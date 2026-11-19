import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  console.log('[DB] Connecting and running migrations...');
  const sqlPath = path.join(__dirname, 'migrations.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('[DB] Migrations executed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[DB] Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (process.argv[1]?.endsWith('migrate.ts')) {
  runMigrations()
    .then(() => {
      console.log('[DB] Migration complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[DB] Fatal migration error:', err);
      process.exit(1);
    });
}
