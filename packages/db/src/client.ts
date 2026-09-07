import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.APPLYONCE_DATABASE_URL ?? process.env.DATABASE_URL ?? "postgres://applyonce:applyonce@localhost:5434/applyonce";
const g = globalThis as unknown as { __applyonceSql?: ReturnType<typeof postgres> };
const configuredPoolSize = Number(process.env.APPLYONCE_DB_POOL_MAX ?? (process.env.VERCEL ? 5 : 10));
const max = Number.isInteger(configuredPoolSize) && configuredPoolSize > 0 && configuredPoolSize <= 20 ? configuredPoolSize : 5;

// Fluid Compute reuses instances, so keep one bounded process-level pool. Short
// timeouts fail quickly during an outage instead of leaving every page hanging.
export const sql = g.__applyonceSql ?? (g.__applyonceSql = postgres(url, {
  max,
  prepare: false,
  connect_timeout: 5,
  idle_timeout: 20,
  max_lifetime: 60 * 30,
  onnotice: () => {},
}));
export const db = drizzle(sql, { schema });
export type Db = typeof db;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
