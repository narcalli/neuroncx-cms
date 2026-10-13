# Features migration

The Features collection (`features`, `src/collections/Features/index.ts`) is an older, mixed list of platform capabilities. Its entries belong in the new collections as each one is built. Features stays as it is until then: nothing in it, the Feature Thread block or the pages that use it is changed before the steps below.

Recorded 13 Oct 2026, from the local copy of production: 13 entries, 12 published and 1 untitled draft.

## Where each entry goes

| Features entry (category) | Goes to |
| --- | --- |
| Customer data built from your own conversations (user-intelligence) | `crmFeatures`, Customer 360 |
| Appointment booking, from enquiry to confirmation (omnichannel-cx) | `crmFeatures`, Enquiries and bookings; also the Appointment assistance agent in `microApps` |
| Virtual agents on the WhatsApp Business API (omnichannel-cx) | `omnichannelCx`, WhatsApp |
| Full duplex voice bots (omnichannel-cx) | `omnichannelCx`, Voice |
| Context-aware responses at the point of transaction (omnichannel-cx) | `omnichannelCx`, Answers from your own content |
| Application support through the admission season (omnichannel-cx) | `microApps` (Student mark statement assessment) or `episodicEngagements` (admissions cycle), to decide |
| Deep integration with CRM, booking and inventory systems (omnichannel-cx) | Integrations hub copy, not an entry |
| Hospital appointment booking with Docpulse (integrations) | `integrations`, DocPulse |
| LeadSquared, connected both ways (integrations) | `integrations`, LeadSquared |
| A content model built for semantic retrieval (knowledge-base) | No home yet, stays in Features for now |
| Response quality monitoring against a threshold (knowledge-base) | No home yet, stays in Features for now |
| Generated long-form content in your own schema (knowledge-base) | No home yet, stays in Features for now |
| Untitled draft (omnichannel-cx) | To be deleted by hand in the admin |

## Where Features is used today

- The Feature Thread block (`src/blocks/FeatureThread/config.ts`), registered on Pages. On the website, `src/blocks/FeatureThread/Component.tsx` reads published features per category, sorted by `order`.
- Locally, the pages /omnichannel-cx, /knowledge-base and /user-intelligence contain that block.
- There is no /features route.

## Retirement steps

1. **Move entries as each collection is built.** When `crmFeatures`, `omnichannelCx`, `microApps` and the integrations work land, rewrite each entry above into its new home, following that collection's doc. Leave the Features entry in place until its replacement is published.
2. **Point Feature Thread at the new collections, or replace it.** Either give the block a source switch, as the integration blocks have, or swap it on each page for the new collection blocks.
3. **Check the pages.** Confirm /omnichannel-cx, /knowledge-base and /user-intelligence still render, with the same or better content, on the local copy and then in production.
4. **Decide on the knowledge-base entries.** They need a home, or a decision to drop them, before Features can go.
5. **Remove Features.** Take the block and the collection out of the config, delete the entries, and drop the empty collection from the database after a backup.
