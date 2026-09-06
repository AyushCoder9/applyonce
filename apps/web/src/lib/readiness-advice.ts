import { z } from 'zod';
import type { assessReadiness } from '@praman/schema';
type Report = ReturnType<typeof assessReadiness>;
const output = z.object({summary:z.string().min(1).max(700),steps:z.array(z.string().min(1).max(250)).max(4)});

export async function explainReadiness(report:Report,intent:'next'|'privacy'|'trust',locale:'en'|'hi') {
  const hi=locale==='hi';
  const local = intent==='privacy' ? {summary:hi?'केवल आपकी चुनी गई जानकारी सहमति के बाद साझा होगी।':'Only the fields you approve are shared after fresh OTP or passkey confirmation.',steps:hi?['सहमति पृष्ठ पर उद्देश्य और अवधि पढ़ें।','वैकल्पिक जानकारी अनचेक करें।','Connections में साझा जानकारी देखें और सहमति वापस लें।']:['Review purpose and retention on the consent screen.','Untick optional fields you want to keep private.','Use Connections to inspect your receipt or revoke access.']}
    : intent==='trust' ? {summary:hi?'सत्यापित स्रोत और स्वयं दी गई जानकारी अलग हैं।':'Verified means an issuer or provider supplied the fact. It does not mean AI judged it to be true.',steps:hi?['हर तथ्य का स्रोत देखें।','समाप्त या बेमेल प्रमाण ठीक करें।','डेमो प्रदाता नमूना डेटा देते हैं।']:['Check the source shown beside each field.','Renew expired evidence and resolve conflicting values.','Sandbox providers return sample evidence; production requires provider access.']}
    : {summary:hi?`${report.required} में से ${report.ready} आवश्यक फ़ील्ड तैयार हैं।`:`${report.ready} of ${report.required} required fields are ready. ${report.closed?'The deadline has passed.':report.blockers.length?'Start with the items below.':'Continue to review and approve the share.'}`,steps:report.blockers.length?report.blockers.slice(0,4).map(c=>`${c.label[locale]}: ${hi?({missing:'जानकारी जोड़ें',expired:'प्रमाण नया करें',conflict:'बेमेल हल करें',blocked:'प्रोफ़ाइल स्वामी से आवेदन करवाएँ'} as Record<string,string>)[c.status]:({missing:'add the missing answer',expired:'renew the evidence in Verify',conflict:'resolve the mismatch in Verify',blocked:'ask the profile owner to apply'} as Record<string,string>)[c.status]}`):[hi?'सहमति से पहले सभी जानकारी जाँचें।':'Review the evidence, choose optional fields, then confirm consent.']};
  if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_MODEL) return {mode:'Local evidence guide',...local};
  try {
    // Only derived checks, no fact values, names, documents or user identifiers.
    const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',signal:AbortSignal.timeout(12_000),headers:{authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'content-type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_MODEL,store:false,max_output_tokens:500,instructions:`Explain these deterministic application checks in ${hi?'Hindi':'plain English'}. Do not infer eligibility, invent facts, request identifiers, claim verification, or add actions beyond the supplied guide. Return a short summary and up to four steps.`,input:JSON.stringify({intent,guide:local}),text:{format:{type:'json_schema',name:'readiness_guide',strict:true,schema:{type:'object',properties:{summary:{type:'string'},steps:{type:'array',items:{type:'string'}}},required:['summary','steps'],additionalProperties:false}}}})});
    if (!response.ok) throw new Error('AI unavailable');
    const result=await response.json() as {output?:{content?:{type:string;text?:string}[]}[]};
    const text=result.output?.flatMap(item=>item.content??[]).find(item=>item.type==='output_text')?.text;
    const parsed=output.parse(JSON.parse(text??''));
    return {mode:'AI explanation · evidence checked locally',...parsed};
  } catch { return {mode:'Local guide · AI unavailable',...local}; }
}
