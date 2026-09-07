export type ProviderMode = "mock" | "setu" | "apisetu" | "disabled";
export type ProviderOperationalState = "demo" | "sandbox" | "approval_pending" | "configured_unverified" | "live" | "unavailable" | "misconfigured";

export type ProviderReadiness = {
  id: "digilocker" | "aadhaar_offline" | "pan" | "abha" | "aa" | "esign" | "ocr" | "sms" | "email";
  label: string;
  env: string;
  mode: ProviderMode;
  state: ProviderOperationalState;
  capabilities: string[];
  blocker?: string;
  onboardingUrl?: string;
};

type Definition = Omit<ProviderReadiness, "mode" | "state" | "blocker"> & {
  implementedModes: ProviderMode[];
  approvalBlocker?: string;
};

const DEFINITIONS: Definition[] = [
  { id: "digilocker", label: "DigiLocker Requester", env: "PROVIDER_DIGILOCKER", capabilities: ["OAuth 2.0 + PKCE", "issued documents", "eAadhaar XML", "refresh", "revoke"], implementedModes: ["mock", "setu", "apisetu", "disabled"], approvalBlocker: "Requester approval, OAuth client credentials, approved scopes and exact callback URL are required for production.", onboardingUrl: "https://partners.apisetu.gov.in/signup" },
  { id: "aadhaar_offline", label: "Aadhaar offline verification", env: "PROVIDER_AADHAAR", capabilities: ["Paperless Offline e-KYC", "Aadhaar App verifiable credentials"], implementedModes: ["mock", "disabled"], approvalBlocker: "UIDAI OVSE registration is required before ApplyOnce accepts real offline Aadhaar credentials.", onboardingUrl: "https://ovse.uidai.gov.in/" },
  { id: "pan", label: "PAN verification", env: "PROVIDER_PAN", capabilities: ["PAN status", "name match"], implementedModes: ["mock", "setu", "disabled"], approvalBlocker: "Income Tax Department/Protean approval or an approved intermediary contract is required.", onboardingUrl: "https://www.incometax.gov.in/iec/foportal/central-state-government-approved-undertaking-agency" },
  { id: "abha", label: "ABHA / ABDM", env: "PROVIDER_ABHA", capabilities: ["ABHA link", "health-administration identity"], implementedModes: ["mock", "disabled"], approvalBlocker: "An India-registered entity, ABDM sandbox approval, milestone testing and production certification are required.", onboardingUrl: "https://abdm.gov.in/" },
  { id: "aa", label: "Account Aggregator", env: "PROVIDER_AA", capabilities: ["purpose-bound financial consent"], implementedModes: ["mock", "disabled"], approvalBlocker: "ApplyOnce needs an eligible regulated FIU partner; a generic startup cannot directly consume AA financial information.", onboardingUrl: "https://sahamati.org.in/financial-information-user-fiu/" },
  { id: "esign", label: "CCA eSign", env: "PROVIDER_ESIGN", capabilities: ["document hash signing", "single-use DSC"], implementedModes: ["mock", "disabled"], approvalBlocker: "ApplyOnce must onboard as an ASP with a currently empanelled eSign Service Provider.", onboardingUrl: "https://cca.gov.in/eSign.html" },
  { id: "ocr", label: "Document extraction", env: "PROVIDER_OCR", capabilities: ["field proposals", "human review"], implementedModes: ["mock", "disabled"] },
  { id: "sms", label: "Transactional SMS", env: "PROVIDER_SMS", capabilities: ["OTP", "status notifications"], implementedModes: ["mock", "disabled"], approvalBlocker: "Production SMS requires a provider account plus TRAI DLT entity, header and template approvals." },
  { id: "email", label: "Transactional email", env: "PROVIDER_EMAIL", capabilities: ["receipts", "status notifications"], implementedModes: ["mock", "disabled"], approvalBlocker: "Production email requires a verified sending domain." },
];

const MODES = new Set<ProviderMode>(["mock", "setu", "apisetu", "disabled"]);

export function providerReadiness(env: NodeJS.ProcessEnv = process.env): ProviderReadiness[] {
  return DEFINITIONS.map((definition): ProviderReadiness => {
    const { implementedModes, approvalBlocker, ...base } = definition;
    const raw = env[definition.env] ?? "mock";
    const mode = MODES.has(raw as ProviderMode) ? raw as ProviderMode : "disabled";
    if (!MODES.has(raw as ProviderMode)) return { ...base, mode, state: "misconfigured", blocker: `Unsupported mode ${raw}.` };
    if (!implementedModes.includes(mode)) return { ...base, mode, state: "misconfigured", blocker: `${mode} is not implemented for ${definition.label}.` };
    if (mode === "disabled") return { ...base, mode, state: "unavailable", blocker: approvalBlocker ?? "Provider is disabled." };
    if (mode === "mock") return { ...base, mode, state: "demo", blocker: approvalBlocker };
    if (mode === "setu") {
      const configured = Boolean(env.SETU_CLIENT_ID && env.SETU_CLIENT_SECRET && (definition.id !== "digilocker" || env.SETU_PRODUCT_INSTANCE_ID));
      return { ...base, mode, state: configured ? (env[`PROVIDER_${definition.id.toUpperCase()}_VERIFIED`] === "1" ? "live" : "configured_unverified") : "misconfigured", blocker: configured ? "Commercial credentials are configured, but production health and consent must be verified before this is labelled live." : "Setu credentials are missing." };
    }
    const configured = definition.id === "digilocker" && Boolean(env.DIGILOCKER_CLIENT_ID && env.DIGILOCKER_CLIENT_SECRET);
    return { ...base, mode, state: configured ? (env.DIGILOCKER_PRODUCTION_VERIFIED === "1" ? "live" : "configured_unverified") : "approval_pending", blocker: configured ? "Credentials are configured. Complete an approved-scope end-to-end test before setting DIGILOCKER_PRODUCTION_VERIFIED=1." : approvalBlocker };
  });
}

export function readinessFor(id: ProviderReadiness["id"], env: NodeJS.ProcessEnv = process.env) {
  return providerReadiness(env).find((provider) => provider.id === id)!;
}
