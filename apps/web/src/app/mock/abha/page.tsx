import { MockConsent } from "../mock-consent";
export const metadata = { title: "Mock abha consent" };
export default async function Page({ searchParams }: { searchParams: Promise<{ state?: string; redirect_uri?: string }> }) {
  const { state, redirect_uri } = await searchParams;
  return <MockConsent provider="abha" state={state} redirectUri={redirect_uri ?? "/app/verify"} />;
}
