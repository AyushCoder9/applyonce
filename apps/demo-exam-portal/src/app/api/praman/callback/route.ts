import { randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { consumeState,saveDraft } from '@/lib/store';
import { exchangeShareToken,loadPramanConfig } from '@/lib/praman';
export async function GET(request:Request) {
  const url=new URL(request.url),cfg=loadPramanConfig(),state=url.searchParams.get('state');
  const jar=await cookies();
  if(!state || jar.get('bta_state')?.value!==state) return NextResponse.redirect(new URL('/apply/return?error=state',cfg.selfUrl));
  const sessionId=consumeState(state);
  if(!sessionId) return NextResponse.redirect(new URL('/apply/return?error=expired',cfg.selfUrl));
  if(url.searchParams.get('praman_error')==='denied') return NextResponse.redirect(new URL('/apply/return?error=denied',cfg.selfUrl));
  const token=url.searchParams.get('share_token');
  if(!token) return NextResponse.redirect(new URL('/apply/return?error=token',cfg.selfUrl));
  try {
    const result=await exchangeShareToken(cfg,sessionId,token);
    const draftToken=randomUUID();saveDraft(draftToken,{...result,createdAt:Date.now()});
    const response=NextResponse.redirect(new URL(`/apply/return?draft=${draftToken}`,cfg.selfUrl));
    response.cookies.set('bta_draft',draftToken,{httpOnly:true,sameSite:'lax',secure:new URL(cfg.selfUrl).protocol==='https:',maxAge:1800,path:'/'});
    response.cookies.delete('bta_state');return response;
  } catch { return NextResponse.redirect(new URL('/apply/return?error=exchange',cfg.selfUrl)); }
}
