export type ConnectorState = "unavailable" | "approval_pending" | "sandbox" | "connected" | "degraded" | "expired" | "revoked";

export type ConnectorDefinition = {
  id: string;
  name: string;
  category: "identity" | "documents" | "education" | "verification";
  state: ConnectorState;
  purpose: string;
  liveData: boolean;
  canAuthorize: boolean;
  disclosure: string;
};

export const connectorRegistry = [
  { id: "synthetic", name: "Synthetic demo source", category: "verification", state: "sandbox", purpose: "Reviewer-safe identity and education claims.", liveData: false, canAuthorize: true, disclosure: "Available only in the labelled synthetic demo tenant." },
  { id: "manual", name: "Manual upload", category: "documents", state: "connected", purpose: "Citizen-controlled private document uploads.", liveData: true, canAuthorize: true, disclosure: "Files remain private and require application-specific consent before sharing." },
  { id: "digilocker", name: "DigiLocker", category: "documents", state: "approval_pending", purpose: "Official document retrieval with citizen consent.", liveData: false, canAuthorize: false, disclosure: "Requester onboarding, agreement, credentials, and production approval are not complete." },
  { id: "meripehchaan", name: "MeriPehchaan", category: "identity", state: "approval_pending", purpose: "Authentication and approved identity claims.", liveData: false, canAuthorize: false, disclosure: "Configured as an authentication adapter only after official partner approval." },
  { id: "apaar", name: "APAAR", category: "education", state: "unavailable", purpose: "Approved academic-record access where documented.", liveData: false, canAuthorize: false, disclosure: "Third-party production access is not currently approved." },
  { id: "esign", name: "CCA-approved eSign", category: "verification", state: "approval_pending", purpose: "Partner-required electronic signatures through an approved ASP or ESP.", liveData: false, canAuthorize: false, disclosure: "ApplyOnce does not operate a custom biometric or signing vault." },
] as const satisfies readonly ConnectorDefinition[];

export function getConnector(provider: string) {
  return connectorRegistry.find((connector) => connector.id === provider) ?? null;
}
