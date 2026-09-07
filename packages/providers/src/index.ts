export * from "./types";
export * from "./fixtures";
export * from "./readiness";
export * from "./apisetu/digilocker";
import type { Providers } from "./types";
import { mockProviders } from "./mock";
import { setuProviders } from "./setu";
import { createApiSetuDigiLocker } from "./apisetu/digilocker";
import { providerReadiness, readinessFor } from "./readiness";

/** Resolve providers from env. Unsupported or incomplete live modes fail closed. */
export function getProviders(env: NodeJS.ProcessEnv = process.env): Providers {
  const pick = <K extends keyof Providers>(k: K, envKey: string): Providers[K] => {
    const mode = env[envKey] ?? "mock";
    if (mode === "mock") return mockProviders[k];
    const ready = providerReadiness(env).find((provider) => provider.env === envKey);
    if (mode === "setu") return ready?.state === "misconfigured" ? unavailable(k, ready.blocker) : setuProviders[k];
    if (mode === "disabled") return unavailable(k);
    if (mode === "apisetu" && k === "digilocker") {
      const directReadiness = readinessFor("digilocker", env);
      if (directReadiness.state === "approval_pending" || directReadiness.state === "misconfigured") return unavailable(k, directReadiness.blocker);
      return createApiSetuDigiLocker({
        clientId: env.DIGILOCKER_CLIENT_ID!,
        clientSecret: env.DIGILOCKER_CLIENT_SECRET!,
        baseUrl: env.DIGILOCKER_BASE_URL,
        scope: env.DIGILOCKER_SCOPE,
        purpose: "educational",
        requestDocumentType: env.DIGILOCKER_REQUEST_DOCUMENT_TYPE,
      }) as Providers[K];
    }
    return unavailable(k, `${envKey}=${mode} is not implemented; refusing to fall back to mock`);
  };
  return {
    digilocker: pick("digilocker", "PROVIDER_DIGILOCKER"), pan: pick("pan", "PROVIDER_PAN"), abha: pick("abha", "PROVIDER_ABHA"), aa: pick("aa", "PROVIDER_AA"),
    esign: pick("esign", "PROVIDER_ESIGN"), ocr: pick("ocr", "PROVIDER_OCR"), sms: pick("sms", "PROVIDER_SMS"), email: pick("email", "PROVIDER_EMAIL"),
  };
}
function unavailable<K extends keyof Providers>(name: K, reason?: string): Providers[K] {
  return new Proxy({}, { get: () => async () => { throw new Error(reason ?? `${String(name)} provider is unavailable in this environment`); } }) as Providers[K];
}
export const providers = getProviders();
export { mockProviders } from "./mock";
