/** Loads root `.env` into process.env for worker tests (real local DB + redis, per repo standing rules — mock providers only). */
import { readFileSync } from "node:fs";
import path from "node:path";

try {
  const envPath = path.resolve(import.meta.dirname, "../../../.env");
  const content = readFileSync(envPath, "utf8");
  for (const raw of content.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i === -1) continue;
    const key = line.slice(0, i).trim();
    const value = line.slice(i + 1).replace(/\s+#.*$/, "").trim().replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
    if (value && !process.env[key]) process.env[key] = value;
  }
} catch {
  // no root .env found — fall back to whatever the shell already exported
}
process.env.NODE_ENV ??= "test";
