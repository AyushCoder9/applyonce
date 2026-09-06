import { redis } from "@praman/jobs";
import { z } from 'zod';
import { db,t,eq,and,isNull,getDek,getFacts } from '@praman/db';
import { assessReadiness } from '@praman/schema';
import { handler,citizen,body,ok,ApiError } from '@/lib/api';
import { explainReadiness } from '@/lib/readiness-advice';

export const POST = handler(async req => {
  const input = await body(req,z.object({formId:z.uuid(),profileId:z.uuid(),intent:z.enum(['next','privacy','trust']),locale:z.enum(['en','hi']).default('en')}));
  const access = await citizen(req,{profileId:input.profileId});
  const minute = Math.floor(Date.now()/60000);
  const key = `readiness:${access.user.id}:${minute}`;
  const calls = await redis().incr(key);
  if (calls===1) await redis().expire(key,90);
  if (calls>12) throw new ApiError(429,"RATE_LIMITED","Please wait a minute before asking again.");
  const form = await db.query.forms.findFirst({where:and(eq(t.forms.id,input.formId),eq(t.forms.status,'live'))});
  if (!form) throw new ApiError(404,'FORM_NOT_FOUND');
  const facts = await getFacts(await getDek(access.ownerUserId),access.profile.id,{keys:form.requestedFields.map(f=>f.key)});
  const conflicts = await db.select({key:t.mismatches.factKey}).from(t.mismatches).where(and(eq(t.mismatches.profileId,access.profile.id),isNull(t.mismatches.resolvedAt)));
  const report = assessReadiness(facts,form,{scope:access.scope,conflicts:conflicts.map(c=>c.key)});
  return ok(await explainReadiness(report,input.intent,input.locale));
});
