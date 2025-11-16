// app/server/api/leads/index.get.ts
import { requireAuth } from '../../utils/auth'
import { db } from '../../db/client'
import { defineEventHandler, getQuery } from 'h3'

export default defineEventHandler(async (event) => {
  const userId = await requireAuth(event)

  const { cursor, limit = '20', status } = getQuery(event)
  const limitNum = Math.min(100, parseInt(limit as string, 10) || 20)
  const cursorDate = cursor ? new Date(cursor as string) : new Date()

  let sql = `
    SELECT id, full_name, status, created_at
    FROM leads
    WHERE user_id = ?
      AND created_at < ?
      AND deleted_at IS NULL
  `
  const params: (string | number)[] = [userId, cursorDate.toISOString()]

  if (status && typeof status === 'string') {
    sql += ' AND status = ?'
    params.push(status)
  }

  sql += `
    ORDER BY created_at DESC
    LIMIT ?
  `
  params.push(limitNum + 1) // +1 para detectar si hay más

  const { rows } = await db.execute({ sql, args: params })

  const hasMore = rows.length > limitNum
  const leads = hasMore ? rows.slice(0, -1) : rows
  const lastRow = leads[leads.length - 1]
  const nextCursor = lastRow?.created_at ?? null

  return {
    leads,
    nextCursor,
    hasMore
  }
})