# category_definition.md

---

## collection: categoryDefinitions (admin label "Category definitions")
payload_slug: categoryDefinitions (not built yet)
config_file: src/collections/CategoryDefinitions/index.ts (planned)
own_page_route: /[slug] at the site root, such as /episodic-crm (planned, see open item 2)
hub_page: none. Entries are linked from the home page, the CRM hub and the blog
shared_groups: six of seven (no WhatsApp), see fields_reference.md
status: design only, 13 Oct 2026. Nothing in this file is built yet

# Category definitions

Read this file before adding or editing a category definition, writing a "what is" page, choosing which definition a home page block shows, writing the knowledge base text for a definition, or building or changing the collection. Read `fields_reference.md` alongside it for the shared field groups.

## 1. What this collection is

One entry is one category NeuronCx wants to own, explained against the older way of doing the same job. Every entry has two sides: the old way and the new way.

| Old way | New way |
| --- | --- |
| Sales CRM | Episodic CRM |
| Task automation | Care coordination |
| Legacy customer success | Forward-deployed engineering |

People who read it:

- Buyers searching "what is an episodic CRM" or "forward deployed engineer", who have not heard of NeuronCx yet.
- Operations and CX heads who already use a sales CRM and need to see why it doesn't fit how they work.
- The knowledge base, so the virtual agents can explain these ideas when asked.

Each entry does three jobs:

1. **Define the term** in one paragraph that can stand alone as a search snippet.
2. **Make the old way look dated**, fairly and without naming a competitor.
3. **Hand over to the product**, with one line linking the idea to NeuronCx.

The positioning these entries support: NeuronCx is an agentic CRM for episodic engagements. Most CRMs follow a straight line, contact to opportunity to conversion. Real relationships repeat, and NeuronCx is built for that.

## 2. What belongs here, and what doesn't

| Collection | One entry is | Example |
| --- | --- | --- |
| **Category definitions (this file)** | One idea, explained as old way vs new way | Episodic CRM vs sales CRM |
| B2C CRM | One capability of the CRM | Customer 360, Segments |
| Episodic engagements | One type of episode the CRM runs, as a template | Maternity care, admissions cycle |
| Micro-apps swarm | One agent | Billing agent, front desk agent |
| Omnichannel CX | One channel or conversation capability | WhatsApp assistant, voice bot |
| Customers | One client story | Ovum Hospitals |

The test: if the entry would still make sense on a page that never mentions NeuronCx, it belongs here. If it describes something NeuronCx's software does, it belongs in that collection, and this collection links to it.

Example of the split: "What counts as an episode" (a booking, an enrolment, an order, a course of service) is generic, so it lives here. "Maternity care", with its own milestones and dates, is a template NeuronCx runs, so it lives in episodic engagements.

## 3. Field design

### Shared groups

| Group | Used | How category definitions fill it |
| --- | --- | --- |
| Core | Yes | `name` is the new way, such as "Episodic CRM". `isUSP` is not used. `featured` marks the entries the home page may pull |
| Card | Yes | `tagline`, such as "CRM built around episodes, not deals". `summary`, one line on the difference. `icon` from the shared library |
| Detail and SEO | Yes | `description` is a longer explanation for the knowledge base and meta fallback. `whoItsFor` names the kinds of organisations the idea fits |
| Own page | Yes | `hasOwnPage` defaults to **on**, because every entry is a search page. `heroHeading` is the question, such as "What is an episodic CRM?". `useCases` hold one short example per vertical. `benefits` and `howItWorks` are optional and usually left empty. `cta` and `related` as normal |
| FAQ | Yes | Up to 6. The questions people search: "how is X different from Y", "is X only for healthcare", "do I need to replace my current CRM" |
| WhatsApp | **No** | These are ideas, not something the assistant lists in a menu. If someone asks on WhatsApp, the knowledge base answers |
| Knowledge base | Yes | Every published entry is included |

### Fields only category definitions have

| Field | Type | Placement | Notes |
| --- | --- | --- | --- |
| `oldWayName` | text, 40, required | Definition tab | The old way, such as "Sales CRM". Used as the left column heading |
| `newWayName` | text, 40, required | Definition tab | Usually the same as `name`. Used as the right column heading |
| `definition` | textarea, 360, required, plain text | Definition tab | About 55 words. Starts "An episodic CRM is…". The search snippet target. Must make sense on its own |
| `comparisonRows` | array, 4 to 8 rows: `dimension` (40), `oldWay` (120), `newWay` (120) | Definition tab | The old vs new table. Same `dimension` wording style across entries ("Built around", "Ends when") |
| `whatCountsHeading` | text, 60 | Definition tab | Such as "What counts as an episode". Leave empty to hide the section |
| `whatCounts` | array, up to 6: `label` (40), `example` (120), `whereYouSeeIt` (80) | Definition tab | The example cards |
| `anatomyHeading` | text, 60 | Definition tab | Such as "What's inside an episode" |
| `anatomy` | array, up to 6: `part` (40), `explanation` (160) | Definition tab | The parts that make up the new way |
| `whyNow` | array, up to 3: `heading` (60), `text` (240) | Page tab | Why the old way breaks today |
| `proofPoints` | array, up to 4: `stat` (60), `claim` (160), `sourceName` (80), `sourceUrl` (text, URL check), `sourceDate` (date) | Page tab | Outside facts only, each with its source. Shown with the source linked |
| `maturity` | select: live, pilot, vision. Required, default vision | sidebar | How much of the idea NeuronCx runs for clients today. See section 4 |
| `caveatText` | text, 120, default "Now in pilot with care providers" | sidebar | Shown when `maturity` is pilot. Editable per entry |
| `bridgeLine` | text, 200 | Page tab | One line linking the idea to NeuronCx. The only place in the entry that sells |
| `crmFeatures` | relationship to `crmFeatures`, hasMany | Page tab | Features that deliver this idea |
| `episodicEngagements` | relationship, hasMany | Page tab | Added once that collection exists |
| `microApps` | relationship, hasMany | Page tab | Added once the micro-apps swarm collection exists |
| `customers` | relationship to `customers`, hasMany | Page tab | Clients working this way. Follows the customers collection's `showName` rule |

Admin: a "Positioning" group in the sidebar. Drafts on, no autosave. Tabs: Card, Definition, Page, FAQ, Knowledge base, SEO.

## 4. What is visible, and when

All rows assume the entry is published. Drafts are never visible.

| Maturity | hasOwnPage | Own page | Cards and blocks | Knowledge base |
| --- | --- | --- | --- | --- |
| live | on | yes, in sitemap | yes, linked | yes |
| live | off | no, 404 | yes, no link | yes |
| pilot | either | only if on, with `caveatText` under the bridge line | yes, with a "Pilot" tag | yes, `kbAnswer` must say it is in pilot |
| vision | either | no | no | no |

Visitors and the public API must never receive vision entries. Enforce this in the collection's read access, not only in the website.

`maturity` describes NeuronCx's delivery, not the idea. The definition, table and examples are always written as plain fact. The caveat sits only next to the bridge line and any section that describes what NeuronCx does.

Unlike other collections, `hasOwnPage` should almost always be on. Turn it off only for a short-lived entry used inside a single home page block.

## 5. Writing rules

General:

- Plain, human language. No em dashes. No filler such as "seamless", "robust", "end-to-end", "paradigm shift", "revolutionary" or "next-generation".
- Write the definition, table and examples as if for a neutral glossary. Keep the pitch for `bridgeLine`.
- Describe the old way fairly. A sales CRM is good at what it was built for. The point is that it was built for something else. If the old-way column reads like a straw man, rewrite it.
- Never name a competitor, in any field.
- Avoid "AI-native" in body copy. Use it only where it is the search term being targeted, such as the meta title or one FAQ.
- Every outside number goes in `proofPoints` with its source. No unsourced statistics anywhere else.
- Write for any vertical. Put patients, students and guests in `useCases`, not in the definition.

By field:

| Field | Rule | Example (Episodic CRM) |
| --- | --- | --- |
| `name` | The term people search | Episodic CRM |
| `tagline` | The difference in a few words, up to 45 characters | Built around episodes, not deals |
| `summary` | Old way and new way in one line, up to 120 characters | Sales CRMs follow a deal to the close. An episodic CRM follows a customer through every period of service. |
| `heroHeading` | The question, up to 70 characters | What is an episodic CRM? |
| `definition` | "An X is…", about 55 words, stands alone | See section 6 |
| `comparisonRows` | Short, parallel phrases on both sides | Ends when / The deal is won / The service is complete |
| `bridgeLine` | Links the idea to NeuronCx, one sentence or two | NeuronCx's agents run each episode for you, booking, taking payment and following up, which is why we call it an agentic CRM for episodic engagements. |

## 6. Worked entry: Episodic CRM vs sales CRM

Taken from the home page Section 2 drafts in Notion. This is the first entry to build.

**definition** (57 words)

> An episodic CRM is a customer relationship management system built around episodes: a period of service with a clear start, a plan and an end, such as an admission cycle, a hotel stay or a course of treatment. Every conversation, booking, payment and follow-up is tied to the episode it belongs to, not treated as a new lead.
> 

**comparisonRows**

| Dimension | Sales CRM | Episodic CRM |
| --- | --- | --- |
| Built around | A lead or deal | An episode of service |
| Ends when | The deal is won | The service is complete |
| A follow-up call is | Logged as a new lead | Added to the original episode |
| Timing follows | Sales stages | Key dates in the episode, like a booking or delivery date |
| Repeat customers get | A new deal each time | One history of every episode |
| Many locations mean | Separate pipelines per team | One record across every location |
| You can see | Which campaign closed the deal | What each episode earned from start to finish |

**whatCounts** ("What counts as an episode")

| Label | Example | Where you see it |
| --- | --- | --- |
| A booking | From reservation to the visit and the feedback afterwards | Clinics, hotels, salons, service centres |
| An enrolment | From the first enquiry to the first day | Colleges, schools, training institutes |
| An order | From purchase to delivery and the next order | Retail, D2C brands, pharmacies |
| A course of service | Several visits or sessions under one plan | Treatments, therapy, fitness, maintenance contracts |

**anatomy** ("What's inside an episode")

| Part | Explanation |
| --- | --- |
| A start | An enquiry, order or booking opens the episode |
| A key date | The date everything is planned around |
| A plan | The steps, reminders and check-ins scheduled around that date |
| An owner | The person or team responsible, at whichever location the customer visits |
| An end, and a next time | The episode closes when the service is complete, and the history carries into the next one |

**whyNow**

1. **Relationships repeat.** A patient returns for consultations, tests and follow-ups. A student moves from enquiry to enrolment to the next term. A straight-line pipeline has nowhere to put the second visit.
2. **Every channel keeps its own piece.** WhatsApp, phone lines, payment links and branch systems each hold part of the story, so the same person shows up as several records.
3. **Agents can now do the follow-up.** Once each episode carries a plan, an agent can send the reminder, take the payment and pass anything that needs judgement to a person.

**maturity:** pilot for the care copilot and milestone parts, live for the single record and episode history. Confirm before publishing (open item 4).

**bridgeLine:** NeuronCx's agents run each episode for you, booking, taking payment and following up, which is why we call it an agentic CRM for episodic engagements.

**FAQ starters:** How is an episodic CRM different from a sales CRM? / Is an episodic CRM only for healthcare? / Do I have to replace my current CRM? / What happens when an episode ends? / Can one customer have more than one episode at a time?

## 7. Required entry: legacy customer success vs forward-deployed engineering

James asked for this section in category definitions. Notion has only the starting point: the primer page note "it's easier to design harness engineering for client-dedicated engineering than for abstracted SaaS assumptions", and a mention of forward-deployed engineering as a product area in Product.md. **Everything below is a draft for James to correct before it goes into the CMS.**

**name:** Forward-deployed engineering
**oldWayName:** Legacy customer success
**heroHeading:** What is forward-deployed engineering?

**definition** (draft, 52 words)

> Forward-deployed engineering is a way of supporting customers in which the supplier's engineers work inside the customer's own setup, building and changing workflows, integrations and agents to fit how that organisation actually runs. It is measured by the work that goes live and the results it moves, not by check-in calls or renewal scores.
> 

**comparisonRows** (draft)

| Dimension | Legacy customer success | Forward-deployed engineering |
| --- | --- | --- |
| Who shows up | A customer success manager | An engineer who works with your team |
| What they do | Check-ins, quarterly reviews, health scores | Build and change workflows, agents and integrations in your setup |
| When the product doesn't fit | A ticket and a wait for the roadmap | The engineer builds what's missing for you |
| Your own processes are | Fitted to the product's defaults | Written into the system: your locations, services and teams |
| Success is measured by | Renewal and satisfaction scores | Workflows live and results moved |
| Built on | One shared product for every customer | A setup dedicated to you |

**whatCounts** ("What a forward-deployed engineer does", draft)

| Label | Example |
| --- | --- |
| Maps the work | Sits with the call centre or front desk to see how enquiries, bookings and follow-ups really run |
| Connects the systems | Links the hospital system, lab system, payment gateway and phone lines you already have |
| Builds the agents | Sets up the booking, billing and follow-up agents around your own services and rules |
| Stays after go-live | Tunes prompts, workflows and reports as your team uses them |

**anatomy** ("What makes it work", draft)

| Part | Explanation |
| --- | --- |
| A dedicated setup | Your own instance, so changes for you never wait on every other customer |
| A model of your organisation | Your locations, services, teams and rules, which every agent works from |
| Engineers on your side | People who can change the system, not just report problems with it |
| Shared measures | Agreed outcomes, such as bookings completed or calls answered, reviewed together |

**whyNow** (draft, sources to be read before quoting)

1. **Organisations are building instead of buying.** Retool's 2026 build-vs-buy report says 35% of enterprises have already replaced some SaaS with custom software.
2. **Building has become faster.** Forrester describes a new class of application generation platforms that shorten build time.
3. **Agents need fitting, not just switching on.** An agent that books, bills and follows up has to know the organisation's own services, prices and rules. That is engineering work, not a settings page.

**proofPoints** (to confirm)

- Retool 2026 Build vs. Buy Report, Business Wire, 17 Feb 2026: https://www.businesswire.com/news/home/20260217548274/en/Retools-2026-Build-vs.-Buy-Report-Reveals-35-of-Enterprises-Have-Already-Replaced-SaaS-With-Custom-Software
- Forrester, "The rise of application generation platforms": https://www.forrester.com/blogs/the-rise-of-application-generation-platforms/

**maturity:** to confirm with James.

**bridgeLine** (draft): Every NeuronCx client gets engineers who build in their own setup, so the CRM and its agents fit how your organisation already works.

**Questions for James:**

1. Is "forward-deployed engineering" the public term, or a team name? Hyphenated or not?
2. Which client engagements show it best? Ovum's advisory work and the client-hosted patient portal are candidates, subject to the customers collection's `showName` rule.
3. Is single-tenant SaaS part of this entry, or its own entry (candidate 5)?
4. Is it a paid service, or part of every subscription? The bridge line depends on the answer.

## 8. Where entries appear

| Place | How entries are picked |
| --- | --- |
| /[slug] own page | One page per entry with `hasOwnPage` on |
| Home page Section 2 ("What is an episodic CRM?") | A new Category Definition block, pointed at one entry. Shows the definition, table, "what counts" cards and anatomy, each with a show or hide toggle. The home page and the own page then share one source |
| /crm-for-agentic-workflows (hub) | The same block, usually showing only the definition and table, linking to the own page |
| B2C CRM and episodic engagement pages | "Read the full guide" link, from the relationships |
| Blog articles | Calls to action link to the entry |
| Knowledge base | Every published live or pilot entry |

Cards and blocks link to the own page only when `hasOwnPage` is on.

### Own page layout (/[slug])

Light theme only, matching the integration, customer and CRM feature pages. In this order:

1. **Hero** on the light wash: an eyebrow ("Category"), `heroHeading` as the H1, `definition` as the lead paragraph directly under it (so search engines can lift it), and the `cta`.
2. **Old vs new table**, from `comparisonRows`, under an H2 such as "How an episodic CRM differs from a sales CRM". Two columns headed `oldWayName` and `newWayName`, with the new-way column lightly highlighted.
3. **What counts as**, from `whatCountsHeading` and `whatCounts`, as a row of cards.
4. **What's inside**, from `anatomyHeading` and `anatomy`, as a ruled list or a simple timeline.
5. **Why now**, from `whyNow`, with any `proofPoints` shown as stat cards with the source linked.
6. **In practice**, from `useCases`, one short card per vertical.
7. **How NeuronCx does it**, the `bridgeLine`, the `caveatText` when the entry is in pilot, and chips linking to related CRM features, episodic engagements and agents.
8. **Who works this way**, from `customers`, when there are any.
9. **FAQ**, from `faqs`, with FAQPage structured data.
10. **Closing panel**, the navy call to action. The only navy section on the page.

Any section with no content is left out. Add DefinedTerm structured data for the term and its definition.

## 9. SEO

Search volumes from Google Keyword Planner and the home page keyword workbook, India:

| Keyword | Monthly | Belongs to |
| --- | --- | --- |
| AI native CRM | about 500 | The Episodic CRM page meta title and the home page |
| episodic crm, what is an episodic crm, episodic crm vs sales crm | not measured yet | The Episodic CRM page |
| agentic crm | not measured yet | The Episodic CRM page bridge line and the CRM hub |
| forward deployed engineer, forward deployed engineering | not measured yet | The forward-deployed engineering page |
| single tenant saas | not measured yet | The FDE page, or its own entry |
| care coordination software, care copilot | not measured yet | The care coordination page |

Rules:

- Each page targets the "what is" question as its H1 and the term in its first sentence.
- Check every term in Keyword Planner before building its page. A new category term may have almost no searches yet. That is fine for a term we want to own, but the page should also target a nearby term people do search, such as "healthcare CRM" or "patient engagement".
- Meta title up to 60 characters, ending in "| NeuronCx". Example: "What Is an Episodic CRM? | NeuronCx". Meta description up to 155.
- Each page links to the CRM hub and to two or three related feature or engagement pages.

## 10. Sources

- Episodic CRM material: Section 2: The power of episodic engagements?, https://app.notion.com/p/3e5bb832393980668c6ce98b70fa7599 (under [23 Sept 26] Ncx Home Page sections extended)
- Forward-deployed engineering and single-tenant notes: [Primer] NCX healthcare suite + single tenant SAAS, https://app.notion.com/p/3a2bb83239398052a984f768b4c58c68
- Product areas: Product.md
- Keyword volumes: the home page keyword workbook
- `fields_reference.md` for every shared field and limit

## 11. Candidate entries

| Entry | Old way | What the notes show | Likely maturity |
| --- | --- | --- | --- |
| Episodic CRM | Sales CRM | Full draft: definition, table, cards, anatomy (section 6) | pilot, to confirm |
| Forward-deployed engineering | Legacy customer success | One-line note and a product area mention (section 7) | to confirm |
| Care coordination | Task automation | Home page Section 2 eyebrow and the five layers: episode template, milestones, shadow carts, care copilot, longitudinal view | pilot |
| Agentic CRM | CRM with AI added on | The bridge line only | to confirm |
| Single-tenant SaaS | Shared SaaS | Primer page links | to confirm, may fold into FDE |

Care coordination overlaps with episodic engagements. Keep the generic idea here (why a task bot stops and care continues) and the five layers as NeuronCx features in episodic engagements and B2C CRM.

## 12. What the CMS needs

Nothing below is built. In this order:

1. **Shared field groups** in `src/fields/`, the same step the B2C CRM file lists. Build once, used by both.
2. **`categoryDefinitions` collection**, with six shared groups (no WhatsApp), the fields in section 3, the read access in section 4 and the "Positioning" admin group.
3. **Slug check:** because pages sit at the site root, a validation hook that refuses a slug already used by a page in `pages`, and the same check in reverse on `pages`.
4. **Category Definition block**, pointed at one entry, with show or hide toggles for definition, table, "what counts" cards and anatomy, and an optional "Read the full guide" link that follows `hasOwnPage`.
5. **Knowledge base:** add `categoryDefinitions` to `src/rag/sources.ts` and the collections `with-rag.ts` watches.
6. **Website:** the root `/[slug]` route, checking `categoryDefinitions` after `pages`, on the same light layout as the other own pages, with FAQPage and DefinedTerm structured data.
7. **Sitemap:** own pages included, as part of the site-wide sitemap fix.

## 13. Before publishing an entry

- [ ]  Maturity set honestly: live only if clients work this way with NeuronCx today
- [ ]  Definition about 55 words, starts "An X is…", makes sense on its own
- [ ]  Old-way column fair, no competitor named
- [ ]  Every outside number in `proofPoints` with a working source link
- [ ]  Caveat showing if the entry is in pilot
- [ ]  No vertical-only wording outside `useCases`
- [ ]  No em dashes or filler words
- [ ]  Hero, table, FAQs and SEO fields filled
- [ ]  Saved as a draft first, checked, then published

## 14. Open items

1. **FDE content:** section 7 is a draft. James to answer the four questions there and correct the table.
2. **Route:** root-level slugs such as /episodic-crm (matches the link already in the Notion copy) need the slug check in section 12. The alternative is a /what-is/[slug] prefix, which avoids clashes but makes longer URLs.
3. **Single-tenant SaaS:** its own entry, or part of forward-deployed engineering.
4. **Episodic CRM maturity:** the Notion copy marks the care copilot and milestone parts "Now in pilot with care providers". Confirm whether the entry as a whole is pilot or live.
5. **Keyword volumes:** check every "not measured" term in section 9 before building pages.
6. **Collection name:** James's list says `category_definition`. This file uses `categoryDefinitions` to match the repo's camelCase.
