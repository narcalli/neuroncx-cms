# micro apps swarm.md

---

## collection: microApps (admin label "Micro-apps swarm")
payload_slug: microApps (not built yet)
config_file: src/collections/MicroApps/index.ts (planned)
supporting_collection: agentFamilies (planned)
own_page_route: /agents/[slug] (planned)
hub_page: /platform/bot-swarm
shared_groups: all seven, see fields_reference.md
status: design only, 13 Oct 2026. Nothing in this file is built yet

# Micro-apps swarm

Read this file before adding or editing an agent, writing an agent page or the bot swarm hub, choosing which agents a block shows, writing the WhatsApp or knowledge base text for an agent, or building or changing the collection. Read `fields_reference.md` alongside it for the shared field groups.

## 1. What this collection is

One entry is one small agent with one job, such as Prescription understanding, Payment services or Assessment sampling.

NeuronCx does not run one large chatbot. It runs a swarm of small agents, each with a single job, all working from the same customer record. When one agent finishes, it passes the customer to the next agent or to a person, so nobody asks the same question twice.

People who read it:

- Operations, front desk and call centre heads who want to know what work the agents take off their team.
- IT teams checking what each agent touches in their systems.
- The WhatsApp assistant, when someone asks "what can your agents do?"
- The knowledge base, so the virtual agents can explain each agent.

Every agent is described the same way, in five steps:

| Step | What it covers |
| --- | --- |
| Hears | The request in the customer's own words, or the call recording |
| Checks | The organisation's own rules: locations, services, prices, slots, scoring sheets |
| Acts | The work done in the organisation's systems: books, charges, files, scores |
| Hands over | When and how a person takes over |
| Records | What is logged, and where |

This structure comes from the Notion page "Section 3: Bot swarm [Microbots]" and becomes the fields in section 3.

## 2. What belongs here, and what doesn't

| Collection | One entry is | Example |
| --- | --- | --- |
| **Micro-apps swarm (this file)** | One agent with one job | Payment services, Prescription understanding |
| Omnichannel CX | One channel or conversation capability | WhatsApp assistant, voice bot, voice note transcription |
| Call quality assessments | One assessment type or scoring form | Front desk call scorecard |
| B2C CRM | One capability of the CRM | Customer 360, the record every agent works from |
| Episodic engagements | One type of episode | Maternity care |
| Integrations | One outside system | Razorpay, DocPulse |

Rules for the edges:

- **An agent finishes a piece of work.** If it only moves a message along, it isn't an agent. Voice note transcription, question answering from your own content, and WhatsApp button handling run inside every workflow. They belong in omnichannel CX, not here.
- **Call quality:** the three call quality agents (sampling, assessment, longitudinal analysis) live here. The scoring forms and assessment types they use live in call quality assessments, and each agent links to them.
- **Channels:** an agent records which channel it works on, and links to omnichannel CX for the channel itself.

## 3. Field design

### Shared groups

Micro-apps swarm uses all seven groups from `fields_reference.md`, with no changes to their fields or limits:

| Group | How micro-apps swarm fills it |
| --- | --- |
| Core | `name` is the job, such as "Payment services". `isUSP` marks the agents that most set NeuronCx apart |
| Card | `tagline` is the card line, such as "Reads a prescription photo and pulls out each test". `summary`, one line on what the team no longer does. `icon` from the shared library |
| Detail and SEO | `description` explains the agent in plain words. `whoItsFor` names the teams, such as front desk, call centre, admissions office or QA |
| Own page | `heroHeading`, `heroSubheading`, `benefits` (3 to 4), `useCases` (one per vertical), `cta`, `related`. `howItWorks` is not used, because the five-step panel replaces it |
| FAQ | Up to 6. Questions a buyer would ask about this agent |
| WhatsApp | Used by the assistant's "what can your agents do" menus |
| Knowledge base | Every live agent is included |

### Fields only micro-apps swarm has

All text fields are plain text, checked by the shared plain-text validator.

| Field | Type | Placement | Notes |
| --- | --- | --- | --- |
| `status` | select: live, pilot, planned. Required, default planned | sidebar | Only live and pilot show publicly |
| `family` | relationship to `agentFamilies`, required | sidebar | Groups agents on the hub page and in WhatsApp menus |
| `channel` | select, hasMany: whatsapp, calls, web | sidebar | Where the agent works |
| `verticals` | select, hasMany: healthcare, diagnostics, education, hospitality | sidebar | Where it is used today |
| `searchName` | text, 60 | Detail tab | The job people search for, such as "Prescription reading AI". Used in the agent page title and H1 support line |
| `keyPoints` | array of text (60), 3 to 4 | Card tab | Short lines for cards and the bento grid |
| `startsWhen` | textarea, 200 | Panel tab | What sets the agent off |
| `customerSees` | textarea, 240 | Panel tab | What the customer sees. Leave empty for agents that work on call recordings |
| `hears` | textarea, 200 | Panel tab |  |
| `checks` | textarea, 300 | Panel tab |  |
| `acts` | textarea, 300 | Panel tab |  |
| `handsOver` | textarea, 240 | Panel tab | Required before the agent can have its own page |
| `records` | textarea, 200 | Panel tab |  |
| `teamControls` | textarea, 240 | Panel tab | What the organisation can change from the dashboard without code |
| `result` | text, 140 | Panel tab | One line on what changes for the team |
| `passesTo` | relationship to `microApps`, hasMany | Panel tab | The next agent in the chain, such as Prescription understanding to Test matching and pricing |
| `proof` | text, 140 | Page tab | One line, such as "Live at a diagnostics chain". Follows the customers collection's `showName` rule |
| `customers` | relationship to `customers`, hasMany | Page tab | Where it is live |
| `integrations` | relationship to `integrations`, hasMany | Page tab | Systems it books, bills or files into |
| `crmFeatures` | relationship to `crmFeatures`, hasMany | Page tab | Features it depends on, usually Customer 360 |
| `callQualityAssessments` | relationship, hasMany | Page tab | Call quality agents only. Added once that collection exists |
| `episodicEngagements` | relationship, hasMany | Page tab | Added once that collection exists |
| `media` | upload | Page tab | A flow graphic or screenshot, such as the payment flow |

### Supporting collection: `agentFamilies`

An editable list, like `crmAreas`, so families can be renamed or added without a deploy.

| Field | Type | Notes |
| --- | --- | --- |
| `name` | text, required, unique |  |
| `slug` | text, required, unique |  |
| `order` | number, default 100 | Sorts families on the hub page and in menus |
| `painLine` | text, 120 | The problem the family solves, in the team's words |
| `summary` | text, 200 | How the agents in the family work together |

Starting families, from the Notion page:

| Family | Pain line | Summary |
| --- | --- | --- |
| Book and get paid | Your team spends the day confirming slots and chasing payments. | One agent books the appointment in your system, the next sends the payment link and stays with it until it's settled. |
| Read and match documents | Someone on your team retypes every prescription, marksheet and ID. | One agent reads the document from a photo, the next matches what it found to your own lists and fills the record. |
| Check and coach your team | Managers can't listen to every call, or tell who is actually improving. | One agent picks a fair sample of calls, the next scores them against your sheet, and the third shows each person's progress week by week. |

A fourth family, "Follow up", may be needed for Qualify, Recover and Status updates (open item 3).

Admin: both collections sit in a "Micro-apps swarm" group in the sidebar. Drafts on for `microApps`, no autosave. Tabs: Card, Detail, Panel, Page, FAQ, WhatsApp, Knowledge base, SEO.

## 4. What is visible, and when

All rows assume the entry is published. Drafts are never visible.

| Status | hasOwnPage | Card on the site | Own page | WhatsApp and knowledge base |
| --- | --- | --- | --- | --- |
| live | on | yes, links to the page | yes, in sitemap | yes |
| live | off | yes, no link | no, 404 | yes |
| pilot | either | yes, labelled "Pilot" | only if on | yes, described as in pilot |
| planned | either | no | no | no |

Visitors and the public API must never receive planned entries. Enforce this in the collection's read access, not only in the website.

Turn `hasOwnPage` on only when the agent is live, every panel field is filled (no "to confirm" left in any of them), `proof` is confirmed, and the page sections are written.

## 5. Writing rules

General:

- Plain, human language. No em dashes. No filler such as "seamless", "robust", "end-to-end", "intelligent automation" or "next-generation".
- Name the agent for its job. "Payment services", not "PayBot" or "AI payment assistant".
- Say what the team no longer does. "Nobody retypes prescriptions", not "automated data extraction".
- Never call something AI-powered without saying what it does.
- Describe only what runs today. If a step works for one client only, say so or leave it out.
- Write "customer" or "person". Use patients, students and guests only in `useCases` and `customerSees` where the agent only serves one vertical, such as Student mark statement assessment.

Cautions already noted in the Notion drafts:

- **Identity and KYC:** don't use "verify" unless the agent checks against an official source. "Reads" and "adds to the record" are safe.
- **Data:** don't claim call or chat data stays in-house. Call data may be processed by an outside model.
- **Partners:** name DocPulse, LeadSquared or Eka Care only once cleared. Razorpay and the WhatsApp Business Platform are fine.
- **Confidence scores:** quote the 80 percent threshold only for Prescription understanding, where it is confirmed.
- **Payment reminders:** don't mention expiry reminders until they run for more than one client.

By field:

| Field | Rule | Example (Payment services) |
| --- | --- | --- |
| `name` | The job, a few words | Payment services |
| `tagline` | What it does, up to 45 characters | Sends the link and sees it through |
| `summary` | What the team no longer does, up to 120 characters | Customers get a working payment link in the chat, and your team stops checking payment status by hand. |
| `searchName` | The searched job | WhatsApp payment link |
| `heroHeading` | The outcome, up to 70 characters | Payment links that follow through on their own |
| `result` | One line | Fewer manual status checks, and customers who lose a link get a working one without calling. |

## 6. Worked entry: Payment services

From the Notion panel. Lines marked "to confirm" must be settled before `hasOwnPage` is turned on.

| Field | Content |
| --- | --- |
| `family` | Book and get paid |
| `channel` | whatsapp |
| `tagline` | Sends the link and sees it through |
| `keyPoints` | Sends the link as soon as a booking is made / Returns the live link, or a new one if it expired / Confirms payment in the same chat |
| `startsWhen` | A booking or order is created, or your team sends a link by hand. |
| `customerSees` | A payment link with the amount. They can ask about it, ask again if they lost it, and get a confirmation in the same chat once they pay. |
| `hears` | Payment questions and requests for the link. |
| `checks` | Whether this booking source should get a link, whether the customer is new or returning for your discount rule, and whether the last link is active, expired or already paid. |
| `acts` | Sends the link through Razorpay. If the customer asks again, it returns the live link, issues a new one if the old one expired, or confirms the payment already went through. |
| `handsOver` | To confirm: refunds and disputes |
| `records` | The payment status against the right order and customer. |
| `teamControls` | Which booking sources get a link, and the discount percentages, caps and thresholds. These are settings, not code changes. |
| `result` | Fewer manual status checks, and customers who lose a link get a working one without calling. |
| `passesTo` | None. Last in the Book and get paid chain |
| `integrations` | Razorpay |
| `proof` | To confirm: where it is live |

The full chain shown in the hub chat panel: Prescription understanding, then Test matching and pricing, then Payment services. Caption: "One customer, three agents, no one retyping anything." Confirm it runs end to end for a live client before showing it without an "example" caption.

## 7. WhatsApp fields

| Field | Limit | Example (Payment services) |
| --- | --- | --- |
| `waRowTitle` | 24 | Payment services |
| `waRowDescription` | 70, aim for 60 | Sends a payment link and confirms payment in the chat |
| `waHeader` | 60, aim for 30 | Payment services |
| `waBody` | 1024, aim for 300 | Once a booking is made, this agent sends a payment link in the same chat. If the customer loses it, they get the live link again, a new one if it expired, or a note that they've already paid. |
| `waKeyPoints` | 3 to 5 lines, 60 each | Link sent as soon as a booking is made / Lost or expired links handled in the chat / Payment confirmed without a call |
| `waButtons` | up to 3, label 20 | See it in a demo / Other agents |

The assistant first asks which family, then lists that family's live and pilot agents by `order`.

## 8. Knowledge base fields

| Field | Rule | Example (Payment services) |
| --- | --- | --- |
| `kbAnswer` | What it does, who it helps, one example. Max 600 | "Payment services is the NeuronCx agent that sends WhatsApp payment links through Razorpay once a booking is made. If a customer loses the link or it expires, they can ask in the chat and get the live link, a new one, or a confirmation that they have already paid. Front desk teams no longer check payment status by hand." |
| `kbFacts` | One checkable fact per line | "Payment links are sent through Razorpay." / "Discount rules for new and returning customers are set in the dashboard." |
| `kbQuestions` | How a customer asks | "Can I send payment links on WhatsApp?" / "What happens if a payment link expires?" |
| `kbSynonyms` | Other names | WhatsApp payment link, payment bot, payment collection |

Only live and pilot agents go into the knowledge base. Pilot agents must say so in `kbAnswer`.

## 9. Where entries appear

| Place | How agents are picked |
| --- | --- |
| /platform/bot-swarm (hub) | One section per family, each showing its live and pilot agents by `order` |
| Home page Section 3 | Bento grid, hand-picked or "all live agents", up to 6 |
| Card Grid and Bento Grid blocks | A new "pull from micro-apps swarm" option: all, by family, by channel, by vertical, or hand-picked |
| /agents/[slug] | One page per agent with `hasOwnPage` on |
| CRM feature, integration and customer pages | "Agents that use this" and "Agents live here" lists, from the relationships |
| Call quality page | The three call quality agents, from `family` |
| WhatsApp assistant | Family menu, then agent list, then the agent message |
| Knowledge base | Every live and pilot agent |

Cards link to the agent page only when `hasOwnPage` is on.

### Hub page layout (/platform/bot-swarm)

From the Notion content mapping, using existing blocks where possible:

1. **Hero** with the chat panel showing three agents in one conversation, each message labelled with the agent that sent it.
2. **Proof strip**, 2 to 3 confirmed figures only.
3. **Menu bots vs agents**, a two-column comparison.
4. **The swarm**, one section per family: family name, `painLine`, `summary`, then agent cards (icon, name, `tagline`, Pilot tag where it applies). Pulled from the collection.
5. **How every agent works**, the five steps: hears, checks, acts, hands over, records.
6. **What sits underneath**, three columns: one shared customer record, work done in your own systems, your team stays in charge.
7. **Works with**, integration logos, cleared partners only.
8. **By industry**, tabs for healthcare, education and hospitality, built from `verticals` and `useCases`.
9. **Case study**, only once a client is cleared.
10. **Trust panel**: every step logged, unsure reads go to a person, you set the limits, built on official channels.
11. **FAQ**, with FAQPage structured data.
12. **Closing panel**, navy, the only navy section.

### Agent page layout (/agents/[slug])

Light theme only, matching the integration, customer and CRM feature pages. In this order:

1. **Hero** on the light wash: breadcrumb (Bot swarm › family › agent), a family pill, `heroHeading` as the H1, `heroSubheading`, the `cta`. On the right, `media` or a short chat example.
2. **The panel**, the five steps as a horizontal strip: Hears, Checks, Acts, Hands over, Records, with `startsWhen` above it and `customerSees` beside it.
3. **The chain**, from `passesTo` and any agent that passes to this one: small linked chips showing where the agent sits.
4. **What your team controls**, from `teamControls`.
5. **Result and proof**, from `result` and `proof`, with a customer link where cleared.
6. **Use cases**, from `useCases`, one card per vertical.
7. **Works with**, from `integrations`.
8. **FAQ**, from `faqs`, with FAQPage structured data.
9. **Other agents in this family**, from `related` or the same `family`.
10. **Closing panel**, navy.

Any section with no content is left out.

## 10. SEO

Search volumes from Google Keyword Planner and the bot swarm keyword table in Notion, India:

| Keyword | Monthly | Belongs to |
| --- | --- | --- |
| AI virtual assistant, AI powered virtual assistant | about 5,000 | Hub page, body copy |
| WhatsApp chatbot, WhatsApp bot, WhatsApp automation, WhatsApp AI chatbot | about 5,000 each | Hub page secondary terms, shared with omnichannel CX |
| WhatsApp bot examples | about 5,000 | The hub's "by industry" section |
| AI agents for customer service | about 500 | Hub page primary keyword |
| AI virtual agents, conversational AI agent | about 500 each | Hub page secondary terms |
| WhatsApp reminder bot, automated message on WhatsApp | about 500 each | Payment services page |
| WhatsApp appointment booking, prescription reading AI, university admission chatbot, AI call quality monitoring, agent performance tracking | not measured yet | Each agent page's `searchName` |

Rules:

- Hub meta title, from Notion: "Bot Swarm: AI Agents for Customer Service | NeuronCx" (52 characters).
- Agent pages target their `searchName`. Check each in Keyword Planner before writing the page.
- Meta title up to 60 characters, ending in "| NeuronCx". Meta description up to 155.
- WhatsApp chatbot terms are shared with omnichannel CX. Decide which page owns each before both go live, so they don't compete.
- Agent pages link up to the hub, across to the next agent in the chain, and out to the CRM feature or integration they rely on.

## 11. Sources

- Panels, families, keyword table, hub layout and FAQ drafts: Section 3: Bot swarm [Microbots], https://app.notion.com/p/3e5bb832393980248694e838e7ac3f42 (under [23 Sept 26] Ncx Home Page sections extended)
- Evidence for the document agents: the ASL workflow steps named in the Notion scratchpad (Prescription_Parsing_Success, GetAllSKUs, SetSKUsToTrxAttribute, PrescriptionAttributePushFormCreation)
- Home page bento copy, on the same Notion page
- `fields_reference.md` for every shared field and limit

## 12. Candidate entries

My reading of the Notion page. Every status and proof line needs confirming before entries go in.

| Agent | Family | Channel | searchName | Likely status | Proof in the notes |
| --- | --- | --- | --- | --- | --- |
| Appointment assistance | Book and get paid | whatsapp | WhatsApp appointment booking | live | Live for hospital and Ayurveda care groups |
| Payment services | Book and get paid | whatsapp | WhatsApp payment link | live | Works with Razorpay. Where it's live to confirm |
| Prescription understanding | Read and match documents | whatsapp | Prescription reading AI | live | Live at a diagnostics chain (ASL workflow) |
| Test matching and pricing | Read and match documents | whatsapp | Diagnostic test pricing | live | Live at a diagnostics chain (ASL workflow) |
| Student mark statement assessment | Read and match documents | whatsapp | University admission chatbot | live | Live at a university |
| Identity and KYC | Read and match documents | whatsapp | WhatsApp KYC | to confirm | None yet |
| Assessment sampling | Check and coach your team | calls | Call sampling | to confirm | None yet |
| Call quality assessment | Check and coach your team | calls | AI call quality monitoring | to confirm | None yet |
| Longitudinal analysis and feedback | Check and coach your team | calls | Agent performance tracking | to confirm | None yet |
| Qualify | Follow up (to confirm) | whatsapp |  | to confirm | Home page card only |
| Recover | Follow up (to confirm) | whatsapp |  | to confirm | Home page card only |
| Status updates | Follow up (to confirm) | whatsapp |  | to confirm | Home page card only |

Naming: the Notion bento grid calls Test matching and pricing "Diagnostic counselling". Pick one name; this file uses Test matching and pricing because it says what the agent does.

Order on the hub, per the Notion note "Prescription comes first": Prescription understanding leads the Read and match documents family, and that family leads the home page bento grid.

## 13. What the CMS needs

Nothing below is built. In this order:

1. **Shared field groups** in `src/fields/`, the same step the B2C CRM and category definitions files list. Build once, used by all.
2. **`agentFamilies` collection**, with the three starting families.
3. **`microApps` collection**, with the shared groups, the fields in section 3, the read access in section 4 and the "Micro-apps swarm" admin group.
4. **"Pull from micro-apps swarm" option** on the Card Grid and Bento Grid blocks: all, by family, by channel, by vertical, hand-picked, with a limit. Only live and pilot entries for visitors.
5. **Agent panel block** for the five-step strip, so the hub and agent pages render it the same way.
6. **Knowledge base:** add `microApps` to `src/rag/sources.ts` and the collections `with-rag.ts` watches.
7. **WhatsApp lists global** (`whatsappLists`): menu button text and section title for this collection.
8. **Website:** the `/agents/[slug]` route and the hub at `/platform/bot-swarm`, on the same light layout as the other own pages, with card links that follow `hasOwnPage`.
9. **Sitemap:** agent pages included, as part of the site-wide sitemap fix.

## 14. Before publishing an agent

- [ ]  Status set honestly: live only if a client uses it today
- [ ]  Family, channel and verticals set
- [ ]  Every panel field filled, with no "to confirm" left
- [ ]  KYC wording avoids "verify" unless checked against an official source
- [ ]  No claim that data stays in-house
- [ ]  Partners named only if cleared
- [ ]  Summary within 120 characters and says what the team no longer does
- [ ]  No em dashes or filler words
- [ ]  WhatsApp and knowledge base fields within their limits, plain text only
- [ ]  If `hasOwnPage` is on: hero, panel, proof, FAQs and SEO fields filled
- [ ]  Saved as a draft first, checked, then published

## 15. Open items

1. **Public name:** James's list says "micro apps swarm", the Notion hub says "Bot swarm", and the home page says "micro agents". The site should use one name everywhere. The collection slug `microApps` can stay either way.
2. **Call quality split:** confirm that the three call quality agents live here and the scoring forms live in call quality assessments.
3. **Follow-up family:** confirm whether Qualify, Recover and Status updates are real agents or just home page card labels.
4. **Proof lines:** which customers can be named for each agent, following the customers collection's `showName` rule.
5. **Hand-over rules:** most panels have no `handsOver` text yet. These are required before agent pages go live.
6. **Route:** /agents/[slug] for agent pages, or nest them under the hub as /platform/bot-swarm/[slug].
7. **Keyword ownership:** decide whether the hub or the omnichannel CX page owns the WhatsApp chatbot terms.
