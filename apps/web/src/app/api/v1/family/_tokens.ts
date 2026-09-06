import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { deploymentAppUrl } from "@/lib/urls";
/** Stateless invite/claim links (ponytail: no table). HS256 with the auth secret, 7-day expiry. */
const secret = () => new TextEncoder().encode(process.env.BETTER_AUTH_SECRET ?? "dev-secret-change-me-dev-secret-change-me");
export type FamilyToken = { kind: "invite" | "claim"; relationId: string; phone: string; scope?: string[]; validUntil?: string | null };
export const signFamilyToken = (p: FamilyToken) => new SignJWT(p).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").setAudience("applyonce:family").sign(secret());
export async function verifyFamilyToken(token: string): Promise<FamilyToken> {
  const { payload } = await jwtVerify(token, secret(), { audience: "applyonce:family" });
  return payload as unknown as FamilyToken;
}
export const appUrl = deploymentAppUrl;
