import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          {
            key: "Content-Security-Policy-Report-Only",
            value: "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; img-src 'self' data: blob: https:; font-src 'self' data: https:; style-src 'self' 'unsafe-inline' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; connect-src 'self' https:; form-action 'self' https:;",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      { source: "/api/v1/forms/:slug/submit", destination: "/api/public/forms/:slug/submit" },
      { source: "/api/v1/forms/:slug", destination: "/api/public/forms/:slug" },
      { source: "/api/v1/me", destination: "/api/me" },
      { source: "/api/v1/me/profile", destination: "/api/profile" },
      { source: "/api/v1/me/applications", destination: "/api/applications" },
      { source: "/api/v1/me/applications/:id/submit", destination: "/api/applications/:id/submit" },
      { source: "/api/v1/me/applications/:id/receipt", destination: "/api/applications/:id/receipt" },
      { source: "/api/v1/me/applications/:id", destination: "/api/applications/:id" },
      { source: "/api/v1/me/documents", destination: "/api/documents" },
      { source: "/api/v1/me/documents/:id", destination: "/api/documents/:id" },
      { source: "/api/v1/me/consents", destination: "/api/consents" },
      { source: "/api/v1/me/consents/:id/revoke", destination: "/api/consents/:id/revoke" },
      { source: "/api/v1/partner/forms", destination: "/api/partner/forms" },
      { source: "/api/v1/partner/forms/:id/publish", destination: "/api/partner/forms/:id/publish" },
      { source: "/api/v1/partner/forms/:id", destination: "/api/partner/forms/:id" },
      { source: "/api/v1/partner/api-keys", destination: "/api/partner/api-keys" },
      { source: "/api/v1/partner/api-keys/:id", destination: "/api/partner/api-keys/:id" },
      { source: "/api/v1/partner/submissions", destination: "/api/partner/submissions" },
      { source: "/api/v1/partner/submissions/:id/status", destination: "/api/partner/submissions/:id/status" },
      { source: "/api/v1/partner/webhooks", destination: "/api/partner/webhooks" },
      { source: "/api/v1/partner/webhooks/process", destination: "/api/partner/webhooks/process" },
      { source: "/api/v1/partner/webhooks/:id/deliveries", destination: "/api/partner/webhooks/:id/deliveries" },
    ];
  },
};

export default withWorkflow(nextConfig);
