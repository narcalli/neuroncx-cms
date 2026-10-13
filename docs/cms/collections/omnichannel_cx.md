# omnichannel.md

---

## collection: omnichannelCx (admin label "Omnichannel CX")
payload_slug: omnichannelCx (not built yet)
config_file: src/collections/OmnichannelCx/index.ts (planned)
own_page_route: /omnichannel-cx/[slug] (planned, see open item 1)
hub_page: /omnichannel-cx
shared_groups: all seven, see fields_reference.md
status: design only, 13 Oct 2026. Nothing in this file is built yet

# Omnichannel CX

Read this file before adding or editing a channel or conversation capability, writing a channel page or the omnichannel hub, choosing which channels a block shows, writing the WhatsApp or knowledge base text for a channel, or building or changing the collection. Read `fields_reference.md` alongside it for the shared field groups.

## 1. What this collection is

One entry is either a **channel** where NeuronCx meets the customer, or a **conversation capability** that works across channels.

| Kind | What it is | Examples |
| --- | --- | --- |
| Channel | A place the customer talks to you | WhatsApp, voice, web chat |
| Capability | Something every conversation can do, whatever the channel | One history across channels, regional languages, voice notes, documents in chat, hand over to your team |

People who read it:

- CX and call centre heads who want to know which channels NeuronCx covers and whether customers can move between them.
- IT teams checking which platforms each channel runs on.
- The WhatsApp assistant, when someone asks "which channels do you support?"
- The knowledge base, so the virtual agents can answer channel questions.

The positioning these entries support, from the home page foundations: **one conversation across every channel.** WhatsApp, voice and web chat share one conversation history. When a customer moves from one channel to another, the conversation carries on where it left off, with no repeated questions. In the foundation stack, omnichannel is the top layer, the one that "meets the customer".

Every entry should answer at least one of these:

| Question | Why it matters |
| --- | --- |
| Can the customer reach you where they already are? | Most customers will not download an app or find a form |
| Does the conversation carry over when they switch? | Otherwise each channel starts its own record (the "one customer, many records" problem) |
| Can it finish the job in the conversation? | A channel that only answers questions still sends people to the phone |

## 2. What belongs here, and what doesn't

| Collection | One entry is | Example |
| --- | --- | --- |
| **Omnichannel CX (this file)** | One channel, or one capability every conversation can use | WhatsApp, voice notes, regional languages |
| Micro-apps swarm | One agent that finishes a job | Payment services, Prescription understanding |
| B2C CRM | One capability of the CRM | Customer 360, Campaigns, Segments |
| Call quality assessments | One assessment type | Front desk call scorecard |
| Integrations | One outside system | Telephony providers, Razorpay |
| Category definitions | One idea, old way vs new way | Episodic CRM vs sales CRM |

Rules for the edges:

- **Agents run on channels.** Payment services is an agent; WhatsApp is the channel it runs on. The agent entry links here through `microApps`.
- **Plumbing lives here.** Voice note transcription, answers from your own content, and WhatsApp buttons and lists run inside every workflow. They are capabilities in this collection, not agents.
- **Campaigns live in B2C CRM.** Sending a campaign is a CRM feature. "Separate numbers for service and promotions" is a channel capability, so it lives here.
- **Telephony providers live in integrations.** The voice channel entry links to them.
- **Zero Call Resolution is an idea**, first call resolution vs zero call resolution. It belongs in category definitions as its own entry. This collection links to it from the capabilities that make it work (status updates, welcome back).

## 3. Field design

### Shared groups

Omnichannel CX uses all seven groups from `fields_reference.md`, with no changes to their fields or limits:

| Group | How omnichannel CX fills it |
| --- | --- |
| Core | `name` is the channel or capability, such as "WhatsApp" or "Regional languages". `isUSP` marks the ones that most set NeuronCx apart, likely "One history across channels" and "Welcome back" |
| Card | `tagline`, a short line under the name. `summary`, one line on what changes for the customer or team. `icon` from the shared library |
| Detail and SEO | `description` explains it in plain words. `whoItsFor` names the teams, such as call centre, front desk or admissions office |
| Own page | `heroHeading`, `heroSubheading`, `benefits` (3 to 6), `howItWorks` (3 to 5 steps), `useCases` (one per vertical), `cta`, `related` |
| FAQ | Up to 6. Questions a buyer would ask about this channel or capability |
| WhatsApp | Used by the assistant's "which channels do you support" menu |
| Knowledge base | Every live entry is included |

### Fields only omnichannel CX has

All text fields are plain text, checked by the shared plain-text validator.

| Field | Type | Placement | Notes |
| --- | --- | --- | --- |
| `kind` | select: channel, capability. Required | sidebar | Splits the hub page into channels and capabilities |
| `status` | select: live, pilot, planned. Required, default planned | sidebar | Only live and pilot show publicly |
| `worksOn` | relationship to `omnichannelCx`, hasMany, filtered to `kind` = channel | sidebar | Capabilities only: which channels it works on |
| `direction` | select, hasMany: inbound, outbound | sidebar | Channels only. Inbound is the customer reaching you; outbound is you reaching them |
| `formats` | select, hasMany: text, voice, images, documents, video, buttons, forms | Detail tab | What the customer can send or receive |
| `languages` | select, hasMany: english, hindi, tamil, kannada, telugu, malayalam, marathi, bengali, other | Detail tab | Only languages confirmed in live use |
| `platformBasis` | text, 120 | Detail tab | What it runs on, such as "The official WhatsApp Business Platform". Leave empty if not confirmed |
| `legacyGap` | text, 160 | Detail tab | How a single-channel tool handles this. Never names a competitor |
| `inAnEpisode` | text, 160 | Detail tab | One line showing it inside a customer episode, matching the home page foundations style |
| `handoverRule` | textarea, 240 | Detail tab | How a person takes over on this channel, and what they see |
| `consentNote` | textarea, 240 | Detail tab | Channels only: how opt-in and opt-out work on this channel |
| `conversationExample` | array, up to 8: `sender` (select: customer, business, team), `channel` (relationship, optional), `text` (300), `label` (40, optional) | Page tab | A short example chat for the page hero. `label` names the agent or step, as in the bot swarm chat panel. `channel` lets one example cross from WhatsApp to a call |
| `exampleCaption` | text, 120 | Page tab | Shown under the example. Use "An example of how it works" unless the exact sequence runs for a live client |
| `screenshots` | array of `image` (upload) + `alt` (text, 160), max 3 | Page tab | Demo-tenant screenshots only |
| `microApps` | relationship to `microApps`, hasMany | Page tab | Agents that run on this channel |
| `crmFeatures` | relationship to `crmFeatures`, hasMany | Page tab | Usually Customer 360, Campaigns |
| `integrations` | relationship to `integrations`, hasMany | Page tab | Telephony providers, WhatsApp platform partners |
| `customers` | relationship to `customers`, hasMany | Page tab | Where it is live. Follows the customers collection's `showName` rule |
| `categoryDefinitions` | relationship, hasMany | Page tab | Such as Zero Call Resolution, once that entry exists |
| `episodicEngagements` | relationship, hasMany | Page tab | Added once that collection exists |

Admin: an "Omnichannel CX" group in the sidebar. Drafts on, no autosave. Tabs: Card, Detail, Page, FAQ, WhatsApp, Knowledge base, SEO.

## 4. What is visible, and when

All rows assume the entry is published. Drafts are never visible.

| Status | hasOwnPage | Card on the site | Own page | WhatsApp and knowledge base |
| --- | --- | --- | --- | --- |
| live | on | yes, links to the page | yes, in sitemap | yes |
| live | off | yes, no link | no, 404 | yes |
| pilot | either | yes, labelled "Pilot" | only if on | yes, described as in pilot |
| planned | either | no | no | no |

Visitors and the public API must never receive planned entries. Enforce this in the collection's read access, not only in the website.

Turn `hasOwnPage` on when the entry is live or in pilot, the page sections are written, and there is either a screenshot or a `conversationExample`. Most channels should have their own page. Most capabilities should not, except the ones with search demand or a strong story (likely "One history across channels" and "Welcome back").

## 5. Writing rules

General:

- Plain, human language. No em dashes. No filler such as "seamless", "omni-experience", "frictionless", "robust" or "next-generation".
- Say what changes for the customer. "They carry on where they left off", not "context persistence".
- Never call something AI-powered without saying what it does.
- Never describe a planned capability as available. Welcome back and shadow sessions are still work in progress in the Notion notes.
- Write "customer" or "person". Put patients, students and guests in `useCases`.

Claims:

- **Languages:** list only languages confirmed in live use. The home page FAQ names English, Hindi, Tamil, Kannada and Telugu.
- **Official platforms:** say "the official WhatsApp Business Platform" only for WhatsApp. Don't describe the voice channel's platform until it is confirmed.
- **Numbers:** the Zero Call Resolution article quotes 30% pre-booking automation, 45% post-booking, up to 60% fewer status calls and 100% prescription capture. Use these only once each figure is tied to a named deployment and cleared. Until then, keep them off channel pages.
- **Clinical lines:** in healthcare examples, the platform organises a patient's history; it does not interpret it. Never suggest an agent gives a medical opinion.
- **Data:** "Deployments are designed to meet India's DPDP Act" is the approved wording from the home page FAQ. Don't go further than that.
- **Consent:** describe opt-in and opt-out per channel only as they actually work.

By field:

| Field | Rule | Example (WhatsApp) |
| --- | --- | --- |
| `name` | The plain name | WhatsApp |
| `tagline` | What it is in a few words, up to 45 characters | Bookings, payments and answers in one chat |
| `summary` | What changes, up to 120 characters | Customers book, pay and get updates in the app they already use, and your team picks up with the full history. |
| `legacyGap` | How a single-channel tool handles it | Menu bots on WhatsApp offer fixed options and send anything else to the phone. |
| `inAnEpisode` | One line inside an episode | A WhatsApp enquiry becomes a phone booking without the customer repeating a single detail. |
| `heroHeading` | The outcome, up to 70 characters | Finish the job in the chat your customers already use |

## 6. Worked entry: WhatsApp

| Field | Content |
| --- | --- |
| `kind` | channel |
| `status` | live |
| `direction` | inbound, outbound |
| `formats` | text, voice, images, documents, buttons, forms |
| `languages` | english, hindi, tamil, kannada, telugu (confirm each) |
| `platformBasis` | The official WhatsApp Business Platform |
| `tagline` | Bookings, payments and answers in one chat |
| `summary` | Customers book, pay and get updates in the app they already use, and your team picks up with the full history. |
| `legacyGap` | Menu bots on WhatsApp offer fixed options and send anything else to the phone. |
| `inAnEpisode` | A WhatsApp enquiry becomes a phone booking without the customer repeating a single detail. |
| `handoverRule` | When a question needs a person, the chat moves to your team in the agent console with the full history attached. You decide which questions always go to a person. |
| `consentNote` | To confirm: how opt-in is captured and how a customer opts out |
| `microApps` | Appointment assistance, Payment services, Prescription understanding, Test matching and pricing, Student mark statement assessment, Identity and KYC |
| `crmFeatures` | Customer 360, Campaigns |
| `integrations` | Razorpay |

**benefits**

- "Nothing to download": customers use the app they already have.
- "The job gets done in the chat": bookings, payments and documents are handled without a call.
- "Your team sees everything": when a person takes over, the whole conversation is already there.
- "Service and promotions kept apart": separate numbers, so a promotion never gets in the way of a booking.

**howItWorks**

1. The customer messages you, or replies to a message you sent.
2. The assistant understands the request, in text, a voice note or a photo.
3. It checks your services, prices and slots, and the customer's history.
4. An agent finishes the job: books, sends a payment link, reads a document.
5. Anything that needs judgement goes to your team, with the full history.

**conversationExample** (caption: "An example of how it works")

| Sender | Text | Label |
| --- | --- | --- |
| customer | [Voice note] Need to book the same blood test as last time at Indiranagar |  |
| business | Got it. Your last test was a full body checkup at Indiranagar. Saturday 8 am or 9:30 am? | Voice notes, Customer 360 |
| customer | 8 am |  |
| business | Booked for Saturday at 8 am. Here's your payment link for ₹[amount]. | Appointment assistance, Payment services |

Branch, test and amount are placeholders. Replace them with demo-tenant values before publishing.

**FAQ starters:** Do customers need to download anything? / Can customers send voice notes and photos? / Which languages does it understand? / Can my team take over a chat? / Is it the official WhatsApp Business Platform? / Can I keep promotions separate from service messages?

## 7. WhatsApp fields

| Field | Limit | Example (WhatsApp) |
| --- | --- | --- |
| `waRowTitle` | 24 | WhatsApp |
| `waRowDescription` | 72, aim for 60 | Bookings, payments and answers in one chat |
| `waHeader` | 60, aim for 30 | WhatsApp |
| `waBody` | 1024, aim for 300 | Your customers book, pay and get updates on WhatsApp, the app they already use. They can type, send a voice note or share a photo, and when a question needs a person, your team picks up with the whole conversation in front of them. |
| `waKeyPoints` | 3 to 5 lines, 60 each | Text, voice notes, photos and documents / Bookings and payments in the chat / Your team takes over with the full history |
| `waButtons` | up to 3, label 20 | See it in a demo / Other channels |

The assistant shows channels first, then a "What every conversation can do" section listing live capabilities by `order`.

## 8. Knowledge base fields

| Field | Rule | Example (WhatsApp) |
| --- | --- | --- |
| `kbAnswer` | What it is, who uses it, one example. Max 600 | "NeuronCx runs on the official WhatsApp Business Platform. Customers can book, pay, send documents and get updates in the chat, using text, voice notes or photos. When a question needs a person, the chat moves to your team with the full history. For example, a customer can send a voice note asking for the same test as last time, pick a slot and pay without a call." |
| `kbFacts` | One checkable fact per line | "NeuronCx uses the official WhatsApp Business Platform." / "Customers can send voice notes, which are turned into text." |
| `kbQuestions` | How a customer asks | "Do you work on WhatsApp?" / "Can patients book on WhatsApp?" / "Can my staff reply on WhatsApp?" |
| `kbSynonyms` | Other names | WhatsApp chatbot, WhatsApp bot, WhatsApp automation, WhatsApp Business API |

Only live and pilot entries go into the knowledge base. Pilot entries must say so in `kbAnswer`.

## 9. Where entries appear

| Place | How entries are picked |
| --- | --- |
| /omnichannel-cx (hub) | Channels first, then capabilities, each by `order` |
| Home page foundations (F5 Omnichannel) | Hand-picked: WhatsApp and voice, with the `inAnEpisode` line |
| Card Grid and Bento Grid blocks | A new "pull from omnichannel CX" option: all, by kind, by channel, or hand-picked |
| /omnichannel-cx/[slug] | One page per entry with `hasOwnPage` on |
| Agent, CRM feature and integration pages | "Runs on" chips, from the relationships |
| Category definition pages | Links from Zero Call Resolution to the capabilities behind it |
| WhatsApp assistant | Channel list, then capabilities, then the entry message |
| Knowledge base | Every live and pilot entry |

Cards link to the entry page only when `hasOwnPage` is on.

### Hub page layout (/omnichannel-cx)

Light theme only. In this order:

1. **Hero:** H1 "One conversation across every channel", the subheading from the home page foundation text, and a `conversationExample` that crosses from WhatsApp to a call, with the channel shown on each message.
2. **Channels**, cards for every live and pilot channel: icon, `name`, `tagline`, `direction` and `formats` as small chips.
3. **What every conversation can do**, a grid of live and pilot capabilities: icon, `name`, `summary`, and which channels they work on.
4. **Languages strip**, built from the `languages` values across live entries.
5. **In an episode**, one row per channel using `inAnEpisode`, showing the same customer moving between channels.
6. **Agents that run here**, chips from `microApps`, linking to the bot swarm.
7. **Trust panel:** official WhatsApp Business Platform, consent per channel, every conversation logged, your team stays in charge.
8. **Resources**, the latest posts from the omnichannel blog category.
9. **FAQ**, with FAQPage structured data. Start from the home page FAQ "Which channels does NeuronCx support?"
10. **Closing panel**, navy, the only navy section.

### Entry page layout (/omnichannel-cx/[slug])

Light theme only, matching the integration, customer, CRM feature and agent pages. In this order:

1. **Hero** on the light wash: breadcrumb (Omnichannel CX › Channels or Capabilities › entry), `heroHeading` as the H1, `heroSubheading`, the `cta`. On the right, the `conversationExample` with `exampleCaption`, or the first screenshot.
2. **Contrast strip:** "A single-channel tool" with `legacyGap`, and "NeuronCx" with the first line of `description`.
3. **What it handles:** `direction`, `formats` and `languages` as chips, and `platformBasis` if set.
4. **Benefits**, from `benefits`.
5. **How it works**, from `howItWorks`.
6. **Your team takes over**, from `handoverRule`.
7. **Use cases**, from `useCases`, one card per vertical.
8. **Agents on this channel**, from `microApps` (channels), or **Works on** from `worksOn` (capabilities).
9. **Works with**, from `integrations`.
10. **FAQ**, from `faqs`, with FAQPage structured data.
11. **Related**, from `related`, or other entries of the same kind.
12. **Closing panel**, navy.

Any section with no content is left out.

## 10. SEO

Search volumes from Google Keyword Planner and the home page keyword workbook, India:

| Keyword | Monthly | Belongs to |
| --- | --- | --- |
| WhatsApp automation, WhatsApp chatbot, WhatsApp bot, chatbot in WhatsApp, WhatsApp AI chatbot | about 5,000 each | The WhatsApp entry page |
| conversational AI platform | about 5,000 | Home page meta; the omnichannel hub as a secondary term |
| contextual AI | about 5,000 | Home page foundations, not this collection |
| WhatsApp bot examples | about 5,000 | Bot swarm hub, "by industry" section |
| voice bot | about 500 | The voice entry page |
| WhatsApp marketing automation | about 500 | B2C CRM Campaigns, not this collection |
| automated message on WhatsApp, WhatsApp reminder bot | about 500 each | Payment services agent page |
| omnichannel CX, omnichannel customer experience, multilingual chatbot, WhatsApp Flows | not measured yet | The hub, the regional languages entry, the WhatsApp Flows entry |

Keyword ownership, settling open item 7 in micro_apps_swarm.md:

- **The WhatsApp entry page owns the WhatsApp chatbot terms** (WhatsApp chatbot, WhatsApp bot, WhatsApp automation).
- **The bot swarm hub owns "AI agents for customer service"** and links to the WhatsApp page with WhatsApp chatbot as link text.
- The omnichannel hub targets "omnichannel CX" and "conversational AI platform" as a secondary term, once volumes are checked.

Rules:

- Meta title up to 60 characters, ending in "| NeuronCx". Example: "WhatsApp Chatbot for Business | NeuronCx". Meta description up to 155.
- Entry pages link up to the hub, across to two or three related channels or capabilities, and out to the agents that run on them.

## 11. Sources

- Omnichannel foundation (F5), the foundation stack and the service and promotions line: Section 3: NeuronCx technical pillars - foundational, https://app.notion.com/p/3e5bb832393980d184c1e91c9891a289
- Channels and languages: Section 8: FAQs, https://app.notion.com/p/3e5bb8323939809bb3a1e60eef8b9c7a
- Shadow sessions and welcome back: "[Section 6] OmniChannel & shadow sessions + Zerocall resolution [WIP]" on [23 Sept 26] Ncx Home Page sections extended, https://app.notion.com/p/3e4bb83239398087af06d2609071b015
- Zero Call Resolution argument and figures: [12 August 26][Mktg] Zero Call Resolution, https://app.notion.com/p/3babb83239398049a92bda60ab9169b3
- Voice notes, answers from your own content and buttons as plumbing: the content scratchpad on Section 3: Bot swarm [Microbots]
- Keyword volumes: the home page keyword workbook and the bot swarm keyword table
- `fields_reference.md` for every shared field and limit

## 12. Candidate entries

My reading of the notes. Every status needs confirming before entries go in.

**Channels**

| Entry | What the notes show | Likely status | Own page |
| --- | --- | --- | --- |
| WhatsApp | Official WhatsApp Business Platform, every live workflow | live | yes |
| Voice | Inbound and outbound calls, voice bot, a planned /platform/ai-voice-agents/ page | to confirm | yes, if live |
| Web chat | Named in the home page FAQ | to confirm | no |
| Email | Named in home page content v1 ("WhatsApp, voice, email and your website") but not in the later FAQ | to confirm | no |

**Capabilities**

| Entry | What the notes show | Likely status | Own page |
| --- | --- | --- | --- |
| One history across channels | Home page F5: "one conversation history" | live, to confirm | yes |
| Welcome back (shadow sessions) | When an order is created, a session is ready; when the customer writes in, the assistant welcomes them back with a summary | planned (WIP) | later |
| Regional languages | English, Hindi, Tamil, Kannada, Telugu in the home page FAQ | live | maybe, if "multilingual chatbot" has volume |
| Voice notes | Voice messages turned into text, in all three workflows | live | no |
| Documents and photos in chat | Prescriptions, marksheets and IDs received in chat | live | no |
| Buttons and lists | WhatsApp interactive messages, in all three workflows | live | no |
| WhatsApp Flows (in-chat forms) | Existing blog posts on WhatsApp Flows | to confirm | maybe |
| Answers from your own content | Retrieval from the client's own content, in all three workflows | live | no |
| Hand over to your team | Agent console, full history attached | live | no |
| Separate numbers for service and promotions | Home page marketing tab | to confirm | no |
| Consent by channel | Zero Call Resolution article: consent tracked channel by channel | to confirm | no |
| Proactive status updates | Results and status changes sent to the chat so customers don't call | live, to confirm | no, links to Zero Call Resolution |

## 13. What the CMS needs

Nothing below is built. In this order:

1. **Shared field groups** in `src/fields/`, the same step the other collection files list. Build once, used by all.
2. **`omnichannelCx` collection**, with the shared groups, the fields in section 3 (including the self-relationship `worksOn`, filtered to channels), the read access in section 4 and the "Omnichannel CX" admin group.
3. **"Pull from omnichannel CX" option** on the Card Grid and Bento Grid blocks: all, by kind, by channel, hand-picked, with a limit. Only live and pilot entries for visitors.
4. **Conversation example block**, reusable on the hub, entry pages and the bot swarm hub, rendering `conversationExample` with optional channel and label tags.
5. **Knowledge base:** add `omnichannelCx` to `src/rag/sources.ts` and the collections `with-rag.ts` watches.
6. **WhatsApp lists global** (`whatsappLists`): menu button text and section titles ("Channels", "What every conversation can do").
7. **Website:** the `/omnichannel-cx` hub and `/omnichannel-cx/[slug]` route, on the same light layout as the other own pages. Old article URLs under /omnichannel-cx/ end in a number, such as /omnichannel-cx/virtual-agent-chatbots-on-whatsapp-business-api/23, so they won't clash, but check the redirects list before launch.
8. **Sitemap:** entry pages included, as part of the site-wide sitemap fix.

## 14. Before publishing an entry

- [ ]  Kind and status set honestly: live only if clients use it today
- [ ]  Channels: direction, formats and platform filled; capabilities: `worksOn` set
- [ ]  Languages limited to those confirmed in live use
- [ ]  No outside figures unless tied to a named, cleared deployment
- [ ]  Healthcare examples don't suggest a medical opinion
- [ ]  Example chat uses demo-tenant values and the right caption
- [ ]  Summary within 120 characters and says what changes
- [ ]  No em dashes or filler words
- [ ]  WhatsApp and knowledge base fields within their limits, plain text only
- [ ]  If `hasOwnPage` is on: hero, benefits, how it works, an example or screenshot, FAQs and SEO fields filled
- [ ]  Saved as a draft first, checked, then published

## 15. Open items

1. **Route:** this file uses /omnichannel-cx and /omnichannel-cx/[slug] to keep the existing URL. The home page drafts link to /platform/whatsapp-automation/ and /platform/ai-voice-agents/ instead. Pick one, and redirect the other.
2. **Current /omnichannel-cx page:** it still shows client names. Fix it before the new hub replaces it, following the customers collection's `showName` rule.
3. **Voice status:** confirm what the voice channel does today (inbound calls, outbound calls, voice bot) and which telephony providers can be named.
4. **Web chat and email:** confirm whether either is live. The FAQ names web chat; email appears only in an older draft.
5. **Welcome back:** shadow sessions are marked WIP. Confirm the status before writing the page.
6. **Zero Call Resolution:** add it as an entry in category definitions (first call resolution vs zero call resolution), and decide which of its figures can be published.
7. **Languages:** confirm the full list in live use.
