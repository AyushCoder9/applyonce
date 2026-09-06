/** Refresh only built-in fixture attachments. Never resets user data. */
import { db, sql } from "./client";
import * as t from "./schema";
import { eq, and } from "drizzle-orm";
import { sampleDocument, AARAV, SUNITA, VIKRAM } from "@praman/providers/fixtures";
import { sha256 } from "@praman/crypto";
if ((process.env.PROVIDER_DIGILOCKER ?? "mock") !== "mock") throw new Error("Demo fixtures require mock DigiLocker mode");
for (const person of [AARAV,SUNITA,VIKRAM]) {
  const profile=await db.query.profiles.findFirst({where:and(eq(t.profiles.ownerUserId,person.id),eq(t.profiles.kind,"self"))});
  if (!profile) continue;
  const docs=await db.select().from(t.documents).where(eq(t.documents.profileId,profile.id));
  for (const doc of docs.filter(d=>d.storageKey?.startsWith("mock/"))) {
    const sample=sampleDocument(doc.docType,doc.title);
    await db.update(t.documents).set({mime:sample.mime,size:sample.bytes.length,sha256:sha256(sample.bytes)}).where(eq(t.documents.id,doc.id));
  }
  for (const docType of ["photo","signature"]) {
    if (docs.some(d=>d.docType===docType)) continue;
    const title=`Sample ${docType} - replace for a real application`;
    const sample=sampleDocument(docType,title);
    await db.insert(t.documents).values({profileId:profile.id,docType,title,storageKey:`mock/${person.id}/${docType}.png`,mime:sample.mime,size:sample.bytes.length,sha256:sha256(sample.bytes),origin:"generated",status:"ready",meta:{sample:true}});
  }
}
console.log("Demo attachments refreshed");
await sql.end();
