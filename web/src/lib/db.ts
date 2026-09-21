import { Pool, type QueryResultRow } from "pg";

const globalForPg = globalThis as unknown as { itomPool?: Pool };

function createPool(): Pool {
  const connectionString =
    process.env.DATABASE_URL ?? "postgres://itom:itom_demo@localhost:5432/itom";
  return new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}

const pool = globalForPg.itomPool ?? createPool();

if (process.env.NODE_ENV !== "production") globalForPg.itomPool = pool;

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
) {
  return pool.query<T>(text, params as never);
}

export { pool };