# Fields reference

**Repo:** neuroncx-cms (Payload)
**Last updated:** 13 Oct 2026
**Applies to:** every content collection that feeds the website, WhatsApp or the knowledge base

## Why this exists

The same content entry (a CRM feature, an integration, a module, a bot agent) is used in three places:

1. **The website**, as a card and sometimes as a page of its own.
2. **WhatsApp**, inside interactive messages with strict character limits.
3. **The knowledge base**, indexed into the Redis vector store for the RAG virtual agents.

This file defines each reusable field group **once**. Collections use these groups as they are and add only the fields that are specific to them. If a limit or a field name needs to change, it changes here and in the shared field file, never in one collection only.

## How to use it

- Each group below maps to one file in `src/fields/` that returns a Payload field array or tab, for example `src/fields/whatsapp.ts`.
- A collection's own doc lists which groups it uses and then describes only its extra fields. It does not repeat the fields from this file.
- Group field names are fixed. Collections must not rename them, so the website, the WhatsApp sender and the RAG sync can read every collection the same way.
- New groups are added here first, then built.

## Rules for all groups

- **Two limits.** Every text field has a hard cap, set as `maxLength`, and some also have a working limit, shown in the admin description with a live counter. The hard cap is what the system will reject. The working limit is what reads well.
- **Plain text where the channel needs it.** WhatsApp and knowledge base fields reject markdown characters and em dashes through a shared `validate` function (`src/fields/validators/plainText.ts`).
- **No em dashes anywhere.** Use a hyphen, a comma, or rewrite the sentence.
- **Plain, human language.** No jargon, no slogans. Write as a person would explain it.
- **Drafts on** for every collection that uses these groups.
- **Types regenerated** (`payload generate:types`) after any change, so the website and the RAG sync fail to build if a field is renamed.

## Group summary

| Group | File | Admin placement | Required on every collection |
|---|---|---|---|
| Core | `core.ts` | Sidebar | Yes |
| Card | `card.ts` | Tab "Card" | Yes |
| Detail and SEO | `detail.ts` | Tab "Detail" | Yes |
| Own page | `ownPage.ts` | Sidebar switch + Tab "Page" | Optional |
| FAQ | `faq.ts` | Tab "FAQ" | Optional |
| WhatsApp | `whatsapp.ts` | Tab "WhatsApp" | Optional |
| Knowledge base | `kbase.ts` | Tab "Knowledge base" | Optional |

## 1. Core

| Field | Type | Notes |
|---|---|---|
| `name` | text, required, unique | Used as the admin title |
| `slug` | text, required, unique, indexed | Lowercase, hyphenated. Generated from `name`, editable |
| `featured` | checkbox, default false | Shown first wherever the collection is listed |
| `order` | number, default 100 | Sort order on grids and in WhatsApp lists. Lower comes first |
| `isUSP` | checkbox, default false | Marks a differentiator so blocks can pull it out |

Collections add their own sidebar fields next to these, for example `status` and `category` on Integrations.

## 2. Card

What shows when the entry appears on a grid, a list or a strip.

| Field | Type | Hard cap | Working limit | Notes |
|---|---|---|---|---|
| `tagline` | text | 60 | 45 | Short line under the name |
| `summary` | text, required | 140 | 120 | One line on what it does |
| `icon` | select | | | Same icon names as the existing blocks |
| `image` | upload (media) | | | Optional. Logos go here for integrations |

Integrations currently has `summary` at 120. It moves to this group, keeping 120 as the working limit, so existing content still fits.

## 3. Detail and SEO

| Field | Type | Hard cap | Notes |
|---|---|---|---|
| `description` | rich text | | Full description. Also indexed for the knowledge base |
| `whoItsFor` | textarea | 300 | The teams or roles that use it |
| `meta.title` | SEO plugin | 60 | Same SEO plugin fields as the pages collection |
| `meta.description` | SEO plugin | 155 | |
| `meta.image` | SEO plugin | | Share image |

## 4. Own page

Decides whether the entry gets a page of its own. Lets every entry start as a card and be promoted later without a schema change.

| Field | Type | Hard cap | Notes |
|---|---|---|---|
| `hasOwnPage` | checkbox, default false | | Sidebar |
| `heroHeading` | text | 70 | Required when `hasOwnPage` is on |
| `heroSubheading` | textarea | 200 | |
| `benefits` | array of `title` (50) + `line` (140) | | 3 to 6 items |
| `howItWorks` | array of `title` (50) + `line` (140) | | 3 to 5 steps |
| `useCases` | array of `title` (50) + `line` (140) | | Up to 4 |
| `cta` | group: `label` (30), `link` | | Closing call to action |
| `related` | relationship to the same collection, hasMany | | Up to 3. If empty, the page shows other entries from the same collection by `order` |

Behaviour:

- **Off:** the Page tab is hidden, the route returns 404, the entry stays out of the sitemap, and its card has no "Learn more" link.
- **On:** the Page tab fields above become required before publishing (`admin.condition` plus a conditional `validate`). The route renders, the entry is added to the sitemap and the card links through.

Each collection sets its own route base in its doc, for example `/crm/[slug]` or `/integrations/[slug]`.

A collection may replace the fixed sections with its own page fields when it needs a different layout. Integrations does this with its Guide tab. It still uses `hasOwnPage` and the same on/off behaviour.

## 5. FAQ

| Field | Type | Hard cap | Notes |
|---|---|---|---|
| `faqs` | array of `question` (120) + `answer` (600, plain text) | | Up to 6 |

Used for the FAQ section and FAQPage structured data on the web page, and indexed for the knowledge base. Answers are plain text so the bot can use them as they are.

## 6. WhatsApp

Plain text only. Written for **interactive session messages** (inside the 24-hour window). Hard caps are the WhatsApp Cloud API limits; anything longer is rejected by WhatsApp, so Payload rejects it first.

| Field | Used in | Hard cap | Working limit |
|---|---|---|---|
| `waRowTitle` | List row title (this entry as a menu item) | 24 | 24 |
| `waRowDescription` | List row description | 70 | 60 |
| `waHeader` | Message header, text type | 60 | 30 |
| `waBody` | Message body | 1024 | 300 |
| `waKeyPoints` | Array of plain lines, sent inside the body | 3 to 5 lines | 60 each |
| `waFooter` | Message footer | 60 | 30 |
| `waButtons` | Array of `label` + `action`, sent as reply buttons | 3 buttons max, label 20 | 20 |
| `waLink` | URL sent when the user wants more | | Own page if `hasOwnPage` is on, otherwise the anchor on the parent page |

`waRowDescription` is capped at 70, not WhatsApp's 72, to match the NCX dashboard's list description limit.

List-level fields (`waListButton`, 20, and `waSectionTitle`, 24) describe a whole list, not one entry. They live once per collection in a Payload global (`whatsappLists`), not on each entry.

WhatsApp limits to keep in mind:

| Limit | Value |
|---|---|
| Reply buttons per message | 3 |
| List sections per message | 10 |
| List rows per message, across all sections | 10 |
| Button label (reply button or list button) | 20 characters |
| Section title, row title | 24 characters |
| Row description | 72 characters |
| Header, footer | 60 characters |
| Body | 1024 characters |

Because a list holds at most 10 rows, `order` decides which entries make it into a menu. Collections with more than 10 entries need the bot to split them by category.

Template messages (outside the 24-hour window) have their own limits and need Meta approval. They are not covered by this group. If we need them, add a separate `waTemplate` group here.

## 7. Knowledge base

What the RAG virtual agents index and answer from.

| Field | Type | Hard cap | Notes |
|---|---|---|---|
| `includeInKbase` | checkbox, default true | | Only published entries with this on are sent to the vector store |
| `kbAnswer` | textarea, plain text | 600 | A complete answer to "What is [name]?", written for the bot |
| `kbFacts` | array of plain lines | 160 each | Short, checkable facts. One fact per line |
| `kbQuestions` | array of text | 120 each | How a customer might ask about it. Helps retrieval match the question |
| `kbSynonyms` | array of text | 40 each | Other names people use for it |
| `kbLastReviewed` | date | | So stale answers can be found and fixed |

Every collection that uses this group is added to the list `with-rag.ts` watches, so a published change reaches the bot without a separate step.

What gets indexed, in order of weight: `kbAnswer`, `kbFacts`, `faqs`, `description`. The bot should lean on the first two.

## Collections using these groups

| Collection | Core | Card | Detail | Own page | FAQ | WhatsApp | Knowledge base | Own fields |
|---|---|---|---|---|---|---|---|---|
| CRM features (`crm-features`) | Yes | Yes | Yes | Yes | Yes | Yes | Yes | None yet |
| Integrations (`integrations`) | Own fields for now | Own fields for now | Own fields for now | Own fields, with Page tab | Yes | Yes | Yes (not indexed yet) | status, category, connection, products, glance, statusFlow, edgeCases, setupChecklist, chatExample, see collections/integrations.md |

Add a row whenever a collection adopts a group.

## Open items

1. **FAQ answer length:** 600 characters is a starting point. Confirm once we see real answers.
2. **WhatsApp lists global:** confirm moving the list button and section title to a global instead of each entry.
3. **Integrations migration:** moving its existing fields onto these groups needs a migration for `summary` and `faqs`. Plan before building.
