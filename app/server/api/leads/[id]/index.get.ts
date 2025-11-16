// app/server/api/leads/[id]/index.get.ts
import { requireAuth } from '../../../utils/auth'
import { db } from '../../../db/client'
import { createError, defineEventHandler, getRouterParam } from 'h3'

export default defineEventHandler(async (event) => {
  const userId = await requireAuth(event)

  // 1. Leer ID de la ruta
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID is required',
    })
  }

  // 2. Consultar lead
  const { rows } = await db.execute({
    sql: `SELECT id, full_name, status, created_at
          FROM leads
          WHERE id = ? AND user_id = ? AND deleted_at IS NULL
          LIMIT 1`,
    args: [id, userId],
  })

  // 3. Si no existe
  if (!rows.length) {
    throw createError({
      statusCode: 404,
      message: 'Lead not found',
    })
  }

  // 4. Devolver el único registro
  return rows[0]
})