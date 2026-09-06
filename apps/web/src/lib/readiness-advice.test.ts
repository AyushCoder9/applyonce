import {afterEach,describe,it,expect,vi} from 'vitest';
import {assessReadiness} from '@applyonce/schema';
import {explainReadiness} from './readiness-advice';
const report=assessReadiness([],{purpose:'exam_application',requestedFields:[{key:'identity.full_name',required:true}]});
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
describe('evidence guidance boundary',()=>{
  it('works without an AI service',async()=>{vi.stubEnv('OPENAI_API_KEY','');expect((await explainReadiness(report,'next','en')).mode).toBe('Local evidence guide');});
  it('sends only derived guidance and never changes the deterministic result',async()=>{
    vi.stubEnv('OPENAI_API_KEY','unit-test-key');vi.stubEnv('OPENAI_MODEL','configured-model');
    const fetcher=vi.fn(async()=>Response.json({output:[{content:[{type:'output_text',text:JSON.stringify({summary:'Add the missing name.',steps:['Open your identity vault.']})}]}]}));vi.stubGlobal('fetch',fetcher);
    const result=await explainReadiness(report,'next','en');expect(result.mode).toContain('AI explanation');
    const request=JSON.parse((fetcher.mock.calls[0] as unknown as [string,RequestInit])[1].body as string);
    expect(request.store).toBe(false);expect(request.text.format.strict).toBe(true);
    expect(Object.keys(JSON.parse(request.input))).toEqual(['intent','guide']);expect(report.ready).toBe(0);
  });
  it('falls back on malformed output or provider failure',async()=>{
    vi.stubEnv('OPENAI_API_KEY','test');vi.stubEnv('OPENAI_MODEL','configured-model');
    vi.stubGlobal('fetch',vi.fn(async()=>Response.json({output:[{content:[{type:'output_text',text:'{"invented":true}'}]}]})));
    expect((await explainReadiness(report,'privacy','hi')).mode).toContain('AI unavailable');
  });
});
