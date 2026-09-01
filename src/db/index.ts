import { attachDatabasePool } from "@vercel/functions";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

export type Database = ReturnType<typeof createDatabase>;

let database: Database | null = null;

function createDatabase() {
  const configuredConnectionString = process.env.DATABASE_URL;

  if (!configuredConnectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  // pg 9 will interpret sslmode=require less strictly. Preserve the current
  // certificate-verifying behavior explicitly before that change lands.
  const connectionString = configuredConnectionString.replace("sslmode=require", "sslmode=verify-full");

  const pool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 8_000,
    allowExitOnIdle: true,
  });
  attachDatabasePool(pool);
  return drizzle(pool, { schema });
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getDatabase() {
  if (!database) {
    database = createDatabase();
  }

  return database;
}
