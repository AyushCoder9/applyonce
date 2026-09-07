# DigiLocker production integration runbook

Verified against the official Requester API v1.12 listed in the [DigiLocker Partner Resource Center](https://apisetu.gov.in/digilocker) on 8 September 2026.

## Implemented contract

`packages/providers/src/apisetu/digilocker.ts` implements:

- OAuth authorization code with a fresh state and S256 PKCE verifier per attempt.
- Exact callback binding and an encrypted, authenticated, ten-minute browser transaction.
- Authorization-code exchange, user profile read, token refresh and token revocation.
- Issued-document listing.
- File and eAadhaar XML retrieval.
- HMAC-SHA256 response-integrity verification before bytes are accepted.
- Rejection of active-content declarations and oversized eAadhaar XML.
- Opaque token bundles encrypted at rest; provider tokens are not placed in Redis job payloads.

## ApplyOnce environment

```dotenv
PROVIDER_DIGILOCKER=apisetu
DIGILOCKER_CLIENT_ID=
DIGILOCKER_CLIENT_SECRET=
DIGILOCKER_BASE_URL=https://api.digitallocker.gov.in/public
DIGILOCKER_SCOPE=openid
DIGILOCKER_REQUEST_DOCUMENT_TYPE=
DIGILOCKER_PRODUCTION_VERIFIED=0
```

Set the exact production callback in API Setu:

```text
https://applyonce-silk.vercel.app/api/v1/providers/digilocker/callback
```

Do not set `DIGILOCKER_PRODUCTION_VERIFIED=1` merely because credentials were issued. First pass the proof checklist below.

## Onboarding sequence

1. Form the India legal entity and identify an authorized signatory/official.
2. Prepare incorporation/registration proof, organization PAN, GST certificate where applicable, authority letter, official domain email, use case, privacy policy, terms, callback domain and security contact.
3. Create one organization account at [API Setu Partner](https://partners.apisetu.gov.in/signup).
4. Register ApplyOnce as a DigiLocker Requester and sign the current Requester terms.
5. Describe the exact education/application use case, purpose, fields, document types, retention, consent screen and deletion/revocation behavior.
6. Request the minimum scopes/document types. Issuer access is separate and is not needed for reading citizen-selected documents.
7. Configure the exact callback URL; callback mismatches must fail.
8. Store the issued credentials only in the deployment secret store. Never commit them.
9. Run sandbox/pre-production flows with synthetic or expressly authorized test identities.
10. Complete NeGD/DigiLocker testing, agreement/MoU and committee/authorized approval steps requested during onboarding.
11. Complete one production proof: consent shown, callback state/PKCE checked, approved document retrieved, HMAC checked, minimal facts persisted, receipt/audit emitted, refresh succeeds, revocation succeeds.
12. Record the evidence date and reviewer, then enable the verified flag.

## Production proof record

- [ ] API Setu organization approved
- [ ] Current Requester terms signed
- [ ] Client ID/secret issued for the production app
- [ ] Exact callback approved
- [ ] Approved purpose and scopes recorded
- [ ] Data-retention and deletion behavior reviewed
- [ ] Consent screen matches approved purpose
- [ ] PKCE/state negative tests pass
- [ ] File HMAC mismatch test fails closed
- [ ] Real approved document pull succeeds
- [ ] Refresh succeeds and new token is encrypted at rest
- [ ] Remote revoke succeeds
- [ ] No tokens/claim values appear in logs, analytics or queue payloads
- [ ] `DIGILOCKER_PRODUCTION_VERIFIED=1` set by an authorized operator

Support: `digilocker-partners@negd.gov.in`. API Setu: `apisetu.support@digitalindia.gov.in`.
