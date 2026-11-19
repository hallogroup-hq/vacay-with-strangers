import pg from 'pg';
import type { PoolClient, QueryResult, QueryResultRow } from 'pg';

const { Pool, types } = pg;

// Parse DATE (OID 1082) as exact 'YYYY-MM-DD' string to avoid timezone drift and React 19 Date child errors
types.setTypeParser(1082, (val: string) => val);

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  `postgresql://${process.env.PGUSER || process.env.USER || 'akmalirsyadpermana'}@localhost:5432/${process.env.PGDATABASE || 'vws_db'}`;

const isLocal = !connectionString || connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

export const pool = new Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  max: 15,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  const res = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  if (process.env.DEBUG_SQL) {
    console.log('[SQL]', { text: text.slice(0, 80), duration, rows: res.rowCount });
  }
  return res;
}

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
