# Integrations and improvement roadmap

## What works now

| Capability | Implemented behavior | External dependency |
|---|---|---|
| Core application system | Postgres, Redis jobs, object storage, consent, signed payload, tracking and partner console | Local Docker services supplied |
| BTA integration | Real local SDK session/exchange, callback state, saved review, submission and status/webhook loop | No external account needed |
| Other catalog forms | Hosted sandbox submissions and tracker entries | No fake `.example` redirect required |
| Provider verification | Deterministic mock account/provider flows and fixtures | Live provider approval and contract testing remain |
| Document extraction | Mock proposals with human acceptance | Real OCR adapter remains |
| e-Sign alternative | OTP-confirmed declaration receipt stored as a downloadable file | Licensed digital signature remains |
| Evidence explanation | Local guide; optional OpenAI Responses adapter | API key and supported model for live AI |
| Extension | Recipe-based DOM matching, guarded fill plan and scoped document URLs | Real target sites and unpacked Chrome validation |

## Optional AI setup

Set `OPENAI_API_KEY` and `OPENAI_MODEL` in the root `.env`, then restart the web application. Select an available model from the current [official model guidance](https://developers.openai.com/api/docs/guides/latest-model). The implementation does not pin an aging model name.

The adapter uses the [Responses API](https://developers.openai.com/api/reference/cli/resources/responses/methods/create) and [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs). It sends an intent and a derived local guide. Names, fact values, documents, raw profile data and user IDs are excluded. `store:false` is set; this does not itself imply zero provider retention. There is a 12-second timeout, bounded output validation and a 12-request-per-user-per-minute limit. Network errors, refusal-like/malformed content and missing configuration fall back to the local guide.

Tests verify the outgoing data shape, strict JSON schema configuration, unchanged readiness result, local behavior and failure fallback. Live model quality and account-specific data handling need validation before production use.

## Why this AI boundary

This is an application involving identity and consequential submissions. A generative model should explain a deterministic finding rather than invent evidence or decide admission. Keeping the score in ordinary code makes it reproducible, testable and usable during model outages. The user's consent remains a separate authenticated action.

## Next improvements, in order

| Priority | Improvement | Delivery approach | Success test |
|---|---|---|---|
| 1 | Production trust and operations | Managed KMS, encrypted objects, malware scanning, backup restore drills, secrets rotation, scoped observability, retention/purge jobs | Demonstrate restore, revoke, expire and delete in staging; independent review |
| 2 | Profile key transfer | Re-encrypt claimed-profile facts/history and transfer ownership transactionally | Guardian deletion cannot affect the adult; both parties' scopes hold |
| 3 | Real document understanding | Opt-in image/PDF extraction into the existing fact proposal schema; preserve evidence page references and human approval | Curated document set with field accuracy, false verification and correction-rate measurements |
| 4 | Grounded requirement guidance | Versioned official form requirements with source URLs and dates, explicit policy-owner approval | A changed requirement produces a reviewable diff; expired policy cannot silently decide readiness |
| 5 | AI evaluation gate | Dataset for English/Hindi explanation correctness, prohibited claims, privacy leaks and provider outages; compare supported models | Zero identifiers in prompts, no unsupported eligibility claims, latency/cost targets on a fixed test set |
| 6 | Better accessibility and language coverage | Keyboard/screen-reader validation and complete Hindi copy across partner and new feature surfaces | Independent assistive-technology sessions and mobile usability tasks |
| 7 | Partner portal production persistence | Move BTA drafts/applications to a transactional database, durable idempotency and an outbox | Concurrent submit, process restart and webhook replay cause one consistent application |
| 8 | Real portal compatibility | Version recipes against current portal DOMs; report unsupported fields rather than fill by guess | A supported-page fixture and a live sandbox validation for each recipe version |

OpenAI supports image inputs and structured output, making it a candidate for proposal extraction; using it here would still require an explicit document-processing consent and evaluations. Model performance should be measured on the project's documents, rather than inferred from a general ranking. The [official Evals API](https://developers.openai.com/api/reference/java/resources/evals/methods/create) can support that measurement.

## Deliberately avoided

No automatic eligibility decisions, autonomous application submission, invented issuer verification, paid model calls without configured credentials, fabricated performance percentages, or silent fallback from a failed live partner request to a successful fixture. These choices keep the hackathon demonstration both clear and defensible.
