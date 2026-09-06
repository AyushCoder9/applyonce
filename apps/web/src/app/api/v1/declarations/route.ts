import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { z } from "zod";
import { db,t } from "@applyonce/db";
import { sha256 } from "@applyonce/crypto";
import { handler,citizen,body,ok,ApiError,log } from "@/lib/api";
import { s3,bucket } from "@/lib/storage";

/** Sandbox declaration receipt. This is not a government or licensed e-Sign certificate. */
export const POST=handler(async req=>{
  const a=await citizen(req,{stepUp:true});
  if(a.profile.kind!=="self" || a.ownerUserId!==a.user.id) throw new ApiError(403,"SELF_ONLY","Create declarations from your own profile.");
  const input=await body(req,z.object({title:z.string().trim().min(3).max(100),declaration:z.string().trim().min(20).max(2000),confirm:z.literal(true)}));
  const id=randomUUID();const at=new Date().toISOString();const digest=sha256(input.declaration);
  const receipt=["APPLYONCE SANDBOX DECLARATION RECEIPT","Not a licensed e-Sign or issuer verification.","",`Receipt: ${id}`,`Confirmed at: ${at}`,`Profile: ${a.profile.displayName}`,`Title: ${input.title}`,"",input.declaration,"",`Declaration SHA-256: ${digest}`,"Confirmed using a recent OTP or passkey session. This receipt does not prove the declaration is true."].join("\n");
  const bytes=Buffer.from(receipt);const key=`docs/${a.profile.id}/${id}/declaration.txt`;
  await s3().send(new PutObjectCommand({Bucket:bucket(),Key:key,Body:bytes,ContentType:"text/plain; charset=utf-8"}));
  await db.insert(t.documents).values({id,profileId:a.profile.id,docType:"other",title:input.title,storageKey:key,mime:"text/plain",size:bytes.length,sha256:sha256(bytes),origin:"generated",status:"ready",meta:{filename:"declaration.txt",sandbox:true,declarationHash:digest,confirmedAt:at}});
  await log(a.session,"declaration.confirm","document",id,{profileId:a.profile.id,declarationHash:digest,sandbox:true});
  return ok({documentId:id,receiptId:id,confirmedAt:at},{status:201});
});
