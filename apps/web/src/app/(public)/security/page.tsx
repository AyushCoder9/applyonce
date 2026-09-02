import type { Metadata } from "next";
import { Prose, H2, P, UL, Block } from "@/components/public/blocks";
export const metadata: Metadata = { title: "Security", description: "How Praman protects your data: per-user encryption, passkeys, step-up, hash-chained audit, signed payloads." };
export default function Security() {
  return (
    <Prose title="Security" updated="2 September 2026" intro="Short version: your sensitive values are encrypted with a key only you unlock, nothing leaves without a fresh passkey or OTP, and every action is in a tamper-evident log.">
      <Block><H2>Encryption</H2><UL items={["Each user has a data-encryption key (AES-256-GCM), wrapped by a key-encryption key held in KMS. Sensitive facts (PAN, account numbers, Aadhaar last-4) are encrypted per value with the profile and field bound as associated data.", "Documents are stored in object storage with server-side encryption and a SHA-256 recorded at upload; we re-check the hash on every download.", "Transport is TLS 1.3 only. Cookies are HttpOnly, Secure, SameSite=Lax."]} /></Block>
      <Block><H2>Authentication</H2><UL items={["Mobile OTP to sign in; passkeys (FIDO2/WebAuthn) for everything sensitive.", "Step-up: sharing, revealing masked values, exporting or deleting data needs a passkey or OTP in the last 5 minutes.", "Sessions are listed under Settings → Security; revoke any device instantly."]} /></Block>
      <Block><H2>Consent and sharing</H2><UL items={["A share cannot exist without a valid consent row — enforced by a database trigger, not just application code.", "Payloads to institutions are signed (ES256 JWS) and verifiable against our public JWKS; institutions get exactly the fields you approved, nothing more.", "Revoking sends a signed webhook to the institution and is recorded with a consent id you can quote."]} /></Block>
      <Block><H2>Auditability</H2><UL items={["Every mutation writes an append-only, hash-chained audit row (each row commits to the previous hash). You see your own rows in Settings → Audit log.", "Institutions' API calls and webhook deliveries are logged with status and attempts."]} /></Block>
      <Block><H2>What we don't do</H2><UL items={["Store your 12-digit Aadhaar number, biometrics or Aadhaar XML in the clear.", "Track you across sites, run ads, or sell or rent data to anyone.", "Let staff read your vault: production access is break-glass, logged and reviewed."]} /></Block>
      <Block><H2>Reporting a vulnerability</H2><P>Email <a className="underline" href="mailto:security@praman.in">security@praman.in</a>. We acknowledge within 24 hours, fix critical issues within 72 hours, and follow CERT-In's 6-hour incident reporting and DPDP Rule 7's 72-hour breach reporting.</P></Block>
    </Prose>
  );
}
