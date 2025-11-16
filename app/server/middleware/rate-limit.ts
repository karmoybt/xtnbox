// server/middleware/rate-limit.ts
import { redis } from '../redis/client';
import { getLogger } from '../audit/logger';
import { createError } from 'h3';

export default defineEventHandler(async (event) => {
  const ip = (event.context.ip as string) || 'unknown';

  // Saltar en desarrollo
  if (process.env.NODE_ENV === 'development') return;

  const key = `ratelimit:${ip}`;
  const current = await redis.incr(key);

  if (current === 1) await redis.expire(key, 60); // 1 minuto

  if (current > 100) {
    getLogger('RATE_LIMIT_EXCEEDED', { ip_address: ip, count: current });
    throw createError({ statusCode: 429, message: 'Too many requests' });
  }
});