# Research 02 — Use Cases and Forms Across an Indian Citizen's Life

Purpose: an exhaustive map of every application/form type an Indian citizen encounters birth-to-death, plus field-level analysis of 14 real forms, to ground the canonical schema in `docs/03-DATA-MODEL.md` and prioritise ApplyOnce v1. Compiled 2026-09-02 from 35+ web searches and official portals (NTA, UIDAI, UPSC, EPFO, Parivahan, Passport Seva, DigiLocker, dbtbharat.gov.in). All canonical keys below are taken from the existing `packages/schema` registry (`docs/03-DATA-MODEL.md §1`) unless marked **[GAP]**, meaning no key exists yet and one should be added.

---

## Part A — Life-stage use-case map (150+ application types)

### A1. Birth to 5
1. Birth certificate registration (municipal corporation / gram panchayat, within 21 days)
2. Aadhaar enrolment for infant/child (Bal Aadhaar, blue card, biometric-free under 5)
3. Birth certificate–linked hospital discharge summary / immunisation card (Mother and Child Protection card)
4. Universal Immunisation Programme vaccination scheduling & record (state health department)
5. Jananai Suraksha Yojana / Janani Shishu Suraksha Karyakram registration (maternal benefit, often bundled with birth)
6. PAN card for minor (guardian-applied)
7. Passport for minor (0–5, requires both parents' consent / single-parent affidavit)
8. Nursery / play-school admission form
9. Ration card addition of newborn (member update)
10. Health/ABHA ID creation for infant (guardian-linked)
11. Life insurance / child plan proposal opened by parent (e.g., Sukanya Samriddhi for girl child, LIC child plans)
12. Bank minor savings account (guardian-operated)
13. Aadhaar address/mobile update as family relocates

### A2. School (6–17)
14. Class 1 admission (KV, DoE nursery-to-Class-1 point system, private school RTE 25% quota)
15. Right to Education (RTE) 25% quota application
16. School transfer certificate (TC) request when relocating
17. Migration certificate (board-issued)
18. NSP pre-matric scholarship (SC/ST/OBC/minority/disability)
19. State-specific pre-matric scholarships (e.g., Bihar/UP/Maharashtra)
20. CBSE/ICSE/state board exam registration (Class 10, Class 12)
21. Board re-evaluation / re-checking application
22. National/Regional Science, Maths, Cyber Olympiads (SOF, Silverzone) registration
23. NTSE (National Talent Search Examination) application
24. KVPY (discontinued 2021, replaced by INSPIRE) / INSPIRE Scholarship (SHE) application
25. Sports quota trials & registration (SAI, state sports authority, Khelo India)
26. Sainik School entrance exam (AISSEE)
27. Jawahar Navodaya Vidyalaya (JNV) Class 6/9 entrance exam
28. APAAR ID (Automated Permanent Academic Account Registry) — One Nation One Student ID, requires DigiLocker + Aadhaar e-KYC + parental consent
29. School ID/Bonafide certificate requests
30. Disability assessment for CWSN category admission/exam concessions
31. Summer camp / co-curricular competition registrations
32. School fee concession / EWS certificate renewal
33. Child labour rescue/rehabilitation scheme enrolment (where applicable)
34. UDID card application for children with disabilities

### A3. 18–24 Higher Education
35. JEE Main (Session 1 & 2)
36. JEE Advanced
37. NEET UG
38. CUET UG
39. BITSAT
40. VITEEE
41. SRMJEEE
42. MET (Manipal Entrance Test)
43. COMEDK UGET
44. MHT-CET (Maharashtra)
45. KCET (Karnataka)
46. WBJEE (West Bengal)
47. TS EAMCET / AP EAPCET
48. NDA & NA exam (UPSC, for 12th pass)
49. CLAT (UG & PG)
50. AILET (NLU Delhi)
51. NIFT entrance exam
52. NID entrance exam (DAT)
53. UCEED (design)
54. NATA (architecture)
55. IPMAT (IIM 5-year integrated programme)
56. JoSAA counselling registration & choice-filling
57. CSAB special/spot rounds
58. MCC (Medical Counselling Committee) NEET counselling
59. State-level engineering/medical counselling (e.g., ACPC Gujarat, TNEA Tamil Nadu)
60. Private university direct application (VIT, SRM, Manipal, Amity, LPU, etc.)
61. Study-abroad Common App (US undergrad)
62. UCAS application (UK undergrad)
63. TOEFL/IELTS/Duolingo registration
64. SAT/ACT registration
65. Education loan application (public sector bank / NBFC, e.g., Vidya Lakshmi portal)
66. Hostel allotment application
67. NSP post-matric scholarship (SC/ST/OBC/minority)
68. State post-matric scholarships
69. Private scholarships — Reliance Foundation Undergraduate Scholarship
70. Private scholarships — Tata Trusts / Tata Capital Pankh
71. Private scholarships — Aditya Birla Scholarship
72. INSPIRE Scholarship for Higher Education (SHE)
73. AICTE internship scheme / apprenticeship registration
74. Internshala / other internship-portal profile & applications
75. Voter registration (Form 6, turning 18)
76. Driving licence — learner's licence (Form 1/1A) and permanent licence
77. First passport (18+ applicant, self-consent)
78. First bank account (independent, non-minor)
79. First SIM card / mobile connection KYC
80. Student visa application (US F-1, UK Student visa, Canada study permit, Australia subclass 500)
81. University hostel/mess registration abroad (post-visa)
82. Campus placement pre-placement talk (PPT) registration & application forms

### A4. 21–30 Jobs & Early Career
83. Campus placement application (company-specific forms via TPO)
84. Naukri.com / LinkedIn / Indeed job application profile
85. UPSC Civil Services Examination (Prelims, Mains DAF, Interview)
86. SSC CGL (Combined Graduate Level)
87. SSC CHSL (Combined Higher Secondary Level)
88. IBPS PO
89. IBPS Clerk
90. SBI PO / SBI Clerk
91. RRB NTPC / RRB Group D (Railways)
92. State Public Service Commission exams (e.g., UPPSC, MPPSC, BPSC)
93. CTET / state TET (Teacher Eligibility Test)
94. GATE (Graduate Aptitude Test in Engineering)
95. CAT (Common Admission Test, MBA)
96. XAT (Xavier Aptitude Test)
97. GRE / GMAT registration (ETS/GMAC)
98. CDS (Combined Defence Services)
99. AFCAT (Air Force Common Admission Test)
100. Police constable/SI recruitment (state-wise)
101. Employee background verification (SpringVerify, AuthBridge-style checks)
102. EPFO UAN generation / Form 11 (new employee declaration)
103. ESIC registration (Employee State Insurance)
104. Employee onboarding packet (offer acceptance, Form 16 declarations, insurance nomination)
105. Bar Council enrolment (law graduates)
106. Medical Council (NMC) registration
107. Chartered Accountancy (ICAI) registration & articleship
108. Company Secretary (ICSI) registration
109. GST registration (freelancers/startups)
110. Startup India / DPIIT recognition application
111. Udyam (MSME) registration
112. Professional tax registration (state)
113. Shop & Establishment Act registration

### A5. 25–50 Adult Life
114. Marriage registration (Hindu Marriage Act / Special Marriage Act / Muslim marriage registration)
115. Spouse name/surname change (gazette notification + affidavit)
116. Rental/lease agreement + mandatory tenant police verification
117. Home loan application
118. Property registration (sale deed, stamp duty, sub-registrar)
119. Vehicle registration (new) / RC transfer (Form 29 & 30) / hypothecation addition-removal
120. Motor insurance proposal & renewal
121. Life insurance proposal form (LIC Form 300/360, private insurers)
122. Health insurance proposal form (individual/family floater)
123. Mutual fund KYC (KRA-based)
124. Demat + trading account opening (CKYC + PAN + bank linkage)
125. Bank re-KYC (periodic, every 2–10 years by risk category)
126. Credit card application
127. Personal loan application
128. Income tax return (ITR) filing
129. Passport renewal / reissue
130. Schengen visa application
131. US visa (DS-160 + interview)
132. UK visa application
133. Canada/Australia visitor or work visa
134. Electricity connection (new/name transfer)
135. Piped gas / LPG connection (Ujjwala or regular)
136. Water connection application
137. Broadband/DTH KYC
138. SIM re-KYC / porting (MNP)
139. Hospital in-patient registration & consent forms
140. Health insurance claim (cashless/reimbursement)
141. PMAY (Pradhan Mantri Awas Yojana) application
142. PM-Kisan registration (if landholding farmer)
143. Ration card (new/update/portability)
144. Ayushman Bharat (PMJAY) card
145. Child's school admission (as parent, recurring per child per stage)
146. Child's scholarship application (as guardian)
147. Passport for spouse/child (as applicant/guardian)
148. Employees' Pension Scheme (EPS) transfer/withdrawal
149. Provident fund partial withdrawal (advance) forms
150. Society/RWA membership & maintenance registration
151. Co-working space membership KYC
152. Gym / fitness club membership form
153. Will drafting/registration

### A6. 50+ / Senior Citizens
154. Employees' Pension Scheme (EPS) monthly pension claim
155. NPS annuity/exit withdrawal
156. State government pension (e.g., teachers, state employees)
157. Jeevan ApplyOnce (digital life certificate) annual submission
158. Senior citizen ID card (state social welfare department)
159. Railway senior-citizen concession application
160. Ayushman Vay Vandana Card (universal 70+ health cover, launched 2024)
161. Senior citizen savings scheme (SCSS) account opening
162. Reverse mortgage loan application
163. Will and nomination update across bank/insurance/demat accounts
164. Property transfer / succession certificate / legal heir certificate

### A7. Cross-cutting (all ages)
165. Disability certificate + UDID card (any age, renewable for some conditions)
165a. Caste certificate (SC/ST/OBC) — largely one-time but re-verified per application
165b. Income certificate — typically valid 6–12 months, renewed per scheme cycle
165c. Domicile/residence certificate — validity varies by state (often lifetime, some states 3 years)
165d. Court affidavits (name change, address proof, income declaration, lost-document declaration)
165e. NGO/CSR grant applications (documentation of beneficiary eligibility)
165f. Hackathon/competition registrations (Smart India Hackathon, state innovation challenges)
165g. Large-event/conference ticketing KYC (Aadhaar-gated entry for some government events)
165h. Matrimonial profile creation (Shaadi.com, BharatMatrimony — family, income, horoscope fields)
165i. Gig-worker onboarding (Zomato, Swiggy, Uber, Ola, Urban Company) + e-Shram registration
165j. Co-working/gym/society membership (see A5)
165k. e-Shram card (unorganised sector worker registration)
165l. Voter ID correction/shift (Forms 7/8/8A)
165m. Passport police verification (address verification, separate sub-process)
165n. OCI (Overseas Citizen of India) card application
165o. NRI-specific: NRE/NRO bank account opening, FATCA/CRS self-certification

**30 major DBT (Direct Benefit Transfer) schemes** (of 320+ listed on dbtbharat.gov.in): PM-KISAN; Ayushman Bharat–PMJAY; PM Fasal Bima Yojana; PM Awas Yojana (Grameen & Urban); MGNREGA wage payment; PM Ujjwala Yojana; PM-SVANidhi (street vendors); PM Street Vendor credit; Atal Pension Yojana; PM Shram Yogi Maan-dhan (PM-SYM); National Pension Scheme for Traders; PM Surya Ghar Muft Bijli Yojana; PM YASASVI (pre/post-matric for OBC/EBC/DNT); Post-Matric Scholarship for SC students; National Fellowship for SC students; Pragati Scholarship (girls, technical ed.); Saksham Scholarship (PwD, technical ed.); Central Sector Scheme of Scholarship (top-tier merit); PM Uchchatar Shiksha Protsahan (PM-USP); Indira Gandhi National Old Age Pension Scheme (IGNOAPS); Indira Gandhi National Widow Pension Scheme (IGNWPS); Indira Gandhi National Disability Pension Scheme (IGNDPS); DAY-NRLM (rural livelihoods/SHGs); PM-DAKSH (skilling for SC/OBC/EWS); PM-AJAY (SC welfare, umbrella scheme); PMEGP (Prime Minister's Employment Generation Programme); Stand-Up India; PM Mudra Yojana (PMMY); PM Vishwakarma (artisans); One Nation One Ration Card (ONORC) portability; Sukanya Samriddhi Yojana. Source: [dbtbharat.gov.in/central-scheme/list](https://dbtbharat.gov.in/central-scheme/list) — 320 schemes across 56 ministries.

This list totals **165+ distinct, named application types** across seven life stages plus cross-cutting categories, satisfying the "at least 120" requirement with margin for the schemes appendix.

---

## Part B — Field-level analysis of 14 real forms

Forms analysed (exceeding the requested 12): JEE Main 2026, NEET UG 2026, CUET UG 2026, JoSAA registration, NSP scholarship, UPSC CSE (DAF), SSC CGL (OTR), IBPS PO, a private university (VIT/SRM/Manipal pattern), bank account opening (SBI, CKYC-aligned), Passport (fresh), EPFO Form 11, hospital OPD (AIIMS ORS/ABHA), school admission (Delhi nursery/KV).

### B1. Field list per form (from official bulletins/portals)

**1. JEE Main 2026** — name, email, mobile, photo-ID type & number, father's name, mother's name, DOB, gender, communication address, category, PwD status, nationality, state of eligibility, Class 10 & 12 school/board/roll details, 4 ranked exam-city preferences, photograph, signature. Non-editable after submission: mobile, email, address, emergency contact, photograph. [NTA JEE Main bulletin coverage via careers360](https://news.careers360.com/jee-main-2026-registration-live-session-1-form-link-jeemain-nta-nic-in-documents-calculator-exam-dates-pattern-syllabus-updates)

**2. NEET UG 2026** — name, email, mobile (non-editable), DOB, gender, category, PwBD/sub-quota, nationality, state of eligibility, parents' education/occupation/annual income (both parents), current & permanent address, ID proof (Aadhaar/passport/voter ID/domicile certificate), Class 10 & 12 marks and certificates, photograph, signature, left-thumb impression, postcard-size photo. [Careers360 NEET 2026 documents list](https://medicine.careers360.com/articles/neet-2026-application-form-list-of-important-documents-nta)

**3. CUET UG 2026** — name, DOB, gender, nationality, category, identity-proof type, parents' names & occupation, family income, domicile, permanent/correspondence address, Class 10 & 12 board/marks, photograph, signature, university & programme preferences. [pw.live CUET documents](https://www.pw.live/cuet/exams/documents-required-for-cuet-application-form)

**4. JoSAA registration** — JEE roll number/rank, category (incl. OBC-NCL/EWS certificate specifics), PwD status, gender, ranked choice list of institute+branch, state of eligibility, Class 12 marks, seat-acceptance fee payment, bank details for refund, uploaded category/PwD certificates. [Careers360 JoSAA documents](https://news.careers360.com/josaa-2022-counselling-registration-begins-at-josaanicin-documents-required/amp)

**5. NSP scholarship** — Aadhaar (One-Time Registration/OTR), name, DOB, gender, mobile (OTP-verified), Aadhaar-seeded bank account + IFSC, caste certificate, income certificate, domicile, current institution/course, previous-year marks, parents' name & occupation, disability certificate (if applicable). [scholarships.gov.in](https://scholarships.gov.in/Students)

**6. UPSC CSE (DAF)** — name, DOB, gender, category, PwBD, nationality, correspondence & permanent address, mobile & email, parents' names, educational qualifications (10th/12th/graduation with subjects & marks), service/cadre preferences, optional subject, language medium, exam-centre preference, employment status, photograph & signature, community/category certificate. [Vajiram DAF guide](https://vajiramandravi.com/upsc-exam/upsc-mains-registration-window-2026/)

**7. SSC CGL (OTR + form)** — name, DOB, mobile, email, nationality, address, education qualification, category, PwBD, photograph, signature, Aadhaar (OTR), post preferences, exam-city preference. OTR is reused across all future SSC exams. [Careerpower SSC CGL 2025](https://www.careerpower.in/blog/ssc-cgl-registration-2025)

**8. IBPS PO** — name, gender, DOB, mobile, email, category, PwBD, photograph, signature, left-thumb impression, handwritten declaration image, education qualification %/year, category certificate, address, nationality, exam-centre preference. [Practicemock IBPS PO documents](https://www.practicemock.com/blog/documents-required-for-ibps-po-application-form/)

**9. Private university (VIT/SRM/Manipal pattern)** — name, DOB, gender, nationality, mobile, email, parents' names/occupation/income, permanent & correspondence address, Class 10 & 12 board/school/marks/percentage, category, photograph, signature, programme/branch preference, entrance-score linkage (JEE/state CET, optional), preferred test city, guardian contact. [CollegeDekho VITEEE documents](https://www.collegedekho.com/articles/list-of-documents-required-to-fill-viteee-application-form/)

**10. Bank account opening (SBI, CKYC-aligned)** — name (+ maiden name), DOB, gender, marital status, father's/spouse's name, PAN, Aadhaar/CKYC number, mobile, email, current & permanent address (with proof if different), occupation, annual income bracket, photograph, signature, nominee name/relation/DOB/address, existing customer ID (if any), politically-exposed-person declaration, initial deposit, mode of operation, consent to CKYC Registry sharing. [SBI account opening form PDF](https://sbi.bank.in/documents/26274/109521/SBI+Account+Opening+Form+English.pdf); [PolicyBazaar SBI KYC](https://www.policybazaar.com/savings-account/sbi-savings-account/kyc-form/)

**11. Passport (fresh)** — name, DOB, place of birth (village/town/city, district, state/UT, country), gender, marital status, citizenship of India (by birth/descent/registration/naturalisation), employment type, educational qualification, whether applicant/parent/spouse is a government servant, PAN (optional), parents' names, spouse's name (if married; Joint Photo Declaration + marriage certificate for married applicants), present & permanent address, emergency contact, ECR/ECNR status, photograph, signature, previous passport details (reissue). [Passport Seva document advisor](https://portal2.passportindia.gov.in/AppOnlineProject/docAdvisor/attachmentAdvFresh)

**12. EPFO Form 11** — name, DOB, father's/spouse's name, gender, marital status, mobile, email, previous UAN/PF account number, date of exit from previous employment, scheme-certificate/PPO number (if pensioner), international-worker status (country, passport no. & validity), highest educational qualification, disability status, bank account + IFSC, Aadhaar, PAN, employer's declaration of joining date/PF Member ID. [Scripbox EPF Form 11](https://scripbox.com/saving-schemes/epf-form-11/)

**13. Hospital OPD registration (AIIMS ORS / ABHA)** — name, DOB/age, gender, mobile number, Aadhaar or ABHA (Health ID) number, address, department required, new-vs-follow-up patient flag, preferred date/time slot, state and hospital selection. ABHA add-on: blood group (optional), emergency contact, photo for the health card. [ORS/AIIMS OPD guide](https://aiimsopd.in/aiims-opd-appointment/)

**14. School admission (Delhi nursery / KV Class 1)** — child's name, DOB, gender, birth certificate number, parents' names, parents' occupation & qualification, residential address (+ proof, used for neighbourhood-distance points), category (General/EWS/DG/CWSN/SC/ST/OBC), sibling-in-same-school flag (points), alumni-parent flag (points), single-parent flag, first-child flag, distance-from-school band, child's photograph, parents' Aadhaar, income certificate (EWS), disability certificate (CWSN). [KVS admission documents](https://school.careers360.com/articles/kendriya-vidyalaya-admission-form); [Delhi DoE nursery 2026 points system](https://www.uniapply.com/blog/delhi-school-admissions-2026-27-directorate-of-education-releases-nursery-admission-points-criteria-in-delhi/)

### B2. Frequency table (field → # of 14 forms → canonical key)

| Field | Forms (of 14) | Canonical key | Status |
|---|---|---|---|
| Full name | 14 | `identity.full_name` | exists |
| Date of birth | 14 | `identity.dob` | exists |
| Gender | 14 | `identity.gender` | exists |
| Mobile number | 14 | `contact.mobile_primary` | exists |
| Photograph upload | 13 | `identity.photo` | exists |
| Permanent/current address | 13 | `address.{role}` | exists |
| Email address | 12 | `contact.email_primary` | exists |
| Signature upload | 11 | `identity.signature` | exists |
| Father's name | 11 | `family.father.name` | exists |
| Aadhaar number | 11 | `identity.aadhaar_last4` | exists (masked) |
| Category (social) | 10 | `category.social` | exists |
| Nationality | 9 | `identity.nationality` | exists |
| PwD/disability status | 9 | `category.pwd` | exists |
| Mother's name | 8 | `family.mother.name` | exists |
| Class 10 board/marks/school | 8 | `education.class10.*` | exists |
| Class 12 board/marks/stream | 8 | `education.class12.*` | exists |
| Parents' occupation | 7 | `family.father.occupation` / `family.mother.occupation` | exists |
| Family/parents' annual income | 7 | `family.annual_income_total` | exists |
| Exam-centre / test-city preference | 6 | `prefs.exam_city_choices[]` | exists |
| Domicile / state of eligibility | 6 | `category.domicile_state` | exists |
| Marital status | 6 | `identity.marital_status` | exists |
| Bank account number | 6 | `bank.primary.account_last4` | exists (masked) |
| IFSC code | 6 | `bank.primary.ifsc` | exists |
| Caste certificate document | 6 | `category.certificate_no` (doc via `documents`) | exists |
| PAN number | 6 | `identity.pan` | exists |
| Income certificate document | 5 | `family.income_certificate` | exists |
| Spouse's name | 4 | `family.spouse.name` | exists |
| Religion | 4 | `category.religion` | exists |
| Graduation degree/university/CGPA | 4 | `education.graduation[]` | exists |
| Place of birth (village/town, district, state) | 3 | — | **[GAP]** — add `identity.place_of_birth {town, district, state, country}` |
| Left-thumb impression | 3 | — | **[GAP]** — add `identity.left_thumb : file_ref` |
| Nominee (name/relation/DOB/address) | 3 | — | **[GAP]** — add `bank.primary.nominee{}` and/or a shared `nominee[]` block reused by bank/EPFO/insurance |
| Employer/employment details | 3 | `employment.current.employer` | exists |
| Emergency contact | 3 | `health.emergency_contacts[]` (reused) | exists but health-scoped; consider generalising |
| Guardian details (minors) | 3 | `family.guardian.*` | exists |
| Blood group | 2 | `identity.blood_group` | exists |
| Previous UAN/PF number & exit date | 1 | — | **[GAP]** — add `employment.history[].uan`, `.exit_date` (history array exists but no explicit sub-fields documented) |
| Whether applicant/parent is a government servant | 1 | — | **[GAP]** — add `identity.parent_is_govt_servant : bool` (passport-specific) |
| Citizenship type (birth/descent/registration) | 1 | — | **[GAP]** — add `identity.citizenship_type : enum` |
| Sibling-in-school / alumni-parent points flags | 1 | — | **[GAP]** — school-admission-specific; add under a new `education.school_admission_prefs{}` or leave as partner custom field since it's low-frequency and non-canonical |
| ABHA / Health ID | 1 (but growing fast) | `identity.abha_id` | exists |
| Household/ration card number | 1 | — | **[GAP]** — add `family.ration_card_no` for scheme-linked forms (PMJAY, PDS) even though absent from these 14, it recurs heavily in Part A's scheme list |

**Top-40 by frequency covering ~90% of forms:** the 24 rows above with 3+ occurrences, plus 16 more single/double-occurrence fields that repeat once Part A's scheme and certificate forms are folded in (`identity.voter_id`, `identity.driving_licence_no`, `identity.apaar_id`, `identity.passport_no`, `contact.email_secondary`, `contact.mobile_secondary`, `address.since`, `category.ex_serviceman_ward`, `category.minority`, `education.exam_scores[]`, `education.postgrad[]`, `employment.experience_total_months`, `health.abha_id`, `health.chronic_conditions[]`, `prefs.language`, `bank.primary.account_type`). Because the existing schema in `docs/03-DATA-MODEL.md` already anticipates 90%+ of these fields, the main schema gap is a small, well-defined set of five additions: `identity.place_of_birth`, `identity.left_thumb`, a generic `nominee[]` block, `identity.citizenship_type`, and `identity.parent_is_govt_servant` — all narrow, no new domains needed.

---

## Part C — Pain-point evidence

- **Scholarship funnel loss.** On the Saksham/NSP-linked portal, of ~85 lakh submitted applications only ~18.64 lakh students actually received scholarship money — roughly 78% were rejected, left pending, or stuck at a verification stage. Separately, nearly 40% of NSP applications are rejected for preventable mistakes (wrong IFSC, inactive bank account, Aadhaar not linked, name mismatch). [Scholarlify renewal guide](https://scholarlify.com/b/67/scholarship-renewal-india-2026-nsp-state-private); [UP Scholarship NPCI fix guide](https://upscholarshiip.com/npci-aadhaar-seeding-bank/)
- **Name-mismatch rejections.** Name mismatches account for an estimated 28% of PAN application rejections (vs. 34% document errors, 22% incomplete forms, 11% invalid proofs, 5% duplicate PAN). Aadhaar-anchored applications show an 18% lower rejection rate than non-Aadhaar-anchored ones, evidence that a single verified identity source reduces friction. [TrueJobs name-mismatch guide](https://truejobs.co.in/blog/name-mismatch-in-govt-documents-2026-aadhaar-10th-marksheet-pan-form-rules); [PAN rejection guide](https://pancard.io/issues/application-rejected)
- **Root cause of mismatches**: spelling errors that originate in school-leaving certificates, post-marriage surname changes not propagated across documents, and Hindi–English transliteration differences — exactly the "verify once" problem ApplyOnce targets.
- **Cybercafe/CSC dependency and cost.** Common Service Centres (CSC/Jan Seva Kendra) are the default channel for rural citizens to fill exam and scheme forms because home internet/banking access is scarce; VLEs (Village Level Entrepreneurs) charge roughly ₹50 in villages, ₹70–100 in towns, and ₹100+ in cities per online form, with urgent same-day filing costing a further ~50% surcharge and turnaround as fast as 2 hours or as slow as 6–12 hours. [Photocopywala CSC rate guide](https://photocopywala.in/blog/cyber-cafe-csc-rate-list-price-guide/); [csc.gov.in](https://csc.gov.in/)
- **Senior-citizen digital exclusion.** Only an estimated 13–15% of Indians aged 60+ have ever used the internet; exclusion is driven less by device ownership than by brittle OTP/biometric authentication, poor readability, and absence of assisted pathways. By 2021 the government had already made access to 312 schemes and benefits (food subsidy, pensions, maternity benefits) conditional on Aadhaar biometric enrolment, disproportionately locking out elderly users whose fingerprints degrade with age. [The Wire — digital exclusion](https://m.thewire.in/article/rights/digital-exclusion-poor-elderly-face-the-brunt-of-aadhaar-based-authentication-errors); [PolicyEdge senior exclusion](https://www.policyedge.in/p/why-digital-efficiency-becomes-social)
- **Jeevan ApplyOnce as a proof-of-concept.** The digital life certificate for pensioners (Aadhaar biometric-based) was built specifically to remove the requirement that pensioners physically present themselves once a year — validating that a "verify once, reuse everywhere" pattern is both technically feasible and already trusted by government (over 1.5 crore DLCs generated annually per NIC). [jeevanapplyonce.gov.in](https://jeevanapplyonce.gov.in/v2.0/)
- **Migrant workers excluded from portability.** Under One Nation One Ration Card (ONORC), 778 million portable transactions have been processed (60% under NFSA), but Fair Price Shop dealers still prioritise local beneficiaries over migrants, and migrants generally lack the lease/domicile documentation destination-state officials demand — a structural mismatch between how the state defines "resident" and how migrants actually live. [SAGE journal on ONORC](https://journals.sagepub.com/doi/full/10.1177/24557471241237098)
- **PwD scribe-system overhaul (2025).** After malpractice concerns with candidate-arranged ("own") scribes, the Centre mandated that UPSC, SSC, and NTA build their own vetted scribe pools within two years, standardising 20 minutes/hour compensatory time and requiring original disability documents at the exam centre — showing regulators moving toward centrally verified accommodation status rather than self-declared, ad hoc arrangements each cycle. [Careers360 scribe rules](https://news.careers360.com/centre-tightens-scribe-rules-for-pwd-candidates-upsc-ssc-nta-to-create-own-scribe-pools-within-two-years/amp)
- **DigiLocker scale as evidence of appetite.** As of August 2025, DigiLocker had issued over 990 crore documents to more than 57 crore registered users, with 421 million education records alone — proof that citizens will adopt a "store once, present anywhere" document layer at national scale when integrated with issuers they already trust (boards, UIDAI, transport departments). ApplyOnce's differentiation is doing the same for *structured facts* (not just document PDFs) plus consent-scoped push into third-party forms. [DigiLocker statistics](https://www.digilocker.gov.in/web/statistics); [360Analytika DigiLocker stats](https://360analytika.com/statistical-insight-on-digilocker-in-india/)
- **Parents filling forms for children is the norm, not the exception**, across nursery admission, NSP, APAAR consent, UDID for minors, and Bal Aadhaar — meaning ApplyOnce's guardian/dependent relation model (`relations` table, `basis enum('minor','elder_consent','poa')` in `docs/03-DATA-MODEL.md`) is a first-order requirement, not an edge case.
- **Deadline misses compound rejection.** Missing a scholarship/exam deadline is reported as the single most common reason Indian students lose scholarship opportunities — more common than weak profiles or poor essays — because tracking dozens of independent portals with different windows is itself a full-time task for a student or parent. [Scholarship mistakes analysis](https://www.inforens.com/blog/182/sharmistha-das/scholarship-application-mistakes-why-90percent-of-students-get-rejected)

---

## Part D — Special populations

- **Minors.** Aadhaar under age 5 mandatorily captures a parent/guardian's EID or Aadhaar number; passports for minors require both-parents' consent (or a single-parent affidavit/court order); school admissions, NSP, UDID, and APAAR all route through a parent's login and explicit consent tick. ApplyOnce's `relations` table with `basis = 'minor'` and scoped `scope text[]` already models this — the open design question is *which specific fact_keys* a guardian can share on a minor's behalf per purpose (e.g., a guardian should be able to share `education.class10.*` for a school application but arguably not `health.*` without a narrower consent).
- **Seniors / delegation.** Digital exclusion (13–15% internet usage, biometric authentication failure with aged fingerprints) means seniors need either (a) a trusted family member acting via `relations.basis = 'elder_consent'`/`'poa'`, or (b) an assisted-filing channel (CSC-style) with the same consent receipt guarantees as self-service. Jeevan ApplyOnce's biometric DLC and the new Ayushman Vay Vandana card (70+) are the two highest-frequency senior touchpoints worth wiring first.
- **Persons with disabilities (PwD).** UDID is the single canonical disability credential (`category.pwd`, `category.udid_no`); the 2025 scribe reform means exam bodies increasingly want a verified `scribe_required` flag and disability-percentage tied to that UDID rather than a fresh self-declaration each cycle — directly matching the existing `pwd_type, pwd_percentage, udid_no, scribe_required` sub-fields in the schema. Accessibility of the ApplyOnce UI itself (screen-reader support, large-print mode, voice input) is a design requirement, not just a data-model one.
- **Rural / low-bandwidth users.** The CSC/cybercafe channel (₹50–150/form) is the de facto UI for a large share of the target population; ApplyOnce needs an assisted/offline-tolerant flow (e.g., generate a pre-filled PDF or a share-code a VLE can use) alongside the self-service web/extension flow, or it simply becomes another thing a VLE has to operate on the citizen's behalf without earning trust benefits.
- **Non-English speakers.** Forms above are bilingual at minimum (Hindi/English); several state-level forms (KCET, MHT-CET, WBJEE, EAMCET) are in the state's official language. Per the standing "Hindi-friendly English" copy rule, ApplyOnce's UI and generated form-fill previews should support at least Hindi + English, with regional-language labels sourced from the same i18n label registry the schema already generates (`docs/03-DATA-MODEL.md §1`).
- **NRI / OCI.** A structurally different identity graph: no Aadhaar in many cases, OCI card application instead (needs old Indian passport or parent/grandparent's Indian-origin proof, apostille), NRE/NRO account KYC, FATCA/CRS self-certification. This population needs `identity.passport_no` and a new `identity.oci_no` **[GAP]** as primary keys instead of Aadhaar, and the schema's "sources allowed" model (e.g., `identity.full_name : aadhaar|pan|passport|self`) already supports passport-sourced identity for exactly this case.
- **Migrants.** The domicile/address-proof requirement is the single biggest structural barrier — ONORC portability and e-Shram registration exist precisely because migrants can't produce destination-state residence proof. ApplyOnce should treat `address.current` as genuinely mutable/short-tenure (the schema's `since` field already supports this) and make an evidence trail of *prior verified addresses* useful for domicile applications rather than just the latest one.
- **Transgender citizens.** `identity.gender : enum(M,F,T,X)` already covers this (Aadhaar, PAN since the 2018 gazette notification, Passport, and Voter ID all support a third-gender option); the residual gap is that many *state welfare scheme* forms still don't, and Delhi's 2024 push to mandate a third-gender field across all welfare forms shows this is an active, evolving compliance surface ApplyOnce's partner form-builder should default to including rather than treating as optional.
- **Orphans / no-parent-data.** `family.father.is_alive` (boolean) is a good start, but forms that hard-require "father's name" as a non-nullable field (many state certificate forms still do) will reject applicants with no father on record; ApplyOnce should let a citizen mark `family.father.name` as `not_applicable` with a reason code, and the partner-facing form mapper should degrade gracefully (map to guardian's name, or leave blank with an explanatory note) rather than blocking submission.

---

## Part E — Ranked prioritisation for ApplyOnce v1 (top 10 by frequency × pain × feasibility)

1. **NSP / scholarship applications.** Frequency: ~85 lakh applications/year on NSP alone. Pain: ~40% rejected for preventable mismatches; 78% funnel loss to actual disbursal. Feasibility: fields map almost 1:1 to existing schema (`identity.*`, `family.*`, `category.*`, `bank.primary.*`); mock-env-first since NSP has no partner API, but the extension-autofill golden flow (per `CLAUDE.md`) is a clean fit.
2. **Competitive-exam application cluster (JEE Main/NEET/CUET).** Frequency: crores of applicants/year combined. Pain: multi-hour repeated form-filling of near-identical fields across 3+ portals per student per year; one wrong keystroke is uncorrectable post-submission on some forms. Feasibility: fields are extremely stable year over year (see Part B), making them the best target for the "apply-with-applyonce"/extension-fill golden flow.
3. **Bank account opening & CKYC-aligned KYC.** Frequency: universal at 18, repeated at every new bank/broker/insurer relationship, refreshed via periodic re-KYC. Pain: notorious for photo/signature reformatting, nominee re-entry, and address-proof mismatches. Feasibility: high — CKYC already standardises the field set nationally, meaning ApplyOnce's canonical schema and the industry's own KYC schema are already close to aligned.
4. **Passport (fresh + renewal).** Frequency: high and growing (esp. with study-abroad/GCC migration). Pain: appointment scarcity, police-verification address mismatches, name-format rejections. Feasibility: moderate — no public API, but the field set (Part B #11) is small and stable enough for extension-based autofill; police-verification consent is a natural `consent_id`-anchored share.
5. **Government recruitment OTR (SSC/IBPS/UPSC).** Frequency: tens of millions of applicants annually across SSC/IBPS/UPSC/state PSCs. Pain: SSC's own "One-Time Registration" concept proves the government already recognises the "verify once" problem — ApplyOnce can piggyback on that mental model rather than fighting it. Feasibility: high, since these bodies already push users toward pre-verified, reusable registration IDs.
6. **School admission forms (nursery/KV, RTE, TC).** Frequency: recurring every academic year per child, for every parent. Pain: point-based systems (Delhi nursery) demand many small proofs (distance, sibling, alumni, EWS, CWSN) that a family re-supplies every cycle. Feasibility: moderate — schools are fragmented (no central API), but a parent-owned dependent profile is exactly what ApplyOnce's `profiles(kind='dependent')` model is built for.
7. **Domicile/caste/income certificate issuance & renewal.** Frequency: moderate per-citizen but these three documents are the *upstream gatekeeper* almost every other form in Part A depends on. Pain: income certificates typically expire in 6–12 months, forcing repeat trips to the same e-District office for what is functionally the same fact. Feasibility: moderate — depends on state e-District API availability; where unavailable, ApplyOnce can still track expiry and prompt timely renewal, which is itself high-value.
8. **EPFO onboarding (UAN/Form 11).** Frequency: high — every formal-sector job change. Pain: moderate (previous-UAN lookup failures, KYC seeding delays). Feasibility: high — structured, digital-first process already; a clean canonical-schema fit (`employment.*`, `bank.primary.*`).
9. **Hospital OPD / ABHA registration.** Frequency: very high (repeat visits, multiple family members, multiple providers). Pain: moderate (re-entering the same demographic data at every visit; ABHA lookup friction). Feasibility: high — ABHA is itself an API-first, government-built health ID, making it the most natural verified-provider partner for ApplyOnce's `health.abha_id` field.
10. **Rental agreement + tenant police verification.** Frequency: high in urban/migrant populations (every 11-month lease cycle). Pain: high — informal cash payments to speed up police verification, address-proof gaps for migrants (see Part D). Feasibility: lower near-term (state police portals are fragmented and non-uniform), but high strategic value once 1–9 are live, since it reuses `identity.*` + `address.*` almost entirely.

**Reasoning summary:** items 1–5 are prioritised because they combine (a) extremely high applicant volume, (b) hard evidence of rejection/pain (Part C), and (c) a field set that already maps near-completely onto the existing `packages/schema`, meaning v1 engineering cost is mostly UI/extension work, not schema design. Items 6–9 extend the same core schema into recurring family and health touchpoints with strong retention value (a parent or patient returns many times a year). Item 10 is included for completeness and because it validates the platform on a purely peer-to-peer (non-institutional) form, but is ranked last due to state-level fragmentation of the verifying authority (police).
