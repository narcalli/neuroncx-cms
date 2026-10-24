---
collection: integrations
entry: ABDM
slug: abdm
route: /integrations/abdm
category: EMR and healthcare systems
outline: content/integrations/abdm-outline.md (v2, 23 Oct 2026)
drafted: 23 Oct 2026, replaces the 22 Oct version
status: draft copy for Phase B, the page for the day NHA certifies NeuronCx. Every [CONFIRM] must be settled with engineering before it is published
---

# ABDM: CMS content (v2)

This is the copy for the ABDM integration entry, written from the v2 outline: the page answers "what does ABDM put on the patient record?", with no channel words in the H1, meta, tagline or summary, and products in the order CRM, Workflows, Bots.

**Where it lives.** `scripts/seed-abdm.ts` writes the field copy below to the entry as a draft. It leaves the published version, the status and the Own page switch as they are.

**What can't go in yet.** Integrations have no page sections, second button or hero picture yet. The copy for those parts is in "Waiting for page sections" at the end, ready to move across when integrations move onto the foundation.

**Markers.** FAQ answers reject `[` and `]`, so the entry can't be published while an FAQ holds a [CONFIRM]. Glance lines, What moves and Edge cases don't, so a marker there would go live as it is. Settle all of them first.

**Phase A** (the ABDM section on the Healthcare page) is not written here yet.

---

## Sidebar

| Field | Value |
|---|---|
| Name | ABDM |
| Slug | abdm |
| Status | Planned until NHA certifies NeuronCx, then Live |
| Category | EMR and Healthcare Systems |
| Connection | API and webhooks |
| Products | CRM, Workflows, Bots |
| Own page | On, once the checks at the end are ticked |

## Card tab

**Tagline** (28 of 45): ABHA on every patient record

**Summary** (100 of 120): Verified ABHA on each patient record, with reports linked to it and consent tracked for every visit.

**Logo:** the name only, until NHA's rules on the ABDM mark are checked [CONFIRM].

**Glance** (title 40, line 60):

| Title | Line |
|---|---|
| ABHA verified on the record | Checked with ABDM, saved once, used on every visit |
| One record per patient | ABHA helps match records across branches [CONFIRM] |
| Reports linked to each visit | The patient sees them in their health records app |
| Consent kept with the visit | Who asked, for which records, and until when |

If the matching key isn't confirmed, replace row 2 with: **Every visit on one record** / Reports and consent sit beside the visit they cover.

## SEO tab

**Primary keyword:** abdm integration

**Secondary keywords:** abha integration, abdm compliant software, abdm compliant hmis, abdm scan and share, abdm m1 m2 m3

**Meta title** (57 of 60): ABDM Integration: ABHA on Every Patient Record | NeuronCx

**Meta description** (141 of 155): Verified ABHA on each patient record, reports linked to every visit, and consent tracked for audit. Works alongside your ABDM-certified HMIS.

## Page tab

**Hero heading** (51 of 70): ABHA on every patient record, linked to every visit

**Hero subheading** (167 of 200): Verify ABHA once and keep it on the patient record, with reports and consent beside each visit. Your HMIS keeps the clinical record. NeuronCx keeps the patient record.

**Button:** Book a demo, to /contact

**Related:** Eka Care, DocPulse

**Section headings:**

- What moves: What moves, and when
- Edge cases: Questions teams ask before they switch it on
- Setup: Setting it up

## What moves tab

Keep only the rows that are live at launch.

| Event | Status pill | What happens in NeuronCx |
|---|---|---|
| ABHA added at booking | ABHA verified | Checked with ABDM and saved on the patient record, so nobody asks for it again |
| Patient scans the facility QR | Token issued | The patient record is found or created, and a token joins the queue [CONFIRM in first release] |
| Report ready | Linked to ABHA | Linked to the patient's ABHA, marked on the visit, and the patient is told [CONFIRM M2 role] |
| Another facility asks for records | Consent granted | Shared only as the patient consented, and the consent is saved on the record [CONFIRM] |
| Consent withdrawn | Consent revoked | Sharing stops, and the withdrawal is saved on the patient record [CONFIRM] |

If the HMIS links reports instead of NeuronCx, rewrite row 3 and the Run section below.

## Edge cases tab

| Situation | What we do |
|---|---|
| The patient has no ABHA | They can still book. The record is saved without one, and the patient gets a link to create an ABHA [CONFIRM]. |
| The ABHA and the phone number don't match | Nothing is saved until ABDM verifies the ABHA. If the check fails, a person on your team takes over. |
| Your HMIS also links the same report | Setup checks your HMIS's ABDM status, so each report is linked to ABHA once [CONFIRM]. |
| The patient withdraws consent | Sharing stops, and the withdrawal is saved on the patient record beside the visit it covers. |

## Setup tab

| Item | Lane |
|---|---|
| Your facility and doctors registered on NHPR, the provider registry | From you |
| Your facility ID and ABDM settings added in NeuronCx | From NeuronCx |
| Your HMIS's ABDM status checked, so reports aren't linked twice | From NeuronCx |
| WhatsApp templates approved for the ABHA step and report notices | From NeuronCx |
| The Scan and Share QR code at your front desk, if you use it | From you |
| A test booking and a test report checked in a health records app | From NeuronCx |

## Example tab

Empty. The main visual is the patient record, not a chat transcript. A small chat example belongs in the Reach section once integrations have page sections.

## FAQ tab

Questions 1 and 2 are written for the day NHA certifies NeuronCx.

**Does NeuronCx integrate with ABDM?**
Yes. NeuronCx is certified by the National Health Authority for [CONFIRM milestones and date]. ABDM puts a verified ABHA on each patient record in NeuronCx, links each visit's reports to it, and keeps the patient's consent beside the visit it covers.

**Is NeuronCx ABDM certified?**
Yes, for [CONFIRM milestones, usually M1 for ABHA and M2 for sharing records], certified by the National Health Authority on [CONFIRM date]. Certification covers NHA functional tests, a security audit by an empanelled auditor and a demo. Go-live then happens facility by facility.

**Do we still need an ABDM-compliant HMIS?**
Yes. Your HMIS keeps the clinical record. NeuronCx keeps the patient record: who they are, every visit, and the consent they've given. The two work side by side, and setup checks your HMIS's ABDM status so the same report isn't linked twice.

**Can patients add their ABHA on WhatsApp?**
Yes. During a booking, the patient adds their ABHA number or ABHA address and confirms it with a one-time password [CONFIRM the steps NHA allows]. It is then saved on their record, so nobody asks again. Patients without an ABHA can still book.

**How is patient consent recorded?**
Every request for a patient's records goes through ABDM's consent manager. The patient sees who is asking, for which records and until when, and can approve or refuse. The decision is saved on the patient record beside the visit it covers, ready for audit and DPDP [CONFIRM].

**Does ABHA help us avoid duplicate patient records?**
[CONFIRM the matching key.] Yes. ABHA is a matching key on the patient record, so records that share an ABHA across branches and channels are flagged for your team to merge.

If the matching key isn't confirmed, use this question instead:

**Which health records can be linked to ABHA?**
At launch, NeuronCx links the reports and documents it delivers, such as diagnostic reports [CONFIRM the list]. ABDM also covers OP consultations, discharge summaries, immunisation records and other health documents, which your HMIS shares if it's ABDM certified.

Left out: DHIS and PM-JAY incentives.

## WhatsApp tab

Read by the bot, not shown on the page.

- **Row title** (4 of 24): ABDM
- **Row description** (47 of 70): ABHA on your record, reports in your health app
- **Header** (text): ABDM integration
- **Body:** ABHA is checked once and kept on your record. Reports from each visit reach your health records app, and nothing is shared without your consent. NeuronCx works alongside your hospital's HMIS, which keeps the clinical record.
- **Key points:** ABHA verified and kept on the record / Reports linked to each visit / Nothing shared without consent / Works alongside your HMIS
- **Footer:** NeuronCx integrations
- **Buttons:** Book a demo, Other integrations

## Knowledge base tab

**Include in knowledge base:** off while Planned.

**Answer** (true today; change "Not yet" to "Yes" with the milestones once NHA certifies NeuronCx):
Not yet. NeuronCx's ABDM integration is in ABDM's sandbox and waits for certification by the National Health Authority. Once certified, it puts a verified ABHA on each patient record, links each visit's reports to it, and keeps the patient's consent beside the visit it covers. The hospital's HMIS keeps the clinical record. NeuronCx keeps the patient record.

**Facts:**

- NeuronCx's ABDM integration is built on ABDM's v3 APIs and is in ABDM's sandbox.
- NHA certification needs at least two ABDM milestones, functional tests, a security audit and a demo.
- Once certified, a verified ABHA is saved on each patient record in NeuronCx.
- The hospital's HMIS keeps the clinical record. NeuronCx keeps the patient record.
- Every request for a patient's records goes through ABDM's consent manager.

**Questions:** Do you integrate with ABDM? / Is NeuronCx ABDM certified? / Does NeuronCx support ABHA? / Can patients add their ABHA on WhatsApp? / Will reports reach the patient's health records app?

**Synonyms:** Ayushman Bharat Digital Mission, ABHA, ABHA ID, Ayushman Bharat Health Account, Health ID, NDHM

---

# Waiting for page sections

Integrations have no fields for these yet. The copy is ready to move across when they get page sections, in this order on the page: contrast strip, benefits, Record, Reach, Run, Measure, then What moves (above), what's next, use cases, edge cases, setup, FAQ, related, closing.

**Second button:** See how episodes work

**Hero picture:** a Customer 360 screen from the demo tenant, showing a verified ABHA badge, an episode timeline with "linked to ABHA" markers, and a consent panel.

## 1. Contrast strip [CONFIRM it is allowed on integrations]

**Heading:** Without ABHA on the record, and with it

| Without | With |
|---|---|
| The same patient is registered again at each branch | One record per patient, whichever branch they visit [CONFIRM matching key] |
| ABHA sits in the HMIS, where the front desk never sees it | A verified ABHA on the patient record, used on every visit |
| Consent is kept in another system | Reports and consent sit beside the visit they cover |

## 2. Benefits

**Heading:** What changes for your team

- **Returning patients recognised.** A verified ABHA identifies the patient, even from a new phone number or at a different branch.
- **Fewer duplicate records.** Records that share an ABHA are flagged for your team to merge [CONFIRM].
- **Each visit shows what was linked.** Your team sees which reports reached the patient's health records app, and when, without opening another system.
- **Consent ready for audit.** Who asked, for which records and until when, saved beside the visit it covers.

Proof points, once measured: [PENDING] share of returning patients matched by ABHA, [PENDING] duplicate records merged.

## 3. How it works: Record

**Heading:** What ABDM adds to the patient record

- A verified ABHA number and ABHA address on the patient's profile.
- ABHA as a matching key, so records that share it are flagged or merged [CONFIRM].
- On each visit, the reports and documents linked to ABHA, and when.
- The consent the patient has given through ABDM: who asked, for which records, and until when.

Your HMIS keeps the clinical record. NeuronCx keeps the patient record.

**What ABDM is** (box): The Ayushman Bharat Digital Mission is India's national network for health records. Each person can have an ABHA, a health account that links their records. Doctors and facilities are listed in a national registry, NHPR. Records move only through ABDM's consent manager, and patients see them in a health records app such as Aarogya Setu 2.0. Over 93 crore ABHA accounts and over 104 crore linked records (PIB, July 2026) [recheck against the latest PIB release].

**Consent and data protection** (box, or a trust panel): Every request goes through ABDM's consent manager. Records travel encrypted, and Aadhaar and mobile numbers are encrypted before they are sent. Data stays in your private cloud. Under the DPDP Rules, consent manager duties start in November 2026 and the core duties in May 2027.

## 4. How it works: Reach

**Heading:** How ABHA reaches the record

Three ways in, each writing to the same patient record:

- **At online booking.** The patient adds their ABHA and confirms it with a one-time password [CONFIRM the steps NHA allows].
- **At the front desk, with Scan and Share.** The patient scans your facility's QR code, their record is found or created, and a token joins the queue [CONFIRM in first release].
- **From your HMIS,** when it already holds the patient's ABHA.

Going out: reports from each visit reach the patient's health records app.

A small chat example can sit here as a second visual.

## 5. How it works: Run

**Heading:** What the agents do with it

Agents work from the patient record:

- The front desk agent asks for ABHA at booking and checks it, and skips the step for patients who already have one.
- The report delivery agent links each report to ABHA when it's ready, and tells the patient [CONFIRM M2 role].
- A person on your team takes over when a check fails or a consent needs a decision.

## 6. How it works: Measure [CONFIRM all against what reports can show at launch]

**Heading:** See ABHA coverage across your locations

In Reports and insight: the share of patient records with a verified ABHA, by branch; the linking status of each visit; consent requests and their outcomes.

## What's next (roadmap)

Seeing a patient's past records from other facilities, with their consent (M3). Discovery through UHI. Insurance claims through NHCX.

## 8. Use cases

**Heading:** Where it helps

- **Diagnostic chains.** Reports linked to ABHA for each test visit.
- **Multi-speciality hospitals.** One patient record across departments and branches.
- **Clinic chains.** Returning patients recognised at any branch.

## Closing

**Heading:** Bring one patient record, and see ABHA, visits and consent in one place

**Button:** Book a demo

---

# Before publishing

The open [CONFIRM] lines, with where each one sits in the CMS:

| Claim | In the CMS |
|---|---|
| Certified milestones and date | FAQ 1, FAQ 2 |
| ABHA as a matching key | Glance row 2, FAQ 6 |
| Scan and Share in the first release | What moves row 2 |
| NeuronCx links reports (M2 role) | What moves row 3 |
| Consent saved on the record | What moves rows 4 and 5, FAQ 5 |
| Patients without ABHA get a link to create one | Edge case 1 |
| No double linking with the HMIS | Edge case 3 |
| ABHA steps NHA allows | FAQ 4 |
| ABDM name and mark use | Logo (not set) |

And from the outline's checklist: NHA certification issued; ABHA steps checked against NHA's rules on Aadhaar and verification; moved to the NHPR v3 APIs; a client running it and its name cleared; figures rechecked against the latest PIB release; demo tenant screens only; saved as a draft, checked, published on approval.
