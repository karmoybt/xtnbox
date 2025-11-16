// scripts/init-db.ts
import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from '../app/server/db/client';

async function initDb() {
  const dbDir = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'db');
  await mkdir(dbDir, { recursive: true });

  const schema = await readFile(join(dbDir, 'schema.sql'), 'utf-8');
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const stmt of statements) {
    await db.execute(stmt);
  }
  console.log('✅ Base de datos inicializada');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  initDb().catch(console.error);
}