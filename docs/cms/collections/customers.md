# Customers.md

---

## collection: customers
payload_slug: customers (today caseStudies, rename agreed, see section 12)
config_file: src/collections/CaseStudies/index.ts (to become src/collections/Customers/index.ts)
own_page_route: /customers/[slug] (exists)
shared_groups: see fields_reference.md
schema_checked: 13 Oct 2026, CMS main 7213565, website main 73d647e

# Customers

Read this file before adding or editing a customer, writing a customer story, naming a client anywhere on the site, choosing which customers a block shows, or changing the collection's fields. Read `fields_reference.md` alongside it for the shared field groups.

## 1. What this collection is

One entry is one organisation that uses NeuronCx, such as a hospital chain, a diagnostic chain or a university. A customer with several products gets one entry, with a section per product on its page.

People who read it:

- Buyers looking for proof from an organisation like theirs.
- Sales, who send a relevant customer page during a deal.
- Integration and product pages, which show "used by" lists drawn from here.
- The knowledge base, only for customers whose name is shown.

It links to `sectors`, `products` and `integrations`.

Naming a client is a matter of permission, not style. Every rule in this file follows from that.

## 2. Field schema as it stands

<!-- Checked by hand on 13 Oct 2026. Replace with a generated table once a collection reference script exists. -->

Collection slug `caseStudies`. `useAsTitle: title`. List columns title, clientName, featured, updatedAt. No default sort, no admin group. Drafts with autosave every 100 ms and scheduled publishing. Create, update and delete need a login. Visitors can read any published entry. No hooks. No tabs: every field sits in the main column.

| Field | Type | Required | Limits | Notes |
| --- | --- | --- | --- | --- |
| `title` | text | yes | max 120 |  |
| `slug` | text | yes | unique | "Used in the address, e.g. ovum for /customers/ovum." Format not validated |
| `clientName` | text | yes | max 120 |  |
| `clientPending` | checkbox | no | default false | "Client name still to confirm". Hidden by the website only, see warning below |
| `logo` | upload | no | media | Not rendered on the customer page today |
| `sectors` | relationship, hasMany | no | `sectors` |  |
| `summary` | textarea | yes | max 240 | "One line shown on the card." |
| `outcomeHeadline` | text | no | max 100 | "No invented figures. Falls back to the title if empty." |
| `metrics` | array, max 4 | no | `value` (20), `label` (80) | "Only real, confirmed figures." |
| `body` | rich text | no | default editor | "Full story" |
| `featured` | checkbox | no | default false |  |

`sectors` has only `name` (text, required) and `slug` (text, required, unique). No order field. Anyone can read it.

Production data on 13 Oct 2026: 0 case studies, 0 saved versions, 0 sectors.

**Warning:** `clientPending` is enforced only in the website's queries (`utilities/caseStudies.ts`), not in the CMS access rule. The public API at /api/caseStudies would return a published entry whose name is still pending. Nothing is exposed today because the collection is empty. Fix this before the first entry goes in (section 12).

## 3. Target design, using the shared groups

The shared groups in `fields_reference.md` are not built yet. When they are, customers uses them like this:

| Group | Use | How customers fills it |
| --- | --- | --- |
| Core | yes | `name` is the client's name (today `clientName`). `slug`, `featured`, `order` as standard |
| Card | yes | `image` holds the logo. `summary` drops from 240 to the shared 140 cap (120 working) |
| Detail and SEO | yes | `description` is a plain paragraph about the organisation. `whoItsFor` is not used |
| Own page | yes, Story variant | Keeps `hasOwnPage`, `heroHeading` (today `outcomeHeadline`), `heroSubheading`, `cta`, `related`. Replaces benefits, how it works and use cases with the Story tab |
| FAQ | optional | Rarely needed on a customer page |
| WhatsApp | no | Client stories are not sent in chat |
| Knowledge base | yes, restricted | Only for customers with `showName` on |

Fields only customers has:

| Field | Type | Placement | Notes |
| --- | --- | --- | --- |
| `status` | select: active, pilot, past | sidebar | Past customers appear only if they have agreed |
| `sectors` | relationship to `sectors`, hasMany | sidebar | Exists |
| `city` | text, 60 | Profile tab | Region or city, such as Bengaluru |
| `locations` | number | Profile tab | Number of sites. Hidden when `showName` is off |
| `since` | date | Profile tab | When they started with NeuronCx |
| `products` | relationship to `products`, hasMany | Profile tab | What they use |
| `integrations` | relationship to `integrations`, hasMany | Profile tab | Lets each integration page show "used by" |
| `showName` | checkbox, default false | sidebar | "Show real name". Replaces `clientPending`. See section 4 |
| `anonymisedName` | text, 80 | Card tab | Required. Shown wherever `showName` is off |
| `challenge` | rich text | Story tab | What was hard for them before |
| `approach` | rich text | Story tab | What was set up, in their terms |
| `results` | array of `metric` (80), `value` (20), `baseline` (40), `period` (40), `source` (120), max 4 | Story tab | Replaces `metrics`. Enter only figures the client has confirmed |
| `storySections` | array of `product` (relationship), `heading` (90), `body` (rich text) | Story tab | One section per product for customers with several |
| `quotes` | array of `quote` (400), `person` (80), `role` (100) | Story tab | Enter only quotes the client has approved |

The current `title` field is dropped: with one entry per customer, the page heading comes from `heroHeading` and the admin title from `name`.

## 4. Showing the real name

One switch decides how a customer appears: `showName` ("Show real name"), off by default.

| showName | What visitors see |
| --- | --- |
| off | `anonymisedName` only. No logo, no page, no link, no quotes or story details |
| on | The real name, the logo, and the page if `hasOwnPage` is on |

Turn `showName` on only when the client has agreed to be named. Quotes and figures are entered only once the client has approved them, so there is no separate switch for those.

The switch must be enforced by the CMS, not only by the website. When `showName` is off, visitors and the public API must never receive the real name, slug, logo or story fields. Use an `afterRead` hook that swaps in `anonymisedName` for anyone not logged in.

Rules for `anonymisedName`:

- Describe the type and scale, not the identity: "A multi-specialty hospital chain in South India".
- Don't combine details that identify the client, such as a specific city, an exact number of centres and a speciality together.
- Never use a client's brand colours, logo shapes or product names alongside it.

## 5. What is visible, and when

All rows assume the entry is published. Drafts are never visible.

| showName | hasOwnPage | Logo walls | Directories and case cards | Own page | Knowledge base |
| --- | --- | --- | --- | --- | --- |
| on | on | yes | named, links to the page | yes, in sitemap | yes |
| on | off | yes | named, no link | no, 404 | yes |
| off | either | no | anonymised, no link | no, 404 | no |

Turn `hasOwnPage` on only when `showName` is on, the story is written, and the client has seen the final text.

## 6. Writing rules

General:

- Plain, human language. No em dashes. No filler.
- Write from the client's side: what was hard for them and what changed for their staff and patients.
- Never invent a figure, a quote, a client name or an outcome. Write [PENDING] and flag it.

Figures:

- Every result needs a baseline, a period and a source, such as "Missed calls fell from 18% to 7% over three months, from the client's telephony reports".
- Never round up, estimate, or combine figures from different clients.
- Enter a figure only after the client has confirmed it.

Privacy:

- No patient names, phone numbers, recordings, chats or screenshots from a client's tenant. Use demo-tenant screenshots only.
- No staff member named without their consent.
- Advisory and contract work stays private unless the client says otherwise. The Ovum IT roadmap, for example, is not story material.

## 7. Where entries appear

| Place | How customers are picked | Today |
| --- | --- | --- |
| Case Study Grid block | Latest (newest first, optional sector filter, max 6) or hand-picked | On no published page |
| Customer Directory block | All, optional sector filter, sorted by name | On no published page |
| Testimonial block | Each quote links to a story via `linkedStory` | On no published page. Quotes are typed on the block; they should come from `quotes` here |
| Logo Wall block | Typed names on the block | /test-page-2 names Ovum, Aarthi Scans and Labs, Apollo AyurVAID and Smilestation. Should pull from here |
| Case Cards block (`agenticCases`) | Typed cases with their own `clientPending` | /crm-for-agentic-workflows: 3 anonymised cases |
| /customers/[slug] | One page per customer, per section 5 | Renders sectors, name, heading, summary, metrics, body and a fixed demo button. Doesn't render the logo |
| /customers | A normal CMS page with only a Conversation Hero | Should hold a Customer Directory |
| Integration and product pages | "Used by", from `integrations` and `products` here | Not built |

Client names also appear in free-text fields outside this collection, such as the conversation label "WhatsApp · Ayurvaid Hospitals · 11:42" in the /omnichannel-cx hero. Those count as naming a client too, and need the client's agreement just the same.

## 8. SEO

Customer pages earn trust more than traffic. Keywords to check in Keyword Planner before writing:

- hospital whatsapp chatbot case study
- diagnostic centre whatsapp automation
- call centre quality monitoring case study
- admissions chatbot case study

Rules:

- Meta title up to 60 characters, built as outcome plus client type, such as "How a hospital chain cut missed calls | NeuronCx". Use the client's name only if `showName` is on.
- Each customer page links to the integrations and products it uses, and back to /customers.

## 9. Sources

- Permission to name a client: client agreements and approval emails, kept outside the CMS.
- What each customer runs: the engineering notes in Notion, such as the DocPulse, Practo, Akhil Miracle, Knowlarity, Tata Smartflo and LeadSquared pages.
- Story material: the Ovum advisory work, the Aarthi Scans and Labs WhatsApp bot work and the DSU admissions bot work.

## 10. Customers

What the notes show each customer runs. The CMS is the source of truth once entries exist.

| Customer | Sector | What the notes show they use | showName |
| --- | --- | --- | --- |
| Ovum Hospitals | Hospitals | WhatsApp assistant, DocPulse, Practo, Akhil Miracle HMS, call centre audit, patient portal | [PENDING] |
| Aarthi Scans and Labs | Diagnostics | WhatsApp assistant, Tata Smartflo telephony | [PENDING] |
| Apollo AyurVAID | Ayurveda hospitals | [PENDING] | [PENDING] |
| Smilestation | Dental | [PENDING] | [PENDING] |
| Berkowitz | Skin and hair | [PENDING] | [PENDING] |
| Dayananda Sagar University | Higher education | Admissions assistant, LeadSquared | [PENDING] |
| Garden City University | Higher education | LeadSquared course workflow | [PENDING] |
| Cinnamon Hotels | Hospitality | Call quality assessment only | [PENDING] |

Names in the engineering notes whose status is unknown: Bodycraft (Knowlarity), Healthland (Eka Care), Glentree Academy (Razorpay), Shishuka, Solace and Hope Trust (DocPulse). Confirm whether each is a current customer before adding them.

Suggested sectors to create: Hospitals, Diagnostics, Dental, Skin and hair, Ayurveda, Higher education, Hospitality.

## 11. Before publishing a customer

- [ ]  `showName` on only if the client has agreed to be named
- [ ]  `anonymisedName` written and not identifying
- [ ]  Every quote approved by the client before it is entered
- [ ]  Every figure confirmed by the client, with a baseline, period and source
- [ ]  No patient data, client-tenant screenshots or unconsented staff names
- [ ]  Products and integrations linked
- [ ]  If `hasOwnPage` is on: the client has seen the final text
- [ ]  Saved as a draft first, checked, then published

## 12. Still to build

In this order:

1. **Rename `caseStudies` to `customers` now**, while the collection is empty. It touches 4 CMS files (the collection, the Case Study Grid and Testimonial block configs, and the generated types) and 5 website files (the customer page, the three block components and `utilities/caseStudies.ts`), plus the copied types. Links already use /customers, so they don't change. The admin and API paths become /admin/collections/customers and /api/customers.
2. **Move name hiding into the CMS.** Replace `clientPending` with `showName` and `anonymisedName`, and enforce it with an `afterRead` hook, so the public API never returns a real name when `showName` is off.
3. **Add `order` to `sectors`** and create the sector entries.
4. **Add the profile and story fields**, with relationships to `products` and `integrations`.
5. **Move onto the shared groups** once they're built, and add the SEO plugin fields.
6. **Render the logo** on the customer page, and put a Customer Directory on /customers.
7. **Point Logo Wall and Testimonial at this collection**, so names and quotes are entered once and follow `showName`.
8. **Add customer pages to the sitemap**, as part of the site-wide sitemap fix.
9. **Add the knowledge base group**, limited to customers with `showName` on, and add the collection to `src/rag/sources.ts`.
