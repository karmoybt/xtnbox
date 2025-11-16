// app\server\api\leads\index.post.ts
import { z } from 'zod';
import { requireAuth } from '../../utils/auth';
import { db } from '../../db/client';
import { randomUUID } from 'node:crypto';
import { defineEventHandler, readValidatedBody } from 'h3'


const createLeadSchema = z.object({
  full_name: z.string().min(1),
  status: z.enum(['new', 'pending', 'enrolled', 'dropped']).default('new'),
  comments: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const userId = await requireAuth(event);
  const body = await readValidatedBody(event, createLeadSchema.parse);

  const leadId = 'lead_' + randomUUID().substring(0, 12);

  await db.execute({
    sql: `
      INSERT INTO leads (id, user_id, full_name, status, comments, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ'), strftime('%Y-%m-%dT%H:%M:%fZ'))
    `,
    args: [leadId, userId, body.full_name, body.status, body.comments || null],
  });

  return { id: leadId, ...body };
});