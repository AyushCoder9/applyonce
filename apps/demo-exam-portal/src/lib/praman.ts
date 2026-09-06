/** Partner adapter uses the shared SDK. Offline fixtures require explicit DEMO_OFFLINE=1. */
import { createPraman, verifyWebhookSignature as verifySignature, type ApplicationStatus } from '@praman/sdk';
import { randomUUID } from 'node:crypto';
import type { PramanPayload } from '@praman/schema';
import { buildOfflinePayload } from './fixtures';
export interface PramanConfig {apiUrl:string;apiKey:string;formSlug:string;webhookSecret:string;selfUrl:string;offline:boolean}
export function loadPramanConfig():PramanConfig {return {
  apiUrl:process.env.PRAMAN_API_URL??'http://localhost:3300',apiKey:process.env.BTA_PRAMAN_API_KEY??'pk_sandbox_bta_demo_key_0001',
  formSlug:process.env.BTA_PRAMAN_FORM_ID??'bta-jee-2026',webhookSecret:process.env.BTA_WEBHOOK_SECRET??'whsec_bta_demo_0001',
  selfUrl:process.env.NEXT_PUBLIC_DEMO_PORTAL_URL??'http://localhost:3301',offline:process.env.DEMO_OFFLINE==='1'
};}
const client=(c:PramanConfig)=>createPraman({apiKey:c.apiKey,baseUrl:c.apiUrl,webhookSecret:c.webhookSecret,fetch:(url,init)=>fetch(url,{...init,signal:AbortSignal.timeout(30_000)})});
export interface ShareSessionResult {share_url:string;session_id:string}
export async function createShareSession(c:PramanConfig,o:{returnUrl:string;state:string}):Promise<ShareSessionResult> {
  if(!c.offline) return client(c).createShareSession({formSlug:c.formSlug,returnUrl:o.returnUrl,state:o.state,idempotencyKey:randomUUID()});
  const id=`sess_offline_${randomUUID()}`;
  const url=new URL(o.returnUrl);url.searchParams.set('share_token',`offline:${id}`);url.searchParams.set('state',o.state);
  return {share_url:url.toString(),session_id:id};
}
export interface ExchangeResult {payload:PramanPayload;verified:boolean;offline:boolean}
export async function exchangeShareToken(c:PramanConfig,sessionId:string,token:string):Promise<ExchangeResult> {
  if(c.offline) return {payload:buildOfflinePayload({formId:c.formSlug,applicationId:`app_offline_${randomUUID()}`,consentId:`cons_offline_${randomUUID()}`,audience:'bta'}),verified:false,offline:true};
  if(token.startsWith('offline:')||sessionId.startsWith('sess_offline')) throw new Error('Offline tokens require explicitly enabled offline mode.');
  const result=await client(c).exchange(token,sessionId);
  return {payload:result.payload,verified:true,offline:false};
}
export const verifyWebhookSignature=(c:PramanConfig,body:string,signature:string|null,timestamp:string|null,tolerance=300)=>verifySignature(c.webhookSecret,body,signature,timestamp,tolerance);
export interface PushStatusInput {status:string;note?:string;externalRef?:string}
export async function pushStatus(c:PramanConfig,id:string,input:PushStatusInput,key: string=randomUUID()):Promise<{ok:boolean;offline:boolean}> {
  if(c.offline) return {ok:true,offline:true};
  await client(c).pushStatus(id,{...input,status:input.status as ApplicationStatus},key);
  return {ok:true,offline:false};
}
