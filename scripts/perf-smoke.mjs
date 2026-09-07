import { performance } from "node:perf_hooks";

const cliUrl = process.argv.slice(2).find((arg) => arg !== "--");
const base = (process.env.APPLYONCE_SMOKE_URL ?? cliUrl ?? "http://localhost:3300").replace(/\/$/, "");
const runs = Number(process.env.APPLYONCE_SMOKE_RUNS ?? 7);
const p95Budget = Number(process.env.APPLYONCE_P95_BUDGET_MS ?? 1500);
const routes = ["/", "/demo", "/status", "/api/health"];

const percentile = (values, p) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * p) - 1)];
};

let failed = false;
for (const route of routes) {
  const samples = [];
  for (let index = 0; index < runs; index++) {
    const started = performance.now();
    const response = await fetch(`${base}${route}`, { redirect: "manual", headers: { "user-agent": "ApplyOnce production smoke" } });
    await response.arrayBuffer();
    const elapsed = performance.now() - started;
    if (response.status >= 400) throw new Error(`${route} returned HTTP ${response.status}`);
    samples.push(elapsed);
  }
  const p50 = percentile(samples, 0.5);
  const p95 = percentile(samples, 0.95);
  const pass = route === "/api/health" ? p95 <= p95Budget : true;
  failed ||= !pass;
  console.log(JSON.stringify({ route, runs, p50Ms: Math.round(p50), p95Ms: Math.round(p95), budgetMs: route === "/api/health" ? p95Budget : null, pass }));
}

if (failed) process.exitCode = 1;
