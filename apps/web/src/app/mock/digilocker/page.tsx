import { MockConsent } from "../mock-consent";
export const metadata = { title: "Mock digilocker consent" };
export default async function Page({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  const { state } = await searchParams;
  return <MockConsent provider="digilocker" state={state} redirectUri="/api/v1/providers/digilocker/callback" />;
}
