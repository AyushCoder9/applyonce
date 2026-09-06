import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { db,t,eq,and,gt } from "@applyonce/db";
import { documentAllowed } from "@applyonce/schema";
import { listProfiles } from "./session";
import { ApiError } from "./api";

const signature = (value:string) => createHmac("sha256", process.env.BETTER_AUTH_SECRET ?? "dev-secret-change-me-dev-secret-change-me").update(value).digest("base64url");
export function sampleUrl(documentId:string,sessionId:string) {
  const data=Buffer.from(JSON.stringify({doc:documentId,sid:sessionId,exp:Date.now()+300000})).toString("base64url");
  return `/api/v1/documents/${documentId}/sample?ticket=${data}.${signature(data)}`;
}
export async function authorizeSample(ticket:string,documentId:string) {
  const [data,sig]=ticket.split(".");
  if(!data || !sig) throw new ApiError(401,"PREVIEW_EXPIRED");
  const expected=Buffer.from(signature(data)); const received=Buffer.from(sig);
  if(expected.length!==received.length || !timingSafeEqual(expected,received)) throw new ApiError(401,"PREVIEW_EXPIRED");
  let value:{doc:string;sid:string;exp:number};
  try {value=JSON.parse(Buffer.from(data,"base64url").toString());} catch {throw new ApiError(401,"PREVIEW_EXPIRED");}
  if(value.doc!==documentId || !Number.isFinite(value.exp) || value.exp<Date.now()) throw new ApiError(401,"PREVIEW_EXPIRED");
  const session=await db.query.session.findFirst({where:and(eq(t.session.id,value.sid),gt(t.session.expiresAt,new Date()))});
  if(!session) throw new ApiError(401,"PREVIEW_EXPIRED");
  const doc=await db.query.documents.findFirst({where:eq(t.documents.id,documentId)});
  const {all}=await listProfiles(session.userId);
  const profile=all.find(p=>p.id===doc?.profileId);
  if(!doc || !profile || !documentAllowed(profile.scope,doc.docType) || doc.status!=="ready" || !doc.storageKey?.startsWith("mock/")) throw new ApiError(404,"DOCUMENT_NOT_FOUND");
  return doc;
}
