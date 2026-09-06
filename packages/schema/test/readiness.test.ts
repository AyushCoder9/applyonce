import { describe, it, expect } from 'vitest';
import { assessReadiness, customAnswerErrors, type Fact } from '../src';
const now = Date.parse('2026-09-06T12:00:00Z');
const fact = (key: string, value: Fact['value'], extra: Partial<Fact> = {}): Fact => ({ key, value, repeatIndex: 0, source: 'issuer_verified', ...extra });
const form = { purpose: 'exam_application' as const, requestedFields: [{ key: 'identity.full_name', required: true }, { key: 'category.pwd', required: true }] };
describe('evidence readiness', () => {
  it('counts false as an answer and does not expose values', () => {
    const result = assessReadiness([fact('identity.full_name', 'Private Name'), fact('category.pwd', false)], form, { now });
    expect(result.canSubmit).toBe(true); expect(result.percent).toBe(100); expect(JSON.stringify(result)).not.toContain('Private Name');
  });
  it('blocks expired evidence, conflicts and delegated fields', () => {
    const facts = [fact('identity.full_name', 'Name', { expiresAt: '2026-09-05' }), fact('category.pwd', false)];
    expect(assessReadiness(facts, form, { now }).blockers[0]?.status).toBe('expired');
    expect(assessReadiness(facts, form, { now, conflicts: ['identity.full_name'] }).blockers[0]?.status).toBe('conflict');
    expect(assessReadiness(facts, form, { now, scope: ['category'] }).blockers[0]?.status).toBe('blocked');
  });
  it('does not confuse an empty or closed form with eligibility', () => {
    expect(assessReadiness([], form, { now }).percent).toBe(0);
    expect(assessReadiness([], { ...form, deadlineAt: '2026-09-01' }, { now }).closed).toBe(true);
  });
  it('rejects tampered custom answers', () => {
    expect(customAnswerErrors([{id:'city',label:'City',type:'enum',options:['Delhi'],required:true}, {id:'agree',label:'Agree',type:'bool',required:true}], {city:'Moon',agree:'true'})).toEqual({city:'Choose one of the listed options',agree:'Confirm this declaration'});
  });
});
