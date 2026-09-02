/** Runs once per server instance. With PRAMAN_INLINE_JOBS=1 the web process runs jobs itself (demo fallback until the worker is up). */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.PRAMAN_INLINE_JOBS === "1") {
    const { registerInlineJobs } = await import("./lib/inline-jobs");
    registerInlineJobs();
  }
}
