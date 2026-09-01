const response = (description: string) => ({ description });

const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "ApplyOnce API",
    version: "1.0.0-beta",
    description: "Versioned contracts for hosted applications, citizen receipts, and partner programs. Government connectors are not implied by this API.",
  },
  servers: [{ url: "/api/v1" }],
  paths: {
    "/forms/{slug}": { get: { summary: "Read a published immutable form version", responses: { "200": response("Published form definition"), "404": response("Form not found") } } },
    "/forms/{slug}/submit": { post: { summary: "Submit a hosted form with an Idempotency-Key", parameters: [{ name: "Idempotency-Key", in: "header", required: true, schema: { type: "string", maxLength: 160 } }], responses: { "200": response("Duplicate-safe receipt"), "400": response("Validation failed"), "409": response("Form unavailable") } } },
    "/me": { get: { summary: "Read the authenticated citizen snapshot", responses: { "200": response("Citizen workspace snapshot"), "401": response("Authentication required") } } },
    "/me/profile": { patch: { summary: "Update editable reusable profile details", responses: { "200": response("Saved profile"), "400": response("Validation failed"), "401": response("Authentication required") } } },
    "/me/applications": { get: { summary: "List citizen applications", responses: { "200": response("Application list") } } },
    "/me/applications/{id}/submit": { post: { summary: "Affirm, snapshot, consent, and submit transactionally", responses: { "200": response("Persisted application and receipt"), "409": response("Already immutable or unavailable"), "422": response("Fields still require action") } } },
    "/me/applications/{id}/receipt": { get: { summary: "Read the hashed immutable application receipt", responses: { "200": response("Application receipt"), "409": response("Not submitted") } } },
    "/partner/forms": { get: { summary: "List organization programs", responses: { "200": response("Organization-scoped forms") } }, post: { summary: "Create a program draft", responses: { "200": response("Program draft") } } },
    "/partner/forms/{id}/publish": { post: { summary: "Publish an immutable program version after organization approval", responses: { "200": response("Published version"), "403": response("Permission or approval required") } } },
    "/partner/submissions": { get: { summary: "List organization-scoped submissions", responses: { "200": response("Submission inbox") } } },
    "/partner/submissions/{id}/status": { patch: { summary: "Update a submission status and notify its citizen", responses: { "200": response("Updated submission") } } },
    "/partner/webhooks/process": { post: { summary: "Run durable signed webhook delivery", responses: { "200": response("Workflow result and run ID") } } },
  },
} as const;

export function GET() {
  return Response.json(openApiDocument, { headers: { "cache-control": "public, max-age=300" } });
}
