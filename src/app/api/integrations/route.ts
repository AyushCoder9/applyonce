import { emailDeliveryStatus } from "@/lib/notifications";
import { connectorRegistry } from "@/lib/connectors/registry";

const integrations = [
  {
    id: "clerk",
    name: "Clerk",
    category: "Identity and access",
    status: "connected",
    purpose: "Passkeys, OTP sign-in, and an account boundary for each citizen.",
  },
  {
    id: "neon",
    name: "Neon Postgres",
    category: "Durable storage",
    status: "connected",
    purpose: "Consent ledger, profile claims, application packets, and event history.",
  },
  {
    id: "resend",
    name: "Resend",
    category: "Notifications",
    status: emailDeliveryStatus().enabled ? "connected" : "awaiting_domain",
    purpose: "Transactional email for receipts and application updates.",
  },
] as const;

export async function GET() {
  return Response.json({
    integrations: [...integrations, ...connectorRegistry.map((connector) => ({ id: connector.id, name: connector.name, category: "Source connector", status: connector.state, purpose: connector.purpose, liveData: connector.liveData, disclosure: connector.disclosure }))],
    email: emailDeliveryStatus(),
    note: "Source connectors are deliberately consent-gated. No real citizen data is used by the public demo.",
  });
}
