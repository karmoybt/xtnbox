// app/server/middleware/auth.ts
import { db } from '../db/client'
import { getLogger } from '../audit/logger'
import { defineEventHandler, getCookie, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const sessionId = getCookie(event, 'session')
  if (!sessionId) {
    throw createError({ statusCode: 401, message: 'Session cookie missing' })
  }

  const { rows } = await db.execute({
    sql: `SELECT user_id
          FROM sessions_store
          WHERE id = ?
            AND expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
          LIMIT 1`,
    args: [sessionId],
  })

  const session = rows[0]
  if (!session) {
    getLogger('SESSION_INVALID_OR_EXPIRED', {
      session_id: sessionId,
      ip_address: event.context.ip,
      url: event.path,
    })
    throw createError({ statusCode: 401, message: 'Session expired or invalid' })
  }

  event.context.auth = { userId: session.user_id }

  getLogger('REQUEST_AUTHENTICATED', {
    user_id: session.user_id,
    session_id: sessionId,
    url_path: event.path,
  })
})