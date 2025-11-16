// server/middleware/trace-id.ts
import { randomUUID } from 'node:crypto';
import { setTraceId } from '../audit/logger';

export default defineEventHandler((event) => {

  const traceId = getHeader(event, 'x-request-id') || randomUUID();
  setTraceId(traceId);                 // string  ✅

  const forwarded = getHeader(event, 'x-forwarded-for');
  const userAgent = getHeader(event, 'user-agent');

  event.context.traceId = traceId;
  event.context.ip =
             forwarded
                ?.split(',')            
                ?.[0]                  
                ?.trim()               
            ?? event.node.req.socket?.remoteAddress
            ?? '0.0.0.0';
  event.context.userAgent = userAgent; 
});