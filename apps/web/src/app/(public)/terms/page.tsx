import type { Metadata } from "next";
import { Prose, H2, P, UL, Block } from "@/components/public/blocks";
export const metadata: Metadata = { title: "Terms of use", description: "Praman terms of use for citizens and institutions." };
export default function Terms() {
  return (
    <Prose title="Terms of use" updated="2 September 2026" intro="Plain-language terms. The privacy notice is separate and is not buried here.">
      <Block><H2>1. The service</H2><P>Praman lets you store facts about yourself, verify them with issuers, and share them with institutions you choose. Praman is a facts provider, not a substitute for an institution's own checks (for example a bank's KYC obligations under RBI directions).</P></Block>
      <Block><H2>2. Your account</H2><UL items={["You must be 18+ to open an account. Under-18 profiles are created and managed by a parent or guardian.", "Keep your mobile and passkeys secure. Tell us immediately at security@praman.in if you suspect misuse.", "One account per person. Don't enter data about someone else without a legal basis (parent, court-appointed guardian, or their consent via a Praman invite)."]} /></Block>
      <Block><H2>3. Accuracy</H2><P>Verified values come from issuers as-is; if an issuer record is wrong, correct it with the issuer and re-sync. Self-declared values are your responsibility — institutions see them marked as unverified.</P></Block>
      <Block><H2>4. Sharing</H2><P>Each share is a consent you give to a named institution for a stated purpose and period. What they do with the data afterwards is governed by their notice and the DPDP Act. You can revoke; we notify them, and they must honour it.</P></Block>
      <Block><H2>5. Institutions</H2><UL items={["Sandbox keys are for testing with seeded demo data only. Live keys require organisation verification.", "Use payloads only for the purpose the applicant consented to; delete on revoke or expiry; verify signatures; keep your webhook secret secret.", "Public bodies use Praman free of charge. Others pay per the published pricing."]} /></Block>
      <Block><H2>6. Acceptable use</H2><P>No scraping, no bulk requests without an API key, no attempts to access other people's profiles, no reverse-engineering our extension recipes to bypass consent.</P></Block>
      <Block><H2>7. Liability</H2><P>We provide Praman with reasonable care and skill. We are not liable for decisions institutions make, for issuer outages, or for indirect losses. Nothing here limits liability that cannot be limited under Indian law.</P></Block>
      <Block><H2>8. Ending</H2><P>You can delete your account any time (30-day grace). We may suspend accounts that break these terms, with notice and a way to appeal via dpo@praman.in.</P></Block>
      <Block><H2>9. Law</H2><P>Indian law; courts of Lucknow, Uttar Pradesh. Contact: legal@praman.in.</P></Block>
    </Prose>
  );
}
