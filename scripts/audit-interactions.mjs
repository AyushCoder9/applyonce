import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const roots = ["src/app", "src/components"];
const forbidden = [
  { label: "placeholder href", pattern: /href=["']#["']/g },
  { label: "empty click handler", pattern: /onClick=\{\(\)\s*=>\s*\{\s*\}\}/g },
  { label: "unfinished marker", pattern: /\b(?:TODO|FIXME|coming soon)\b/gi },
  { label: "false external receipt claim", pattern: /(?:received your approved packet|submitted to the receiving portal|accepted by National STEM)/gi },
];

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesUnder(target));
    if (entry.isFile() && /\.(?:ts|tsx)$/.test(entry.name)) files.push(target);
  }
  return files;
}

const findings = [];
for (const root of roots) {
  for (const file of await filesUnder(root)) {
    const source = await readFile(file, "utf8");
    for (const rule of forbidden) {
      for (const match of source.matchAll(rule.pattern)) {
        const line = source.slice(0, match.index).split("\n").length;
        findings.push(`${file}:${line} ${rule.label}`);
      }
    }
  }
}

if (findings.length > 0) {
  console.error(findings.join("\n"));
  process.exit(1);
}

console.log("Interaction audit passed: no placeholder controls or false external-receipt claims found.");
