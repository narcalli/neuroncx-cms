# B2C_Crm.md

---

## collection: crmFeatures (admin label "B2C CRM")
payload_slug: crmFeatures (not built yet)
config_file: src/collections/CrmFeatures/index.ts (planned)
own_page_route: /crm/[slug] (planned)
hub_page: /crm-for-agentic-workflows
shared_groups: all seven, see fields_reference.md
status: design only, 13 Oct 2026. Nothing in this file is built yet

# B2C CRM

Read this file before adding or editing a CRM feature, writing a feature page, choosing which CRM features a block shows, writing the WhatsApp or knowledge base text for a feature, or building or changing the collection. Read `fields_reference.md` alongside it for the shared field groups.

## 1. What this collection is

One entry is one capability of the NeuronCx CRM, such as Customer 360, Segments or Campaigns.

People who read it:

- Operations and CX heads comparing CRMs for an organisation that serves thousands of people.
- IT teams checking what the CRM actually does.
- The WhatsApp assistant, when someone asks "what can NeuronCx do?"
- The knowledge base, so the virtual agents can explain each feature.

The positioning these entries support: NeuronCx is a B2C CRM built around customer episodes. Traditional CRMs were built for sales teams tracking a few large deals through a pipeline. Hospitals, diagnostic chains, universities and hotels serve thousands of people, each on their own journey, who come back again and again. Every feature should show how NeuronCx handles that better.

The home page frames the problem as three situations. Each feature should answer at least one of them:

| Problem | What happens in a sales-pipeline CRM |
| --- | --- |
| The follow-up that looks like a stranger | After the sale, a customer's next call or message is logged as a new lead, and they have to explain everything again |
| The customer who quietly drops off | Someone starts a booking or application and stops halfway, and nobody notices, because the CRM only watches leads on their way to a sale |
| One customer, many records | The same person reaches you on WhatsApp, by phone and at two locations, and ends up as four entries |

## 2. What belongs here, and what doesn't

| Collection | One entry is | Example |
| --- | --- | --- |
| **B2C CRM (this file)** | One capability of the CRM | Customer 360, Segments, Campaigns |
| Episodic engagements | One type of customer episode the CRM runs | Maternity care, admissions cycle |
| Omnichannel CX | One channel or conversation capability | WhatsApp assistant, voice bot |
| Micro-apps swarm | One agent | Billing agent, front desk agent |
| Call quality assessments | One assessment type | Call scoring scorecard |
| Integrations | One outside system | DocPulse |

If an idea is about how a customer is recognised, reached, served or measured inside the CRM, it belongs here. If it's a channel, an agent or an outside system, it belongs in that collection, and this collection links to it.

## 3. Field design

### Shared groups

B2C CRM uses all seven groups from `fields_reference.md`, with no changes to their fields or limits:

| Group | How B2C CRM fills it |
| --- | --- |
| Core | `name` is the feature name, such as "Customer 360". `isUSP` marks the features that most set NeuronCx apart |
| Card | `tagline`, a short line under the name. `summary`, one line on what changes for the team. `icon` from the shared icon library. `image`, an optional screenshot or illustration |
| Detail and SEO | `description` explains the feature in plain words. `whoItsFor` names the teams, such as front desk, call centre, admissions office or marketing |
| Own page | Standard sections: `heroHeading`, `heroSubheading`, `benefits` (3 to 6), `howItWorks` (3 to 5 steps), `useCases` (up to 4, one per vertical where possible), `cta`, `related` |
| FAQ | Up to 6. Questions a buyer would ask about this feature |
| WhatsApp | Used by the assistant's "what can NeuronCx do" menus |
| Knowledge base | Every live feature is included |

### Fields only B2C CRM has

| Field | Type | Placement | Notes |
| --- | --- | --- | --- |
| `status` | select: live, beta, planned. Required, default planned | sidebar | Only live and beta show publicly. Beta is labelled on the site |
| `area` | relationship to `crmAreas`, required | sidebar | Groups features on the hub page and in WhatsApp menus |
| `problemSolved` | select, hasMany: strangerFollowUp, silentDropOff, duplicateRecords | sidebar | Which of the three problems in section 1 it answers. Optional |
| `legacyGap` | text, 160 | Detail tab | One line on how a sales-pipeline CRM handles this. Never names a competitor |
| `screenshots` | array of `image` (upload) + `alt` (text, 160), max 3 | Page tab | Demo-tenant screenshots only |
| `integrations` | relationship to `integrations`, hasMany | Page tab | Systems this feature works with |
| `customers` | relationship to `customers`, hasMany | Page tab | "Used by". Follows the customers collection's `showName` rule |
| `episodicEngagements` | relationship, hasMany | Page tab | Added once the episodic engagements collection exists |

### Supporting collection: `crmAreas`

Like `integrationCategories`, an editable list so areas can be renamed or added without a deploy.

| Field | Type | Notes |
| --- | --- | --- |
| `name` | text, required, unique |  |
| `slug` | text, required, unique |  |
| `order` | number, default 100 | Sorts areas on the hub page and in menus |
| `intro` | text, 140 | One line shown above the area's features on the hub page |

Starting areas:

| Area | What it covers | Intro line |
| --- | --- | --- |
| Know every customer | Recognising the same person across channels, locations and visits | One record per person, however they reach you |
| Reach them | Campaigns, segments, consent and timing | The right message to the right people, with their consent |
| Run the work | Enquiries, bookings, carts, assignment and locations | Every enquiry and booking handled by the right person |
| Measure what happened | Sources, reports and dashboards | See what worked, from first message to completed visit |

Admin: both collections sit in a "B2C CRM" group in the sidebar. Drafts on for `crmFeatures`, no autosave.

## 4. What is visible, and when

All rows assume the entry is published. Drafts are never visible.

| Status | hasOwnPage | Card on the site | Own page | WhatsApp and knowledge base |
| --- | --- | --- | --- | --- |
| live | on | yes, links to the page | yes, in sitemap | yes |
| live | off | yes, no link | no, 404 | yes |
| beta | either | yes, labelled "Beta" | only if on | yes, described as in beta |
| planned | either | no | no | no |

Visitors and the public API must never receive planned entries. Enforce this in the collection's read access, not only in the website.

Turn `hasOwnPage` on only when the feature is live or in beta, the page sections are written, and there is at least one demo-tenant screenshot.

## 5. Writing rules

General:

- Plain, human language. No em dashes. No filler such as "seamless", "robust", "end-to-end", "360-degree synergy" or "next-generation".
- Say what changes for the customer's team, not what the software contains. "Your team sees the whole history before replying", not "unified data layer".
- Never call something AI-powered without saying what it does.
- Never describe a planned feature as available. If in doubt, set status to planned.

Voice across verticals:

- Write the entry so it works for any vertical: "customer" or "person", not "patient".
- Put vertical detail in `useCases`: patients for hospitals and diagnostics, students for universities, guests for hotels.

By field:

| Field | Rule | Example (Customer 360) |
| --- | --- | --- |
| `name` | The plain name people would use | Customer 360 |
| `tagline` | What it is in a few words, up to 45 characters | One record for every person |
| `summary` | What changes for the team, up to 120 characters | Every chat, call, booking and visit on one record, so no one asks a returning customer to start again. |
| `legacyGap` | How a pipeline CRM handles it | Sales CRMs create a new lead each time a past customer gets in touch. |
| `heroHeading` | The outcome, up to 70 characters | Know who you're talking to, every time |
| `benefits` | Outcomes, each with a short line | "No more starting again": returning customers are recognised on their first message. |
| `useCases` | One per vertical | Hospitals: the front desk sees past visits and upcoming appointments before replying. |

## 6. WhatsApp fields

| Field | Limit | Example (Customer 360) |
| --- | --- | --- |
| `waRowTitle` | 24 | Customer 360 |
| `waRowDescription` | 72, aim for 60 | One record for every customer, across every channel |
| `waHeader` | 60, aim for 30 | Customer 360 |
| `waBody` | 1024, aim for 300 | Every chat, call, booking and visit lands on one record, so your team knows who they're talking to before they reply. |
| `waKeyPoints` | 3 to 5 lines, 60 each | WhatsApp, calls and walk-ins on one record / Past bookings and visits in view / Works across all your locations |
| `waButtons` | up to 3, label 20 | See it in a demo / Other features |

With more than 10 features, the assistant first asks which area, then lists that area's features by `order`.

## 7. Knowledge base fields

| Field | Rule | Example (Customer 360) |
| --- | --- | --- |
| `kbAnswer` | What it is, who uses it, one example. Max 600 | "Customer 360 is the NeuronCx record that brings together everything about one customer: their WhatsApp chats, calls, bookings, carts and visits, across every location. Front desk and call centre teams use it to see a customer's history before replying, so a returning customer is never treated as a new lead." |
| `kbFacts` | One checkable fact per line | "WhatsApp chats and phone calls for the same person appear on one record." |
| `kbQuestions` | How a customer asks | "Can I see a customer's full history?" / "Does NeuronCx merge duplicate contacts?" |
| `kbSynonyms` | Other names | Patient 360, customer profile, single customer view |

Only live and beta features go into the knowledge base. Beta features must say so in `kbAnswer`.

## 8. Where entries appear

| Place | How features are picked |
| --- | --- |
| /crm-for-agentic-workflows (hub) | One section per area, each showing that area's live and beta features by `order` |
| Home page technical pillars | Hand-picked, usually `isUSP` features |
| Card Grid and Bento Grid blocks | A new "pull from B2C CRM" option: all, by area, by problem, or hand-picked. Same pattern as the Integrations block |
| /crm/[slug] | One page per feature with `hasOwnPage` on |
| Integration and customer pages | "Works with" and "Used by" lists, from the relationships |
| WhatsApp assistant | Area menu, then feature list, then the feature message |
| Knowledge base | Every live and beta feature |

Cards link to the feature page only when `hasOwnPage` is on.

### Hub page cards

Each card shows the `icon`, the `name` (with a "USP" tag when `isUSP` is on, and a "Beta" tag when status is beta), the `tagline` and the `summary`. Cards are grouped under each area's name and `intro` line, in area `order`, then feature `order`.

### Feature page layout (/crm/[slug])

Light theme only, matching the integration and customer pages. In this order:

1. **Hero** on the light wash: breadcrumb (B2C CRM › area › feature), an area pill, `heroHeading` as the H1, `heroSubheading`, and two buttons: the `cta` and "How it works". On the right, the first of `screenshots`.
2. **Contrast strip**, a white band split in two: "A sales-pipeline CRM" with `legacyGap`, and "NeuronCx" with the feature's answer, taken from the first line of `description`.
3. **Benefits**, from `benefits`, as a ruled row of 3 (or 2 rows when there are more).
4. **How it works**, from `howItWorks`, as numbered steps.
5. **Use cases**, from `useCases`, one card per vertical.
6. **Works with**, from `integrations`, as small chips linking to integration pages that have their own page.
7. **FAQ**, from `faqs`, with FAQPage structured data.
8. **Related features**, from `related`, or other live features in the same area.
9. **Closing panel**, the navy call to action. The only navy section on the page.

Any section with no content is left out.

## 9. SEO

Search volumes from Google Keyword Planner and the home page keyword workbook, India:

| Keyword | Monthly | Belongs to |
| --- | --- | --- |
| whatsapp crm, crm with whatsapp, crm for whatsapp | about 5,000 | The hub page |
| hospital crm, crm in hospital industry | about 5,000, low competition | A healthcare CRM page or article |
| AI native CRM | about 500 | The hub page and home page |
| healthcare CRM, education CRM | about 500 | Vertical pages |
| Customer 360 | NeuronCx already ranks around position 3 | The Customer 360 feature page |
| agentic CRM, B2C CRM, episodic CRM, multi-location CRM | not measured yet | Check before building pages around them |

Rules:

- The hub page targets "whatsapp crm". Feature pages target the feature plus its job, such as "customer 360 crm" or "whatsapp campaign segments". Check each in Keyword Planner before writing.
- Meta title up to 60 characters, ending in "| NeuronCx". Meta description up to 155.
- Feature pages link up to the hub and across to two or three related features.

## 10. Sources

- Home page drafts and keyword workbook: [23 Sept 26] Ncx Home Page sections extended, https://app.notion.com/p/3e4bb83239398087af06d2609071b015
- Problem framing: [24 Sept 26] Problem solution framing, linked from the page above
- Platform design work: the Segments, Audience and campaigns, Reporting and Care Episodes design records
- `fields_reference.md` for every shared field and limit
- The demo of the hub cards, the Customer 360 page and the WhatsApp flow, 13 Oct 2026

## 11. Candidate entries

My reading of the design notes. Every status needs confirming before entries go in.

| Feature | Area | What the notes show | Likely status | Problem it answers |
| --- | --- | --- | --- | --- |
| Customer 360 | Know every customer | Patient 360 product, one record across channels | live | duplicateRecords, strangerFollowUp |
| Enquiries and bookings | Run the work | Enquiries tracked through to a completed appointment | live | silentDropOff |
| Agent assignment | Run the work | Lead owners, agents linked to calls and transactions | live |  |
| Carts and orders | Run the work | Billable carts attached to transactions and orders | live |  |
| Multi-location (hub and spoke) | Run the work | Listed as a home page pillar | to confirm | duplicateRecords |
| Campaigns | Reach them | WhatsApp bulk campaigns, redesign planned | live |  |
| Segments | Reach them | Detailed design: audience, behavioural, real-time and catalogue segments | to confirm |  |
| Consent and opt-out | Reach them | Opt-in and opt-out handling described in home page copy | to confirm |  |
| Source tracking | Measure what happened | Campaign and ad source attached to incoming leads | live |  |
| Reports and dashboards | Measure what happened | Reporting module and analytics stack | live |  |
| Journeys, A/B testing, frequency capping, next best action | Reach them | Planned in the campaigns redesign | planned | silentDropOff |

Episodes themselves (such as the Maternity care episode) belong in the episodic engagements collection, not here.

## 12. What the CMS needs

Nothing below is built. In this order:

1. **Shared field groups** in `src/fields/`: core, card, detail, ownPage, faq, whatsapp and kbase, plus the plain-text check in `src/fields/validators/plainText.ts`, exactly as `fields_reference.md` defines them.
2. **`crmAreas` collection**, with the four starting areas.
3. **`crmFeatures` collection**, with the shared groups, the fields in section 3, the read access in section 4, and the "B2C CRM" admin group.
4. **"Pull from B2C CRM" option** on the Card Grid and Bento Grid blocks: all, by area, by problem, hand-picked, with a limit. Only live and beta entries for visitors.
5. **Knowledge base:** add `crmFeatures` to `src/rag/sources.ts` and the collections `with-rag.ts` watches.
6. **WhatsApp lists global** (`whatsappLists`), holding the menu button text and section title per collection, as planned in `fields_reference.md`.
7. **Website:** the `/crm/[slug]` route, built on the same light layout as the integration and customer pages, and card links that follow `hasOwnPage`.
8. **Sitemap:** feature pages included, as part of the site-wide sitemap fix.

Integrations and customers keep their current fields. Moving them onto the shared groups is a separate step.

## 13. Before publishing a feature

- [ ]  Status set honestly: live only if clients use it today
- [ ]  Area and, where it applies, the problem it answers
- [ ]  Summary within 120 characters and says what changes for the team
- [ ]  No vertical-only wording outside `useCases`
- [ ]  No em dashes or filler words
- [ ]  WhatsApp and knowledge base fields within their limits, plain text only
- [ ]  If `hasOwnPage` is on: hero, benefits, how it works, at least one demo-tenant screenshot, FAQs and SEO fields filled
- [ ]  Saved as a draft first, checked, then published

## 14. Open items

1. **Slug:** this file uses `crmFeatures`, matching the repo's camelCase. `fields_reference.md` still says `crm-features`. Update one to match the other.
2. **Feature list and statuses:** section 11 is a reading of design notes, not a confirmed list.
3. **Hub page:** keep /crm-for-agentic-workflows, or create a shorter /crm page and redirect.
4. **Problem field:** confirm the three problems as fixed options, or make them an editable collection like `crmAreas`.
