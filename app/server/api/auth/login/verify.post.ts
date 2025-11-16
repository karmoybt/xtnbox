// app/server/api/auth/login/verify.post.ts
import { z } from 'zod'
import { verifyAuthentication } from 'webauthn-server'
import { db } from '../../../db/client'
import { redis } from '../../../redis/client'
import { getLogger } from '../../../audit/logger'
import { uint8 } from '../../../utils/webauthn'
import { randomUUID } from 'node:crypto'
import { defineEventHandler, readValidatedBody, createError, setCookie} from 'h3'

const verifySchema = z.object({
  email: z.string().email(),
  credential: z.unknown(),
})

interface CredJSON {
  id: string
  type: string
  rawId: number[]
  response: {
    authenticatorData: number[]
    clientDataJSON: number[]
    signature: number[]
    userHandle?: number[]
  }
}

function isCredJSON(obj: unknown): obj is CredJSON {
  if (typeof obj !== 'object' || obj === null) return false
  const o = obj as Record<string, unknown>
  const resp = o.response
  if (typeof resp !== 'object' || resp === null) return false
  const r = resp as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    typeof o.type === 'string' &&
    Array.isArray(o.rawId) &&
    Array.isArray(r.authenticatorData) &&
    Array.isArray(r.clientDataJSON) &&
    Array.isArray(r.signature)
  )
}
function toUint8Array(value: unknown): Uint8Array {
  if (value instanceof Buffer) {
    return new Uint8Array(value)
  }
  if (Array.isArray(value) && value.every(v => typeof v === 'number')) {
    return new Uint8Array(value as number[])
  }
  throw new Error('Unexpected public_key format')
}

interface StoredCredential {
  public_key: Uint8Array
  counter: number
}

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, verifySchema.parse)
  const { email, credential } = body

  if (!isCredJSON(credential)) {
    throw createError({ statusCode: 400, message: 'Malformed credential' })
  }

  // 1. Buscar usuario
  const userRes = await db.execute({
    sql: 'SELECT id FROM users WHERE email = ? AND deleted_at IS NULL',
    args: [email],
  })
  const user = userRes.rows[0] ? { id: userRes.rows[0].id as string } : undefined
  if (!user) {
    getLogger('USER_LOGIN_FAILED', {
      email,
      reason: 'user_not_found',
      ip_address: event.context.ip,
    })
    throw createError({ statusCode: 401, message: 'Invalid credentials' })
  }

  // 2. Obtener challenge desde Redis
  const challengeKey = `auth_challenge:${user.id}`
  const expectedChallenge = await redis.get(challengeKey)
  if (!expectedChallenge) {
    getLogger('USER_LOGIN_FAILED', {
      user_id: user.id,
      reason: 'challenge_missing',
      ip_address: event.context.ip,
    })
    throw createError({ statusCode: 400, message: 'Login challenge expired' })
  }

  // 3. Buscar credencial del usuario
  const credId = Buffer.from(uint8(credential.rawId)).toString('base64')
  const credRes = await db.execute({
    sql: 'SELECT public_key, counter FROM credentials WHERE user_id = ? AND cred_id = ?',
    args: [user.id, credId],
  })

  const stored: StoredCredential | undefined = credRes.rows[0]
  ? {
      public_key: toUint8Array(credRes.rows[0].public_key),
      counter: Number(credRes.rows[0].counter),
    }
  : undefined

  if (!stored) {
    throw createError({ statusCode: 401, message: 'Unknown credential' })
  }

  try {
    // 4. Preparar credencial para la librería
    const credForLib = {
      id: credential.id,
      rawId: uint8(credential.rawId),
      response: {
        authenticatorData: uint8(credential.response.authenticatorData),
        clientDataJSON: uint8(credential.response.clientDataJSON),
        signature: uint8(credential.response.signature),
        userHandle: credential.response.userHandle
          ? uint8(credential.response.userHandle)
          : undefined,
      },
      type: credential.type,
    }

    // 5. Verificar autenticación
    const verification = await verifyAuthentication({
      response: credForLib,
      expectedChallenge,
      expectedOrigin: process.env.NUXT_PUBLIC_ORIGIN || 'http://localhost:3000',
      expectedRPID: 'localhost',
      authenticator: {
        credentialID: uint8(credential.rawId),
        credentialPublicKey: stored.public_key,
        counter: stored.counter,
      },
    })

    if (!verification.verified) {
      throw createError({ statusCode: 401, message: 'Invalid passkey' })
    }

    // 6. Crear sesión
    const sessionId = 'sess_' + randomUUID().substring(0, 16)
    const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await db.execute({
      sql: `CREATE TABLE IF NOT EXISTS sessions_store (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ'))
      )`,
    })

    await db.execute({
      sql: 'INSERT INTO sessions_store (id, user_id, expires_at) VALUES (?, ?, ?)',
      args: [sessionId, user.id, sessionExpiry.toISOString()],
    })

    // 7. Establecer cookie
    setCookie(event, 'session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    // 8. Log y respuesta
    getLogger('USER_LOGIN_SUCCESS', {
      user_id: user.id,
      session_id: sessionId,
      ip_address: event.context.ip,
    })

    return { success: true }

  } catch (err) {
    // ✅ Aquí está la corrección clave: tipar err como Error
    const error = err instanceof Error ? err : new Error('Unknown error during login verification')
    getLogger('USER_LOGIN_FAILED', {
      user_id: user.id,
      reason: error.message,
      ip_address: event.context.ip,
    })
    throw createError({ statusCode: 401, message: 'Invalid passkey' })
  }
})