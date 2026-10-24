# Audit 01: CMS fields used by the integration pages

Read-only audit, 15 Oct 2026. Source: `neuroncx-cms` at `ff6745f` (the same as `main`, so production). Current values in section 7 come from the local copy of the production database taken on 14 Oct 2026 at 17:08.

Files read:

- `src/collections/IntegrationsMaster.ts`
- `src/collections/Integrations.ts`
- `src/collections/IntegrationTaxonomies.ts` (categories, connection types, products)
- `src/collections/integrations/hooks.ts`, `seo.ts`, `checklist.ts`
- `src/fields/whatsapp.ts`, `faq.ts`, `kbase.ts`, `link.ts`, `icons.ts`, `validators/plainText.ts`

Conventions in the tables:

- **Field** is the stored path. `a.b` is a field inside a group; `a[].b` is a field inside each row of an array.
- **Label** is the label set in code. "(none set)" means Payload builds the label from the field name.
- **Required** "own page" means the field is checked only when publishing an integration with Own page on (`requiredForOwnPage`). Drafts save without it.
- **UI** rows are admin-only components. They store nothing.
- "link group" is the shared `link()` field. Its sub-fields are listed once, in section 6.

## 1. Integrations master (`integrationsMaster`)

Admin label "Integrations master", in the Integrations group. The sidebar is listed first, then the tabs in order.

| Field | Label | Type | Required | Limit / validator | Options | Relation | Tab / group | Notes |
|---|---|---|---|---|---|---|---|---|
| name | (none set) | text | yes | 60 | | | Sidebar | Used as the admin title |
| slug | (none set) | text | yes, unique, indexed | 60, `masterSlugRule` | | | Sidebar | Lowercase and single dashes; must not match an integration item slug |
| isMain | Is main | checkbox | no | | | | Sidebar | Default off. `masterOneMain` allows one record with it on |
| filter | Which integrations | group | | | | | Sidebar | |
| filter.categories | (none set) | relationship, many | no | | | integrationCategories | Sidebar › Which integrations | Sorted by order |
| filter.products | (none set) | relationship, many | no | | | products | Sidebar › Which integrations | Sorted by order |
| seoCheck | | UI | | | | | Sidebar | `SeoCheck` panel, mode "master" |
| primaryKeyword | Primary keyword | text | no | 60 | | | SEO | |
| secondaryKeywords[].keyword | Secondary keywords › (none set) | array › text | row: yes | 5 rows, 60 each | | | SEO | |
| meta | Search listing | group | | | | | SEO | SEO plugin fields |
| meta.overview | | UI | | | | | SEO › Search listing | Plugin overview |
| meta.title | (plugin) | text | no | 60 | | | SEO › Search listing | Generate button off |
| meta.image | (plugin) | upload | no | | | media | SEO › Search listing | |
| meta.description | (plugin) | textarea | no | 155 | | | SEO › Search listing | Generate button off |
| meta.preview | | UI | | | | | SEO › Search listing | Plugin preview |
| eyebrow | (none set) | text | no | 40 | | | Hero | |
| h1 | H1 | text | yes | 70 | | | Hero | |
| subheading | (none set) | textarea | no | 200 | | | Hero | |
| heroSystems | Systems in the hero | relationship, many | no | 7 rows | | integrations | Hero | |
| hero | (no label) | group | | | | | Hero | |
| hero.secondaryCta | Second button | group | | | | | Hero › hero | |
| hero.secondaryCta.label | (none set) | text | no | 30 | | | Hero › Second button | |
| hero.secondaryCta.link | | link group | when label set | | | pages, posts | Hero › Second button | Shown only when label has text |
| hero.image | (none set) | upload | no | | | media | Hero › hero | |
| fiveThingsHeading | Five things heading | text | no | 70, `plainText` | | | Sections | Empty shows "What connecting your systems gives you" |
| fiveThings[].title | Five things › (none set) | array › text | yes | 3 to 5 rows, 50 | | | Sections | |
| fiveThings[].line | (none set) | text | yes | 140 | | | Sections | |
| whenFeedsGoWrongHeading | When feeds go wrong heading | text | no | 70, `plainText` | | | Sections | Empty shows "When feeds go wrong" |
| whenFeedsGoWrong[].problem | When feeds go wrong › (none set) | array › text | yes | no row limit, 80 | | | Sections | |
| whenFeedsGoWrong[].whatHappens | What happens | text | yes | 160 | | | Sections | |
| apiCard | API card | group | | | | | Sections | |
| apiCard.heading | (none set) | text | no | 60 | | | Sections › API card | |
| apiCard.line | (none set) | text | no | 140 | | | Sections › API card | |
| apiCard.buttonLabel | Button text | text | no | 30, `plainText` | | | Sections › API card | Shown when heading set. Empty shows "Get in touch" |
| apiCard.link | | link group | when heading set | | | pages, posts | Sections › API card | Shown only when heading has text |
| labels | (no label) | group | | | | | Item page labels | Read from the Is main record only |
| labels.statusTable | Status table | text | no | 70, `onlyNameToken` | | | Item page labels | See section 7 |
| labels.edgeCases | Edge cases | text | no | 70, `onlyNameToken` | | | Item page labels | See section 7 |
| labels.setup | Setup | text | no | 70, `onlyNameToken` | | | Item page labels | See section 7 |
| labels.related | Related | text | no | 70, `onlyNameToken` | | | Item page labels | See section 7 |
| faqHeading | FAQ heading | text | no | 70, `plainText` | | | FAQ | Empty shows "Questions about integrations" |
| faqs[].question | FAQs › (none set) | array › text | yes | 6 rows, 120 | | | FAQ | |
| faqs[].answer | (none set) | textarea | yes | 600, `plainText` | | | FAQ | |
| closing | (no label) | group | | | | | Closing | |
| closing.heading | (none set) | text | no | 70 | | | Closing | |
| closing.subheading | (none set) | textarea | no | 200 | | | Closing | |
| cta | Call to action | group | | | | | Closing | |
| cta.label | (none set) | text | no | 30 | | | Closing › Call to action | |
| cta.link | | link group | when label set | | | pages, posts | Closing › Call to action | Shown only when label has text |
| waIntro | Intro message | textarea | no | 1024, `plainText` | | | WhatsApp | |
| waListButton | List button | text | no | 20, `plainText` | | | WhatsApp | |
| waSectionTitle | Section title | text | no | 24, `plainText` | | | WhatsApp | |
| waFallback | Fallback message | textarea | no | 300, `plainText` | | | WhatsApp | |
| includeInKbase | Include in knowledge base | checkbox | no | | | | Knowledge base | Default on |
| kbAnswer | Answer | textarea | no | 600, `plainText` | | | Knowledge base | |
| kbFacts[].fact | Facts › (none set) | array › text | yes | 160, `plainText` | | | Knowledge base | No row limit |
| kbQuestions[].question | Questions › (none set) | array › text | yes | 120, `plainText` | | | Knowledge base | No row limit |
| kbSynonyms[].synonym | Synonyms › (none set) | array › text | yes | 40, `plainText` | | | Knowledge base | No row limit |
| kbLastReviewed | Last reviewed | date | no | | | | Knowledge base | Day only |

## 2. Integration items (`integrations`)

Admin label "Integration item(s)", in the Integrations group. The admin shows `name` at the top of the main area, the sidebar on the right, then the tabs in order.

| Field | Label | Type | Required | Limit / validator | Options | Relation | Tab / group | Notes |
|---|---|---|---|---|---|---|---|---|
| name | (none set) | text | yes, unique | 60 | | | Main (above tabs) | Used as the admin title |
| status | (none set) | select | yes | | `live`, `pilot`, `planned` | | Sidebar | Default `live` |
| category | (none set) | relationship | yes | | | integrationCategories | Sidebar | Sorted by order |
| connection | (none set) | relationship | no | | | connectionTypes | Sidebar | Sorted by order |
| products | (none set) | relationship, many | no | | | products | Sidebar | Sorted by order |
| featured | (none set) | checkbox | no | | | | Sidebar | Default off |
| order | (none set) | number | no | | | | Sidebar | Default 100 |
| slug | (none set) | text | own page; unique, indexed | 60, `itemSlugRule` | | | Sidebar | Must not match a master slug |
| hasOwnPage | Own page | checkbox | no | | | | Sidebar | Default off. Shows the Page tab |
| seoCheck | | UI | | | | | Sidebar | `SeoCheck` panel, mode "item" |
| logo | (none set) | upload | no | | | media | Card | |
| tagline | (none set) | text | no | 60 | | | Card | |
| summary | (none set) | text | no | 120 | | | Card | |
| glance[].title | At a glance › (none set) | array › text | yes | 3 to 4 rows, 40 | | | Card | |
| glance[].line | (none set) | text | yes | 60 | | | Card | |
| primaryKeyword | Primary keyword | text | no | 60 | | | SEO | |
| secondaryKeywords[].keyword | Secondary keywords › (none set) | array › text | row: yes | 5 rows, 60 each | | | SEO | |
| meta.overview | | UI | | | | | SEO › Search listing | |
| meta.title | (plugin) | text | own page | 60, `requiredForOwnPage` | | | SEO › Search listing | Filled by `itemFallbacks` when empty |
| meta.image | (plugin) | upload | no | | | media | SEO › Search listing | |
| meta.description | (plugin) | textarea | own page | 155, `requiredForOwnPage` | | | SEO › Search listing | Filled from summary when empty |
| meta.preview | | UI | | | | | SEO › Search listing | |
| heroHeading | Hero heading | text | own page | 70, `requiredForOwnPage` | | | Page | The Page tab shows only while Own page is on |
| heroSubheading | Hero subheading | textarea | no | 200 | | | Page | |
| cta | Call to action | group | | | | | Page | |
| cta.label | (none set) | text | no | 30 | | | Page › Call to action | |
| cta.link | | link group | when label set | | | pages, posts | Page › Call to action | Shown only when label has text |
| related | (none set) | relationship, many | no | 3 rows | | integrations | Page | Excludes itself |
| headingOverrides | Section headings | group | | | | | Page | |
| headingOverrides.statusTable | Status table | text | no | 70 | | | Page › Section headings | No validator |
| headingOverrides.edgeCases | Edge cases | text | no | 70 | | | Page › Section headings | No validator |
| headingOverrides.setup | Setup | text | no | 70 | | | Page › Section headings | No validator |
| headingOverrides.related | Related | text | no | 70 | | | Page › Section headings | No validator |
| statusFlow[].event | Status flow › (none set) | array › text | yes | no row limit, 40 | | | What moves | |
| statusFlow[].inPartner | In the partner system | text | no | 40 | | | What moves | |
| statusFlow[].whatHappens | What happens | text | yes | 120 | | | What moves | |
| edgeCases[].situation | Edge cases › (none set) | array › text | yes | no row limit, 80 | | | Edge cases | |
| edgeCases[].whatWeDo | What NeuronCx does | text | yes | 160 | | | Edge cases | |
| setupChecklist[].item | Setup checklist › (none set) | array › text | yes | no row limit, 80 | | | Setup | Prefilled from the connection type |
| setupChecklist[].providedBy | Provided by | select | yes | `you`, `neuroncx`, `partner` | | | Setup | Labels You, NeuronCx, Partner |
| setupChecklistSource | (none set) | text | no | | | | Setup | Hidden. Written by `itemFallbacks` |
| chatExample[].sender | Chat example › (none set) | array › select | yes | 8 rows | `customer`, `business`, `team` | | Example | |
| chatExample[].time | (none set) | text | no | 10 | | | Example | |
| chatExample[].text | (none set) | textarea | yes | 300, `plainText` | | | Example | |
| chatExample[].label | (none set) | text | no | 40 | | | Example | |
| faqs[].question | FAQs › (none set) | array › text | yes | 6 rows, 120 | | | FAQ | No FAQ heading field here |
| faqs[].answer | (none set) | textarea | yes | 600, `plainText` | | | FAQ | |
| whatsappPreview | | UI | | | | | WhatsApp | `WhatsappPreview`, top of tab |
| waRowTitle | Row title (list menu) | text | no | 24, `plainText` | | | WhatsApp | Filled from name when empty |
| waRowDescription | Row description (list menu) | text | no | 70, `plainText` | | | WhatsApp | Filled from summary when empty and short enough |
| waHeaderType | Header type | select | no | | `text`, `image` | | WhatsApp | Default `text` |
| waHeader | Header | text | no | 60, `plainText` | | | WhatsApp | |
| waBody | Body | textarea | no | 1024, `plainText` | | | WhatsApp | |
| fillKeyPoints | | UI | | | | | WhatsApp | `FillKeyPoints` button |
| waKeyPoints[].line | Key points › (none set) | array › text | yes | 3 to 5 rows, 60, `plainText` | | | WhatsApp | |
| waFooter | Footer | text | no | 60, `plainText` | | | WhatsApp | |
| waButtons[].label | Reply buttons › (none set) | array › text | yes | 3 rows, 20, `plainText` | | | WhatsApp | |
| waButtons[].action | (none set) | select | yes | | `bookDemo`, `otherSystems`, `talkToSales`, `openPage` | | WhatsApp | |
| waLinkLabel | Link button text | text | no | 20, `plainText` | | | WhatsApp | |
| waLink | Link (more information) | text | no | `linkRule` (path or https URL) | | | WhatsApp | Read only. Set by `itemFallbacks` |
| includeInKbase | Include in knowledge base | checkbox | no | | | | Knowledge base | Default on |
| kbAnswer | Answer | textarea | no | 600, `plainText` | | | Knowledge base | |
| kbFacts[].fact | Facts › (none set) | array › text | yes | 160, `plainText` | | | Knowledge base | |
| kbQuestions[].question | Questions › (none set) | array › text | yes | 120, `plainText` | | | Knowledge base | |
| kbSynonyms[].synonym | Synonyms › (none set) | array › text | yes | 40, `plainText` | | | Knowledge base | |
| kbLastReviewed | Last reviewed | date | no | | | | Knowledge base | Day only |

## 3. Integration categories (`integrationCategories`)

Admin label "Integration category / categories", in the Integrations group. There are no tabs; fields show in this order.

| Field | Label | Type | Required | Limit / validator | Options | Relation | Tab / group | Notes |
|---|---|---|---|---|---|---|---|---|
| name | (none set) | text | yes, unique | 60 | | | Main | |
| slug | (none set) | text | yes, unique, indexed | 60, `slugRule(capped)` | | | Main | Filled from the name when empty |
| order | (none set) | number | no | | | | Main | Default 100 |
| hubHeading | Hub heading | text | no | 60 | | | Main | |
| description | Hub intro | textarea | no | 140 | | | Main | |
| icon | Icon | select | no | | 61 values from `iconOptions` (`src/fields/icons.ts`) | | Main | Icon picker component |
| waRowTitle | WhatsApp row title | text | no | 24, `plainText` | | | Main | |
| waRowDescriptionAuto | Fill the WhatsApp row description automatically | checkbox | no | | | | Main | Default off |
| waRowDescription | WhatsApp row description | text | no | 70, `plainText` | | | Main | Written by hooks while the switch above is on |

## 4. Integration connection types (`connectionTypes`)

Admin label "Integration connection type(s)", in the Integrations group. There are no tabs.

| Field | Label | Type | Required | Limit / validator | Options | Relation | Tab / group | Notes |
|---|---|---|---|---|---|---|---|---|
| name | (none set) | text | yes, unique | 60 | | | Main | |
| slug | (none set) | text | yes, unique, indexed | 60, `slugRule(capped)` | | | Main | Filled from the name when empty |
| order | (none set) | number | no | | | | Main | Default 100 |
| badgeLabel | Badge label | text | no | 20 | | | Main | |
| description | (none set) | textarea | no | 200 | | | Main | |
| timing | (none set) | select | no | | `asItHappens`, `scheduled`, `onUpload` | | Main | |
| typicalSetup | Typical setup | textarea | no | 120 | | | Main | |
| defaultChecklist[].item | Default setup checklist › (none set) | array › text | yes | no row limit, 80 | | | Main | Shared `checklistFields()` |
| defaultChecklist[].providedBy | Provided by | select | yes | | `you`, `neuroncx`, `partner` | | Main | |
| waLine | WhatsApp line | text | no | 60, `plainText` | | | Main | |
| kbAnswer | Knowledge base answer | textarea | no | 600, `plainText` | | | Main | |

## 5. Products (`products`): fields the integration pages read

The integration pages read one product field. The block and landing filters use product ids only.

| Field | Label | Type | Required | Limit / validator | Options | Relation | Tab / group | Read by |
|---|---|---|---|---|---|---|---|---|
| name | (none set) | text | yes, unique | no length limit | | | Main | Item page hero card ("Works with …") |

Other product fields, not read by integration pages: `slug` (required, unique, `slugRule` without a length cap), `order` (default 100), `shortDescription` (Short description (one line), 160), `icon` (Icon (optional), select from `iconOptions`).

## 6. Hooks, shared field files and drafts

### Per collection

| Collection | Drafts | Read access | Collection hooks | Field-level hooks and validators |
|---|---|---|---|---|
| integrationsMaster | on | `authenticatedOrPublished` | beforeChange: `masterOneMain` | `masterSlugRule` (slug), `onlyNameToken` (labels.*), `plainText` |
| integrations | on | `liveOrAuthenticated`: visitors get published **and** Live only | beforeChange: `itemFallbacks`; afterChange: `itemRefreshCategories`; afterDelete: `itemRefreshCategoriesAfterDelete` | `itemSlugRule` (slug), `requiredForOwnPage` (heroHeading, meta.title, meta.description, slug), `linkRule` (waLink), `plainText` |
| integrationCategories | on | `publishedOrBeforeDrafts`: published, or saved before drafts existed | beforeChange: `categoryAutoRowDescription`; beforeDelete: `refuseDeleteWhileUsed` (integrations.category, pages layout.categories) | slug beforeValidate: fill from name; `slugRule(capped)`; `plainText` |
| connectionTypes | on | `publishedOrBeforeDrafts` | beforeDelete: `refuseDeleteWhileUsed` (integrations.connection) | slug beforeValidate: fill from name; `slugRule(capped)`; `plainText` |
| products | off | `anyone` | beforeDelete: `refuseDeleteWhileUsed` (integrations.products, pages layout.products) | slug beforeValidate: fill from name; `slugRule(uncapped)` |

What the hooks do:

| Hook | File | Behaviour |
|---|---|---|
| `itemFallbacks` | `integrations/hooks.ts` | Fills or sets several fields before saving. Details are in the rows below. |
| | | `meta.title`: when empty, "<primary keyword or name> with NeuronCx \| NeuronCx", cut to 60. |
| | | `meta.description`: when empty, copied from summary. |
| | | `waRowTitle`: when empty, the name cut to 24 (only if plain text). |
| | | `waRowDescription`: when empty, the summary (only if 70 or less and plain text). |
| | | `waLink`: set to `/integrations/<slug>` (Own page on) or `/integrations#<slug>`, or null when there is no slug. |
| | | `setupChecklist`: copied from the connection type's default checklist once per connection, tracked by `setupChecklistSource`. |
| `itemRefreshCategories`, `itemRefreshCategoriesAfterDelete` | `integrations/hooks.ts` | Rewrites `waRowDescription` on categories that have the automatic switch on. It lists live, published names, fitted to 70 characters. Writes go through the database adapter (`db.updateOne`, `db.updateVersion`), with no validation and no new version. |
| `categoryAutoRowDescription` | `integrations/hooks.ts` | The same fill, when the category itself is saved with the switch on. |
| `masterOneMain` | `integrations/hooks.ts` | Throws a ValidationError on `isMain` if another record already has it on. Drafts are included in the check. |
| `refuseDeleteWhileUsed` | `IntegrationTaxonomies.ts` | Blocks deleting a category, connection type or product that integrations or page blocks still use. Drafts are included in the check. |

### Shared field files

| File | Exports | Used by |
|---|---|---|
| `src/fields/whatsapp.ts` | `whatsappTab(opts)`: waRowTitle, waRowDescription, waHeaderType (opt), waHeader, waBody, waKeyPoints, waFooter, waButtons, waLinkLabel (opt), waLink | integrations (with button actions, header type, link label, and link set by hook) |
| `src/fields/faq.ts` | `faqTab({ headingFallback? })`: faqHeading (only when a fallback is given), faqs | integrations (no heading), integrationsMaster (with heading) |
| `src/fields/kbase.ts` | `kbaseTab()`: includeInKbase, kbAnswer, kbFacts, kbQuestions, kbSynonyms, kbLastReviewed | integrations, integrationsMaster |
| `src/fields/validators/plainText.ts` | `plainText`, `checkPlainText`, `plainTextProblem`. Rejects `* _ # \` [ ]`, the em dash and `>` at a line start. Runs the built-in text, textarea or array check first. | All four collections except products (field list in sections 1 to 4) |
| `src/fields/link.ts` | `link()`: a group with `type` (radio, `reference` or `custom`, default `reference`), `newTab` (checkbox), `reference` (relationship to pages or posts, required when type is reference), `url` (text, required when type is custom) | master hero.secondaryCta.link, apiCard.link, cta.link; item cta.link. All with label and appearance turned off. |
| `src/fields/icons.ts` | `iconField()` | integrationCategories, products |
| `src/collections/integrations/seo.ts` | `integrationSeoTab({ forItems })`, `seoCheckField(mode)` | integrations, integrationsMaster |
| `src/collections/integrations/checklist.ts` | `checklistFields()`, `PROVIDED_BY` | integrations (setupChecklist), connectionTypes (defaultChecklist) |
| `src/collections/integrations/admin/*` | `SeoCheck`, `WhatsappPreview`, `FillKeyPoints` (UI), `cutLine` | integrations; SeoCheck also on master |

## 7. Label templates with a {name} token

These are the master record's Item page labels. The schema sets no `defaultValue` on any of them. When one is empty, the item page falls back to the text in `DEFAULT_LABELS` in the website's `src/app/(frontend)/integrations/[slug]/page.tsx`. That text matches the "For example" text in each field's admin description.

| Field | Admin label | Limit / validator | Default (admin example and website fallback) | Current value on the main record |
|---|---|---|---|---|
| labels.statusTable | Status table | 70, `onlyNameToken` | What moves between {name} and NeuronCx | What moves between {name} and NeuronCx |
| labels.edgeCases | Edge cases | 70, `onlyNameToken` | When things do not go to plan (no token) | How {name} errors and repeats are handled |
| labels.setup | Setup | 70, `onlyNameToken` | What it takes to connect {name} | What you need to connect {name} |
| labels.related | Related | 70, `onlyNameToken` | Other systems like {name} | Other integrations to use with {name} |

The main record is "WhatsApp CRM Integration for Your Systems | NeuronCx": Is main on, published.

Item `headingOverrides.statusTable`, `.edgeCases`, `.setup` and `.related` take the same four headings per item. The website replaces `{name}` in them too, but the schema has no validator or description mentioning the token.

## 8. Unused, duplicated or inconsistent

**Unused.** These fields aren't read by the website or the knowledge base sync.

1. **WhatsApp fields:**
   - every `wa*` field on items and the master;
   - `waRowTitle`, `waRowDescription` and `waRowDescriptionAuto` on categories;
   - `waLine` on connection types.

   Only the admin preview and the hooks read them.
2. **Knowledge base fields:** every knowledge base tab field on items and the master, plus `kbAnswer` on connection types. `src/rag/sources.ts` indexes only pages and posts.
3. **`meta.image`** on items and the master.
4. **Master `meta.title` and `meta.description`:** only the `/integrations-preview` route reads them. A CMS page using the Integrations landing block takes its search title from the page itself.
5. **Master `slug`:** only the slug clash check reads it. The landing block picks a record by id or by Is main.
6. **Master `labels` on records other than the main one:** these fields are editable on every record, but only the Is main record's are ever read.
7. **`primaryKeyword` and `secondaryKeywords`:** only the admin SEO check and the meta title fallback read them. Neither is output on the site.
8. **Categories:** the website doesn't read `icon` or `slug`. Filters use ids.
9. **Connection types:** the website doesn't read `description`, `timing` or `typicalSetup`. `defaultChecklist` is read only by the prefill hook.
10. **Products:** `slug`, `shortDescription` and `icon` aren't read by integration pages. Customer pages read `shortDescription` and `icon`.

**Duplicated**

11. **WhatsApp row fields:** `waRowTitle` and `waRowDescription` are defined twice, with the same names and limits (24 and 70): in `whatsapp.ts` for items, and inline on categories.
12. **Link that appears once a label has text:** this pattern is built twice, as `linkShownWith()` in the master and inline in the item Page tab.
13. **Item page headings:** the same four headings exist as master `labels` and item `headingOverrides`, with different validation (see 17).
14. **Call to action:** a `cta` group of the same shape (label plus link) exists on the master Closing tab and the item Page tab.
15. **Slug format check:** the lowercase-and-dashes regex appears twice: `slugFormat` in `IntegrationTaxonomies.ts` and `masterSlugRule` in `hooks.ts`.
16. **`description` field:** it means different things in two collections. Categories label it "Hub intro" (textarea, 140). Connection types leave it unlabelled (textarea, 200).

**Inconsistent**

17. **Heading validation:**
    - Master `labels.*` use `onlyNameToken` but not `plainText`.
    - The master section headings use `plainText`.
    - Item `headingOverrides.*` use neither.
18. **Item `slug`:**
    - It has no lowercase-and-dashes check, unlike master and taxonomy slugs.
    - It isn't filled from the name, unlike taxonomy slugs.
    - It's optional unless Own page is on.
19. **Products against the other two taxonomies:**
    - Products has no length cap on name and slug; the others cap both at 60.
    - Products has drafts off; the others have drafts on.
    - Products read access is `anyone`; the others use `publishedOrBeforeDrafts`.
    - Products sits outside the Integrations admin group.
20. **Read access differs across the five collections:**
    - Items: published and Live.
    - Master: authenticated or published.
    - Categories and connection types: published or no `_status`.
    - Products: anyone.
21. **Field naming:** the master uses `h1` and `subheading`, while items use `heroHeading` and `heroSubheading` for the same role.
22. **Admin descriptions that no longer match the built pages:**
    - Item `glance` says "for the strip under the page hero". The page shows these points in the hero card.
    - Item and master `cta` say "The closing button". Both pages also use it for the hero button.
    - The master `labels.edgeCases` example has no `{name}`, while the other three examples do.
23. **Limits for similar text:**
    - `statusFlow[].whatHappens` is 120, while `whenFeedsGoWrong[].whatHappens` and `edgeCases[].whatWeDo` are 160.
    - `apiCard.heading` is 60, while the other section headings are 70.
24. **Row limits:**
    - `fiveThings` and `glance` have row limits.
    - `whenFeedsGoWrong`, `statusFlow`, `edgeCases`, `setupChecklist` and the knowledge base lists have none.
25. **FAQ heading:** the master has `faqHeading`. Items have no FAQ heading field, so the item page uses fixed text ("Questions about {name}").
26. **Main record name:** the record's `name` is "WhatsApp CRM Integration for Your Systems | NeuronCx", a search-title style value. The field's description asks for an editor label such as "Main integrations page". This is a data point, not a schema issue.
