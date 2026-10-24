---
collection: integrations
entry: ABDM
slug: abdm
route: /integrations/abdm
category: EMR and healthcare systems
version: 2, rewritten 23 Oct 2026 against brand/positioning.md and claude/foundation.md
replaces: version 1 of this outline, and content/integrations/abdm.md (out of date until regenerated from this outline)
status: outline, not copy. Every [CONFIRM] must be settled with engineering before the full content is written
---

# ABDM integration: page outline (v2)

## 0. What changed from v1, and why

`brand/positioning.md` now sets NeuronCx as an AI-native episodic CRM. It names this page as the first integration file to fix. v1 was written as a conversation page.

| v1 | v2 | Rule in positioning.md |
|---|---|---|
| "Your HMIS keeps the medical record. NeuronCx handles the conversation around it" | "Your HMIS keeps the clinical record. NeuronCx keeps the patient record: who they are, every visit, and the consent they've given" | Section 3, sitting next to another system of record |
| WhatsApp in the tagline, summary, meta description and hero | No channel words in the H1, meta, tagline or summary. WhatsApp only in the one FAQ and the template checklist item where it matters | Section 3, channel words |
| Products: Bots, CRM, Workflows | CRM, Workflows, Bots | Section 3, list order |
| Main visual: a chat transcript | Main visual: the patient record, showing a verified ABHA, linked visits and consent | Section 3, visuals |
| Guide written around "what the patient sees in the chat" | Guide written around "what ABDM puts on the patient record", then Record, Reach, Run, Measure | Section 2, ordering rule and writer's test |
| No problem framing | Tied to two of the three core problems: the returning customer who looks like a stranger, and one customer with many records | Section 1 |
| No proof points | Proof stated as CRM outcomes, all [PENDING] until measured | Section 3, proof points |
| Phase A on `/why-neuroncx/standards-readiness/` | Phase A on the Healthcare industry page (that route is not in the new navigation) | Section 4, navigation |

Patient words are allowed on this page, because it is an industry-specific integration page. The channel and record rules still apply.

## 1. The writer's test, answered

**What does the ABDM integration put on the patient record, or change about it?**

| On the record | What it fixes |
|---|---|
| A verified ABHA number and ABHA address on the patient's profile | A returning patient is recognised by ABHA, even from a new phone number or a different branch (problem 1) |
| ABHA used as a matching key, so records that share it are flagged or merged [CONFIRM] | One patient, many records, across branches and channels (problem 3) |
| Each visit, or episode, shows which reports and documents were linked to ABHA, and when | The team can see what reached the patient's health records app without checking another system |
| The consent the patient has given through ABDM: who asked, for which records, until when | Consent sits on the record next to the visit it covers, ready for audit and DPDP |

If engineering can't confirm the matching key, the first two rows become "a verified ABHA on every profile", and the page drops its claim on problem 3.

## 2. Where we are, and the two phases

**Status.** We are on the ABDM sandbox with the v3 APIs. There are no production credentials and no certification yet. Under `claude/foundation.md`, `planned` entries never leave the CMS, while `pilot` entries are shown to visitors. Sandbox work is not a client pilot, so the entry stays `planned` until NHA certifies us.

| Phase | When | What goes on the site |
|---|---|---|
| A | Now | An ABDM section on the Healthcare industry page, plus one FAQ. The integration entry stays `planned`, so its card and page are hidden |
| B | After NHA certification for M1 and M2 | The full `/integrations/abdm` page below. Entry set to `live`, `hasOwnPage` on |

**Certification needs:** at least two milestones built (usually M1 ABHA and M2 sharing records), NHA functional tests passed, a web application security audit by an empanelled auditor, a demo and the sandbox exit form. Go-live is then per facility.

## 3. Phase A: ABDM section on the Healthcare industry page

The industry page template has the episodes in that industry, the three problems in its terms, agents, integrations and a customer story. ABDM goes in its integrations area. Healthcare words are allowed here.

1. **Heading direction:** ABHA on the patient record.
2. **Two or three lines.** What ABDM and ABHA are. What NeuronCx does today: an ABHA field on the patient record [CONFIRM], and booking data shaped to ABDM's FHIR profiles [CONFIRM]. What's being built: ABHA verified at booking, and reports linked to ABHA, now in ABDM's sandbox.
3. **Sitting-next-to line:** your HMIS keeps the clinical record, NeuronCx keeps the patient record.
4. **FAQ: "Is NeuronCx ABDM certified?"** An honest "not yet", saying the integration is in ABDM's sandbox and that we'll name the milestones once NHA certifies them.
5. **No ABDM card, logo or badge** in any integrations strip, trust panel or partner list until Phase B.

**Home page.** The new homepage outline lists integrations as booking, billing, payment, ERP, telephony and WhatsApp, with no ABDM. Make sure the four "ABDM-aligned" lines in the old v1 home copy don't carry over.

## 4. Phase B: entry fields

### Sidebar

| Field | Value |
|---|---|
| `name` | ABDM |
| `slug` | abdm |
| `status` | planned now, live after certification |
| `category` | EMR and healthcare systems |
| `connection` | API and webhooks |
| `products` | CRM, Workflows, Bots |
| `hasOwnPage` | on, once section 8 is ticked |

### Card tab (no channel words)

- **`tagline`** (45), direction: ABHA on every patient record
- **`summary`** (120), direction: Verified ABHA on each patient record, with reports linked to it and consent tracked for every visit.
- **`image`**: name only until NHA's rules on the ABDM mark are checked [CONFIRM]
- **`glance`** (title 40, line 60), record first:

| Title | Line direction |
|---|---|
| ABHA verified on the record | Checked with ABDM, saved once, used on every visit |
| One record per patient | ABHA helps match records across branches [CONFIRM] |
| Reports linked to each visit | The patient sees them in their health records app |
| Consent kept with the visit | Who asked, for which records, and until when |

### SEO

| Field | Direction |
|---|---|
| Primary keywords | abdm integration (90 a month in India), abha integration (70) |
| Secondary keywords | abdm compliant software (70, highest ad spend, so a buyer term), abdm compliant hmis, abdm scan and share, abdm m1 m2 m3 (volumes to check) |
| Leave out | abha id (110K), abha id create (49.5K) and similar. Citizens looking for their own card, the wrong audience |
| `meta.title` (60) | ABDM Integration: ABHA on Every Patient Record \| NeuronCx |
| `meta.description` (155) | Verified ABHA on each patient record, reports linked to every visit, and consent tracked for audit. Works alongside your ABDM-certified HMIS. No channel words |

Volumes from Ubersuggest, India, checked 23 Oct 2026.

### Page fields

- **`heroHeading`** (70), direction: an outcome, no channel words. For example "Make ABHA part of every patient record" or "ABHA on every patient record, linked to every visit".
- **`heroSubheading`** (200), direction: what lands on the record, then the sitting-next-to line. For example: "Verify ABHA once and keep it on the patient's record. Reports from each visit reach their health records app, and every consent is kept with the visit it covers."
- **Hero media:** a Customer 360 screen from the demo tenant, showing a verified ABHA badge, an episode timeline with "linked to ABHA" markers, and a consent panel.
- **`cta`:** Book a demo. **`secondaryCta`:** See how episodes work.

## 5. Phase B: page sections, in order

Under `claude/foundation.md`, entry pages become a hero followed by a drag-and-reorder `layout` of sections. Integrations move onto that foundation last (build step 12). Until then, the guide rich text holds the same content, with each section below as an H3, so the copy moves across without rewriting.

| # | Section (foundation key) | Heading direction | What goes in it |
|---|---|---|---|
| 1 | `contrastStrip` [CONFIRM it is allowed on integrations] | Without ABHA on the record vs with it | Without: the same patient registered again at each branch, ABHA typed into the HMIS but unseen by the front desk, consent in another system. With: one record, ABHA verified, links and consent beside each visit |
| 2 | `benefits` | What changes for your team | Three or four record outcomes: returning patients recognised by ABHA, fewer duplicate records [CONFIRM], each visit showing what was linked, consent ready for audit |
| 3 | `howItWorks`, part 1: **Record** | What ABDM adds to the patient record | The four record items from section 1. The sitting-next-to line: your HMIS keeps the clinical record, NeuronCx keeps the patient record. A short "What ABDM is" box (ABHA, the NHPR registry, the consent manager, health records apps such as Aarogya Setu 2.0), with the figures: over 93 crore ABHA accounts and over 104 crore linked records (PIB, July 2026) |
| 4 | `howItWorks`, part 2: **Reach** | How ABHA reaches the record | Three ways in, each writing to the same record: during online booking (the patient adds their ABHA and confirms it with a one-time password [CONFIRM the steps NHA allows]), at the front desk through Scan and Share (patient scans the facility QR, the record is found or created, a token joins the queue [CONFIRM in first release]), and from the HMIS if it already holds ABHA. Outbound: reports reach the patient's health records app. A small chat example is allowed here as a secondary visual |
| 5 | `howItWorks`, part 3: **Run** | What the agents do with it | Agents work from the record: the front desk agent asks for and checks ABHA at booking and skips the step for patients who already have one; the report delivery agent links the report to ABHA when it's ready and tells the patient [CONFIRM M2 role]; a person takes over when a check fails or consent needs a decision |
| 6 | `howItWorks`, part 4: **Measure** | See ABHA coverage across your locations | In Reports and insight: share of patient records with a verified ABHA by branch, linking status per visit, consent requests and outcomes. All [CONFIRM] against what reports can show at launch |
| 7 | `statusFlow` | What moves, and when | Table, record-first wording. ABHA added at booking: checked with ABDM, saved on the record. Patient scans the facility QR: record found or created, token added. Report ready: linked to ABHA, marked on the visit, patient told. Another facility asks: shared only as consented, consent saved on the record. Consent withdrawn: sharing stops, record updated. Keep only the rows live at launch |
| 8 | `useCases` | Where it helps | Healthcare only, since this is an ABDM page: a diagnostic chain (reports linked per test visit), a multi-speciality hospital (one record across departments and branches), a clinic chain (returning patients recognised at any branch). No client names |
| 9 | `edgeCases` | Questions teams ask before they switch it on | Patient has no ABHA (can still book, gets a link to create one [CONFIRM]). ABHA and phone number don't match. HMIS also links the same report (avoid double linking [CONFIRM]). Patient withdraws consent |
| 10 | `setupChecklist` | Setting it up | Facility and doctors on NHPR. Facility ID and ABDM settings in NeuronCx. HMIS ABDM status checked. Message templates approved for the ABHA step and report notices (the one place WhatsApp is named). Scan and Share QR at the front desk, if used. A test booking and a test report checked in a health records app |
| 11 | `faq` | | See section 6 |
| 12 | `related` | | Eka Care, DocPulse, the Customer 360 page, the Healthcare industry page |
| 13 | Closing | | Book a demo. Headline direction: bring one patient record and see ABHA, visits and consent in one place |

**What's next**, one short block after section 7 or inside the guide, marked as roadmap: seeing past records from other facilities with consent (M3), discovery through UHI, and insurance claims through NHCX.

**Consent and data protection** sits inside section 3 or as a `trustPanel` site block: every request goes through ABDM's consent manager, records travel encrypted, Aadhaar and mobile numbers are encrypted before sending, and data stays in the client's private cloud. DPDP dates: consent manager rules from Nov 2026, core duties from May 2027.

## 6. FAQ (up to 6)

| Question | Answer direction |
|---|---|
| Does NeuronCx integrate with ABDM? | Yes, with the certified milestones and date [CONFIRM], then what it puts on the patient record |
| Is NeuronCx ABDM certified? | Name the milestones and date. Until then this page isn't live |
| Do we still need an ABDM-compliant HMIS? | Yes. Your HMIS keeps the clinical record. NeuronCx keeps the patient record and works alongside it, and setup checks that reports aren't linked twice |
| Can patients add their ABHA on WhatsApp? | The one channel FAQ. Yes, during booking, confirmed with a one-time password, then saved on the record [CONFIRM] |
| How is patient consent recorded? | Through ABDM's consent manager, saved on the patient record beside the visit it covers |
| Does ABHA help us avoid duplicate patient records? | Only if the matching key is confirmed. Otherwise swap in "Which health records can be linked to ABHA?" |

Left out: DHIS and PM-JAY incentives, unless a client claims through us and DHIS's validity is confirmed.

## 7. WhatsApp and knowledge base tabs

These are read by the bot, not shown on the page, so channel words are fine in WhatsApp fields. Keep the record framing anyway.

- **`waRowDescription`** (72), direction: ABHA on your record, reports in your health app
- **`waBody`**, direction: ABHA is checked once and kept on your record, reports from each visit reach your health records app, and nothing is shared without your consent
- **`waKeyPoints`** order: on the record, linked reports, consent, works with your HMIS
- **`kbAnswer`** opens with a truthful yes or "not yet", then what goes on the patient record, then the sitting-next-to line
- **`kbSynonyms`:** Ayushman Bharat Digital Mission, ABHA, ABHA ID, Ayushman Bharat Health Account, Health ID, NDHM
- **`includeInKbase`:** off while `planned`. Under the foundation, planned entries never reach the knowledge base anyway

## 8. Claims ledger and checks

| Claim | Evidence today | Action |
|---|---|---|
| ABHA field on the patient record | LinkedIn post #4 shows ABHA next to UHID | [CONFIRM] it exists in the product today, for Phase A |
| ABHA used to match or merge records | None recorded | [CONFIRM], or drop the problem 3 claim |
| Booking data follows ABDM's FHIR profiles | Hospital ontology work references the NRCeS Appointment profile | [CONFIRM] scope, for Phase A |
| ABDM integration live | Sandbox only | Wait for certification |
| Reports linked by NeuronCx (M2 role) | Not decided | [CONFIRM]. If the HMIS links instead, rewrite sections 5 and 7 |
| Consent saved on the record | Not decided | [CONFIRM] |
| ABHA coverage reports | Not decided | [CONFIRM], or drop section 6 of the layout |

Before publishing, from positioning.md section 11, plus the ABDM items:

- [ ] H1, meta, tagline and summary free of channel and conversation words
- [ ] The page answers "what does this put on the patient record?"
- [ ] Products and "works with" lists in the order CRM, Workflows, Bots
- [ ] No line treats the CRM as someone else's system
- [ ] Main visual is the patient record, not a chat transcript
- [ ] Proof points stated as record outcomes, each one measured
- [ ] NHA certification issued, milestones and date in the FAQ
- [ ] ABHA steps checked against NHA's rules on Aadhaar and verification
- [ ] Moved to the NHPR v3 APIs
- [ ] A client running it, and its name cleared before any mention
- [ ] ABDM name and mark use checked
- [ ] Figures rechecked against the latest PIB release
- [ ] Demo tenant screens only
- [ ] No em dashes or filler words
- [ ] Saved as a draft, checked in live preview, published on approval

## Sources

Same as v1 (PIB July 2026, Nirmitee milestone and certification guides, NRCeS FHIR IG, OpenGov Asia on Aarogya Setu 2.0, Taxmann on DPDP Rules, the Notion ABDM and Patient 360 pages), plus:

- `brand/positioning.md`, agreed 23 Oct 2026
- `claude/foundation.md`, 23 Oct 2026
- Ubersuggest keyword data, India, 23 Oct 2026
