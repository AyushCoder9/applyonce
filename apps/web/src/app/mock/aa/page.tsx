import { MockConsent } from "../mock-consent";
export const metadata = { title: "Mock Account Aggregator consent" };
export default async function Page({ searchParams }: { searchParams: Promise<{ handle?: string; purpose?: string }> }) {
  const { handle } = await searchParams;
  return <MockConsent provider="aa" handle={handle} redirectUri="/api/v1/providers/aa/consent" />;
}
