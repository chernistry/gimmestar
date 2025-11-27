import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '../db/schema.js';

const { Pool } = pg;

export function createDatabaseConnection() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const pool = new Pool({ connectionString });
  return drizzle(pool, { schema });
}

export type Database = ReturnType<typeof createDatabaseConnection>;

// Lazy singleton instance
let _db: Database | null = null;

export const db = new Proxy({} as Database, {
  get(target, prop) {
    if (!_db) {
      _db = createDatabaseConnection();
    }
    return (_db as any)[prop];
  },
});
