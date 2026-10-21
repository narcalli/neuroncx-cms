---
collection: integrations
payload_slug: integrations
config_file: src/collections/Integrations.ts
own_page_route: /integrations/[slug] (website src/app/(frontend)/integrations/[slug]/page.tsx)
shared_groups: see fields_reference.md
schema_checked: 14 Oct 2026, after the integrations restructure (main 817d27e) and the audit fixes
---

# Integrations

Read this file before adding or editing an integration, writing its page or guide, choosing which integrations a block shows, or changing the collection's fields. Read `fields_reference.md` alongside it for the shared field groups.

## 1. What this collection is

One entry is one outside system that NeuronCx connects to, such as DocPulse, Exotel or Razorpay. Each entry is written once and shown wherever integrations appear.

People who read it:

- Buyers checking "do you work with the system we already use?"
- Hospital and clinic IT teams checking what data moves, and how.
- Sales, who send the integration page during a deal.
- The WhatsApp assistant and the knowledge base, once the WhatsApp and knowledge base groups are added.

It links to: case studies (`caseStudies`), and on the taxonomies branch, three supporting collections: `integrationCategories`, `connectionTypes` and `products`.

## 2. Field schema as it stands

Checked 14 Oct 2026, after the integrations restructure. The section is four collections in the admin group "Integrations". Restructure plan and follow-up steps: `MIGRATION_PLAN.md` in the repo root.

### Integration items (`integrations`)

Settings: `useAsTitle: name`, list columns name, category, status, featured, `defaultSort: order`, drafts on (no autosave). Create, update and delete need a login. Visitors read only entries that are published and Live (`liveOrAuthenticated`).

| Where | Fields |
|---|---|
| Main column | `name` (required, unique, 60) |
| Sidebar | `status` (live, pilot, planned; default live), `category` (required), `connection`, `products`, `featured`, `order`, `slug` (60, unique, checked against master slugs), `hasOwnPage`, SEO check panel |
| Card tab | `logo`, `tagline` (60, aim 45), `summary` (120), `glance` (3 to 4: `title` 40, `line` 60) |
| SEO tab | `primaryKeyword` (60), `secondaryKeywords` (up to 5, `keyword` 60), `meta.title` (60), `meta.description` (155), `meta.image` |
| Page tab, shown with Own page on | `heroHeading` (70), `heroSubheading` (200), `cta` (`label` 30, `link`), `showClosing` (checkbox, default on; off hides the closing panel), `related` (up to 3), `headingOverrides` (`statusTable`, `edgeCases`, `setup`, `related`, 70 each) |
| What moves tab | `statusFlow` (`event` 40, `inPartner` 40, `whatHappens` 120) |
| Edge cases tab | `edgeCases` (`situation` 80, `whatWeDo` 160) |
| Setup tab | `setupChecklist` (`item` 80, `providedBy`: you, neuroncx, partner) |
| Example tab | `chatExample` (up to 8: `sender`, `time` 10, `text` 300 plain, `label` 40) |
| FAQ tab | `faqs` (up to 6: `question` 120, `answer` 600 plain) |
| WhatsApp tab | preview panel, `waRowTitle` 24, `waRowDescription` 70, `waHeaderType`, `waHeader` 60, `waBody` 1024, "Fill from status flow", `waKeyPoints` (3 to 5, `line` 60), `waFooter` 60, `waButtons` (up to 3: `label` 20, `action`: bookDemo, otherSystems, talkToSales, openPage), `waLinkLabel` 20, `waLink` (read only) |
| Knowledge base tab | `includeInKbase`, `kbAnswer` 600, `kbFacts` (`fact` 160), `kbQuestions` (`question` 120), `kbSynonyms` (`synonym` 40), `kbLastReviewed` |

Publishing with Own page on needs `slug`, `heroHeading`, `meta.title` and `meta.description`. On save, when empty: `meta.title` becomes "<primaryKeyword or name> with NeuronCx | NeuronCx", `meta.description` the summary, `waRowTitle` the name and `waRowDescription` a summary of 70 or under (both only when plain text). `waLink` is always set from the slug. The setup checklist is filled from the connection type's default once per connection type.

### Integration categories (`integrationCategories`) and connection types (`connectionTypes`)

Both: `name` (60), `slug` (60), `order`, drafts on, visitors read published entries.

- Categories add `hubHeading` (60), `description` (the hub intro, 140), `icon`, `waRowTitle` (24), `waRowDescriptionAuto` and `waRowDescription` (70). With the automatic switch on, the row description lists the category's live, published integrations, refreshed when one is published, changed, unpublished or deleted.
- Connection types add `badgeLabel` (20), `description` (200), `timing` (asItHappens, scheduled, onUpload), `typicalSetup` (120), `defaultChecklist`, `waLine` (60), `kbAnswer` (600).

### Integrations master (`integrationsMaster`)

Landing pages and the wording shared by item pages. One record has `isMain` on, and item pages read their headings from it. Visitors read published records.

Sidebar: `name`, `slug` (checked against item slugs), `isMain`, `filter` (`categories`, `products`), SEO check panel. Tabs: SEO (as on items), Hero (`eyebrow` 40, `h1` 70 required, `subheading` 200, `heroSystems` up to 7, `hero.secondaryCta`, `hero.image`), Sections (`fiveThingsHeading` 70, `fiveThings`, `whenFeedsGoWrongHeading` 70, `whenFeedsGoWrong`, `apiCard` with `buttonLabel` 30), Item page labels (`labels.statusTable`, `edgeCases`, `setup`, `related`, 70 each, `{name}` only), FAQ (`faqHeading` 70, then `faqs`), Closing (`closing.heading` 70, `closing.subheading` 200, `cta`), WhatsApp (`waIntro` 1024, `waListButton` 20, `waSectionTitle` 24, `waFallback` 300), Knowledge base.

## 3. Target design, using the shared groups

The WhatsApp, FAQ and knowledge base groups are built (`src/fields/`) and used above. Core, card and detail are not built as shared groups yet, so integrations keeps its own name, slug, logo and summary until the Phase 2 steps in `MIGRATION_PLAN.md`. The target, once they are:

| Group | Use | How integrations fills it |
|---|---|---|
| Core | yes | `name`, `slug`, `featured`, `order` move here. `slug` becomes required. `isUSP` is rarely used |
| Card | yes | `logo` becomes `image`. `summary` moves here, hard cap 140, working limit 120. `icon` defaults to `plug` |
| Detail and SEO | yes | `description` is the plain explanation. `whoItsFor` names the teams, such as front desk, call centre or admissions. SEO fields are new for this collection |
| Own page | yes, Guide variant | Keeps `hasOwnPage`, `heroHeading`, `heroSubheading`, `cta`, `related`. Replaces `benefits`, `howItWorks` and `useCases` with the Guide tab below |
| FAQ | yes | Up to 6. Feeds the page FAQ, Google's FAQ markup and the knowledge base |
| WhatsApp | yes | There are more than 10 integrations, so menus split by category |
| Knowledge base | yes | So the assistant can answer "do you integrate with X?" |

Fields only integrations has, on top of the groups:

| Field | Type | Placement | Notes |
|---|---|---|---|
| `status` | select: live, pilot, planned | sidebar | Exists |
| `category` | relationship to `integrationCategories` | sidebar | Exists, required |
| `connection` | relationship to `connectionTypes` | sidebar | Exists |
| `products` | relationship to `products`, hasMany | sidebar | Exists |
| `glance` | array of `title` (40) + `line` (60), 3 to 4 | Card tab | The strip under the page hero |
| `guideTitle` | text, 90 | Guide tab | The article heading |
| `author` | relationship to users | Guide tab | Byline |
| `lastReviewed` | date | Guide tab | Set by hand, so small fixes don't change "Updated" |
| `guide` | rich text | Guide tab | Its H3 headings build the page's contents list |
| `readTime` | number, read-only | Guide tab | Set on save from the word count at 200 words a minute |
| `relatedIntegrations` | relationship to integrations, hasMany, max 3 | Related tab | If empty, the page shows other live entries in the same category |
| `caseStudies` | relationship to `caseStudies`, hasMany | Related tab | Only once the client has cleared it |

Rich text blocks the guide needs (none exist yet; Posts only has banner, code and mediaBlock): `chatExample`, `statusTable`, `callout`, `checklist`, `imageWithCaption`. Register them so Posts can use them too.

## 4. What is visible, and when

| Status | hasOwnPage | Card on the site | Own page | In sitemap | WhatsApp and knowledge base |
|---|---|---|---|---|---|
| live | off | yes, no link | no, 404 | no | yes |
| live | on | yes, links to the page | yes | yes | yes, `waLink` points to the page |
| pilot | either | no | no | no | no |
| planned | either | no | no | no | no |

All of this also needs the entry to be published. Drafts are never visible to visitors.

Turn `hasOwnPage` on only when all of these are true:

- A client runs the integration today.
- The guide is written and checked against the engineering notes.
- The partner's name is cleared for public use.

## 5. Writing rules

General:

- Plain, human language. No em dashes. No filler such as "seamless", "leverage", "robust" or "end-to-end".
- Write what changes for the customer, not what the software contains.
- Every fact must trace to the engineering notes in section 10. Never invent a client name, figure or outcome. Write [PENDING] and flag it.
- Never paste API keys, tokens, passwords or client credentials into any field, even as an example.
- Spell names the way the partner does: WhatsApp, DocPulse, LeadSquared, Eka Care, Tata Smartflo, Razorpay, Practo, Exotel, Knowlarity, Asttecs.

By field:

| Field | Rule | Example |
|---|---|---|
| `summary` | One line on what moves between the two systems | "Patients book, cancel and reschedule DocPulse appointments on WhatsApp, and every status change updates the record." |
| `heroHeading` | An action, the partner name and the result | "Book DocPulse appointments on WhatsApp" |
| `heroSubheading` | Who does what, and what lands where, in two sentences | "Patients pick a doctor and slot in a WhatsApp chat, and the booking lands straight in DocPulse." |
| `glance` | Short claims a skimmer can check | "Every status tracked" / "No-shows and visits included" |
| `guide` | The problem in the customer's world, how it works step by step, what happens after, a table of what moves and when, a setup checklist | See the DocPulse preview |
| `faqs` | Questions phrased the way a buyer would search | "Can patients book DocPulse appointments on WhatsApp?" |

## 6. WhatsApp fields

| Field | Limit | Example (DocPulse) |
|---|---|---|
| `waRowTitle` | 24 | DocPulse |
| `waRowDescription` | 70, aim for 60 | Book doctor appointments on WhatsApp |
| `waHeader` | 60, aim for 30 | DocPulse integration |
| `waBody` | 1024, aim for 300 | Patients book, cancel and reschedule DocPulse appointments in this chat, and every change updates the hospital's records. |
| `waKeyPoints` | 3 to 5 lines, 60 each | Live slots from DocPulse / Cancel or reschedule by reply / No-shows recorded |
| `waButtons` | up to 3, label 20 | Book a demo / Other integrations |

A WhatsApp list holds at most 10 rows. With more than 10 integrations, the assistant first asks for the category, then lists that category's entries by `order`.

## 7. Knowledge base fields

| Field | Rule | Example (DocPulse) |
|---|---|---|
| `kbAnswer` | Starts with a yes, then what moves and who uses it. Max 600 | "Yes. NeuronCx connects to DocPulse so patients can book, cancel and reschedule hospital appointments on WhatsApp. Slots come live from DocPulse, the booking is written straight into it, and status changes such as no-show or completed update the patient's record." |
| `kbFacts` | One checkable fact per line, 160 each | "Bookings are created in DocPulse as soon as the patient confirms." |
| `kbQuestions` | How a customer asks | "Do you integrate with DocPulse?" / "Can patients book on WhatsApp if we use DocPulse?" |
| `kbSynonyms` | Other names, 40 each | Docpulse, DocPulse HIS. For LeadSquared: LSQ |

Integrations are not watched by the RAG pipeline yet. `with-rag.ts` is applied to Pages and Posts only, and `src/rag/sources.ts` lists those two.

## 8. Where entries appear

| Place | How entries are picked |
|---|---|
| Integrations block | `populateBy`: manual (typed list, being retired), all, filter (category, products), selection. Limit 1 to 24 |
| Integrations Marquee block | Same modes. Limit 4 to 40. Renders nothing if fewer than 4 entries match |
| Partner Strip block | Same modes for its platforms list, limit 1 to 8. Its standards badges stay typed on the block |
| /integrations page | One Integrations block per category, each set to filter |
| /integrations/[slug] | Only entries in section 4's "own page" row; any other slug is a 404. Sections: hero with At a glance, What moves, Example, Edge cases, Setup, FAQ (with FAQ markup), Related, closing. Headings: the entry's Section headings, else the main master record's Item page labels |
| WhatsApp menus | Once the WhatsApp group is added |
| Knowledge base | Once the knowledge base group is added and the collection is watched |

In collection modes, visitors only ever see published, live entries, sorted by `order` then `name`. The picking logic lives in the website's `src/utilities/integrations.ts`.

Cards in the Integrations block link to an entry's own page when it has one. Other places that show integrations (the marquee, the partner strip, customer pages) don't link yet, and the site's link component still only understands pages and posts.

## 9. SEO

Search volumes from Google Keyword Planner, India, September 2025 to August 2026, checked 12 Oct 2026:

| Keyword | Monthly | Belongs to |
|---|---|---|
| whatsapp crm integration, integrate whatsapp with crm, crm integration with whatsapp, whatsapp integrated crm | about 500 each | /integrations |
| eka care emr | about 500, low competition | Eka Care page |
| leadsquared whatsapp integration, leadsquared converse | about 50 each | LeadSquared page |
| zoho crm whatsapp integration | about 500, low competition | A Zoho page, only if a client runs it |
| whatsapp crm, crm with whatsapp | about 5,000 | The CRM page, not integrations |
| hospital crm | about 5,000, low competition | A healthcare CRM page or article |
| DocPulse, Practo, Razorpay and Akhil Miracle terms | no measurable volume | Partner pages still help buyers searching by name and give sales a link |

Rules:

- Each integration page targets its partner name plus the job, such as "DocPulse WhatsApp appointment booking".
- Meta title up to 60 characters and ending in "| NeuronCx". Meta description up to 155.
- Partner pages link up to /integrations and across to related integrations.

## 10. Sources

Facts come from the engineering notes in Notion:

- [Master] ALL TPS, TPIM: https://app.notion.com/p/80dd10ab6e1d439c9ce99fb2f31715b1
- All TPS Vendor Webhooks notes: https://app.notion.com/p/14ebb832393980aca2a0f618ad8c9034
- DocPulse notes master: https://app.notion.com/p/2d896c7a51914e6887fa0af81afb795b
- LeadSquared master: https://app.notion.com/p/5f4ff8a320404ed0a494a20e571ae00c
- Razorpay master: https://app.notion.com/p/396bb832393980fd8b54e707cf79ef57
- Practo: https://app.notion.com/p/0211196e44cf4b979ccdcd7ca9f45f0a
- Eka Care APIs: https://app.notion.com/p/213bb8323939806ebabfe56f36736a36
- Akhil Miracle HMS: https://app.notion.com/p/384bb832393980388481fad151aa9898
- Exotel: https://app.notion.com/p/04d30f65db6b4a20a9161e64338f7653
- Knowlarity: https://app.notion.com/p/21dbb8323939805b9f54c24734a19595
- Tata Smartflo and Knowlarity agent linking: https://app.notion.com/p/2b7bb832393980859017c9c3caaa5acb
- Asttecs: https://app.notion.com/p/1a7bb83239398086a9d4c40404015fd1

Several of these pages contain live credentials. Read them for facts only.

## 11. Entries

Snapshot of the local copy pulled from production on 12 Oct 2026. The CMS is the source of truth.

| Name | Status | Published | Suggested hasOwnPage | Note |
|---|---|---|---|---|
| DocPulse | live | yes | on | Guide drafted |
| LeadSquared | live | yes | on | Replaces the old LeadSquared page, needs a redirect |
| Eka Care | live | yes | on | Rename from "EkaCare". Targets "eka care emr" |
| Exotel | live | yes | off for now | |
| Knowlarity | live | yes | off for now | |
| Tata Smartflo | live | yes | off for now | |
| Asttecs | live | yes | off for now | |
| Razorpay | live | yes | off for now | Confirm a client collects payments through it |
| Practo | live | yes | off for now | Category should be Booking and operations |
| Akhil Miracle HMS | pilot | yes | off | Import scope still in progress |

Not yet entered: WhatsApp Business Platform, Medics, Zenoti. Zoho CRM, HubSpot and Salesforce stay out until confirmed.

## 12. Still to build

In this order:

1. **Deploy the taxonomies branch**, then add "Booking and operations" as a category entry.
2. **Commit `scripts/block-reference.ts`** (only in one local copy today) and extend it, or add a sibling script, to generate section 2 of every collection file.
3. **Build the shared groups** in `src/fields/` from `fields_reference.md`, then move integrations onto them. `slug` becomes required, so fill slugs for existing entries first. `logo` moves to `image`.
4. **Add the SEO plugin fields** to integrations.
5. **Build the Guide tab, the rich text blocks and the Related tab.**
6. ~~Build `/integrations/[slug]`~~ (built 14 Oct 2026, with Integrations block links). Still to do: integration links in the link component, the marquee, the partner strip and customer pages, and in the sitemap.
7. **Fix the sitemap** so it includes pages, posts, case studies and integration pages (see note below).
8. **Add redirects** from the old LeadSquared and DocPulse URLs once their new pages exist.
9. **Add the WhatsApp and knowledge base groups**, and add integrations to `src/rag/sources.ts`.

Note on the sitemap: the live site currently has no working sitemap. `next-sitemap` points to /pages-sitemap.xml and /posts-sitemap.xml, which return 404, and `NEXT_PUBLIC_SERVER_URL` isn't set at build time, so robots.txt and sitemap.xml point to example.com. This affects the whole site, not just integrations.

## 13. Before publishing an entry

- [ ] Name spelled the way the partner spells it
- [ ] Category, connection and products set
- [ ] Summary within 120 characters and describes what moves
- [ ] Every claim checked against the Notion notes
- [ ] No client named without clearance, no credentials anywhere
- [ ] Status set honestly: live only if a client runs it today
- [ ] If `hasOwnPage` is on: slug, hero fields, guide, FAQs and SEO fields filled
- [ ] Saved as a draft first, checked in preview, then published
