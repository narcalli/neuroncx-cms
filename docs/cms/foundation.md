---
title: Content collections foundation
repo: neuroncx-cms (Payload), neuroncx-website (Next.js)
applies_to: every content collection that feeds the website, WhatsApp or the knowledge base
builds_on: fields_reference.md (shared field groups), collections/*.md (per-collection briefs)
status: design only, 23 Oct 2026. Nothing in this file is built yet
---

# Content collections foundation

Read this file before creating a new content collection, changing how collections are built, adding a page section, or changing how the website, WhatsApp or the knowledge base read collection content. Read `fields_reference.md` alongside it for the shared field groups.

## 1. Why this exists

The site is moving from pages typed in the CMS to pages built from collections: integrations, B2C CRM, the bot swarm, and more to come (omnichannel CX, call quality assessments, episodic engagements, customers, category definitions). Each one so far has been designed and built on its own, with its own master record, its own "pull from X" block option, its own route and its own knowledge base wiring.

This foundation makes every content collection come from the same kit, so that:

- **A new collection is one short config file and one brief**, not a fresh build.
- **Every collection behaves the same** for editors (same tabs, same order, same publish rules), for visitors (same visibility rules, same page layout system) and for the bot (same knowledge base and WhatsApp shape).
- **Each collection can still be customised**: its own fields, its own groupings, its own page sections, its own route.
- **A fix happens once.** A change to a shared field, section or rule reaches every collection.

## 2. The five layers

| Layer | What it is | State on 23 Oct 2026 |
| --- | --- | --- |
| **1. Field groups** | Core, Card, Detail, Own page, FAQ, WhatsApp, Knowledge base, plus `status`, `seo`, `cardDesign` | Built on `feat/shared-field-groups`, not on main |
| **2. Collection factory** | `defineContentCollection()`, one function that turns a short config into a full Payload collection | New |
| **3. Section registry** | Every page section as a block that knows which fields it reads, used in a drag-and-reorder `layout` field | New |
| **4. Hubs and groupings** | One `hubs` collection for hub pages, and groupings (areas, families, categories) as types in `Lists` | `Lists` built, `hubs` new |
| **5. Delivery** | Website routes and cards, knowledge base sync, WhatsApp endpoint, sitemap, revalidation, all read from one registry | Built for integrations only |

```
                    ┌──────────────── registry ────────────────┐
fields_reference ─► defineContentCollection() ─► crmFeatures, microApps, …
section registry ─► layout field ─────────────┘        │
Lists (groupings) ─────────────────────────────────────┤
hubs (one record per collection) ──────────────────────┤
                                                       ▼
                 website routes · collection cards block · sitemap
                 knowledge base serializer · WhatsApp endpoint
```

## 3. Layer 1: field groups

Defined in `fields_reference.md` and built in `src/fields/`. Nothing changes here, except one addition:

| Group | File | New? |
| --- | --- | --- |
| Core, Card, Detail, Own page, FAQ, WhatsApp, Knowledge base | `core.ts` … `kbase.ts` | No |
| Status, public read access, SEO tab, card design | `status.ts`, `access/publicLiveOrPilot.ts`, `seo.ts`, `cardDesign.ts` | No |
| **Layout** | `layout.ts` | Yes. The drag-and-reorder sections field, section 5 below |

Rules that stay as they are:

- Shared field names and limits are fixed. They change in the group file and in `fields_reference.md` only, never in one collection.
- Plain text where the channel needs it (WhatsApp and knowledge base fields), checked by `validators/plainText.ts`.
- No em dashes anywhere.

## 4. Layer 2: the collection factory

### 4.1 What a collection file looks like

`src/collections/CrmFeatures/index.ts`, in full:

```tsx
export const CrmFeatures = defineContentCollection({
  slug: 'crmFeatures',
  label: 'B2C CRM',
  adminGroup: 'B2C CRM',
  route: '/crm',
  groupBy: { listType: 'crmArea', field: 'area', required: true },
  groups: ['core', 'card', 'detail', 'ownPage', 'faq', 'whatsapp', 'kbase'],
  fields: {
    sidebar: [problemSolved],
    detail: [legacyGap],
    page: [screenshots, rel('integrations'), rel('customers')],
  },
  sections: ['contrastStrip', 'benefits', 'howItWorks', 'useCases', 'integrations', 'faq', 'related'],
  cardDesigns: ['grid', 'feature', 'story'],
  kb: { resolve: ['area', 'integrations'] },
})
```

### 4.2 Config options

| Option | Required | What it does |
| --- | --- | --- |
| `slug` | yes | Payload slug, camelCase. Also the registry key |
| `label` | yes | Admin label, singular and plural derived |
| `adminGroup` | no | Sidebar group in the admin. Defaults to `label` |
| `route` | no | Route base for entry pages, such as `/crm`. No route means entries are cards only and `ownPage` is not allowed |
| `groupBy` | no | The grouping: which `Lists` type, the field name, whether it is required |
| `groups` | yes | Which shared field groups to include. `core` and `card` are always included |
| `fields` | no | Extra fields per placement: `sidebar`, `card`, `detail`, `page`, `faq`, `whatsapp`, `kbase` |
| `sections` | no | Which sections from the registry editors may add to the `layout` field. Site blocks allowed on every collection are added automatically (section 5.3) |
| `cardDesigns` | no | Which card designs entries may pick. Defaults to all |
| `kb` | no | Knowledge base options: `resolve` (relationships to send as names), `exclude` (fields to leave out) |
| `whatsapp` | no | WhatsApp options: menu order source, extra button actions |
| `hooks` | no | Extra Payload hooks, run after the factory's own |
| `access` | no | Override read access. Use only with a written reason in the brief |

### 4.3 What the factory adds on its own

Every collection gets these, so none can forget them:

| Area | What is added |
| --- | --- |
| Access | The shared `publicLiveOrPilot` rule. Logged-in users read everything; visitors and the public API read only published entries with status live or pilot. Planned entries never leave the CMS |
| Drafts | On, no autosave |
| Admin layout | Sidebar: name, slug, status, grouping, featured, order, isUSP, hasOwnPage. Tabs in this fixed order: Card, Detail, Page, FAQ, WhatsApp, Knowledge base, SEO. Empty tabs are left out |
| Slug | Generated from `name`, editable, lowercase with dashes, checked for format and uniqueness |
| Fallbacks on save | Empty `meta.title` becomes the name plus "| NeuronCx". Empty `meta.description` becomes `summary`. Empty `waRowTitle` and `waRowDescription` come from `name` and `summary`. `waLink` is set from the route and slug |
| Publish check | With `hasOwnPage` on: `heroHeading`, `meta.title`, `meta.description`, and the required fields of every section switched on in that entry's layout (section 5.2). Fields of sections that are off are not required |
| Revalidation | On publish, unpublish or delete: the entry page, the hub page, and any page that lists this collection |
| Knowledge base | Wrapped with `withRag()` when `groups` includes `kbase` |
| Registry | Added to `src/content/registry.ts`, which routes, sitemap, the collection cards block, the knowledge base and WhatsApp all read |

### 4.4 What can and can't be customised

| Can be customised per collection | Can't |
| --- | --- |
| Extra fields in any placement | Names and limits of shared fields |
| Which shared groups are used | The tab order |
| The grouping and its list type | The visibility rules for status |
| The route base | The plain-text rule on WhatsApp and knowledge base fields |
| Which sections are allowed, and collection-specific sections | One H1 per page, one navy section per page |
| Which card designs are allowed |  |
| Extra hooks |  |

## 5. Layer 3: sections and the layout field

### 5.1 How an entry page is built

```
Hero (fixed, not in the list, holds the H1)
layout (drag and reorder)
  ├─ section blocks: read from the entry's own fields
  └─ site blocks: their own fields
Closing (fixed at the end unless the layout includes it)
```

### 5.2 Defining a section

Each section is a small Payload block plus a website component, registered once in `src/content/sections/`:

```tsx
export const benefitsSection = defineSection({
  key: 'benefits',
  label: 'Benefits',
  reads: ['benefits'],
  requiredWhenOn: ['benefits'],
  headingDefault: 'What changes for your team',
  fields: [], // optional: heading override is added automatically
})
```

| Property | What it does |
| --- | --- |
| `key` | Block slug and registry key |
| `label` | Admin label in the block picker |
| `reads` | The entry fields the section draws from |
| `requiredWhenOn` | Fields the publish check requires while this section is in the layout |
| `headingDefault` | Heading used when neither the entry nor the hub sets one. `{name}` is replaced with the entry's name |
| `fields` | Any section-only settings. A `heading` override is always added |

A section with nothing to show is not drawn, even when it is in the layout. An entry with no `passesTo` has no chain section.

### 5.3 What goes in the block picker

| Kind | Blocks | Notes |
| --- | --- | --- |
| Shared sections | benefits, howItWorks, useCases, screenshots, integrations, customers, faq, related, closing | Available to any collection whose fields support them |
| Collection sections | agentPanel, agentChain (bot swarm), contrastStrip (B2C CRM), statusFlow, edgeCases, setupChecklist (integrations) | Registered by that collection, allowed only there |
| Site blocks | testimonial, statBand, mediaBlock, productInAction, caseStudyGrid, benefits, cta, content, trustPanel, logoWall | The existing page blocks, reused through `blockReferences` where the Payload version supports it, so each block is defined once |
| Never allowed | Every hero block, the plain `faq` block | One H1 per page. The `faq` section replaces the `faq` block, so FAQPage data is not doubled |

### 5.4 Layout field rules

| Rule | Setting |
| --- | --- |
| Drag and reorder | `admin.isSortable` left at its default (true). Rows also have move up and move down |
| Easy to scan | `admin.initCollapsed: true` |
| Rows you can tell apart | A `RowLabel` component showing block label plus heading, such as "Testimonial: What changed at the front desk" |
| Defaults | A new entry's layout is copied from its hub record's `defaultLayout`. An entry with `usePageDefaults` on follows the hub, so a reorder on the hub reaches every entry still on defaults |
| One navy section | Validation: no block other than the closing may set `background: navy` |
| Closing last | Validation warns, not blocks, when the closing is not the last row |
| Live preview | Enabled for every collection with a route, so editors see a reorder before saving |

### 5.5 What the bot reads

The knowledge base and WhatsApp read structured fields, never the layout. Hidden sections stay off the page only; their fields still reach the bot. Site blocks such as testimonials and stat bands are page-only, since they often hold client names or figures cleared separately. A block can opt in with an `includeInKbase` switch if its text should be indexed.

## 6. Layer 4: hubs and groupings

### 6.1 `hubs`

One collection for every hub page, one record per content collection. Replaces building a new master for each collection. `integrationsMaster` moves in later (section 10).

| Tab | Fields |
| --- | --- |
| Sidebar | `name`, `slug`, `forCollection` (select from the registry, unique), `isMain` |
| SEO | `primaryKeyword`, `secondaryKeywords`, `meta.title`, `meta.description`, `meta.image` |
| Hero | `eyebrow` (40), `h1` (70, required), `subheading` (200), `heroChips` (up to 4, 30 each), `heroMedia`, `heroChat` (the shared chat field, fields_reference.md section 4: up to 8 messages from customer, business or team, plain text 300, entry relationship for the label), `heroChatCaption` (80), `cta`, `secondaryCta` |
| Grouping sections | One row per grouping, in page order: `group` (relationship to `Lists`), `eyebrow` (60), `heading` (70), `intro` (200), card design override, optional hand-picked entries. With no rows: every grouping in `order`, using its own name and intro |
| Hub layout | A `layout` field for the hub page itself, using hub sections (how it works, layers, works with, by industry, trust, articles) and site blocks |
| Entry defaults | `defaultLayout` for entry pages, and `labels` (section headings with `{name}`) |
| FAQ | `faqHeading`, `faqs` |
| Closing | `closing.heading` (70), `closing.subheading` (200), `cta`, `secondaryCta` |
| WhatsApp | `waIntro` (1024), `waListButton` (20), `waSectionTitle` (24), `waFallback` (300) |
| Knowledge base | `kbAnswer` (answers "What is [hub]?"), `kbFacts`, `kbQuestions`, `kbSynonyms`, `includeInKbase` |

Hub sections that read from other collections:

| Hub section | Reads |
| --- | --- |
| Works with | Every integration linked from a live entry in this collection, or hand-picked |
| By industry | Rows: vertical, heading, problem line, entries (relationship), outcome line |
| Layers | Rows: title, line, link to an entry in any registered collection |
| Articles | Posts by category or hand-picked |

### 6.2 Groupings in `Lists`

A new grouping is a new `type` value, not a new collection. Every list entry has the same fields:

| Field | Type | Notes |
| --- | --- | --- |
| `type` | select | crmArea, agentFamily, and the next one |
| `name`, `slug`, `order` |  | Unique within its type |
| `intro` | text, 140 | One line under the grouping's heading on the hub |
| `painLine` | text, 120 | Optional. The problem the grouping solves, in the team's words |
| `summary` | text, 200 | How the entries in the grouping work together |
| `icon` | select | Shared icon library |
| `cardDesign` | select | Optional. Sits between the entry's and the section's design |
| `waRowTitle` | text, 24, plain | The grouping as a WhatsApp menu row |
| `waRowDescription` | text, 70, plain |  |

## 7. Layer 5: delivery

### 7.1 Website

| Piece | What it does |
| --- | --- |
| Hub route | Renders the hub record for a collection: hero, grouping sections, hub layout, FAQ, closing |
| Entry route | `[route]/[slug]` for every registered collection with a route. Hero, then `RenderSections(layout)`, then closing |
| `RenderSections` | One renderer for section blocks and site blocks, using the existing `RenderBlocks` for site blocks |
| Cards | The shared card components. Design falls back from entry, to grouping, to section, to hub default, to grid |
| Breadcrumbs | Home / hub / grouping / entry, with BreadcrumbList data |
| Metadata | From the entry's SEO tab with the factory's fallbacks |

### 7.2 Collection cards block

One block for any page, replacing every "pull from X" option planned per collection:

| Field | Values |
| --- | --- |
| `collection` | Select from the registry |
| `populateBy` | all, by grouping, featured, USP, hand-picked |
| `groups` | Relationship to `Lists`, filtered by the collection's list type |
| `selectedDocs` | Hand-picked entries |
| `limit` | 1 to 24 |
| Card design | The shared `cardDesignFields` group |

Visitors only ever get live and pilot entries, enforced by access, not by the block.

### 7.3 Knowledge base

One serializer for every registered collection with `kbase`:

- **Sent:** published entries with status live or pilot and `includeInKbase` on. Hub records too, so "What is the bot swarm?" has an answer.
- **Shape:** each tab becomes one section in NCX post content, arriving as Awaiting Approval, as `ncx-sync.md` already describes for integrations.
- **Order of weight:** `kbAnswer`, `kbFacts`, `faqs`, `description`, then the collection's own fields.
- **Relationships:** sent as names, per the collection's `kb.resolve` (grouping, integrations, the next agent in a chain). Today's sync drops relationships, so the bot can't answer "what happens next?"
- **Pilot entries:** `kbAnswer` must say so. The serializer adds "(in pilot)" to the section title as a backstop.
- **Never sent:** SEO and WhatsApp tabs, layout, media, links, dates, planned entries.
- **Store:** the Redis multitenant vector store, under NeuronCx's own tenant.

### 7.4 WhatsApp

One read-only endpoint, `/api/wa/[collection]`, behind an API key, returning ready-to-send interactive message JSON:

| Request | Returns |
| --- | --- |
| `?step=groups` | List message of the collection's groupings (`waRowTitle`, `waRowDescription`), with the hub's `waIntro`, `waListButton`, `waSectionTitle` |
| `?step=entries&group=<slug>` | List message of that grouping's live and pilot entries, 10 at most, by `order` |
| `?step=entry&slug=<slug>` | The entry message: `waHeader`, `waBody` with `waKeyPoints`, `waFooter`, `waButtons`, `waLink` |
| Anything not found | The hub's `waFallback` |

Collections without a grouping skip the first step. Nothing in the repos sends WhatsApp fields today, so this endpoint is what the NCX bot calls.

### 7.5 Sitemap and revalidation

- The sitemap lists every entry with `hasOwnPage` on, from every registered collection, plus every hub. This also fixes the current sitemap, which points at sitemaps that don't exist.
- Revalidation runs from the factory's hooks (section 4.3), so a new collection needs no extra wiring.

## 8. Adding a new collection

After the foundation is built, in this order:

1. **Write the brief.** Copy `collections/_template.md` to `collections/<name>.md`: what one entry is, what belongs elsewhere, grouping, extra fields, sections, visibility, writing rules, WhatsApp and knowledge base examples, keywords, candidate entries, open items.
2. **Scaffold.** `pnpm new:collection <slug>` creates `src/collections/<Name>/index.ts` from the factory, registers it, and creates a draft hub record.
3. **Fill the config.** Extra fields, `groupBy`, allowed sections, card designs, `kb.resolve`.
4. **Add collection sections** if the page needs any the registry doesn't have.
5. **Add the grouping** as a new `type` in `Lists`, with its starting entries.
6. **Regenerate** types (`payload generate:types`) and the block reference (`scripts/block-reference.ts`) used by the page builder skill.
7. **Set up the hub record:** hero, grouping sections, default entry layout, FAQ, closing, WhatsApp text, knowledge base answer.
8. **Enter content as drafts**, check in live preview, publish only on approval.
9. **Approve the knowledge base sections** in NCX once they arrive.

### 8.1 Brief template headings

`collections/_template.md`:

1. What this collection is (one entry is, who reads it)
2. What belongs here, and what doesn't
3. Field design (shared groups used, extra fields, grouping list type and starting entries)
4. What is visible, and when
5. Writing rules (general and by field)
6. WhatsApp fields (with one worked example)
7. Knowledge base fields (with one worked example)
8. Where entries appear (hub, cards, entry pages, WhatsApp, knowledge base)
9. Page sections (allowed sections, default entry layout)
10. SEO (keywords, owner pages)
11. Candidate entries
12. Before publishing an entry (checklist)
13. Open items

## 9. Build order

Each step is its own Claude Code prompt. Each ends with a build, generated types and a short check in the local admin on `localhost:3001`.

| # | Prompt | Depends on |
| --- | --- | --- |
| 1 | Merge the shared field groups from `feat/shared-field-groups` to main. Rebase `feat/bot-swarm-collections` onto main after, since it branched from an older main |  |
| 2 | `defineContentCollection()` and `src/content/registry.ts`, with tests on the generated config (access, tabs, hooks, publish check) | 1 |
| 3 | Section registry, `defineSection()`, the `layout` field group and the website's `RenderSections` | 2 |
| 4 | `hubs` collection and the shared grouping fields on `Lists` | 2 |
| 5 | Generic hub and entry routes, breadcrumbs, metadata, sitemap | 3, 4 |
| 6 | Collection cards block | 2 |
| 7 | Knowledge base serializer for registered collections and hubs | 2, 4 |
| 8 | WhatsApp endpoint | 4 |
| 9 | Rebuild `crmFeatures` on the factory as the first real collection | 1 to 8 |
| 10 | Build `microApps` and its `agentFamilies` grouping on the factory, with the agentPanel and agentChain sections | 9 |
| 11 | `pnpm new:collection` scaffold script and `collections/_template.md` | 9 |
| 12 | Move integrations onto the factory and `integrationsMaster` into `hubs` | 9, with a production backup and redirects |

## 10. Existing collections

| Collection | Today | Move to the foundation |
| --- | --- | --- |
| `crmFeatures` | Built on `feat/shared-field-groups`, no route, blocks or knowledge base yet | Step 9. First real user, small risk since nothing is live |
| `microApps` | Design only, `collections/micro_apps_swarm.md` | Step 10. Built on the factory from the start |
| `integrations` and its four supporting collections | Live, own fields, own master, own sync | Step 12, last. Needs a migration for `summary` and `faqs`, the master moved into `hubs`, categories either kept or moved into `Lists` |
| `customers`, `caseStudies`, `sectors` | Live, own fields | After integrations, once the pattern is proven |
| Older `Features` collection | Overlaps with `crmFeatures` | Retire once its entries move, per `docs/cms/features-migration.md` |
| Planned: omnichannel CX, call quality assessments, episodic engagements, category definitions | Briefs written or planned | Built on the factory from the start |

## 11. Decisions needed before building

1. **Hubs:** one generic `hubs` collection (recommended), or a master per collection as integrations has.
2. **Integration categories:** keep `integrationCategories` as its own collection, or move it into `Lists` as a type.
3. **Route bases:** `/crm/[slug]`, `/bot-swarm/[slug]`, and the rule for every new collection.
4. **Older Features collection:** retire before or after `crmFeatures` moves onto the factory.
5. **Payload version:** confirm it supports `blockReferences`. Without it, site blocks are imported into the layout field directly, which works but repeats them in the generated types.
6. **Knowledge base approvals:** keep Awaiting Approval for every section, or let edits to already-approved entries go live directly (the `ncx-sync-active-on-publish` branch).

## 12. Checks for every collection built on the foundation

- [ ]  Built with `defineContentCollection()`, no hand-built access, tabs or hooks
- [ ]  Brief written in `collections/<name>.md` from the template
- [ ]  Planned entries return nothing to a logged-out request on the REST and GraphQL APIs
- [ ]  Shared field names and limits unchanged
- [ ]  Grouping added as a `Lists` type, not a new collection
- [ ]  Allowed sections listed, no hero blocks or plain `faq` block in the picker
- [ ]  Hub record created with a default entry layout
- [ ]  Types and block reference regenerated
- [ ]  Entry page, hub, sitemap, collection cards block, knowledge base and WhatsApp endpoint checked with one live entry
- [ ]  No em dashes or filler words in any default copy or label
