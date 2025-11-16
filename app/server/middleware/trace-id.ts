import { randomUUID } from 'node:crypto'
import { setTraceId } from '../audit/logger'
import { defineEventHandler, getHeader } from 'h3'

export default defineEventHandler((event) => {
  // Solo aplicar a rutas de API
  if (!event.path.startsWith('/api/')) return

  const traceId = getHeader(event, 'x-request-id') || randomUUID()
  setTraceId(traceId)

  const forwarded = getHeader(event, 'x-forwarded-for')
  const userAgent = getHeader(event, 'user-agent')

  event.context.traceId = traceId
  event.context.ip = forwarded?.split(',')?.[0]?.trim() ??
    event.node.req.socket?.remoteAddress ??
    '0.0.0.0'
  event.context.userAgent = userAgent
})