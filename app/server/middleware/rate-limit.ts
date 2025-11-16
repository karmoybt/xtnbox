import { redis } from '../redis/client'
import { getLogger } from '../audit/logger'
import { defineEventHandler, createError } from 'h3'

export default defineEventHandler(async (event) => {
  // Solo aplicar a rutas de API
  if (!event.path.startsWith('/api/')) return

  if (process.env.NODE_ENV === 'development') return

  const ip = (event.context.ip as string) || 'unknown'
  const key = `ratelimit:${ip}`
  const current = await redis.incr(key)

  if (current === 1) {
    await redis.expire(key, 60)
  }

  if (current > 100) {
    getLogger('RATE_LIMIT_EXCEEDED', { ip_address: ip, count: current })
    throw createError({ statusCode: 429, message: 'Too many requests' })
  }
})