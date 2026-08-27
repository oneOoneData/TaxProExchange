import { Pool } from 'pg';

// Lazy singleton Postgres pool for the MCP `query_database` tool.
// Reads MCP_DATABASE_URL (preferred) or DATABASE_URL — the Supabase pooler
// connection string (see CLAUDE.md). SSL is required by the Supabase pooler.
let pool: Pool | null = null;

export function mcpDbPool(): Pool {
  if (pool) return pool;

  const connectionString =
    process.env.MCP_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim();

  if (!connectionString) {
    throw new Error(
      'MCP_DATABASE_URL (or DATABASE_URL) is not set — required for the query_database tool'
    );
  }

  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    statement_timeout: 15_000,
  });

  return pool;
}
