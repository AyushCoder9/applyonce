import { z } from 'zod';
import { buildReadinessGuide, type ReadinessIntent, type ReadinessLocale, type ReadinessReport } from '@applyonce/schema';
const output = z.object({summary:z.string().min(1).max(700),steps:z.array(z.string().min(1).max(250)).max(4)});

export async function explainReadiness(report:ReadinessReport,intent:ReadinessIntent,locale:ReadinessLocale) {
  const hi=locale==='hi';
  const local = buildReadinessGuide(report, intent, locale);
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
