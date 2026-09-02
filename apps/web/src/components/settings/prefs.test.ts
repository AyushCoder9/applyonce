import { describe, it, expect } from "vitest";
import { defaultPrefs, mergePrefs, toRows, CHANNELS, CATEGORIES } from "./prefs";
describe("prefs merge", () => {
  it("defaults: inapp+sms on, email off except consent", () => {
    const d = defaultPrefs();
    expect(d.inapp.expiry).toBe(true); expect(d.sms.application).toBe(true); expect(d.email.expiry).toBe(false); expect(d.email.consent).toBe(true);
  });
  it("rows override defaults, junk ignored, base untouched", () => {
    const base = defaultPrefs();
    const m = mergePrefs([{ channel: "sms", category: "expiry", enabled: false }, { channel: "pigeon", category: "expiry", enabled: true }, { channel: "email", category: "nope", enabled: true }], base);
    expect(m.sms.expiry).toBe(false); expect(base.sms.expiry).toBe(true); expect(m.email.expiry).toBe(false);
  });
  it("toRows is full matrix", () => { expect(toRows(defaultPrefs())).toHaveLength(CHANNELS.length * CATEGORIES.length); });
});
