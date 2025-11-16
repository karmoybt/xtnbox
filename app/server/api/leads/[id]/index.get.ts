// server/api/lead/[id]/index.get.ts
import { requireAuth } from '../../../utils/auth';
import { db } from '../../../db/client';
import { createError } from 'h3';

export default defineEventHandler(async (event) => {
  const userId = await requireAuth(event);

  // 1. leer id de la ruta
  const id = getRouterParam(event, 'id');
  if (!id || Number.isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID inválido',
    });
  }

  // 2. consultar
  const { rows } = await db.execute({
    sql: `
      SELECT id, full_name, status, created_at
      FROM leads
      WHERE id = ?
        AND user_id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `,
    args: [Number(id), userId],
  });

  // 3. si no existe
  if (!rows.length) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Lead no encontrado',
    });
  }

  // 4. devolver el único registro
  return rows[0];
});