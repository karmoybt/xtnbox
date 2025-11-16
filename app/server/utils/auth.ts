// app/server/utils/auth.ts
import type { H3Event } from 'h3'
import { db } from '../db/client'
import { getCookie, createError } from 'h3'

export async function requireAuth(event: H3Event): Promise<string> {
  const sessionId = getCookie(event, 'session')
  if (!sessionId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const { rows } = await db.execute({
    sql: 'SELECT user_id FROM sessions_store WHERE id = ? AND expires_at > ?',
    args: [sessionId, new Date().toISOString()],
  })

  const session = rows[0]
  if (!session) {
    throw createError({ statusCode: 401, message: 'Invalid session' })
  }

  return session.user_id as string
}