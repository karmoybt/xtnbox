// server/middleware/auth.ts
import { db } from '../db/client';
import { getLogger } from '../audit/logger';

export default defineEventHandler(async (event) => {
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
    throw createError({ statusCode: 401, message: 'Session expired or invalid' });
  }

  event.context.auth = { userId: session.user_id };
  getLogger('REQUEST_AUTHENTICATED', {
    user_id: session.user_id,
    session_id: sessionId,
    url_path: event.path,
  });
});