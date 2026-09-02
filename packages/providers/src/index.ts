export * from "./types";
export * from "./fixtures";
import type { Providers } from "./types";
import { mockProviders } from "./mock";
import { setuProviders } from "./setu";

/** Resolve providers from env, per-provider. PROVIDER_<NAME>=mock|setu */
export function getProviders(env: NodeJS.ProcessEnv = process.env): Providers {
  const pick = <K extends keyof Providers>(k: K, envKey: string): Providers[K] =>
    (env[envKey] === "setu" ? setuProviders : mockProviders)[k];
  return {
    digilocker: pick("digilocker", "PROVIDER_DIGILOCKER"), pan: pick("pan", "PROVIDER_PAN"), abha: pick("abha", "PROVIDER_ABHA"), aa: pick("aa", "PROVIDER_AA"),
    esign: mockProviders.esign, ocr: mockProviders.ocr, sms: mockProviders.sms, email: mockProviders.email,
  };
}
export const providers = getProviders();
export { mockProviders } from "./mock";
