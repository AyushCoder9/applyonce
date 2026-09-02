import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL ?? "postgres://praman:praman@localhost:5434/praman";
const g = globalThis as unknown as { __pramanSql?: ReturnType<typeof postgres> };
export const sql = g.__pramanSql ?? (g.__pramanSql = postgres(url, { max: 10, prepare: false, onnotice: () => {} }));
export const db = drizzle(sql, { schema });
export type Db = typeof db;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
