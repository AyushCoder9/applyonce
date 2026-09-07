import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type {
  AadhaarOfflineKyc,
  DigiLockerProvider,
  IssuedDoc,
  ProviderAuthTransaction,
} from "../types";

const DEFAULT_BASE = "https://api.digitallocker.gov.in/public";

type TokenBundle = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
  consentValidTill?: string;
  digilockerId?: string;
  referenceKey?: string;
};

type DigiLockerConfig = {
  clientId: string;
  clientSecret: string;
  baseUrl?: string;
  scope?: string;
  purpose?: "kyc" | "verification" | "compliance" | "availing_services" | "educational";
  consentValidTill?: string;
  requestDocumentType?: string;
  fetch?: typeof fetch;
  requireResponseHmac?: boolean;
};

const b64url = (bytes: Uint8Array) => Buffer.from(bytes).toString("base64url");
const sha256b64url = (value: string) => createHash("sha256").update(value).digest("base64url");
const stateToken = () => b64url(randomBytes(32));
const verifierToken = () => b64url(randomBytes(48));

function assertConfig(config: DigiLockerConfig) {
  if (!config.clientId || !config.clientSecret) throw new Error("DigiLocker client credentials are not configured");
}

function encodeRef(value: TokenBundle) {
  return `digilocker:v1:${Buffer.from(JSON.stringify(value), "utf8").toString("base64url")}`;
}

function decodeRef(value: string): TokenBundle {
  if (!value.startsWith("digilocker:v1:")) throw new Error("Unsupported DigiLocker provider reference");
  const parsed = JSON.parse(Buffer.from(value.slice("digilocker:v1:".length), "base64url").toString("utf8")) as TokenBundle;
  if (!parsed.accessToken || !parsed.expiresAt) throw new Error("Invalid DigiLocker provider reference");
  return parsed;
}

async function errorText(response: Response) {
  const body = await response.text().catch(() => "");
  try {
    const parsed = JSON.parse(body) as { error?: string; error_description?: string; message?: string };
    return parsed.error_description ?? parsed.message ?? parsed.error ?? `HTTP ${response.status}`;
  } catch {
    return body.slice(0, 240) || `HTTP ${response.status}`;
  }
}

function bearer(ref: string) {
  return { authorization: `Bearer ${decodeRef(ref).accessToken}` };
}

function verifyHmac(bytes: Uint8Array, received: string | null, clientSecret: string, required: boolean) {
  if (!received) {
    if (required) throw new Error("DigiLocker response is missing its integrity HMAC");
    return;
  }
  const clean = received.trim().replace(/^sha256=/i, "");
  const expectedHex = createHmac("sha256", clientSecret).update(bytes).digest("hex");
  const expectedBase64 = Buffer.from(expectedHex, "hex").toString("base64");
  const candidates = [expectedHex, expectedBase64, Buffer.from(expectedHex, "hex").toString("base64url")];
  const valid = candidates.some((candidate) => {
    const a = Buffer.from(candidate);
    const b = Buffer.from(clean);
    return a.length === b.length && timingSafeEqual(a, b);
  });
  if (!valid) throw new Error("DigiLocker response integrity check failed");
}

function xmlEntities(value: string) {
  return value.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

function tagAttributes(xml: string, tag: string): Record<string, string> {
  const match = xml.match(new RegExp(`<${tag}\\b([^>]*)>`, "i")) ?? xml.match(new RegExp(`<${tag}\\b([^>]*)/>`, "i"));
  if (!match?.[1]) return {};
  return Object.fromEntries(Array.from(match[1].matchAll(/([:\w-]+)\s*=\s*(["'])(.*?)\2/g), (m) => [m[1]!, xmlEntities(m[3] ?? "")]));
}

function tagText(xml: string, tag: string) {
  return xmlEntities(xml.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, "i"))?.[1]?.trim() ?? "");
}

export function parseDigiLockerAadhaarXml(xml: string, referenceKey = ""): AadhaarOfflineKyc {
  if (Buffer.byteLength(xml, "utf8") > 2_000_000) throw new Error("DigiLocker Aadhaar XML is unexpectedly large");
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error("Unsafe declarations are not allowed in DigiLocker XML");
  const poi = tagAttributes(xml, "Poi");
  const poa = tagAttributes(xml, "Poa");
  const root = tagAttributes(xml, "KycRes");
  const uidData = tagAttributes(xml, "UidData");
  const reference = referenceKey || root.referenceId || root.referenceKey || "";
  // A DigiLocker reference key is not an Aadhaar number. Derive the display-only
  // suffix only when the credential itself contains a UID/masked UID attribute.
  const uidDigits = String(uidData.uid ?? poi.uid ?? root.uid ?? "").replace(/\D/g, "");
  if (!poi.name || !poi.dob || !poi.gender) throw new Error("DigiLocker Aadhaar XML is missing identity fields");
  return {
    name: poi.name,
    dob: normalizeDate(poi.dob),
    gender: normalizeGender(poi.gender),
    photoBase64: tagText(xml, "Pht") || undefined,
    address: {
      house: poa.house || undefined,
      street: poa.street || undefined,
      landmark: poa.lm || poa.landmark || undefined,
      locality: poa.loc || poa.locality || poa.po || undefined,
      vtc: poa.vtc || poa.city || "",
      district: poa.dist || poa.district || "",
      state: poa.state || "",
      pincode: poa.pc || poa.pincode || "",
      country: poa.country || "India",
    },
    last4: uidDigits.slice(-4),
    referenceKey: reference,
    xmlHash: createHash("sha256").update(xml).digest("hex"),
    generatedAt: new Date().toISOString(),
  };
}

function normalizeDate(value: string) {
  if (/^\d{2}-\d{2}-\d{4}$/.test(value)) return value.split("-").reverse().join("-");
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value.split("/").reverse().join("-");
  return value;
}

function normalizeGender(value: string): "M" | "F" | "T" {
  const initial = value.trim().charAt(0).toUpperCase();
  return initial === "F" ? "F" : initial === "T" ? "T" : "M";
}

function mapDocType(value: string) {
  return ({
    ADHAR: "aadhaar",
    PANCR: "pan",
    SSCER: "marksheet_10",
    HSCER: "marksheet_12",
    DRVLC: "dl",
    CTCER: "category_cert",
    INCER: "income_cert",
    DMCER: "domicile_cert",
    DEGCR: "degree",
  } as Record<string, string>)[value.toUpperCase()] ?? value.toLowerCase();
}

/** Direct implementation of DigiLocker Requester API v1.12 (OAuth 2.0 + PKCE). */
export function createApiSetuDigiLocker(config: DigiLockerConfig): DigiLockerProvider {
  assertConfig(config);
  const request = config.fetch ?? fetch;
  const base = (config.baseUrl ?? DEFAULT_BASE).replace(/\/$/, "");
  const responseHmacRequired = config.requireResponseHmac ?? true;

  async function json<T>(path: string, init: RequestInit) {
    const response = await request(`${base}${path}`, { ...init, signal: init.signal ?? AbortSignal.timeout(15_000) });
    if (!response.ok) throw new Error(`DigiLocker ${path}: ${await errorText(response)}`);
    return response.json() as Promise<T>;
  }

  return {
    async startAuth(_userId, redirectUri) {
      const state = stateToken();
      const codeVerifier = verifierToken();
      const transaction: ProviderAuthTransaction = { state, redirectUri, codeVerifier };
      const params = new URLSearchParams({
        response_type: "code",
        client_id: config.clientId,
        redirect_uri: redirectUri,
        state,
        code_challenge: sha256b64url(codeVerifier),
        code_challenge_method: "S256",
        scope: config.scope ?? "openid",
        purpose: config.purpose ?? "educational",
      });
      if (config.consentValidTill) params.set("consent_valid_till", config.consentValidTill);
      if (config.requestDocumentType) params.set("req_doctype", config.requestDocumentType);
      return { url: `${base}/oauth2/1/authorize?${params}`, transaction };
    },

    async completeAuth(transaction, code) {
      if (!transaction.codeVerifier) throw new Error("DigiLocker PKCE verifier is missing");
      const token = await json<{
        access_token: string;
        refresh_token?: string;
        expires_in?: number;
        consent_valid_till?: string;
        digilocker_id?: string;
        reference_key?: string;
      }>("/oauth2/1/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          client_id: config.clientId,
          client_secret: config.clientSecret,
          redirect_uri: transaction.redirectUri,
          code_verifier: transaction.codeVerifier,
        }),
      });
      if (!token.access_token) throw new Error("DigiLocker did not return an access token");
      const bundle: TokenBundle = {
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresAt: new Date(Date.now() + Math.max(60, token.expires_in ?? 3600) * 1000).toISOString(),
        consentValidTill: token.consent_valid_till,
        digilockerId: token.digilocker_id,
        referenceKey: token.reference_key,
      };
      const user = await json<{ name?: string; dob?: string; digilockerid?: string }>("/oauth2/1/user", {
        headers: { authorization: `Bearer ${bundle.accessToken}`, accept: "application/json" },
      });
      bundle.digilockerId ||= user.digilockerid;
      return { providerRef: encodeRef(bundle), name: user.name, dob: user.dob ? normalizeDate(user.dob) : undefined };
    },

    async listIssuedDocs(providerRef) {
      const result = await json<{ items?: Array<Record<string, unknown>>; documents?: Array<Record<string, unknown>> }>("/oauth2/2/files/issued", {
        headers: { ...bearer(providerRef), accept: "application/json" },
      });
      const items = result.items ?? result.documents ?? [];
      return items.map<IssuedDoc>((item) => ({
        uri: String(item.uri ?? ""),
        docType: mapDocType(String(item.doctype ?? item.docType ?? item.type ?? "document")),
        name: String(item.name ?? item.description ?? "Issued document"),
        issuerId: String(item.issuerid ?? item.issuerId ?? ""),
        issuerName: String(item.issuer ?? item.issuerName ?? "DigiLocker issuer"),
        issuedAt: item.date ? String(item.date) : undefined,
        mime: String(item.mime ?? "application/pdf"),
      })).filter((item) => item.uri.length > 0);
    },

    async fetchDoc(providerRef, uri) {
      const response = await request(`${base}/oauth2/1/file/${encodeURIComponent(uri)}`, { headers: bearer(providerRef), signal: AbortSignal.timeout(30_000) });
      if (!response.ok) throw new Error(`DigiLocker document fetch: ${await errorText(response)}`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      verifyHmac(bytes, response.headers.get("hmac") ?? response.headers.get("x-digilocker-hmac"), config.clientSecret, responseHmacRequired);
      return { bytes, mime: response.headers.get("content-type")?.split(";")[0] ?? "application/octet-stream" };
    },

    async fetchAadhaarXml(providerRef) {
      const response = await request(`${base}/oauth2/3/xml/eaadhaar`, { headers: bearer(providerRef), signal: AbortSignal.timeout(30_000) });
      if (!response.ok) throw new Error(`DigiLocker eAadhaar fetch: ${await errorText(response)}`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      verifyHmac(bytes, response.headers.get("hmac") ?? response.headers.get("x-digilocker-hmac"), config.clientSecret, responseHmacRequired);
      return parseDigiLockerAadhaarXml(Buffer.from(bytes).toString("utf8"), decodeRef(providerRef).referenceKey);
    },

    async refresh(providerRef) {
      const current = decodeRef(providerRef);
      if (new Date(current.expiresAt).getTime() - Date.now() > 5 * 60_000) return { providerRef };
      if (!current.refreshToken) throw new Error("DigiLocker refresh token is unavailable");
      const token = await json<{ access_token: string; refresh_token?: string; expires_in?: number; consent_valid_till?: string }>("/oauth2/1/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: current.refreshToken,
          client_id: config.clientId,
          client_secret: config.clientSecret,
        }),
      });
      return { providerRef: encodeRef({ ...current, accessToken: token.access_token, refreshToken: token.refresh_token ?? current.refreshToken, expiresAt: new Date(Date.now() + Math.max(60, token.expires_in ?? 3600) * 1000).toISOString(), consentValidTill: token.consent_valid_till ?? current.consentValidTill }) };
    },

    async revoke(providerRef) {
      const token = decodeRef(providerRef);
      const response = await request(`${base}/oauth2/1/revoke`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
        body: new URLSearchParams({ token: token.refreshToken ?? token.accessToken, client_id: config.clientId, client_secret: config.clientSecret }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error(`DigiLocker revoke: ${await errorText(response)}`);
    },
  };
}
