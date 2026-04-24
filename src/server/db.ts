import pg from "pg";

import { AppError } from "@/server/app-errors";

const { Pool } = pg;

type GlobalWithDb = typeof globalThis & {
  __brommerLogboekPool?: pg.Pool;
};

function getConnectionString() {
  return process.env.DATABASE_URL;
}

export function getDbPool() {
  const connectionString = getConnectionString();

  if (!connectionString) {
    return null;
  }

  const globalWithDb = globalThis as GlobalWithDb;

  if (!globalWithDb.__brommerLogboekPool) {
    globalWithDb.__brommerLogboekPool = new Pool({
      connectionString,
      max: 5,
    });
  }

  return globalWithDb.__brommerLogboekPool;
}

export function getDbPoolOrThrow() {
  const pool = getDbPool();

  if (!pool) {
    throw new AppError({
      code: "DB_NOT_CONFIGURED",
      message: "De databaseverbinding is niet ingesteld.",
    });
  }

  return pool;
}

export async function withDbClient<T>(callback: (client: pg.PoolClient) => Promise<T>) {
  const pool = getDbPoolOrThrow();
  const client = await pool.connect();

  try {
    return await callback(client);
  } finally {
    client.release();
  }
}

export async function withDbTransaction<T>(callback: (client: pg.PoolClient) => Promise<T>) {
  return withDbClient(async (client) => {
    await client.query("begin");

    try {
      const result = await callback(client);
      await client.query("commit");
      return result;
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  });
}

export function numericToNumber(value: number | string | null) {
  if (value === null) {
    return null;
  }

  return typeof value === "number" ? value : Number(value);
}

export async function getDatabaseHealth() {
  const pool = getDbPool();

  if (!pool) {
    return {
      status: "not_configured" as const,
    };
  }

  try {
    await pool.query("select 1");

    return {
      status: "up" as const,
    };
  } catch (error) {
    return {
      status: "down" as const,
      message: error instanceof Error ? error.message : "Unknown database error",
    };
  }
}
