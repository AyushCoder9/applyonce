import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.APPLYONCE_DATABASE_URL ?? process.env.DATABASE_URL ?? "postgres://applyonce:applyonce@localhost:5434/applyonce";
const g = globalThis as unknown as { __applyonceSql?: ReturnType<typeof postgres> };
export const sql = g.__applyonceSql ?? (g.__applyonceSql = postgres(url, { max: 10, prepare: false, onnotice: () => {} }));
export const db = drizzle(sql, { schema });
export type Db = typeof db;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
