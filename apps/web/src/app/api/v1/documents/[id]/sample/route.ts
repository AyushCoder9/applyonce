import { handler } from "@/lib/api";
import { authorizeSample } from "@/lib/document-preview";
import { sampleDocument } from "@applyonce/providers";
export const GET=handler(async(req,{params})=>{
  const doc=await authorizeSample(new URL(req.url).searchParams.get("ticket")??"",params.id!);
  const sample=sampleDocument(doc.docType,doc.title);
  return new Response(new Uint8Array(sample.bytes),{headers:{"content-type":sample.mime,"cache-control":"private, no-store","x-content-type-options":"nosniff","content-disposition":`inline; filename="sample.${sample.mime==="image/png"?"png":"pdf"}"`}});
});
