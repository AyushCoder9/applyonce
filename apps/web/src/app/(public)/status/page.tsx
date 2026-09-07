import type { Metadata } from "next";
import { Container } from "@/components/public/blocks";
import { StatusSystemPanel } from "@/components/public/status-system-panel";
export const metadata: Metadata = { title: "Status", description: "Live status of ApplyOnce services and integration modes." };
export default function Status() {
  return (
    <Container className="py-14 md:py-20">
      <h1 className="font-display text-4xl font-bold">Status</h1>
      <p className="mt-2 max-w-2xl text-ink-2">The page opens immediately, then checks the deployed API, database, request-scoped processor and independent BTA state.</p>
      <StatusSystemPanel />
    </Container>
  );
}
