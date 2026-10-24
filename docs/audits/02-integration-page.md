# Audit 02: how the website renders /integrations/[slug]

Read-only audit, 15 Oct 2026. Sources:

- **Code:** `neuroncx-website` at `de52280`, the same as `main`, which is what Netlify serves.
- **Live page:** the HTML of https://neuroncx.netlify.app/integrations/docpulse, fetched for this audit.
- **Data:** the published data the page reads, from the public production CMS API (`/api/integrations`, `/api/integrationCategories`, `/api/integrationsMaster`).

Field names below are the CMS paths listed in [01-cms-fields.md](01-cms-fields.md). "Item" means the integration item being shown (`integrations` collection). "Master" means the Integrations master record with Is main on.

## 1. Route, page file and components

| Part | File (in `neuroncx-website`) | Role |
|---|---|---|
| Route | `src/app/(frontend)/integrations/[slug]/page.tsx` | The whole page: data loading, metadata, markup and an inline `<style>` block. Rendered on demand (`ƒ` in the build output); no `generateStaticParams`. |
| Layout | `src/app/(frontend)/layout.tsx` | Site layout: fonts, `globals.css`, `<Header />`, page, `<Footer />` |
| Header | `src/Header/Component.tsx`, `Component.client.tsx`, `AnnouncementBar.tsx`, `headerStyles.ts` | Shared site header (section 6) |
| Footer | `src/Footer/Component.tsx` | Shared site footer (section 6) |
| 404 | `src/app/(frontend)/not-found.tsx` | Shown by `notFound()` for any slug that doesn't qualify |
| FAQ section | `src/blocks/FAQ/Component.tsx` | Shared FAQ block (the Pages block), used here directly |
| FAQ answer text | `src/components/RichText` | Renders each answer, called by the FAQ block with gutter and prose off |
| Closing section | `src/blocks/ClosingCTA/Component.tsx` | Shared closing block, used here directly |
| Master record loader | `src/blocks/IntegrationsLanding/Component.tsx` (`loadMaster`) | Loads the master with Is main on, depth 2 |
| CMS fetch | `src/utilities/cms.ts` (`getMany`) | REST request to the CMS. Cached 60 s (`revalidate: 60`) with tags |
| Link and FAQ helpers | `src/utilities/cmsValues.ts` (`hrefOf`, `paragraph`) | Turns a CMS link group into a URL; wraps a plain-text answer as a rich text paragraph |
| Item page link | `src/utilities/integrations.ts` (`integrationHref`) | `/integrations/<slug>` for a Live item with Own page on, else null |
| Media | `src/utilities/media.ts` (`pickMedia`) | Resolves a media upload to `src`, size and `unoptimized` |
| Next.js | `next/image`, `next/link`, `next/navigation` (`notFound`) | |
| Global styles | `src/app/(frontend)/globals.css` | `--ncx-*`, `--wash` and `--g1`…`--g4` colour tokens, and `.ncx-container` |

### Which slugs render

`loadItem(slug)` asks the CMS for an item matching all of these, depth 2:

- `slug` equals the URL slug
- `status` is `live`
- `_status` is `published`
- `hasOwnPage` is true

Anything else gets `notFound()`. The CMS read access for visitors also returns only items that are published and Live.

The page then loads two more things in parallel:

- the master record (`loadMaster()`);
- the related items (`loadRelated()`, section 4).

## 2. Section by section, top to bottom

The live DocPulse page currently renders:

> header › hero › What moves › Edge cases › Setup › FAQ › Related › Closing › footer

The Example section is skipped, because DocPulse has no chat example.

### 2.0 Metadata (`<head>`)

| Output | Source | Live DocPulse |
|---|---|---|
| `<title>` | Item `meta.title`, else item `heroHeading`, else item `name` | "DocPulse Integration for WhatsApp Booking \| NeuronCx" (`meta.title`) |
| `meta description` | Item `meta.description`, else item `summary` | `meta.description` |
| Open Graph, canonical | Not set by this page. The layout's site-wide defaults apply. | `og:title` "Blog", `og:description` "An open-source blog built with Payload CMS and Next.js.", `og:image` `http://localhost:3000/website-template-OG.webp`. No canonical link. |

Not used:

- item `meta.image`, `primaryKeyword` and `secondaryKeywords`;
- the master `meta.*`.

### 2.1 Hero

| Piece on the page | Source | Hardcoded? |
|---|---|---|
| Breadcrumb "Integrations" | none | Yes: text "Integrations", link `/integrations` |
| Breadcrumb current page | Item `name` | |
| First tag | Item `category` › category `name` | |
| Second tag | Item `connection` › connection type `badgeLabel`, else `name` | |
| H1 | Item `heroHeading`, else item `name` | |
| Subheading | Item `heroSubheading`, else item `summary` | |
| Button label | Item `cta.label` (only when its link resolves), else master `cta.label`, else "Talk to our team" | Fallback text "Talk to our team" |
| Button link | Item `cta.link`, else master `cta.link`, else `/contact` | Fallback `/contact` |
| Card logo | Item `logo`; without a logo, the first letter of item `name` | |
| Card name | Item `name` | |
| Card tagline | Item `tagline` | |
| Card "Works with …" | Item `products` › product `name`, joined with commas | Prefix "Works with" |
| At a glance rows | Item `glance[].title` and `glance[].line` | List label "At a glance" (screen readers only) |

Fields that exist but aren't shown:

- Item: `status`, `featured`, `order`, `slug` (it's only the URL), `primaryKeyword`, `secondaryKeywords`, `meta.image`.
- Category: `hubHeading`, `description`, `icon`.
- Connection type: `description`, `timing`, `typicalSetup`.

### 2.2 What moves (status table)

| Piece | Source | Hardcoded? |
|---|---|---|
| Heading | Item `headingOverrides.statusTable`, else master `labels.statusTable`, else "What moves between {name} and NeuronCx". `{name}` is replaced by item `name`. | Fallback text |
| Column 1 title | none | Yes: "When" |
| Column 2 title | none, plus item `name` | Yes: "In {name}". Shown only if at least one row has `inPartner`. |
| Column 3 title | none | Yes: "What happens in NeuronCx" |
| Rows | Item `statusFlow[].event`, `statusFlow[].inPartner` (as a pill), `statusFlow[].whatHappens` | |

The section is hidden when `statusFlow` has no rows. Every `statusFlow` field is shown.

### 2.3 Example (between What moves and Edge cases)

| Piece | Source | Hardcoded? |
|---|---|---|
| Heading | none | Yes: "An example conversation" |
| Messages | Item `chatExample[].label`, `.text`, `.time` | |
| Bubble side and colour | Item `chatExample[].sender`, used only as a CSS class. `customer` sits on the right in green; the other two values look the same. | |

The section is hidden when `chatExample` is empty, as it is for DocPulse. The `sender` value is never shown as text.

### 2.4 Edge cases

| Piece | Source | Hardcoded? |
|---|---|---|
| Heading | Item `headingOverrides.edgeCases`, else master `labels.edgeCases`, else "When things do not go to plan" | Fallback text |
| Rows | Item `edgeCases[].situation` and `edgeCases[].whatWeDo` | |

The section is hidden when there are no rows. Every field is shown.

### 2.5 Setup

| Piece | Source | Hardcoded? |
|---|---|---|
| Heading | Item `headingOverrides.setup`, else master `labels.setup`, else "What it takes to connect {name}" | Fallback text |
| Step numbers | CSS counter (01, 02 …) | |
| Step text | Item `setupChecklist[].item` | |
| "From …" | Item `setupChecklist[].providedBy`: `you` shows "You", `neuroncx` shows "NeuronCx", `partner` shows item `name` | Yes: the word "From" and the You / NeuronCx mapping. These are fixed in the page, not taken from the CMS option labels. |

Fields that exist but aren't shown:

- item `setupChecklistSource` (hidden, internal);
- connection type `typicalSetup`, `timing`, `description` and `defaultChecklist` (the checklist is shown only after the hook has copied it onto the item).

### 2.6 FAQ

| Piece | Source | Hardcoded? |
|---|---|---|
| Heading | none, plus item `name` | Yes: "Questions about {name}". The master `faqHeading` isn't used here. |
| Questions | Item `faqs[].question` | |
| Answers | Item `faqs[].answer`, wrapped in one rich text paragraph (`paragraph()`) and rendered by `RichText` | |
| Open or closed | none | Every item starts closed: `defaultOpen` isn't passed |
| Background | none | Block default `cloud` |
| FAQPage structured data | Questions and answers | `emitSchema` is on |

### 2.7 Related

| Piece | Source | Hardcoded? |
|---|---|---|
| Heading | Item `headingOverrides.related`, else master `labels.related`, else "Other systems like {name}" | Fallback text |
| Cards | See section 4 | |
| Card logo | Related item `logo`; without one, the first letter of its `name` | |
| Card name and line | Related item `name` and `summary` | |
| Card link | `/integrations/<slug>` when the related item is Live with Own page on; otherwise the card isn't a link | |

Related items' `tagline`, `category` and `connection` aren't shown.

### 2.8 Closing

| Piece | Source | Hardcoded? |
|---|---|---|
| Heading | Master `closing.heading`, else "Connect the systems you already use" | Fallback text |
| Subheading | Master `closing.subheading` | |
| Button | The same label and link as the hero button (2.1) | Arrow icon. Rendered as a plain `<a>`, not `next/link`. |

The closing block's secondary button and tagline props exist but aren't passed.

### 2.9 Item fields not used anywhere on the page

- `status`, `featured` and `order`. `status` is only a filter, and `order` is only the sort for related items.
- `primaryKeyword`, `secondaryKeywords` and `meta.image`.
- `setupChecklistSource`.
- Every WhatsApp field: `waRowTitle`, `waRowDescription`, `waHeaderType`, `waHeader`, `waBody`, `waKeyPoints`, `waFooter`, `waButtons`, `waLinkLabel`, `waLink`.
- Every knowledge base field: `includeInKbase`, `kbAnswer`, `kbFacts`, `kbQuestions`, `kbSynonyms`, `kbLastReviewed`.

From the master, the page reads only `labels.*`, `cta.*` and `closing.*`.

## 3. The three things seen on the live DocPulse page

### 3.1 H1 "Book DocPulse appointments on WhatsApp"

It comes from the item's **Hero heading** field (`heroHeading`). The code is `d.heroHeading || d.name`; nothing else feeds the H1.

The published DocPulse record shows the three fields are separate:

| Field | Value | Where it shows |
|---|---|---|
| `heroHeading` | Book DocPulse appointments on WhatsApp | H1 |
| `tagline` | WhatsApp booking for DocPulse hospitals | Hero card, under the name |
| `summary` | Patients book, cancel and reschedule DocPulse appointments on WhatsApp. Every change in DocPulse updates their record. | Subheading, because `heroSubheading` is empty |

### 3.2 Category tag "EMR and Healthcare Systems"

It's the **category record's `name`**, not hardcoded. The page prints `category.name` from the item's `category` relationship, and the text "EMR and Healthcare Systems" doesn't appear anywhere in the website code.

In production, DocPulse's category record (id `6acdc57bce270a9cadbd7003`) is now named "EMR and Healthcare Systems", with slug `emr-and-healthcare-systems-integrations`. In the local copy taken on 14 Oct, the same record was "Hospital systems" with slug `hospital-systems`, so it was renamed in the CMS after that.

### 3.3 FAQ answers not visible

The answers are being read; **each item is closed by default.**

- Each FAQ is a native `<details class="faq-item">` with the question in `<summary>`. The FAQ block adds the `open` attribute only when an item has `defaultOpen`, and this page doesn't pass it.
- The live HTML has 4 `<details>` elements, none with `open`. Each one contains its full answer text.
- The answers also appear in the FAQPage structured data.
- Clicking or tapping a question opens it, using native browser behaviour with no JavaScript. The "+" marker changes to "–" while open.

## 4. How the related section picks its items

The heading on the live page, "Other integrations similar to DocPulse", comes from the master record's `labels.related`. Its current production value is "Other integrations similar to {name}".

`loadRelated(item)` picks the cards like this:

1. **Hand-picked first.** It takes item `related` (Page tab), keeping only entries that came back populated and have status Live. Visitors can't read drafts or non-Live items, so those come back as bare ids and are dropped. If at least one entry is left, those entries (up to 3) are shown, in the editor's order, and nothing else is added.
2. **Otherwise, the same category.** If nothing is left from step 1, it fetches up to 3 other items with:
   - the same `category`;
   - status Live and published;
   - a different id from the current item;
   - sorted by `order`, then `name`.

   These don't need Own page on.
3. If both steps return nothing, the section is hidden.

### When fewer than 4 are set

- The page **never shows more than 3** related items. The CMS field `related` allows at most 3 rows; the code keeps at most 3 hand-picked items; and the category query is limited to 3.
- **Hand-picked, 1 to 3 Live items:** only those show. The rest isn't filled from the category.
- **Hand-picked, but none of them Live and published:** it falls back to the category list.
- **Nothing hand-picked:** up to 3 from the category, as many as exist.
- **Card layout:** the cards sit in a grid that fills columns at least 260px wide, so 1 or 2 cards leave the rest of the row empty.

**DocPulse today:** `related` is empty, and its category has two published Live items, DocPulse and EkaCare. So the section shows **one card, EkaCare**. It isn't a link, because EkaCare has Own page off.

## 5. Styling and motion already in the project

| Item | What exists |
|---|---|
| Tailwind | Tailwind CSS 4 (`tailwindcss` ^4.1.18, `@tailwindcss/postcss`) with a legacy config file. `globals.css` starts with `@import 'tailwindcss'`, `@import 'tw-animate-css'` and `@config '../../../tailwind.config.mjs'`, uses `@theme` and `@layer`, and loads `@tailwindcss/typography`. |
| shadcn-style UI | `components.json`, `class-variance-authority`, `clsx`, `tailwind-merge`, and Radix (checkbox, label, select, slot) |
| CSS modules | 3 files: `BentoGrid`, `IntegrationsMarquee`, `OptionCard` (under `src/components/blocks/`) |
| Inline `<style>` blocks | 46 components use `<style>{\`...\`}</style>` with `ncx-*` class names and the `--ncx-*` tokens from `globals.css`. Most site blocks work this way. |
| This page | Inline `<style>` only, with `.ncx-iitem*` classes. No Tailwind utilities except the layout-level `.ncx-container` and the tokens. |
| Animation library | `motion` ^13.5.1, the successor package to Framer Motion, imported as `motion/react` in 8 files: the `Agentic*` blocks and `CaseStudyGrid/TiltAnchor.tsx`. `framer-motion` and GSAP aren't installed. `tw-animate-css` is loaded globally. |
| Animation on this page | One CSS keyframe animation: `ncxDrift`, the slow drifting gradient behind the hero. CSS transitions: button background, related-card border, FAQ "+" colour, closing button hover. No JavaScript animation. |
| `prefers-reduced-motion` | Mentioned in 30 files under `src`: 25 block components, 2 page routes (customers and integrations), `Header/headerStyles.ts`, `IntegrationsMarquee.module.css`, and one README. 6 of them also check it in JavaScript with `matchMedia` (AgenticEpisode, AgenticFlowDemo, AgenticStats, HeroStack, JourneyEngine, PlatformLayersTwo). `globals.css` has no global rule. |
| `prefers-reduced-motion` on this page | The hero drift stops under reduced motion. The FAQ block turns off its "+" transition, and the closing block turns off its button transition. The page's own button-background and related-card-border transitions have no reduced-motion rule. |

## 6. Header and footer

Both are **shared site components**, rendered once by the frontend layout around every page. Nothing in the integration page adds or changes them.

| Component | How it works |
|---|---|
| Header | `src/Header/Component.tsx` (server) loads the CMS global `header` and passes it to `Component.client.tsx`. The client decides `is-stuck` and `on-dark` on each route by checking what the header is sitting on, so it adapts to this page's light hero without page-specific code. `AnnouncementBar.tsx` and `headerStyles.ts` belong to it. |
| Footer | `src/Footer/Component.tsx` (server) loads the CMS globals `footer` and `header`. |
| Admin bar | Commented out in the layout |
