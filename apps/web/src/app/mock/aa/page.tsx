import { MockConsent } from "../mock-consent";
export const metadata = { title: "Mock Account Aggregator consent" };
export default async function Page({ searchParams }: { searchParams: Promise<{ handle?: string; redirect_uri?: string; purpose?: string }> }) {
  const { handle, redirect_uri } = await searchParams;
  return <MockConsent provider="aa" handle={handle} redirectUri={redirect_uri ?? "/app/verify"} />;
}
