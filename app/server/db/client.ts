// app\server\db\client.ts
import { createClient } from '@libsql/client';

const dbUrl = process.env.TURSO_URL || 'file:./db/cristinacrm.db';
const authToken = process.env.TURSO_TOKEN || '';

export const db = createClient({
  url: dbUrl,
  authToken,
});