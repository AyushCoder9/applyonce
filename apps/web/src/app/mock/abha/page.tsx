import { MockConsent } from "../mock-consent";
export const metadata = { title: "Mock abha consent" };
export default async function Page({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  const { state } = await searchParams;
  return <MockConsent provider="abha" state={state} redirectUri="/api/v1/providers/abha/link" />;
}
