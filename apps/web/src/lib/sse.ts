/** Server-Sent Events helpers. Pure formatter is unit-tested; the stream polls the DB (ponytail: no pub/sub). */
export type SseEvent = { event?: string; data: unknown; id?: string };

export const formatSse = ({ event, data, id }: SseEvent) =>
  (id ? `id: ${id}\n` : "") + (event ? `event: ${event}\n` : "") + `data: ${JSON.stringify(data)}\n\n`;

export const SSE_HEADERS = { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" } as const;

/**
 * Build a streaming Response that calls `poll(since)` every `intervalMs`, writes every returned event,
 * sends a comment heartbeat every `heartbeatMs`, and closes when the request is aborted.
 */
export function sseResponse(req: Request, poll: (since: Date) => Promise<SseEvent[]>, opts: { intervalMs?: number; heartbeatMs?: number; hello?: unknown } = {}) {
  const enc = new TextEncoder();
  const intervalMs = opts.intervalMs ?? 1500, heartbeatMs = opts.heartbeatMs ?? 25_000;
  let timer: ReturnType<typeof setTimeout> | undefined, beat: ReturnType<typeof setInterval> | undefined;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let since = new Date();
      let closed = false;
      const write = (s: string) => { if (!closed) try { controller.enqueue(enc.encode(s)); } catch { closed = true; } };
      const close = () => { if (closed) return; closed = true; clearTimeout(timer); clearInterval(beat); try { controller.close(); } catch { /* already closed */ } };
      req.signal.addEventListener("abort", close);
      write(formatSse({ event: "hello", data: opts.hello ?? { at: since.toISOString() } }));
      beat = setInterval(() => write(": ping\n\n"), heartbeatMs);
      const tick = async () => {
        if (closed) return;
        const at = new Date();
        try { for (const e of await poll(since)) write(formatSse(e)); since = at; }
        catch (e) { write(formatSse({ event: "error", data: { message: String((e as Error).message) } })); }
        if (!closed) timer = setTimeout(tick, intervalMs);
      };
      timer = setTimeout(tick, 50);
    },
    cancel() { clearTimeout(timer); clearInterval(beat); },
  });
  return new Response(stream, { headers: SSE_HEADERS });
}
