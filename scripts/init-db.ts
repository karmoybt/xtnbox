// scripts/init-db.ts
import { readFile } from 'fs/promises';
import { db } from '../app/server/db/client';

async function initDb() {
  const schema = await readFile(new URL('../db/schema.sql', import.meta.url), 'utf-8');
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