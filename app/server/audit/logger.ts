// server/audit/logger.ts
import { randomUUID } from 'node:crypto';
import { mkdirSync, appendFileSync } from 'node:fs'; // 1 solo import de fs, al inicio

let currentTraceId: string | null = null;

export const setTraceId = (id: string) => {
  currentTraceId = id;
};

interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  event: string;
  trace_id: string;
  [key: string]: unknown; // <- elimina el "any"
}

const AUDIT_LOG_PATH = process.env.AUDIT_LOG_PATH || './logs/audit.log';

// Crear carpeta síncronamente y UNA sola vez al cargar el módulo
mkdirSync('./logs', { recursive: true });

export const getLogger = (event: string, context: Partial<LogEntry> = {}) => {
  const trace_id = currentTraceId || randomUUID();
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: context.level || 'info',
    event,
    trace_id,
    ...context,
  };

  appendFileSync(AUDIT_LOG_PATH, JSON.stringify(entry) + '\n');

  return entry;
};