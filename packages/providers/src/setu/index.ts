/**
 * Setu sandbox adapters (DigiLocker, Aadhaar offline via DigiLocker, PAN, AA).
 * Endpoints per Setu docs (docs.setu.co). Filled in by env; never called from tests.
 * Only DigiLocker + PAN implemented; others fall back to mock until keys exist.
 */
import type { DigiLockerProvider, PanProvider, IssuedDoc } from "../types";
import { mockProviders } from "../mock";

const BASE = process.env.SETU_BASE_URL ?? "https://dg-sandbox.setu.co";
const H = () => ({ "x-client-id": process.env.SETU_CLIENT_ID ?? "", "x-client-secret": process.env.SETU_CLIENT_SECRET ?? "", "x-product-instance-id": process.env.SETU_PRODUCT_INSTANCE_ID ?? "", "content-type": "application/json" });
async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(`${BASE}${path}`, { ...init, headers: { ...H(), ...(init.headers ?? {}) } });
  if (!r.ok) throw new Error(`setu ${path} ${r.status}: ${await r.text()}`);
  return r.json() as Promise<T>;
}

// Setu DigiLocker: POST /api/digilocker → {id, url, validUpto}; GET /api/digilocker/{id}/status → {status}; GET /api/digilocker/{id}/aadhaar → {aadhaar:{...}}; POST /api/digilocker/{id}/document → {fileUrl, validUpto}
export const setuDigilocker: DigiLockerProvider = {
  async startAuth(_userId, redirectUri) {
    const r = await call<{ id: string; url: string }>("/api/digilocker", { method: "POST", body: JSON.stringify({ redirectUrl: redirectUri, docType: "AADHAAR" }) });
    return { url: r.url, state: r.id };
  },
  async completeAuth(state) {
    const s = await call<{ status: string }>(`/api/digilocker/${state}/status`);
    if (s.status !== "authenticated") throw new Error(`setu digilocker status ${s.status}`);
    return { providerRef: state };
  },
  async listIssuedDocs(ref) {
    const r = await call<{ documents: { docType: string; name: string; orgId: string; orgName: string; uri: string; date?: string }[] }>(`/api/digilocker/${ref}/documents`);
    return r.documents.map<IssuedDoc>((d) => ({ uri: d.uri, docType: mapDocType(d.docType), name: d.name, issuerId: d.orgId, issuerName: d.orgName, issuedAt: d.date, mime: "application/pdf" }));
  },
  async fetchDoc(ref, uri) {
    const r = await call<{ fileUrl: string }>(`/api/digilocker/${ref}/document`, { method: "POST", body: JSON.stringify({ uri, format: "pdf" }) });
    const bytes = new Uint8Array(await (await fetch(r.fileUrl)).arrayBuffer());
    return { bytes, mime: "application/pdf" };
  },
  async fetchAadhaarXml(ref) {
    const r = await call<{ aadhaar: { name: string; dateOfBirth: string; gender: string; maskedNumber: string; address: Record<string, string>; photo?: string; xml?: { fileUrl: string; shareCode: string } } }>(`/api/digilocker/${ref}/aadhaar`);
    const a = r.aadhaar, adr = a.address ?? {};
    return {
      name: a.name, dob: normDate(a.dateOfBirth), gender: (a.gender?.[0]?.toUpperCase() as "M" | "F" | "T") ?? "M", photoBase64: a.photo, last4: a.maskedNumber?.slice(-4) ?? "0000",
      referenceKey: ref, xmlHash: a.xml?.fileUrl ?? "", generatedAt: new Date().toISOString(),
      address: { house: adr.house, street: adr.street, landmark: adr.landmark, locality: adr.locality, vtc: adr.vtc ?? adr.city ?? "", district: adr.district ?? "", state: adr.state ?? "", pincode: adr.pincode ?? "", country: "India" },
    };
  },
};
const mapDocType = (t: string) => ({ ADHAR: "aadhaar", PANCR: "pan", SSCER: "marksheet_10", HSCER: "marksheet_12", DRVLC: "dl", CTCER: "category_cert", INCER: "income_cert", DMCER: "domicile_cert", DEGCR: "degree" } as Record<string, string>)[t] ?? t.toLowerCase();
const normDate = (d: string) => (/^\d{2}-\d{2}-\d{4}$/.test(d) ? d.split("-").reverse().join("-") : d);

// Setu PAN: POST /api/verify/pan {pan, consent:"Y", reason} → {verification:"success", data:{full_name, category}}
export const setuPan: PanProvider = {
  async verify(pan, name) {
    const r = await call<{ verification: string; data?: { full_name?: string } }>("/api/verify/pan", { method: "POST", body: JSON.stringify({ pan, consent: "Y", reason: "ApplyOnce identity verification" }) });
    const ok = r.verification === "success";
    const nm = r.data?.full_name?.toLowerCase().trim() ?? "";
    return { valid: ok, nameMatch: ok ? (nm === name.toLowerCase().trim() ? 1 : nm.includes(name.toLowerCase().split(" ")[0] ?? "") ? 0.7 : 0.3) : 0, status: r.verification };
  },
};

export const setuProviders = { ...mockProviders, digilocker: setuDigilocker, pan: setuPan };
