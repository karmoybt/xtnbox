// server/api/auth/register/verify.post.ts
import { z } from 'zod';
import { verifyRegistration } from 'webauthn-server';
import { db } from '../../../db/client';
import { getLogger } from '../../../audit/logger';
import { randomUUID } from 'node:crypto';
import { uint8 } from '../../../utils/webauthn';

/* ----------  Zod + tipos  ---------- */
const verifySchema = z.object({
  email: z.string().email(),
  credential: z.unknown(),
});

interface CredentialJSON {
  id: string;
  rawId: number[];
  response: {
    attestationObject: number[];
    clientDataJSON: number[];
    transports?: string[];
  };
  type: string;
}

/* ----------  Guard  ---------- */
function isCredJSON(obj: unknown): obj is CredentialJSON {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    Array.isArray(o.rawId) &&
    typeof o.response === 'object' &&
    o.response !== null &&
    Array.isArray((o.response as Record<string, unknown>).attestationObject) &&
    Array.isArray((o.response as Record<string, unknown>).clientDataJSON)
  );
}

/* ----------  Handler  ---------- */
export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, verifySchema.parse);
  const { email, credential } = body;

  const expectedChallenge = 'STATIC_CHALLENGE_PLACEHOLDER'; // ← cámbialo en prod

  if (!isCredJSON(credential))
    throw createError({ statusCode: 400, message: 'Malformed credential' });
  const challengeKey = `reg_challenge:${email}`;
  const expectedChallenge = await redis.get(challengeKey);
  if (!expectedChallenge) {
    throw createError({ statusCode: 400, message: 'Registration challenge expired' });
  }
  

  try {
    /* 1.  Conversión a formato que entiende la librería */
    const credForLib = {
      id: credential.id,
      rawId: uint8(credential.rawId),
      response: {
        attestationObject: uint8(credential.response.attestationObject),
        clientDataJSON: uint8(credential.response.clientDataJSON),
        transports: credential.response.transports ?? [],
      },
      type: credential.type,
    };

    /* 2.  Verificación única */
    const verification = await verifyRegistration({
      response: credForLib,
      expectedChallenge,
      expectedOrigin: process.env.NUXT_PUBLIC_ORIGIN || 'http://localhost:3000',
      expectedRPID: 'localhost',
      requireUserVerification: true,
    });

    if (!verification.verified)
      throw createError({ statusCode: 400, message: 'Passkey verification failed' });

    /* 3.  Guardar usuario, credencial y sesión */
    const userId = 'usr_' + randomUUID().substring(0, 12);
    const credId = Buffer.from(verification.registrationInfo!.credentialID).toString('base64');

    await db.execute({
      sql: `INSERT INTO users (id, email, created_at, updated_at)
            VALUES (?, ?, strftime('%Y-%m-%dT%H:%M:%fZ'), strftime('%Y-%m-%dT%H:%M:%fZ'))`,
      args: [userId, email],
    });

    await db.execute({
      sql: `INSERT INTO credentials (user_id, cred_id, public_key, counter, transports)
            VALUES (?, ?, ?, ?, ?)`,
      args: [
        userId,
        credId,
        Buffer.from(verification.registrationInfo!.credentialPublicKey),
        verification.registrationInfo!.counter,
        JSON.stringify(credential.response.transports ?? []),
      ],
    });

    const sessionId = 'sess_' + randomUUID().substring(0, 16);
    const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.execute({
      sql: `CREATE TABLE IF NOT EXISTS sessions_store (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL,
              expires_at TEXT NOT NULL,
              created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ'))
            )`,
    });
    await db.execute({
      sql: 'INSERT INTO sessions_store (id, user_id, expires_at) VALUES (?, ?, ?)',
      args: [sessionId, userId, sessionExpiry.toISOString()],
    });

    setCookie(event, 'session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    getLogger('USER_REGISTERED_SUCCESS', {
      user_id: userId,
      email,
      cred_id: credId,
      ip_address: event.context.ip,
      user_agent: event.context.userAgent,
      session_id: sessionId,
    });

    return { success: true, user: { id: userId, email } };
  } catch (err) {
    getLogger('USER_REGISTERED_FAILED', {
      email,
      error: (err as Error).message,
      ip_address: event.context.ip,
    });
    throw createError({ statusCode: 400, message: 'Registration failed' });
  }
});