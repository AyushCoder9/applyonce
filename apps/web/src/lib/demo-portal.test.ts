import {beforeAll,describe,it,expect} from 'vitest';
import {randomUUID} from 'node:crypto';
import {normalizeDateInput,validateValue} from '../../../demo-exam-portal/src/lib/validation';
import {FIELDS} from '../../../demo-exam-portal/src/lib/fields';
import {exchangeShareToken,type ApplyOnceConfig} from '../../../demo-exam-portal/src/lib/applyonce';
import {isApplicationStatusTransitionAllowed} from '@applyonce/schema';
let store:typeof import('../../../demo-exam-portal/src/lib/store');
beforeAll(async()=>{store=await import('../../../demo-exam-portal/src/lib/store');});
describe('BTA review and validation',()=>{
 it('rejects impossible dates in either supported format',()=>{expect(normalizeDateInput('2026-02-31')).toBeNull();expect(normalizeDateInput('31/02/2026')).toBeNull();expect(normalizeDateInput('2007-03-14')).toBe('2007-03-14');const dob=FIELDS.find(f=>f.isDate)!;expect(validateValue(dob,'2007-03-14').ok).toBe(true);});
 it('rejects arbitrary options and preserves false checkbox answers',()=>{const select=FIELDS.find(f=>f.kind==='select')!;expect(validateValue(select,'not-a-choice').ok).toBe(false);const bool=FIELDS.find(f=>f.kind==='checkbox'&&!f.mustBeChecked)!;expect(validateValue(bool,false)).toEqual({ok:true,value:false});});
 it('consumes callback state once',async()=>{const key=`test-${randomUUID()}`;await store.rememberState(key,'session');expect(await store.consumeState(key)).toBe('session');expect(await store.consumeState(key)).toBeNull();});
 it('retains review drafts across refresh and records submission',async()=>{const key=`test-${randomUUID()}`;await store.saveDraft(key,{payload:{} as never,verified:true,offline:false,createdAt:Date.now()});expect(await store.getDraft(key)).toBeTruthy();expect(await store.getDraft(key)).toBeTruthy();await store.completeDraft(key,'BTA-ref');expect((await store.getDraft(key))?.submittedRef).toBe('BTA-ref');const expired=`test-${randomUUID()}`;await store.saveDraft(expired,{payload:{} as never,verified:true,offline:false,createdAt:Date.now()-31*60000});expect(await store.getDraft(expired)).toBeUndefined();});
 it('rejects offline tokens unless fixture mode was explicitly enabled',async()=>{const cfg:ApplyOnceConfig={apiUrl:'http://localhost:1',apiKey:'test',formSlug:'test',webhookSecret:'test',selfUrl:'http://localhost:1',offline:false};await expect(exchangeShareToken(cfg,'sess_offline_x','offline:x')).rejects.toThrow('explicitly enabled');});
 it('prevents contradictory terminal status changes',()=>{expect(isApplicationStatusTransitionAllowed('under_review','accepted')).toBe(true);expect(isApplicationStatusTransitionAllowed('accepted','rejected')).toBe(false);expect(isApplicationStatusTransitionAllowed('rejected','accepted')).toBe(false);});
});
