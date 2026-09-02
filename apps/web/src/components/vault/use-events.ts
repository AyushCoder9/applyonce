"use client";
import { useEffect, useRef } from "react";
export type JobEvent = { id: string; profileId: string; provider: string; kind: string; status: "queued" | "running" | "succeeded" | "failed"; progress: { step: string; pct: number; log: string[] } | null; error?: string | null; resultJson?: unknown; finishedAt?: string | null };
export type NotificationEvent = { id: string; category: string; title: string; body?: string | null; link?: string | null; createdAt: string };
/** Subscribe to /api/v1/events (SSE). Handlers are kept in a ref so callers can pass inline fns. */
export function useEvents(handlers: { onJob?: (j: JobEvent) => void; onNotification?: (n: NotificationEvent) => void }, enabled = true) {
  const ref = useRef(handlers);
  ref.current = handlers;
  useEffect(() => {
    if (!enabled || typeof EventSource === "undefined") return;
    const es = new EventSource("/api/v1/events");
    es.addEventListener("job", (e) => ref.current.onJob?.(JSON.parse((e as MessageEvent).data)));
    es.addEventListener("notification", (e) => ref.current.onNotification?.(JSON.parse((e as MessageEvent).data)));
    return () => es.close();
  }, [enabled]);
}
