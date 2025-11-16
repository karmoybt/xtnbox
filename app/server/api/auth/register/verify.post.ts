// app/server/api/auth/register/verify.post.ts
import { z } from 'zod'
import { verifyRegistration } from 'webauthn-server'
import { db } from '../../../db/client'
import { redis } from '../../../redis/client'
import { getLogger } from '../../../audit/logger'
import { uint8 } from '../../../utils/webauthn'
import { randomUUID } from 'node:crypto'
import {
  defineEventHandler,
  readValidatedBody,
  createError,
  setCookie
} from 'h3'

const verifySchema = z.object({
  email: z.string().email(),
  credential: z.unknown(),
})

interface CredentialJSON {
  id: string
  rawId: number[]
  response: {
    attestationObject: number[]
    clientDataJSON: number[]
    transports?: string[]
  }
  type: string
}

function isCredJSON(obj: unknown): obj is CredentialJSON {
  if (typeof obj !== 'object' || obj === null) return false
  const o = obj as Record<string, unknown>
  const resp = o.response
  if (typeof resp !== 'object' || resp === null) return false
  const r = resp as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    Array.isArray(o.rawId) &&
    Array.isArray(r.attestationObject) &&
    Array.isArray(r.clientDataJSON)
  )
}

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, verifySchema.parse)
  const { email, credential } = body

  if (!isCredJSON(credential)) {
    throw createError({ statusCode: 400, message: 'Malformed credential' })
  }

  // 1. Recuperar el challenge desde Redis
  const challengeKey = `reg_challenge:${email}`
  const expectedChallenge = await redis.get(challengeKey)
  if (!expectedChallenge) {
    getLogger('USER_REGISTRATION_FAILED', {
      email,
      reason: 'challenge_missing_or_expired',
      ip_address: event.context.ip,
    })
    throw createError({ statusCode: 400, message: 'Registration challenge expired' })
  }

  try {
    // 2. Preparar credencial para la librería
    const credForLib = {
      id: credential.id,
      rawId: uint8(credential.rawId),
      response: {
        attestationObject: uint8(credential.response.attestationObject),
        clientDataJSON: uint8(credential.response.clientDataJSON),
        transports: credential.response.transports ?? [],
      },
      type: credential.type,
    }

    // 3. Verificar registro
    const verification = await verifyRegistration({
      response: credForLib,
      expectedChallenge,
      expectedOrigin: process.env.NUXT_PUBLIC_ORIGIN || 'http://localhost:3000',
      expectedRPID: 'localhost',
      requireUserVerification: true,
    })

    if (!verification.verified || !verification.registrationInfo) {
      throw createError({ statusCode: 400, message: 'Passkey verification failed' })
    }

    // 4. Crear usuario y credencial
    const userId = 'usr_' + randomUUID().substring(0, 12)
    const credId = Buffer.from(verification.registrationInfo.credentialID).toString('base64')

    await db.execute({
      sql: `INSERT INTO users (id, email, created_at, updated_at)
            VALUES (?, ?, strftime('%Y-%m-%dT%H:%M:%fZ'), strftime('%Y-%m-%dT%H:%M:%fZ'))`,
      args: [userId, email],
    })

    await db.execute({
      sql: `INSERT INTO credentials (user_id, cred_id, public_key, counter, transports)
            VALUES (?, ?, ?, ?, ?)`,
      args: [
        userId,
        credId,
        verification.registrationInfo.credentialPublicKey,
        verification.registrationInfo.counter,
        JSON.stringify(credential.response.transports ?? []),
      ],
    })

    // 5. Crear sesión
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
      args: [sessionId, userId, sessionExpiry.toISOString()],
    })

    // 6. Establecer cookie
    setCookie(event, 'session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    // 7. Log y respuesta
    getLogger('USER_REGISTERED_SUCCESS', {
      user_id: userId,
      email,
      cred_id: credId,
      ip_address: event.context.ip,
      session_id: sessionId,
    })

    return { success: true, user: { id: userId, email } }

  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown registration error')
    getLogger('USER_REGISTRATION_FAILED', {
      email,
      error: error.message,
      ip_address: event.context.ip,
    })
    throw createError({ statusCode: 400, message: 'Registration failed' })
  }
})