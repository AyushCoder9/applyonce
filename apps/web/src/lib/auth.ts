import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { phoneNumber } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { passkey } from "@better-auth/passkey";
import { db, t, eq, getDek, putFact, audit } from "@applyonce/db";
import { providers, MOCK_OTP } from "@applyonce/providers";
import { demoPortalUrl, deploymentAppUrl } from "./urls";

const mockSms = (process.env.PROVIDER_SMS ?? "mock") === "mock";
const url = process.env.BETTER_AUTH_URL ?? deploymentAppUrl();

export const auth = betterAuth({
  baseURL: url,
  secret: process.env.BETTER_AUTH_SECRET ?? "dev-secret-change-me-dev-secret-change-me",
  database: drizzleAdapter(db, { provider: "pg", schema: { user: t.user, session: t.session, account: t.account, verification: t.verification, passkey: t.passkey } }),
  trustedOrigins: [url, demoPortalUrl(), "chrome-extension://*"].filter((origin): origin is string => Boolean(origin)),
  user: { additionalFields: { locale: { type: "string", required: false, defaultValue: "en" }, role: { type: "string", required: false, defaultValue: "citizen", input: false } } },
  session: {
    additionalFields: { steppedUpAt: { type: "date", required: false, input: false }, activeProfileId: { type: "string", required: false, input: false } },
    expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24,
  },
  rateLimit: { enabled: true, window: 60, max: 60, customRules: { "/phone-number/send-otp": { window: 60, max: mockSms ? 30 : 3 }, "/phone-number/verify": { window: 60, max: mockSms ? 30 : 5 } } },
  plugins: [
    phoneNumber({
      otpLength: 6, expiresIn: 300, allowedAttempts: 5,
      phoneNumberValidator: (p) => /^\+91[6-9]\d{9}$/.test(p),
      sendOTP: async ({ phoneNumber: to, code }) => { await providers.sms.send(to, `${code} is your ApplyOnce OTP. Valid 5 min. Never share it.`, "otp"); },
      ...(mockSms ? { verifyOTP: async ({ code }) => code === MOCK_OTP } : {}), // ponytail: fixed demo OTP in mock; real check in live
      signUpOnVerification: { getTempEmail: (p) => `${p.replace(/\D/g, "")}@phone.applyonce.local`, getTempName: () => "New user" },
    }),
    passkey({ rpID: process.env.APPLYONCE_RP_ID ?? "localhost", rpName: process.env.APPLYONCE_RP_NAME ?? "ApplyOnce", origin: url, authenticatorSelection: { residentKey: "preferred", userVerification: "preferred" } }),
    nextCookies(),
  ],
  databaseHooks: {
    session: { create: { after: async (session, context) => {
      // This hook runs after the passkey assertion has been verified by better-auth.
      if (context?.path === "/passkey/verify-authentication") await db.update(t.session).set({steppedUpAt:new Date()}).where(eq(t.session.id,session.id));
    } } },
    user: { create: { after: async (user) => {
      // every user gets a self profile + a data key
      const [p] = await db.insert(t.profiles).values({ ownerUserId: user.id, kind: "self", displayName: user.name === "New user" ? "You" : user.name }).returning();
      const dek = await getDek(user.id);
      const phone = (user as { phoneNumber?: string }).phoneNumber?.replace(/^\+91/, "");
      if (phone && /^[6-9]\d{9}$/.test(phone)) await putFact(dek, { profileId: p!.id, key: "contact.mobile_primary", value: phone, source: "provider_verified", verifiedBy: "otp" });
      await audit({ actorUserId: user.id, action: "user.create", targetType: "user", targetId: user.id });
    } } },
  },
});
export type Auth = typeof auth;
