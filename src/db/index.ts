import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

export type Database = ReturnType<typeof createDatabase>;

let database: Database | null = null;

function createDatabase() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  const pool = new Pool({ connectionString, max: 3 });
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
