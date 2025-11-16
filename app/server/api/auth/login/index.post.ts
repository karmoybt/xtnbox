// server/api/auth/login.post.ts
import { z } from 'zod';
import { generateAuthenticationOptions } from 'webauthn-server';
import { db } from '../../../db/client';                         
import { getLogger } from '../../../audit/logger';                   
import { createClient } from 'redis';                            
import type { RedisClientType } from 'redis';
import type { ResultSet } from '@libsql/client';
import rateLimit from '../../../middleware/rate-limit';

const loginSchema = z.object({
  email: z.string().email(),
});

const redis: RedisClientType = createClient({ url: process.env.REDIS_URL });
await redis.connect(); 

export default defineEventHandler(async (event) => {
  await rateLimit(event);
  const body = await readValidatedBody(event, loginSchema.parse);
  const { email } = body;

    const user = await db
    .execute({
        sql: 'SELECT id FROM users WHERE email = ? AND deleted_at IS NULL',
        args: [email],
    })
    .then((r: ResultSet) => r.rows[0] as { id: string } | undefined);

  if (!user) {
    getLogger('USER_LOGIN_ATTEMPT_NONEXISTENT', { email, ip_address: event.context.ip });
    return { options: { challenge: 'dummy' } };
  }

  const options = generateAuthenticationOptions({
    rpID: 'localhost',
    timeout: 60_000,
    userVerification: 'preferred',
    allowCredentials: [],
  });

await redis.setEx(`auth_challenge:${user.id}`, 60, options.challenge);

  getLogger('USER_LOGIN_CHALLENGE_ISSUED', {
    user_id: user.id,
    email,
    ip_address: event.context.ip,
    challenge_key: `auth_challenge:${user.id}`,
  });

  return { options };
});