/** BTA-style application reference numbers. Fake, in-memory/JSON only — no real registry. */
import { randomInt } from "node:crypto";

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // no 0/O/1/I to avoid transcription errors, gov-forms style

function randomRef(len: number): string {
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[randomInt(0, ALPHABET.length)];
  return out;
}

/** BTA26-XXXXXXX (7 chars after the year prefix) */
export function generateApplicationNumber(existing: (ref: string) => boolean): string {
  for (let attempt = 0; attempt < 50; attempt++) {
    const ref = `BTA26-${randomRef(7)}`;
    if (!existing(ref)) return ref;
  }
  // astronomically unlikely, but never loop forever
  return `BTA26-${randomRef(7)}${Date.now().toString(36).slice(-2).toUpperCase()}`;
}

export function generateIdempotencyKey(): string {
  return `idem_${Date.now().toString(36)}_${randomRef(8)}`;
}
