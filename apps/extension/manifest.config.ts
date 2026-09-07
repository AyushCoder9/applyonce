import { defineManifest } from "@crxjs/vite-plugin";

/**
 * MV3 manifest. Host permissions cover the ApplyOnce app itself (token handshake +
 * background API calls) and the portals the built-in recipes target. The fill
 * content script runs on <all_urls> so the `generic` label-heuristics recipe can
 * offer best-effort autofill on any portal, not just the ones with a named recipe.
 */
export default defineManifest({
  manifest_version: 3,
  name: "ApplyOnce Autofill",
  version: "0.1.0",
  description: "Fill exam, scholarship and KYC forms from your verified ApplyOnce vault — sequential highlight, nothing cached on disk.",
  action: { default_popup: "src/popup/index.html", default_title: "ApplyOnce Autofill" },
  background: { service_worker: "src/background.ts", type: "module" },
  permissions: ["storage", "activeTab", "scripting"],
  host_permissions: [
    "http://localhost:3300/*",
    "http://localhost:3301/*",
    "https://applyonce-bta-demo.vercel.app/*",
    "https://*.applyonce.in/*",
    "https://*.nta.ac.in/*",
    "https://scholarships.gov.in/*",
  ],
  content_scripts: [
    {
      matches: ["http://localhost:3300/*", "https://*.applyonce.in/*"],
      js: ["src/content/handshake.ts"],
      run_at: "document_idle",
    },
    {
      matches: ["<all_urls>"],
      js: ["src/content/fill.ts"],
      run_at: "document_idle",
    },
  ],
});
