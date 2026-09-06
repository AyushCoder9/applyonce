# The two-minute ApplyOnce pitch

## The story

One student. One application. One reason to trust it: every reused answer has evidence, and the citizen controls the share. Minute one demonstrates the complete application; minute two focuses on evidence readiness and its constrained explanation layer.

Target delivery: 228 spoken words at 135–145 words per minute, with the remaining time reserved for clicks and short pauses. Use a stopwatch in rehearsal; the timestamps below are a speaking plan, not a claim that browser latency is fixed.

## Prepare before the clock starts

1. Run the web app, worker, BTA and local Docker services. Use production builds for the recording. Enable BTA's `DEMO_ADMIN_ENABLED=1` sandbox flag.
2. Log in as Aarav, phone **9876543210**, OTP **123456**. All records in this demonstration are synthetic fixtures.
3. On the BTA readiness page, resolve missing current-address details and select the ready **Sample photo** / **Sample signature** if needed. Do one complete practice submission to verify callbacks and the worker. Keep the next run's facts ready; the five form-specific choices still need confirmation.
4. Keep three tabs in this order: **A:** BTA `/apply/manual`; **B:** ApplyOnce `/app/apply/bta-jee-2026`; **C:** a fresh BTA-initiated ApplyOnce consent screen. Start C from BTA's **Apply with ApplyOnce** button so its browser state cookie is valid. In C, fill the two exam cities, paper, language and declaration, but do not confirm OTP yet. This is rehearsal setup, not a prerecorded success screen.
5. Use a 1280×900 or larger viewport, 100% zoom, and hide unrelated tabs/notifications. Keep developer tools closed. Prepare the OTP input so six digits take under two seconds.
6. In B, rehearse opening **Evidence behind the score** and **What should I do first?** using the actual visible controls. In keyless mode the response is visibly labeled **Local evidence guide**. Do not call this a live-model demo unless a real model is configured and has been tested.

## Exact on-screen flow and speech

| Time | Page and action | Say this |
|---|---|---|
| **0:00–0:12** | **A — BTA manual form.** Show the first step; briefly gesture to the multi-step navigation. Look at the judges for the opening line. | **“Your future should not depend on typing your past correctly. Yet every new application asks us to rebuild the same person: name, address, marks, certificates.”** |
| **0:12–0:25** | **B — ApplyOnce readiness.** Show the named exam and readiness card; then point to the source detail. | **“Meet ApplyOnce. Aarav keeps a reusable vault, where every answer carries its source. Before he applies, ApplyOnce checks what this particular form needs.”** |
| **0:25–0:43** | **C — prepared consent.** Show institution, purpose and requested fields. Click **Share … fields**, enter **123456**, then click **Return now** on the receipt. | **“Here is the institution, the purpose, and the exact information requested. Aarav reviews the share and confirms. ApplyOnce creates a consent receipt and sends the institution a signed payload.”** |
| **0:43–1:00** | **C — BTA review.** Scroll enough to show populated answers and attachments. Click **Submit to BTA**; show the application reference and **Under review**. | **“Back at BTA, his answers and document references are ready to review. He submits. There is the application number, and its status returns to ApplyOnce. This is a working local integration with sample data.”** |
| **1:00–1:13** | **B — readiness.** Pause half a beat before the first sentence; reload if needed. | **“But faster typing is not our breakthrough. Knowing whether an answer deserves to travel is. That is why we built evidence readiness.”** |
| **1:13–1:32** | Expand the source detail; point to the verification/source labels. If there are gaps, show their actual repair links. Do not claim a seeded score is universal. | **“For every required answer, it checks presence, source, expiry, conflicts and access scope. Missing or conflicting evidence becomes a repair step. A self-declared answer stays visibly self-declared. The system does not quietly upgrade trust.”** |
| **1:32–1:49** | Click **What should I do first?** Show the guide and its mode label. | **“Ask ApplyOnce makes those findings understandable. Its optional AI receives derived guidance, not raw identity data. The score stays in deterministic code. The model can explain; it cannot invent verification or submit an application.”** |
| **1:49–2:00** | Stay on the source-aware readiness screen. Stop moving the pointer; deliver the final line to the judges. | **“That means it still works without an AI connection. Reuse the evidence. Keep the choice. ApplyOnce: your next opportunity should start with you, not another blank form.”** |

## Rehearsal notes

- Run the flow with a stopwatch three times. Aim to reach BTA's application number by **0:55** and the AI explanation by **1:40**. If slow, shorten pointer movement and scrolling before speeding up speech.
- Time the actual provider/OTP/return navigation on the machine used for judging. Starting a prepared but unsubmitted consent screen keeps the live proof focused on confirmation, signed exchange, review and submission.
- If callback latency exceeds five seconds, say “The signed handoff is completing” once. Keep speaking about the readiness feature while it completes; return to the real result when ready. Do not present a stale receipt as the current submission.
- If the local AI guide is displayed, use the exact “optional AI” wording above. If a model is configured, still show the mode label and keep the privacy/authority boundary explanation.
- Repeated runs create new applications and consent receipts. Use a fresh BTA session for each run; callback tokens are deliberately one-use.
- The sample photograph, signature and issuer files are demonstration evidence. Do not describe the declaration receipt as a licensed e-Sign or claim live government verification, admission eligibility, certification or measured time savings.

## Backup demonstration

Keep a completed application in another tab as an explicitly labeled previous rehearsal. If the network or local service fails, disclose it and show the previous run's tracker plus the actual readiness/source UI. The differentiator can still be explained honestly without pretending a new submission succeeded.
