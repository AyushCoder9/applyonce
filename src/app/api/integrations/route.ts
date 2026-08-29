import { emailDeliveryStatus } from "@/lib/notifications";

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
    id: "digilocker",
    name: "DigiLocker",
    category: "Source connector",
    status: "adapter_ready",
    purpose: "Official document retrieval after the citizen authorises a partner connection.",
  },
  {
    id: "meripehchaan",
    name: "MeriPehchaan",
    category: "Source connector",
    status: "adapter_ready",
    purpose: "Federated identity and profile claims through an approved integration.",
  },
  {
    id: "apaar",
    name: "APAAR",
    category: "Source connector",
    status: "adapter_ready",
    purpose: "Academic record retrieval through a supported institutional flow.",
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
    integrations,
    email: emailDeliveryStatus(),
    note: "Source connectors are deliberately consent-gated. No real citizen data is used by the public demo.",
  });
}
