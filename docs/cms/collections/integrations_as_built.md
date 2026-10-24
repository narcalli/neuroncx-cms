# Integrations collection: as built

How the Integrations section of the CMS works today, and what each field does on the website. For editors who write integration entries and developers who change the collection.

- **Code described:** neuroncx-cms `main` at `ad102e5` and neuroncx-website `main` at `0422b97` (22 Oct 2026).
- **Design notes:** [integrations.md](integrations.md) is the original spec copied from Notion on 13 Oct 2026. It describes a target design, and parts of it differ from what was built. Where the two disagree, this file describes the code.
- **Related:** [fields_reference.md](../fields_reference.md) (shared field groups), [ncx-sync.md](../ncx-sync.md) (knowledge base sync), `E:\Payload CMS\BLOCKS_REFERENCE.md` (every block's fields).

---

## 1. The pieces

The admin's **Integrations** group holds five collections:

| Admin name | Slug | What it is |
|---|---|---|
| Integration items | `integrations` | One entry per system NeuronCx connects to (DocPulse, Exotel, WhatsApp Business Platform...). Written once, shown wherever integrations are listed. |
| Integration categories | `integrationCategories` | The groups items belong to (Messaging channels, Telephony and dialers...). Each item has exactly one. |
| Integration connection types | `connectionTypes` | How NeuronCx connects (webhooks, API, file upload...). Optional on an item. |
| Products | `products` | NeuronCx products an item works with. Shared with the rest of the site. |
| Integrations master | `integrationsMaster` | Landing page records, plus the wording every item page shares. One record is the main one. |

Items, categories, connection types and the master all have drafts: save a draft, then **Publish** to make it visible. Products have no drafts.

---

## 2. Who sees what

An item reaches visitors only when it is **published** and its **Status is Live**. The CMS enforces this for every visitor request, including relationships: a hand-picked item that is a draft, Pilot or Planned is simply left out. Logged-in editors see everything.

| Published | Status | Own page | Card in lists | Card links to its page | Page at /integrations/&lt;slug&gt; | Sent to the knowledge base |
|---|---|---|---|---|---|---|
| no | any | any | no | no | no (404) | no |
| yes | Pilot or Planned | any | no | no | no (404) | no |
| yes | Live | off | yes | no | no (404) | yes, if "Include in knowledge base" is on |
| yes | Live | on (with a slug) | yes | yes | yes | yes, if "Include in knowledge base" is on |

Notes:

- "Card in lists" still depends on each block's settings (category filter, Featured only, How many).
- Categories and connection types are visible when published, or when saved before drafts were switched on for them. Products are always visible.
- An integrations master record is visible when published.

---

## 3. Editing an integration item

Drafts save without any checks. The checks below run when you publish.

### Sidebar

| Field | Rules | What it does |
|---|---|---|
| Name | Required, unique, 60 characters | The card title and the fallback for most headings. Spell it the way the partner does. |
| Status | Live (default), Pilot, Planned | Only Live reaches the site and the knowledge base. |
| Category | Required | Groups the item, gives cards their icon and badge, and can set the item's card design (section 6). |
| Connection | Optional | Shown as a tag on the item page (its badge label, else its name). Setting it fills an empty setup checklist (section 4). |
| Products | Optional, several | Block filters by product, and the "Works with ..." line on the item page. |
| Featured | Off by default | Read by any block with **Featured only** ticked. |
| Order | Default 100 | Lower shows first. Lists sort by order, then name. |
| Slug | Unique, 60 characters | The page address `/integrations/<slug>`. Needed to publish with Own page on. Cannot match an integrations master slug. |
| Own page | Off by default | Gives the item its own page and shows the **Page** tab. Publishing then needs a slug, a hero heading, an SEO title and an SEO description (the last two usually fill themselves, see section 4). |
| SEO check | Read only | Shows where the primary keyword appears (heading, SEO title, SEO description, summary) with live character counts. Never blocks saving. |

### Card tab

| Field | Rules | What it does |
|---|---|---|
| Logo | Image | Transparent PNG or SVG. Without one, cards show the first letter of the name. |
| Tagline | 60 characters (aim for 45) | Short line under the name on logo cards. |
| Summary | 120 characters | One line on what moves between the two systems. Card text, the item page subheading fallback and the SEO description fallback. |
| Card design | Optional | This item's own card design. Empty follows the category (section 6). |
| At a glance | 3 to 4 points, title 40 and line 60 characters | Not shown on the website yet (section 11). |

### SEO tab

| Field | Rules | What it does |
|---|---|---|
| Primary keyword | 60 characters | Feeds the SEO title fallback and the SEO check. |
| Secondary keywords | Up to 5, 60 characters each | For the editor's reference. |
| Search listing: title | 60 characters | The page title in search results and the browser tab. Left empty, it is filled as "&lt;primary keyword&gt; with NeuronCx \| NeuronCx" (or the name, if there is no keyword). |
| Search listing: description | 155 characters | Left empty, it is filled from the summary. |
| Search listing: image | Image | The share image. Without one, the site's default share image is used. |

### Page tab (only while Own page is on)

| Field | Rules | What it does |
|---|---|---|
| Hero heading | 70 characters, needed to publish with Own page on | The page H1. An action, the partner name and the result: "Book DocPulse appointments on WhatsApp". |
| Hero subheading | 200 characters | Under the H1. Falls back to the summary. |
| Call to action | Label 30 characters, then a link | The page's button. Type a label to choose where it goes. The link can point at a page, a post or a custom URL. |
| Show closing panel | On by default | The dark closing panel at the end of the page. Off removes it on this page only. |
| Related | Up to 3 items, not itself | Hand-picked related integrations. Left empty, or with fewer than 3, it is filled with other live items in the same category. |
| Section headings | 70 characters each | Override the four section headings for this page only (section 5). |

### What moves, Edge cases, Setup, Example

| Tab | Field | Rules | Shown on the item page as |
|---|---|---|---|
| What moves | Status flow | Rows of event (40, required), "In the partner system" (40), "What happens" (120, required) | The status table, with the partner's logo and the NeuronCx logo |
| Edge cases | Edge cases | Situation (80, required), "What NeuronCx does" (160, required) | "When things do not go to plan" |
| Setup | Setup checklist | Step (80, required), Provided by: You, NeuronCx or Partner | "What it takes to connect ..." in lanes by who provides each step |
| Example | Chat example | Up to 8 messages: sender (Customer, Business, Team), time (10), text (300, plain text), label (40) | "An example conversation", as chat bubbles. Demo-tenant details only. |

### FAQ tab

Up to 6 questions (120 characters) with plain-text answers (600 characters). Shown on the item page as "Questions about &lt;name&gt;", with the first one open, and published as FAQPage structured data for search engines.

### WhatsApp tab

All plain text, with the limits WhatsApp itself enforces. A phone-style **preview** at the top shows the category row, this item's row and the message, with live character counts.

| Field | Rules |
|---|---|
| Row title (list menu) | 24 characters. Filled from the name when empty. |
| Row description (list menu) | 70 characters, aim for 60. Filled from the summary when empty and it fits. |
| Header type | Text or Image (list messages only allow text) |
| Header | 60 characters, aim for 30 |
| Body | 1,024 characters, aim for 300 |
| Key points | Up to 5 lines, 60 characters each. **Fill from status flow** turns up to 5 What moves rows into "event: what happens" lines; it only fills empty rows and never changes a line someone wrote. |
| Footer | 60 characters, aim for 30 |
| Reply buttons | Up to 3: label (20) and action (Book a demo, Other systems, Talk to sales, Open the page) |
| Link button text | 20 characters |
| Link (more information) | Read only, set automatically (section 4) |

### Knowledge base tab

| Field | Rules |
|---|---|
| Include in knowledge base | On by default. Off keeps the item out of the knowledge base. |
| Answer | 600 characters, plain text. A complete answer to "What is this?" |
| Facts | One short, checkable fact per line, 160 characters |
| Questions | How a customer might ask about it, 120 characters |
| Synonyms | Other names people use, 40 characters |
| Last reviewed | A date, so stale answers can be found |

What actually gets sent is in section 9.

---

## 4. What the CMS fills in or prevents

On every save of an item:

- **SEO title**: if empty, "&lt;primary keyword or name&gt; with NeuronCx | NeuronCx", cut on a whole word to fit 60 characters.
- **SEO description**: if empty, the summary.
- **WhatsApp row title**: if empty, the name cut to 24 characters on a whole word (skipped if the name is not plain text).
- **WhatsApp row description**: if empty, the summary when it is 70 characters or fewer and plain text.
- **WhatsApp link**: `/integrations/<slug>` with Own page on, `/integrations#<slug>` without, empty with no slug.
- **Setup checklist**: when a connection type is set and the checklist is empty, it is filled from that connection type's default checklist. This happens once per connection type, so a checklist you clear stays clear until you change the connection.

Elsewhere:

- **Category row description**: a category with "Fill the WhatsApp row description automatically" on lists the names of its live, published items, in order, cut to 70 characters on a whole name. It updates when an item is published, changed, unpublished or deleted. Publish or discard an open draft of the category first, because the update is written to its latest version.
- **Deleting a category, connection type or product** that an item or a page block still uses is refused, with a message naming them. Move them first.
- **Slugs**: an item slug cannot match an integrations master slug, and the other way round.
- **One main master**: only one integrations master record can have Is main on.

---

## 5. The item page: /integrations/&lt;slug&gt;

The page exists only for a published, Live item with Own page on and a slug. Every other address under /integrations/ is a 404. Top to bottom:

1. **Hero**: a breadcrumb pill (Integrations / name), tags for the category and the connection, the H1 (hero heading, else name), the subheading (hero subheading, else summary), the button, and "Works with ..." listing the products.
2. **Status table**, from What moves.
3. **An example conversation**, from Example.
4. **Edge cases**.
5. **Setup**.
6. **FAQ**, with FAQPage structured data.
7. **Related**: up to 3 cards, then an "All integrations" card. Shown on every item page.
8. **Closing panel**, unless Show closing panel is off. Heading and text come from the main master record's Closing tab, else "Connect the systems you already use".

A section with no rows is left out, except Related.

**Section headings** come from the item's Section headings, else the main master record's **Item page labels**, else these defaults. `{name}` becomes the item's name.

| Section | Default |
|---|---|
| Status table | What moves between {name} and NeuronCx |
| Edge cases | When things do not go to plan |
| Setup | What it takes to connect {name} |
| Related | Other systems like {name} |

**The button** (in the hero and the closing panel): the item's own call to action when it has a label and a link, else the main master record's call to action, else "Talk to our team" linking to /contact.

**Search and sharing**: the title is the SEO title, else the hero heading, else the name. The description is the SEO description, else the summary. The canonical address is the site address plus `/integrations/<slug>`; it is left out when the site address is not set. The share image is the item's SEO image, else the site default.

---

## 6. Card designs

Cards that list integrations can be drawn in six designs: **Grid** (the default), **Logo card**, **Directory with filters**, **Feature card**, **Story card** and **Pill**. Directory and Pill describe a whole list, so only a section can use them. An item or a category can choose Grid, Logo card, Feature card or Story card.

**Which design a card uses**, first match wins:

1. The item's own Card design (Card tab).
2. Its category's Card design.
3. The section's design.
4. Grid.

Steps 1 and 2 apply only where the section's switch **"Let integrations and categories use their own design"** is on (it is by default) and the section's design is not Directory or Pill.

**Where a section's design is set:**

- An **Integrations block** on a page: its Card design tab.
- An **integrations landing** page: the master record's Card design tab sets the design for every section. A row under Integration sections can turn off "Use the page's design" to set its own.

When the items in one section end up with different designs, they are drawn as one group per design, in the order each design first appears, 18 px apart. If "Cards per row" is empty, every group shows 3 per row so the groups line up.

**What a card shows**: the name, the tagline (logo cards) or summary, the logo (else the first letter), the category's icon and name as a badge, and a link only when the item has its own page. The link text for Feature and Story cards comes from the section's "Link text".

---

## 7. Where else items appear

Every block that lists integrations has the same **Show** switch:

| Show | Picks |
|---|---|
| All live integrations | Every live, published item, up to How many |
| Filter by category or product | Items in any chosen category or product. Needs at least one choice. |
| Hand-picked | The chosen items, in the order picked. Picks that are no longer live and published are dropped for visitors. |
| Manual list, old style | The list typed into the block itself. Being retired. Its cards never use item designs. |

All and Filter can also use **Featured only**, and sort by order, then name. Hand-picked keeps the order the items were picked in.

| Place | How many | Notes |
|---|---|---|
| Integrations block | 1 to 24 | Cards in the chosen design. Can group cards under a heading per category. |
| Integrations Marquee block | 4 to 40 | Scrolling logos, no links. Renders nothing with fewer than 4. |
| Partner Strip block | 1 to 8 | Item names as text, no links. Its standards badges are typed on the block. |
| Integrations landing block | n/a | A whole landing page built from an integrations master record (section 8). |
| /integrations-preview | n/a | The main master record's landing page, hidden from search engines. |
| Customer pages | n/a | "What they use" lists the customer's integrations, without links. |

---

## 8. Categories, connection types, products and the master

### Integration categories

| Field | Rules | What it does |
|---|---|---|
| Name | Required, unique, 60 characters | The badge on cards, the landing section label |
| Slug | Required, unique, 60 characters, lowercase and dashes | Filled from the name when empty |
| Order | Default 100 | Order in lists and dropdowns |
| Hub heading | 60 characters | The section heading on landing pages |
| Hub intro | 140 characters | The line under it |
| Icon | From the shared icon library | On cards and landing sections |
| Card design | Optional | Every item in the category uses it, unless the item has its own. Empty follows the section. |
| WhatsApp row title and description | 24 and 70 characters | The category as a row in the WhatsApp menu. The description can fill itself (section 4). |

### Connection types

Name, slug and order as above, plus: badge label (20, the chip on the item page), description (200), timing (as it happens, scheduled, on upload), typical setup (120), **default setup checklist** (copied into items, section 4), WhatsApp line (60) and a knowledge base answer (600).

### Products

Name, slug, order, a one-line short description (160) and an optional icon.

### Integrations master

One record per landing page. The record with **Is main on** is also where every item page takes its shared wording.

| Tab | What it holds |
|---|---|
| Sidebar | Name (for editors), slug, Is main, **Which integrations** (categories and products to limit the landing page to; empty lists every live item) |
| SEO | Keywords and the search listing |
| Hero | Eyebrow, H1 (required), subheading, **Hero layout** (Left with an image on the right, or Centred with no image), up to 7 systems shown around the hero, the **logo strip** switch and its own Show settings, a second button, the image |
| Integration sections | The landing page's sections in order, one per category (a category can appear once): eyebrow, heading, intro, and its own card design when "Use the page's design" is off. **Left empty, the page shows every category** (or those in Which integrations) with its name, hub heading and hub intro. |
| Card design | The default card design for every section on the page |
| Sections | "Five things" (3 to 5), "When feeds go wrong" and the API card, each with an optional heading |
| Item page labels | The four item page section headings (section 5). Only used on the main record. |
| FAQ | The landing page's questions |
| Closing | The closing panel's heading and text, and the call to action. That button is also the main button in the landing hero and the fallback button on item pages. |
| WhatsApp | Intro message, list button, section title and the fallback message for systems that are not listed |
| Knowledge base | As on items. The master itself is not sent to the knowledge base (section 9). |

---

## 9. Knowledge base and WhatsApp

Integration items are the only CMS content synced to the NCX knowledge base. The full description is in [ncx-sync.md](../ncx-sync.md). In short:

- An item is sent when it is published, Live and "Include in knowledge base" is on.
- Each tab becomes one post content in NCX, which arrives as **Awaiting Approval**. Nothing reaches the bot until someone approves it in the dashboard.
- Only text a visitor reads is sent. WhatsApp fields, links, selects, media and relationships are not, and neither is the Page tab of an item without its own page.
- Publishing, unpublishing or deleting queues the sync 30 seconds later. Saving a draft of a live item changes nothing.

The WhatsApp fields describe the item for the WhatsApp list menu and message; the preview in the WhatsApp tab shows how they fit together.

---

## 10. When changes show on the site

The website keeps what it reads from the CMS for 60 seconds, and nothing clears that early when you publish. A published change usually shows within a minute or two. Draft items cannot be previewed on the site (section 11).

---

## 11. Known gaps

Checked against the code on 22 Oct 2026:

1. **At a glance is not shown.** The field exists on the Card tab, but no page renders it.
2. **Item pages are in no sitemap.** `next-sitemap.config.cjs` excludes every path and points robots.txt at `/pages-sitemap.xml` and `/posts-sitemap.xml`, which have no routes in the website. This affects the whole site.
3. **No preview for items.** The collection has no Preview button, and the item page only reads published items, so a draft can't be checked on the site before publishing.
4. **The WhatsApp link of an item without its own page goes nowhere specific.** It is `/integrations#<slug>`, but nothing on /integrations has that anchor, so it opens the top of the page.
5. **Few links to item pages.** Only cards in the Integrations block (and the landing sections, which use it) and the Related cards link. The marquee, the partner strip and customer pages don't.
6. **Buttons can't pick an integration.** The link field (Call to action, master buttons) references pages and posts only. To link to an item page, use a custom URL: `/integrations/<slug>`.
7. **Item slugs have no format check.** Category, connection type and master slugs must be lowercase with dashes; an item slug only has to be unique. Keep item slugs lowercase with dashes by hand.

---

## 12. Before publishing an item

- [ ] Name spelled the way the partner spells it
- [ ] Status set honestly: Live only if a client runs it today
- [ ] Category set, plus connection and products where they apply
- [ ] Summary describes what moves, within 120 characters
- [ ] Every claim checked against the engineering notes; no client named without clearance; no credentials anywhere
- [ ] With Own page on: slug (lowercase, dashes), hero heading, What moves, Setup and FAQs filled; SEO title and description read well
- [ ] Knowledge base answer and facts filled, or "Include in knowledge base" switched off
- [ ] After publishing, the card and the page checked on the live site (allow a minute or two)

---

## 13. For developers

| Concern | CMS (neuroncx-cms) | Website (neuroncx-website) |
|---|---|---|
| Item collection | `src/collections/Integrations.ts` | |
| Categories, connection types, products | `src/collections/IntegrationTaxonomies.ts` | |
| Master | `src/collections/IntegrationsMaster.ts` | |
| Hooks and publish checks | `src/collections/integrations/hooks.ts` | |
| SEO tab and SEO check | `src/collections/integrations/seo.ts`, `admin/SeoCheck.tsx` | |
| WhatsApp preview, Fill from status flow | `src/collections/integrations/admin/` | |
| Show switch for blocks | `src/fields/integrationSource.ts` | `src/utilities/integrations.ts` (`loadIntegrations`, `integrationHref`) |
| Card designs | `src/fields/cardDesign.ts`, `src/fields/CardDesignPicker/` | `src/components/cards/` (`CardSection.tsx`, `defaults.ts`, `adapters/integration.ts`) |
| Blocks | `src/blocks/Integrations`, `IntegrationsMarquee`, `PartnerStrip`, `IntegrationsLanding` | `src/blocks/Integrations`, `src/components/blocks/IntegrationsMarquee`, `src/blocks/PartnerStrip`, `src/blocks/IntegrationsLanding` |
| Item page | | `src/app/(frontend)/integrations/[slug]/page.tsx` |
| Knowledge base sync | `src/rag/` (`sources.ts` lists the collection) | |

- **Visitor access** is enforced in the CMS (`liveOrAuthenticated` in `Integrations.ts`). The website's own checks (`integrationHref`, the page query) repeat it as a second line of defence; keep both in step.
- **Hand-picked lists** are filtered for visitors by an `afterRead` hook on REST and GraphQL only. Scripts using the Local API get the list as saved, so a read-modify-write script does not drop hidden picks.
- **Card design names** must match between `ITEM_CARD_DESIGNS` and `CARD_DESIGN_DEFAULTS` in the CMS (`src/fields/cardDesign.ts`) and the website (`src/components/cards/types.ts`, `defaults.ts`).
- **Defaults are filled on read.** A saved group with no value reads as its defaultValue, which is why section overrides use an explicit switch ("Use the page's design") rather than an empty value.
- **After a schema change**: run `npm run generate:types` in the CMS and copy `src/payload-types.ts` to the website.
- **Tests**: `tests/int/cardDesign.int.spec.ts` and `tests/int/integrationsMaster.int.spec.ts` in the CMS (`npm run test:int`).
