import { MockConsent } from "../mock-consent";
export const metadata = { title: "Mock digilocker consent" };
export default async function Page({ searchParams }: { searchParams: Promise<{ state?: string; redirect_uri?: string }> }) {
  const { state, redirect_uri } = await searchParams;
  return <MockConsent provider="digilocker" state={state} redirectUri={redirect_uri ?? "/app/verify"} />;
}
