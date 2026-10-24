# Audit 03: real data and template mapping

Read-only audit, 15 Oct 2026. Builds on [01-cms-fields.md](01-cms-fields.md) (fields) and [02-integration-page.md](02-integration-page.md) (current page).

**How the data was read.** A throwaway script outside `src` (deleted afterwards) read the production CMS through its REST API at `https://main.duebzy83yxxuo.amplifyapp.com/api`. It used depth 1 and printed every field in admin order.

The Payload Local API was not used. In this project it connects to the local database, a copy from 14 Oct 17:08 that is already out of date: DocPulse's category has been renamed since.

**What this view leaves out.** The REST API without a login returns the **published** version of each record. Any unpublished draft newer than these values is not shown.

How to read the values:

- Relationships show the related record's name. Uploads show the file name. Links show where they point.
- UI-only fields (the SEO check panel, WhatsApp preview and similar) store nothing and are left out.
- **EMPTY** means no value. For an array, it means no rows.
- "(same as the schema default)" marks a value that matches the field's default, so it may never have been chosen by an editor.

## Part A: data check

### A. DocPulse integration item

id `6accb8ee26b058aba6cfaf55`, published, last updated 2026-10-14T11:29:06.781Z. 12 empty of 123 rows.

| Field | Value |
|---|---|
| name | DocPulse |
| status | live (same as the schema default) |
| category | EMR and Healthcare Systems |
| connection | API and webhooks |
| products | Bots, CRM, Workflows |
| featured | true |
| order | 10 |
| slug | docpulse |
| hasOwnPage | true |
| logo | **EMPTY** |
| tagline | WhatsApp booking for DocPulse hospitals |
| summary | Patients book, cancel and reschedule DocPulse appointments on WhatsApp. Every change in DocPulse updates their record. |
| glance[1].title | 5 booking statuses |
| glance[1].line | Confirmed, arrived, no-show, completed and cancelled |
| glance[2].title | Reception bookings included |
| glance[2].line | Bookings made at the front desk reach the record too |
| glance[3].title | Open slots from DocPulse |
| glance[3].line | Patients only see times that are free in DocPulse |
| glance[4].title | Cancel or reschedule by reply |
| glance[4].line | Patients type Cancel or Reschedule in the chat |
| primaryKeyword | docpulse integration |
| secondaryKeywords[1].keyword | docpulse software |
| secondaryKeywords[2].keyword | docpulse whatsapp |
| secondaryKeywords[3].keyword | docpulse appointment booking |
| secondaryKeywords[4].keyword | whatsapp appointment booking |
| meta.title | DocPulse Integration for WhatsApp Booking \| NeuronCx |
| meta.image | **EMPTY** |
| meta.description | The DocPulse integration lets patients book, cancel and reschedule on WhatsApp. Every booking status in DocPulse updates the patient record in NeuronCx. |
| heroHeading | Book DocPulse appointments on WhatsApp |
| heroSubheading | **EMPTY** |
| cta.label | **EMPTY** |
| cta.link | **EMPTY** |
| related | **EMPTY** |
| headingOverrides.statusTable | **EMPTY** |
| headingOverrides.edgeCases | **EMPTY** |
| headingOverrides.setup | **EMPTY** |
| headingOverrides.related | **EMPTY** |
| statusFlow[1].event | Patient books on WhatsApp |
| statusFlow[1].inPartner | New appointment |
| statusFlow[1].whatHappens | The patient picks a location, doctor, visit type and time from the free slots. The booking is saved in DocPulse. |
| statusFlow[2].event | Appointment confirmed |
| statusFlow[2].inPartner | Confirmed |
| statusFlow[2].whatHappens | The booking is added to the patient's record and a WhatsApp confirmation is sent. |
| statusFlow[3].event | Appointment changed |
| statusFlow[3].inPartner | Confirmed again |
| statusFlow[3].whatHappens | The existing booking is updated. No second booking is created. |
| statusFlow[4].event | Patient arrives |
| statusFlow[4].inPartner | Arrived |
| statusFlow[4].whatHappens | The booking is marked as arrived on the patient's record. |
| statusFlow[5].event | Patient does not come |
| statusFlow[5].inPartner | No-show |
| statusFlow[5].whatHappens | The booking is marked as missed on the patient's record. |
| statusFlow[6].event | Visit finished |
| statusFlow[6].inPartner | Completed |
| statusFlow[6].whatHappens | The booking is marked as completed on the patient's record. |
| statusFlow[7].event | Appointment cancelled |
| statusFlow[7].inPartner | Cancelled |
| statusFlow[7].whatHappens | The booking is marked as cancelled and closed on the patient's record. |
| statusFlow[8].event | Patient replies Cancel or Reschedule |
| statusFlow[8].inPartner | Appointment updated |
| statusFlow[8].whatHappens | The patient chooses which booking to change, and the change is made in DocPulse. |
| edgeCases[1].situation | DocPulse sends the same booking twice |
| edgeCases[1].whatWeDo | Only one booking is kept. The second message updates the first booking instead of making a copy. |
| edgeCases[2].situation | A time arrives with or without a time zone |
| edgeCases[2].whatWeDo | Both formats are read correctly, so the patient always sees the right appointment time. |
| edgeCases[3].situation | A no-show is sent more than once |
| edgeCases[3].whatWeDo | The booking is marked as missed once. Repeat messages do not change it again. |
| edgeCases[4].situation | A Practo booking cannot be saved in DocPulse |
| edgeCases[4].whatWeDo | Your front desk gets a WhatsApp alert with the doctor, patient and time, so they can move the patient to another slot. |
| edgeCases[5].situation | A request to DocPulse fails |
| edgeCases[5].whatWeDo | The failed request is saved with the reason, so your team and ours can see what went wrong and fix it. |
| setupChecklist[1].item | DocPulse API key for each hospital account |
| setupChecklist[1].providedBy | you |
| setupChecklist[2].item | NeuronCx webhook address added in DocPulse |
| setupChecklist[2].providedBy | partner |
| setupChecklist[3].item | Your locations, departments, doctors and visit types matched to DocPulse |
| setupChecklist[3].providedBy | neuroncx |
| setupChecklist[4].item | The booking messages patients get, and when they get them |
| setupChecklist[4].providedBy | you |
| setupChecklist[5].item | One test booking, cancellation and no-show checked with your team |
| setupChecklist[5].providedBy | you |
| setupChecklistSource | **EMPTY** |
| chatExample[] | **EMPTY** (no rows) |
| faqs[1].question | Can patients book DocPulse appointments on WhatsApp? |
| faqs[1].answer | Yes. Patients choose a location, department, doctor, visit type and time in the WhatsApp chat. Only free slots from DocPulse are shown. When the patient confirms, the booking is saved in DocPulse and added to their record in NeuronCx. |
| faqs[2].question | Do bookings made at reception show up in NeuronCx? |
| faqs[2].answer | Yes. DocPulse tells NeuronCx about every confirmed booking, wherever it was made. A booking made at the front desk, online or on WhatsApp is added to the same patient record. |
| faqs[3].question | Which DocPulse booking statuses does NeuronCx receive? |
| faqs[3].answer | Five statuses: confirmed, arrived, no-show, completed and cancelled. Each one updates the booking on the patient's record, so your team can see where every appointment stands. |
| faqs[4].question | Can patients cancel or reschedule a DocPulse appointment on WhatsApp? |
| faqs[4].answer | Yes. The confirmation message tells patients to reply Cancel or Reschedule. They choose the booking to change in the chat, and the change is made in DocPulse. |
| waRowTitle | DocPulse |
| waRowDescription | Book, cancel and reschedule DocPulse appointments |
| waHeaderType | text (same as the schema default) |
| waHeader | DocPulse integration |
| waBody | With the DocPulse integration, patients book hospital appointments right here on WhatsApp. They pick a location, doctor and time from the free slots in DocPulse. Every change made in DocPulse, like a cancellation or a missed visit, also updates their record. |
| waKeyPoints[1].line | Free slots shown straight from DocPulse |
| waKeyPoints[2].line | Cancel or reschedule by replying in the chat |
| waKeyPoints[3].line | Bookings made at reception included |
| waKeyPoints[4].line | No-shows and completed visits recorded |
| waFooter | NeuronCx integrations |
| waButtons[1].label | Book a demo |
| waButtons[1].action | bookDemo |
| waButtons[2].label | Other systems |
| waButtons[2].action | otherSystems |
| waLinkLabel | See how it works |
| waLink | /integrations/docpulse |
| includeInKbase | true (same as the schema default) |
| kbAnswer | Yes. NeuronCx connects to DocPulse, the hospital software. Patients can book, cancel and reschedule DocPulse appointments on WhatsApp. They choose a location, doctor, visit type and time from the free slots in DocPulse, and the booking is saved in DocPulse. When a booking changes in DocPulse, for example confirmed, arrived, no-show, completed or cancelled, the patient's record in NeuronCx is updated. Bookings made at reception are included. |
| kbFacts[1].fact | Free slots are read from DocPulse when a patient books on WhatsApp. |
| kbFacts[2].fact | Bookings made on WhatsApp are saved in DocPulse. |
| kbFacts[3].fact | DocPulse sends five booking statuses to NeuronCx: confirmed, arrived, no-show, completed and cancelled. |
| kbFacts[4].fact | Bookings made at reception in DocPulse also reach the patient's record in NeuronCx. |
| kbFacts[5].fact | If DocPulse sends the same booking twice, only one booking is kept. |
| kbFacts[6].fact | Hospitals with more than one location are supported. Patients choose the location first. |
| kbQuestions[1].question | Do you integrate with DocPulse? |
| kbQuestions[2].question | Can patients book on WhatsApp if we use DocPulse? |
| kbQuestions[3].question | Does NeuronCx work with DocPulse hospital software? |
| kbQuestions[4].question | Do DocPulse bookings show up in NeuronCx? |
| kbSynonyms[1].synonym | Docpulse |
| kbSynonyms[2].synonym | DocPulse HIS |
| kbSynonyms[3].synonym | DocPulse software |
| kbLastReviewed | 2026-10-14T11:30:00.000Z |

### A. EkaCare integration item

id `6accb92326b058aba6cfaf89`, published, last updated 2026-10-12T10:40:35.176Z. 37 empty of 49 rows.

| Field | Value |
|---|---|
| name | EkaCare |
| status | live (same as the schema default) |
| category | EMR and Healthcare Systems |
| connection | API and webhooks |
| products | Bots, Workflows |
| featured | false (same as the schema default) |
| order | 20 |
| slug | ncx-integrations-ekacare |
| hasOwnPage | false (same as the schema default) |
| logo | **EMPTY** |
| tagline | **EMPTY** |
| summary | Appointment created, updated and status events from Eka Care start the right WhatsApp message automatically. |
| glance[] | **EMPTY** (no rows) |
| primaryKeyword | **EMPTY** |
| secondaryKeywords[] | **EMPTY** (no rows) |
| meta.title | **EMPTY** |
| meta.image | **EMPTY** |
| meta.description | **EMPTY** |
| heroHeading | **EMPTY** |
| heroSubheading | **EMPTY** |
| cta.label | **EMPTY** |
| cta.link | **EMPTY** |
| related | **EMPTY** |
| headingOverrides.statusTable | **EMPTY** |
| headingOverrides.edgeCases | **EMPTY** |
| headingOverrides.setup | **EMPTY** |
| headingOverrides.related | **EMPTY** |
| statusFlow[] | **EMPTY** (no rows) |
| edgeCases[] | **EMPTY** (no rows) |
| setupChecklist[] | **EMPTY** (no rows) |
| setupChecklistSource | **EMPTY** |
| chatExample[] | **EMPTY** (no rows) |
| faqs[] | **EMPTY** (no rows) |
| waRowTitle | **EMPTY** |
| waRowDescription | **EMPTY** |
| waHeaderType | text (same as the schema default) |
| waHeader | **EMPTY** |
| waBody | **EMPTY** |
| waKeyPoints[] | **EMPTY** (no rows) |
| waFooter | **EMPTY** |
| waButtons[] | **EMPTY** (no rows) |
| waLinkLabel | **EMPTY** |
| waLink | **EMPTY** |
| includeInKbase | true (same as the schema default) |
| kbAnswer | **EMPTY** |
| kbFacts[] | **EMPTY** (no rows) |
| kbQuestions[] | **EMPTY** (no rows) |
| kbSynonyms[] | **EMPTY** (no rows) |
| kbLastReviewed | **EMPTY** |

### A. Integrations master (Is main on)

id `6acf3eafa1394126804017b1`, published, last updated 2026-10-14T12:06:33.941Z. 14 empty of 64 rows.

| Field | Value |
|---|---|
| name | WhatsApp CRM Integration for Your Systems \| NeuronCx |
| slug | integrations |
| isMain | true |
| filter.categories | **EMPTY** |
| filter.products | **EMPTY** |
| primaryKeyword | whatsapp crm integration |
| secondaryKeywords[1].keyword | integrate whatsapp with crm |
| secondaryKeywords[2].keyword | crm integration with whatsap |
| secondaryKeywords[3].keyword | whatsapp integrated crm |
| secondaryKeywords[4].keyword | payment gateway integration |
| secondaryKeywords[5].keyword | cloud telephony integration |
| meta.title | WhatsApp CRM Integration for Your Systems \| NeuronCx |
| meta.image | **EMPTY** |
| meta.description | WhatsApp CRM integration for the software you already use. Connect booking, phone, CRM and payment systems to one customer record. |
| eyebrow | Integrations |
| h1 | WhatsApp CRM integration for the systems you already use |
| subheading | NeuronCx connects to your hospital software, phone system, CRM and payment gateway. Bookings, calls and payments from each one are saved on the same customer record. |
| heroSystems | DocPulse, EkaCare, LeadSquared, Exotel, Knowlarity, Razorpay |
| hero.secondaryCta.label | **EMPTY** |
| hero.secondaryCta.link | **EMPTY** |
| hero.image | **EMPTY** |
| fiveThingsHeading | **EMPTY** |
| fiveThings[1].title | Every booking status reaches the record |
| fiveThings[1].line | When a booking is confirmed, cancelled, missed or completed in your booking software, the customer's record shows it. |
| fiveThings[2].title | Bookings from every source in one place |
| fiveThings[2].line | Bookings made on WhatsApp, at your front desk or on an online booking site all land on the same record. |
| fiveThings[3].title | Every call saved with its details |
| fiveThings[3].line | Each call is saved on the caller's record with who answered, how long it lasted and the recording. |
| fiveThings[4].title | Payments confirmed by the gateway |
| fiveThings[4].line | A booking shows as paid only after the payment company confirms it, not when the customer closes the page. |
| fiveThings[5].title | Your CRM stays up to date |
| fiveThings[5].line | Leads, chats and call scores are written into the CRM your team already uses. |
| whenFeedsGoWrongHeading | **EMPTY** |
| whenFeedsGoWrong[] | **EMPTY** (no rows) |
| apiCard.heading | Don't see your system? |
| apiCard.line | NeuronCx has its own API and webhooks. Most systems can connect, even if they are not listed here. |
| apiCard.buttonLabel | **EMPTY** |
| apiCard.link | page: /contact |
| labels.statusTable | What moves between {name} and NeuronCx |
| labels.edgeCases | How {name} errors and repeats are handled |
| labels.setup | What you need to connect {name} |
| labels.related | Other integrations similar to {name} |
| faqHeading | **EMPTY** |
| faqs[] | **EMPTY** (no rows) |
| closing.heading | Connect the systems you already use |
| closing.subheading | If your CRM or booking software isn't listed, it can usually still connect. Tell us which one you use and we'll tell you what's involved. |
| cta.label | Talk to our team |
| cta.link | page: /contact |
| waIntro | NeuronCx works with the booking software, phone systems, CRMs and payment gateways you already use. Pick the type of system you use to see what connects and how.  |
| waListButton | Choose system type |
| waSectionTitle | Types of systems |
| waFallback | We don't list that system yet, but most systems can still connect. Tell us its name and our team will tell you what's involved. |
| includeInKbase | true (same as the schema default) |
| kbAnswer | NeuronCx works with booking and records software, online booking sites, phone systems, CRMs and payment gateways. Current integrations include DocPulse, Eka Care, Practo, Exotel, Knowlarity, Tata Smartflo, Asttecs, LeadSquared and Razorpay. Bookings, calls, payments and chats from these systems are saved on one customer record. Systems that are not listed can often connect through the NeuronCx API and webhooks. |
| kbFacts[1].fact | NeuronCx connects to booking software, online booking sites, phone systems, CRMs and payment gateways. |
| kbFacts[2].fact | Bookings, calls, payments and chats from connected systems are saved on one customer record. |
| kbFacts[3].fact | NeuronCx engineers set up each integration with the client's IT team. |
| kbFacts[4].fact | Systems that are not listed can often connect through the NeuronCx API and webhooks.  |
| kbQuestions[1].question | Which systems do you integrate with? |
| kbQuestions[2].question | Do you work with our booking software? |
| kbQuestions[3].question | Can you connect to our phone system? |
| kbQuestions[4].question | Do you integrate with our CRM? |
| kbSynonyms[] | **EMPTY** (no rows) |
| kbLastReviewed | **EMPTY** |

### A. Category "EMR and Healthcare Systems"

id `6acdc57bce270a9cadbd7003`, published, last updated 2026-10-14T12:04:31.841Z. 2 empty of 9 rows.

| Field | Value |
|---|---|
| name | EMR and Healthcare Systems |
| slug | emr-and-healthcare-systems-integrations |
| order | 40 |
| hubHeading | Hospital management system integration |
| description | Connect your HMS or EMR to WhatsApp. Appointments, visits and status changes update the patient record in NeuronCx. |
| icon | **EMPTY** |
| waRowTitle | Hospital systems |
| waRowDescriptionAuto | false (same as the schema default) |
| waRowDescription | **EMPTY** |

### A. Connection type "API and webhooks"

id `6acdc57cce270a9cadbd7027`, published, last updated 2026-10-14T06:38:52.082Z. 7 empty of 10 rows.

| Field | Value |
|---|---|
| name | API and webhooks |
| slug | api-webhooks |
| order | 20 |
| badgeLabel | **EMPTY** |
| description | **EMPTY** |
| timing | **EMPTY** |
| typicalSetup | **EMPTY** |
| defaultChecklist[] | **EMPTY** (no rows) |
| waLine | **EMPTY** |
| kbAnswer | **EMPTY** |

### Notes on the data

**DocPulse**

- Empty: `logo`, `meta.image`, `heroSubheading`, `cta`, `related`, all four `headingOverrides`, `setupChecklistSource` and `chatExample`.
- Everything the current page shows is filled.

**EkaCare**

- Filled: card and sidebar fields only (`name`, `status`, `category`, `connection`, `products`, `order`, `slug`, `summary`). `waHeaderType` and `includeInKbase` hold only their schema defaults.
- Empty: everything else, including `tagline` and `logo`.

**Master record**

- Empty: `whenFeedsGoWrong`, `faqs`, `fiveThingsHeading`, `whenFeedsGoWrongHeading`, `faqHeading` and `apiCard.buttonLabel`.
- `heroSystems` has 6 entries; Practo is no longer in it.
- One secondary keyword reads "crm integration with whatsap", missing the final "p".

**Category:** `icon` and `waRowDescription` are empty. Its `waRowTitle` is still "Hospital systems", while its `name` is now "EMR and Healthcare Systems".

**Connection type:** only `name`, `slug` and `order` are filled. `badgeLabel` is empty, so labels fall back to the name. `defaultChecklist` is empty, so it has never prefilled a setup checklist, which is why DocPulse's `setupChecklistSource` is empty.

**No item has a logo.** All 9 published Live items have `logo` empty.

## Part B: the new template against existing fields

"Item" is the integration item on the page; "master" is the Integrations master record with Is main on. "Fixed text" means words the template supplies itself; no field holds them today either.

### B1. Hero (text only)

| Template needs | Existing field | DocPulse has a value? |
|---|---|---|
| Breadcrumb: link to all integrations | none (the current page uses the fixed text "Integrations" and `/integrations`) | n/a |
| Breadcrumb: this page | item `name` | Yes: DocPulse |
| Category label | item `category` › category `name` | Yes: EMR and Healthcare Systems |
| Connection label | item `connection` › connection type `badgeLabel`, else `name` | `badgeLabel` EMPTY; `name` yes: API and webhooks |
| H1 | item `heroHeading` | Yes |
| Subheading | item `heroSubheading`, with `summary` as the current fallback | `heroSubheading` EMPTY; `summary` yes |
| Button label | item `cta.label`, else master `cta.label` | Item EMPTY; master yes: Talk to our team |
| Button link | item `cta.link`, else master `cta.link` | Item EMPTY; master yes: /contact |
| "Works with" products | item `products` › product `name` | Yes: Bots, CRM, Workflows |
| "Works with" wording | none (fixed text) | n/a |

Not used by a text-only hero: item `logo`, `tagline` and `glance`. The current page shows these in the hero card.

### B2. Status flow (one scroll step per row)

| Template needs | Existing field | DocPulse has a value? |
|---|---|---|
| Rows | item `statusFlow[]` | Yes: 8 rows |
| "When" | `statusFlow[].event` | Yes: 8 of 8 |
| "In DocPulse" status | `statusFlow[].inPartner` | Yes: 8 of 8 |
| What happens in NeuronCx | `statusFlow[].whatHappens` | Yes: 8 of 8 |
| Column titles "When", "In {name}", "What happens in NeuronCx" | none (fixed text plus item `name`) | n/a |
| Direction per row (WhatsApp to partner, or partner to NeuronCx) | **none** | No |
| Status colour per row | **none** | No |
| Section heading | item `headingOverrides.statusTable`, else master `labels.statusTable` | Override EMPTY; master yes |

### B3. Edge cases

| Template needs | Existing field | DocPulse has a value? |
|---|---|---|
| Situation | item `edgeCases[].situation` | Yes: 5 rows |
| What we do | item `edgeCases[].whatWeDo` | Yes: 5 of 5 |
| Section heading | item `headingOverrides.edgeCases`, else master `labels.edgeCases` | Override EMPTY; master yes |

### B4. Setup (three lanes)

| Template needs | Existing field | DocPulse has a value? |
|---|---|---|
| Step text | item `setupChecklist[].item` | Yes: 5 rows |
| Who provides it, which picks the lane | item `setupChecklist[].providedBy`: `you`, `partner`, `neuroncx` | Yes: you 3, partner 1, neuroncx 1 |
| Lane titles | none as a field. The option labels "You", "Partner" and "NeuronCx" exist in CMS code, and item `name` can name the partner lane. | n/a |
| Section heading | item `headingOverrides.setup`, else master `labels.setup` | Override EMPTY; master yes |

### B5. FAQ accordion

| Template needs | Existing field | DocPulse has a value? |
|---|---|---|
| Question | item `faqs[].question` | Yes: 4 rows |
| Answer | item `faqs[].answer` | Yes: 4 of 4 |
| Section heading with {name} | **none**. Master `faqHeading` is the landing page's FAQ heading, and it is empty. | No |

### B6. Related (up to 4 cards, plus "All integrations")

| Template needs | Existing field | DocPulse has a value? |
|---|---|---|
| Hand-picked cards | item `related`, **capped at 3 rows** in the CMS | EMPTY |
| Top-up from the same category | item `category`, plus other items' `category`, `status`, `_status`, `order` and `name` | 1 other published Live item in the category: EkaCare |
| Card: logo | related item `logo` | EkaCare EMPTY |
| Card: first letter | related item `name` | Yes |
| Card: name | related item `name` | Yes |
| Card: tagline | related item `tagline` | EkaCare EMPTY (it has a `summary`) |
| Card: link to its page | related item `slug` and `hasOwnPage` | EkaCare: Own page off, so no link |
| "All integrations" card: label | **none** | n/a |
| "All integrations" card: link | **none**. Master `slug` is "integrations", but no field ties a master record to the page that shows it. | n/a |
| Section heading | item `headingOverrides.related`, else master `labels.related` | Override EMPTY; master yes |

With today's data, DocPulse would get **one item card** (EkaCare, name only, no link) plus the "All integrations" card.

### B7. Closing panel

| Template needs | Existing field | DocPulse has a value? |
|---|---|---|
| Heading | master `closing.heading` | Yes |
| Subheading | master `closing.subheading` | Yes |
| Button label and link | item `cta`, else master `cta` | Item EMPTY; master yes |

There is no item-level closing heading. Every item page shares the master's.

### B8. WhatsApp section (only when filled)

| Template needs | Existing field | DocPulse has a value? |
|---|---|---|
| Show only when filled | none as a switch. Can be read from the fields below. | n/a |
| Header | item `waHeader` (`waHeaderType` says text or image) | Yes: "DocPulse integration" (type: text) |
| Body | item `waBody` | Yes |
| Key points | item `waKeyPoints[].line` | Yes: 4 rows |
| Footer | item `waFooter` | Yes |
| Reply buttons | item `waButtons[].label` (with `action` codes such as `bookDemo`; no URLs) | Yes: 2 rows |
| Link button | item `waLinkLabel` and `waLink` | Yes: "See how it works", /integrations/docpulse |
| List row (menu) | item `waRowTitle`, `waRowDescription` | Yes |
| Section heading | **none** | No |

EkaCare has every WhatsApp field empty, so this section would not show for it.

### B9. Section headings from the master {name} templates

| Section | Existing field | DocPulse has a value? |
|---|---|---|
| Status flow | master `labels.statusTable` (item override first) | Yes: What moves between {name} and NeuronCx |
| Edge cases | master `labels.edgeCases` (item override first) | Yes: How {name} errors and repeats are handled |
| Setup | master `labels.setup` (item override first) | Yes: What you need to connect {name} |
| Related | master `labels.related` (item override first) | Yes: Other integrations similar to {name} |
| FAQ | **none** | No |
| WhatsApp | **none** | No |
| Closing | master `closing.heading` (one heading for every item, no {name}) | Yes |
| The value put into {name} | item `name` | Yes: DocPulse |

## Part C: gaps

Only template needs with no existing field are listed here.

| # | Gap | Can it be worked out from existing data? | Verdict |
|---|---|---|---|
| 1 | Status flow: direction per row | Partly. See C1. | Works for DocPulse; truly needs a field to hold across items |
| 2 | Status flow: colour per row | Mostly, from `inPartner` text. See C2. | Can be worked out; a field only if editors must choose |
| 3 | Status flow column titles | Yes. Fixed text plus item `name`, as the current page does. | No field needed |
| 4 | Setup lane titles | Yes. The three `providedBy` values, with item `name` for the partner lane. | No field needed |
| 5 | FAQ heading with {name} | No data to work it from | Fixed template text, or a new field if editors must change it |
| 6 | WhatsApp section heading | No data to work it from | Fixed template text, or a new field if editors must change it |
| 7 | WhatsApp section show or hide | Yes. Show it when `waBody` (or `waKeyPoints`) has content. | No field needed |
| 8 | Related: top-up to 4 | Yes. Same `category`, Live and published, not this item, sorted by `order` then `name`. The current page already does this, up to 3. | No field needed |
| 9 | Related: a 4th hand-picked card | Not a missing field: `related` exists but is capped at 3 rows. With top-up, 4 cards are still possible. | Only the existing limit stands in the way of 4 hand-picked |
| 10 | "All integrations" card: label and link | Link: yes, the same fixed `/integrations` the breadcrumb uses (master `slug` is also "integrations", but nothing ties it to a page). Label: fixed text. | No field needed |
| 11 | Breadcrumb link to all integrations | Same as 10 | No field needed |

### C1. Direction from text

I tested a text rule against the two items that have a status flow:

> If `whatHappens` says the result lands in the partner ("saved in DocPulse", "made in DocPulse"), the row is WhatsApp to partner. Otherwise it is partner to NeuronCx.

An event-text rule ("WhatsApp" or "replies" in `event`) gives the same split.

**DocPulse: 8 of 8 correct.**

- Rows 1 and 8 ("Patient books on WhatsApp", "Patient replies Cancel or Reschedule") are WhatsApp to partner.
- The other six are partner to NeuronCx.

**LeadSquared: 3 of 10 correct** (rows 1, 4 and 8). Most of its rows send data from NeuronCx **into** LeadSquared without saying so in a way the rule can see. Two rows fit neither of the template's two directions:

- Row 7, "Template sent from LeadSquared": LeadSquared to WhatsApp.
- Row 10, "Outbound call ends": NeuronCx to LeadSquared.

So direction can be inferred for booking-style items written like DocPulse. Across items it needs a field, and two values don't cover LeadSquared.

### C2. Colour from status text

A keyword list on `inPartner` gives each DocPulse row a sensible meaning (8 of 8):

| Status words | DocPulse statuses | Meaning |
|---|---|---|
| confirm, arrive, complete | Confirmed, Confirmed again, Arrived, Completed | done / good |
| no-show | No-show | warning |
| cancel | Cancelled | stopped |
| anything else | New appointment, Appointment updated | neutral |

None of LeadSquared's 10 statuses contain these words ("New lead created", "Lead updated", "Call score saved" and so on), so all of its rows would come out neutral.
