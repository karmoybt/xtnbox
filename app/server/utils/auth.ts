// server/utils/auth.ts
import type { H3Event } from 'h3';
import { db } from '../db/client';

export async function requireAuth(event: H3Event) {
  const sessionId = getCookie(event, 'session');
  if (!sessionId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const session = await db
    .execute({
      sql: 'SELECT user_id FROM sessions_store WHERE id = ? AND expires_at > ?',
      args: [sessionId, new Date().toISOString()],
    })
    .then(r => r.rows[0]);

  if (!session) {
    throw createError({ statusCode: 401, message: 'Invalid session' });
  }

  return session.user_id as string;
}