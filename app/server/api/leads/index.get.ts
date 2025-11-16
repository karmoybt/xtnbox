// server/api/lead/index.get.ts
import { requireAuth } from '../../utils/auth';
import { db } from '../../db/client';
import type { ResultSet, Row } from '@libsql/client';

export default defineEventHandler(async (event) => {
  const userId = await requireAuth(event);
  const { cursor, limit = '20', status } = getQuery(event);

  const limitNum = Math.min(100, parseInt(limit as string, 10) || 20);
  const cursorDate = cursor ? new Date(cursor as string) : new Date();

  let sql = `
    SELECT id, full_name, status, created_at
    FROM leads
    WHERE user_id = ?
      AND created_at < ?
      AND deleted_at IS NULL
  `;
  const args: (string | number)[] = [userId, cursorDate.toISOString()]; 

  if (status) {
    sql += ` AND status = ?`;
    args.push(status as string);
  }

  sql += ` ORDER BY created_at DESC LIMIT ?`;
  args.push(limitNum + 1);

  const rows = await db.execute({ sql, args }).then((r: ResultSet) => r.rows as Row[]);
  const hasMore = rows.length > limitNum;
  const leads = hasMore ? rows.slice(0, -1) : rows;

  const lastRow = leads[leads.length - 1];
  const nextCursor = lastRow?.created_at ?? null;

  return { leads, nextCursor, hasMore };
});