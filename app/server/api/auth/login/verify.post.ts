// server/api/auth/login/verify.post.ts
import { z } from 'zod';
import { verifyAuthentication } from 'webauthn-server';      // 1. nombre real
import { db } from '../../../db/client';                    // 2. ruta
import { redis } from '../../../redis/client';
import { getLogger } from '../../../audit/logger';
import { randomUUID } from 'node:crypto';
import { uint8 } from '../../../utils/webauthn';            // 2. import
import type { ResultSet } from '@libsql/client';

const verifySchema = z.object({
  email: z.string().email(),
  credential: z.unknown(),
});

/* 3.  Guard + tipos */
interface CredJSON {
  id: string;
  type: string;
  rawId: number[];
  response: {
    authenticatorData: number[];
    clientDataJSON: number[];
    signature: number[];
    userHandle?: number[];
  };
}

function isCredJSON(obj: unknown): obj is CredJSON {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.type === 'string' &&
    Array.isArray(o.rawId) &&
    typeof o.response === 'object' &&
    o.response !== null &&
    Array.isArray((o.response as Record<string, unknown>).authenticatorData) &&
    Array.isArray((o.response as Record<string, unknown>).clientDataJSON) &&
    Array.isArray((o.response as Record<string, unknown>).signature)
  );
}

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, verifySchema.parse);
  const { email, credential } = body;

  if (!isCredJSON(credential))
    throw createError({ statusCode: 400, message: 'Malformed credential' });

  const user = await db
    .execute({
      sql: 'SELECT id FROM users WHERE email = ? AND deleted_at IS NULL',
      args: [email],
    })
    .then((r: ResultSet) => r.rows[0] as { id: string } | undefined);

  if (!user) {
    getLogger('USER_LOGIN_FAILED', { email, reason: 'user_not_found', ip_address: event.context.ip });
    throw createError({ statusCode: 401, message: 'Invalid credentials' });
  }

  const challengeKey = `auth_challenge:${user.id}`;
  const expectedChallenge = await redis.get(challengeKey);
  if (!expectedChallenge) {
    getLogger('USER_LOGIN_FAILED', { user_id: user.id, reason: 'challenge_missing', ip_address: event.context.ip });
    throw createError({ statusCode: 400, message: 'Login challenge expired' });
  }

  const credId = Buffer.from(uint8(credential.rawId)).toString('base64');
  const stored = await db
    .execute({
      sql: 'SELECT public_key, counter FROM credentials WHERE user_id = ? AND cred_id = ?',
      args: [user.id, credId],
    })
    .then((r: ResultSet) => r.rows[0] as { public_key: Uint8Array; counter: number } | undefined);

  if (!stored)
    throw createError({ statusCode: 401, message: 'Unknown credential' });

  try {
    const verification = await verifyAuthentication({
      response: {
        id: credential.id,
        rawId: uint8(credential.rawId),
        response: {
          authenticatorData: uint8(credential.response.authenticatorData),
          clientDataJSON: uint8(credential.response.clientDataJSON),
          signature: uint8(credential.response.signature),
          userHandle: credential.response.userHandle ? uint8(credential.response.userHandle) : undefined,
        },
        type: credential.type,
      },
      expectedChallenge,
      expectedOrigin: process.env.NUXT_PUBLIC_ORIGIN || 'http://localhost:3000',
      expectedRPID: 'localhost',
      authenticator: {
        credentialID: uint8(credential.rawId),
        credentialPublicKey: stored.public_key,
        counter: stored.counter,
      },
    });

    if (!verification.verified) throw new Error('Verification failed');

    await db.execute({
      sql: 'UPDATE credentials SET counter = ? WHERE user_id = ? AND cred_id = ?',
      args: [verification.authenticationInfo!.newCounter, user.id, credId],
    });

    const sessionId = 'sess_' + randomUUID().substring(0, 16);
    const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.execute({
      sql: 'INSERT INTO sessions_store (id, user_id, expires_at) VALUES (?, ?, ?)',
      args: [sessionId, user.id, sessionExpiry.toISOString()],
    });

    setCookie(event, 'session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    getLogger('USER_LOGIN_SUCCESS', {
      user_id: user.id,
      cred_id: credId,
      session_id: sessionId,
      ip_address: event.context.ip,
    });

    return { success: true };
  } catch (err) {
    getLogger('USER_LOGIN_FAILED', {
      user_id: user.id,
      reason: (err as Error).message,
      ip_address: event.context.ip,
    });
    throw createError({ statusCode: 401, message: 'Invalid passkey' });
  }
});