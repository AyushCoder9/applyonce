import "server-only";
import { SignJWT, jwtVerify } from "jose";
/** Stateless invite/claim links (ponytail: no table). HS256 with the auth secret, 7-day expiry. */
const secret = () => new TextEncoder().encode(process.env.BETTER_AUTH_SECRET ?? "dev-secret-change-me-dev-secret-change-me");
export type FamilyToken = { kind: "invite" | "claim"; relationId: string; phone: string; scope?: string[]; validUntil?: string | null };
export const signFamilyToken = (p: FamilyToken) => new SignJWT(p).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").setAudience("praman:family").sign(secret());
export async function verifyFamilyToken(token: string): Promise<FamilyToken> {
  const { payload } = await jwtVerify(token, secret(), { audience: "praman:family" });
  return payload as unknown as FamilyToken;
}
export const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3300";
