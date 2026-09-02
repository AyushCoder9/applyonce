# BTA-JEE 2026 — field map

Single source of truth: `src/lib/fields.ts` (`FIELDS` array). This file is a human-readable
export of it for the Chrome extension recipe author (WP6, recipe id `bta-demo`) and anyone
wiring up automated fill. Every `id` below is both the `id` and `name` attribute of its
`<input>`/`<select>` on `/apply/manual` — stable, semantic, never renamed.

56 fields total = 45 required + 6 optional canonical keys from the seeded `bta-jee-2026`
form's `requestedFields` (`packages/db/src/seed.ts`) + 5 BTA-only `customFields`.
(docs/04-DESIGN-SYSTEM.md #19 says "48 fields" as flavour text for the pain narrative — the
actual seeded form has 56; this file mirrors the seed exactly, per the task brief.)

Registry key column is the exact `fact_key` from `packages/schema/src/registry.ts` —
`@praman/sdk`/the partner API return `SharedFact[]` keyed by these. `—` means the field is a
BTA-only custom question (`PramanPayload.custom.<id>`), not a canonical fact.

## Step 1 — Personal Details

| id | Label | Type | Required | Registry key |
|---|---|---|---|---|
| `candidate_name` | Candidate's Full Name (as on Class 10 certificate) | text (forced uppercase) | yes | `identity.full_name` |
| `dob` | Date of Birth | text, DD/MM/YYYY | yes | `identity.dob` |
| `gender` | Gender | select | yes | `identity.gender` |
| `nationality` | Nationality | select | yes | `identity.nationality` |
| `aadhaar_last4` | Aadhaar Number — last 4 digits | text (max 4) | no | `identity.aadhaar_last4` |
| `blood_group` | Blood Group | select | no | `identity.blood_group` |
| `apaar_id` | APAAR ID (ABC ID) | text | yes | `identity.apaar_id` |
| `photo` | Recent Passport-size Photograph | file (jpeg/png, 10–200 KB) | yes | `identity.photo` |
| `signature` | Signature (scanned) | file (jpeg/png, 4–30 KB) | yes | `identity.signature` |

## Step 2 — Contact & Address

| id | Label | Type | Required | Registry key |
|---|---|---|---|---|
| `mobile` | Mobile Number | tel, 10-digit | yes | `contact.mobile_primary` |
| `email` | Email Address | email | yes | `contact.email_primary` |
| `address_permanent_line1` | Permanent Address — Line 1 | text | yes | `address.permanent.line1` |
| `address_permanent_line2` | Permanent Address — Line 2 | text | no | `address.permanent.line2` |
| `village_town_permanent` | Permanent Address — Village / Town / City | text | yes | `address.permanent.village_town` |
| `district_permanent` | Permanent Address — District | text | yes | `address.permanent.district` |
| `state_permanent` | Permanent Address — State | select | yes | `address.permanent.state` |
| `pincode_permanent` | Permanent Address — PIN Code | text, 6-digit | yes | `address.permanent.pincode` |
| `address_current_line1` | Current Address — Line 1 | text | yes | `address.current.line1` |
| `village_town_current` | Current Address — Village / Town / City | text | yes | `address.current.village_town` |
| `district_current` | Current Address — District | text | yes | `address.current.district` |
| `state_current` | Current Address — State | select | yes | `address.current.state` |
| `pincode_current` | Current Address — PIN Code | text, 6-digit | yes | `address.current.pincode` |

## Step 3 — Parents & Income

| id | Label | Type | Required | Registry key |
|---|---|---|---|---|
| `father_name` | Father's Name | text (forced uppercase) | yes | `family.father.name` |
| `father_occupation` | Father's Occupation | select | yes | `family.father.occupation` |
| `father_mobile` | Father's Mobile Number | tel, 10-digit | yes | `family.father.mobile` |
| `mother_name` | Mother's Name | text (forced uppercase) | yes | `family.mother.name` |
| `mother_occupation` | Mother's Occupation | select | yes | `family.mother.occupation` |
| `family_annual_income` | Total Family Annual Income (₹) | number | yes | `family.annual_income_total` |
| `parent_govt_servant` | Is either parent a Government servant? | checkbox | no | `family.parent_govt_servant` |

## Step 4 — Category & Eligibility

| id | Label | Type | Required | Registry key |
|---|---|---|---|---|
| `category` | Category | select | yes | `category.social` |
| `category_certificate_no` | Category Certificate Number | text | yes | `category.certificate_no` |
| `category_valid_until` | Category Certificate Valid Until | text, DD/MM/YYYY | yes | `category.valid_until` |
| `category_certificate` | Upload Category Certificate | file (pdf/jpeg/png, 10–500 KB) | yes | `category.certificate` |
| `pwd` | Person with Disability (PwD)? | checkbox | yes | `category.pwd` |
| `pwd_type` | Disability Type (if applicable) | select | no | `category.pwd_type` |
| `udid_no` | UDID Number (if applicable) | text | no | `category.udid_no` |
| `scribe_required` | Scribe Required (if applicable)? | checkbox | no | `category.scribe_required` |
| `domicile_state` | Domicile State | select | yes | `category.domicile_state` |

## Step 5 — Education (Class 10 / 12)

| id | Label | Type | Required | Registry key |
|---|---|---|---|---|
| `class10_board` | Class 10 Board | select | yes | `education.class10.board` |
| `class10_year` | Class 10 Passing Year | number | yes | `education.class10.year` |
| `class10_roll_no` | Class 10 Roll Number | text | yes | `education.class10.roll_no` |
| `class10_percentage` | Class 10 Percentage | number | yes | `education.class10.percentage` |
| `class10_school_name` | Class 10 School Name | text | yes | `education.class10.school_name` |
| `class10_marksheet` | Upload Class 10 Marksheet | file (pdf/jpeg/png, 20 KB–1 MB) | yes | `education.class10.marksheet` |
| `class12_board` | Class 12 Board | select | yes | `education.class12.board` |
| `class12_year` | Class 12 Passing Year | number | yes | `education.class12.year` |
| `class12_roll_no` | Class 12 Roll Number | text | yes | `education.class12.roll_no` |
| `class12_percentage` | Class 12 Percentage | number | yes | `education.class12.percentage` |
| `class12_school_name` | Class 12 School Name | text | yes | `education.class12.school_name` |
| `class12_stream` | Class 12 Stream | select | yes | `education.class12.stream` |
| `class12_marksheet` | Upload Class 12 Marksheet | file (pdf/jpeg/png, 20 KB–1 MB) | yes | `education.class12.marksheet` |

## Step 6 — Exam Preferences & Declaration (BTA-only custom questions)

| id | Label | Type | Required | Registry key |
|---|---|---|---|---|
| `exam_city_1` | Exam City Preference 1 | select | yes | — (`custom.exam_city_1`) |
| `exam_city_2` | Exam City Preference 2 | select | yes | — (`custom.exam_city_2`) |
| `paper` | Paper | select | yes | — (`custom.paper`) |
| `medium` | Question Paper Medium | select | yes | — (`custom.medium`) |
| `declaration` | "I declare that the information given above is true…" | checkbox | yes | — (`custom.declaration`) |

## Notes for the `bta-demo` extension recipe

- All fields live in one `<form>` across the whole manual wizard; only the current step's
  `<fieldset>` is visible (`hidden` attribute), the rest stay in the DOM — an extension can
  fill every step's inputs without waiting on step navigation, then the citizen just clicks
  through "Save & Next" to reach Review.
- Select elements use native `<option value="...">` — set `.value` and dispatch a `change`
  event (React re-renders based on the native DOM value on submit, not on controlled state).
- Date fields (`dob`, `category_valid_until`) expect **DD/MM/YYYY** text, not ISO.
- File inputs (`photo`, `signature`, `*_marksheet`, `category_certificate`) cannot be filled
  by script for security reasons in real browsers — per docs/05 F3, the extension should skip
  these and show its "attach from Praman" helper instead.
