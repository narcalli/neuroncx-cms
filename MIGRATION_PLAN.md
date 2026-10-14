# Integrations: migration plan

Written 14 Oct 2026 for branch `feat/integrations-restructure`. **Nothing in this file has been run.** Each step runs against the local copy first, then production only with explicit approval, after a fresh backup.

The restructure (Phases 1 to 5) was additive: no field was renamed or removed, and no optional field became required. The steps below are the follow-up changes that do touch data.

## Before deploying the branch

### Step 0. Back up production

```
npm run db:backup
```

Reads production only and writes `db-backups/prod-<time>/`. Every rollback below restores from this backup if its own undo fails.

### Step 1. Check production data fits the new caps

The branch adds these caps to existing fields. Payload rejects a save that breaks a cap, so an entry that is already too long could no longer be saved until it is shortened.

| Collection | Field | New cap |
| --- | --- | --- |
| integrations | name | 60 |
| integrations | slug | 60 |
| integrationCategories | name | 60 |
| integrationCategories | slug | 60 |
| integrationCategories | description (now the hub intro) | 140 |
| connectionTypes | name | 60 |
| connectionTypes | slug | 60 |
| connectionTypes | description | 200 |

Check: a read-only query on production (or on a fresh `npm run db:pull` copy) listing every value over its cap. On the local copy of 12 Oct 2026 nothing is over: the longest integration name is 17 characters and every description is empty.

If anything is over: shorten it in the admin before deploying. Rollback: none needed, the check changes nothing.

### Step 2. Give existing categories and connection types their first version

The branch turns drafts on for integration categories and connection types. Their 9 existing entries were saved before drafts existed, so they have no `_status` and no saved version.

- **Visitors and the website:** unaffected. Their read access shows published entries and entries with no `_status`.
- **The admin:** affected. It looks relationship values up as drafts, which reads from the versions collection. Until each entry has a version, existing categories and connection types show as "Untitled - ID: ..." on integration items and are missing from the pickers.

Fix: publish each of the 9 entries once, with `_status: 'published'` and no other change. This creates the first version and sets `_status` to published.

```
NODE_OPTIONS="--no-deprecation --import=tsx/esm" node --env-file=.env scripts/publish-integration-taxonomies.ts --remote
```

The script skips entries that are already published with a version, leaves real drafts alone, and reports how many entries visitors see before and after (it must be the same). Without `--remote` it refuses any database not on this machine.

Done on the local copy on 14 Oct 2026: 6 categories and 3 connection types published, visitors saw 6 and 3 before and after, and a second run skipped all 9. Production: run it right after deploying the branch, after Step 0.

Rollback: restore `integrationcategories` and `connectiontypes` from the Step 0 backup and drop `_integrationcategories_versions` and `_connectiontypes_versions`.

## Phase 2 renames and requirements

Run in this order. Each one is a code change plus a data step, and the website has to change in step with the CMS where it reads the field.

### Step 3. Fill missing slugs and fix the prefixed ones

Target slugs, lowercase with single dashes, matching the address `/integrations/<slug>`:

| Integration | Slug today | Target slug |
| --- | --- | --- |
| Knowlarity | none | `knowlarity` |
| Tata Smartflo | none | `tata-smartflo` |
| Asttecs | none | `asttecs` |
| DocPulse | `ncx-inetgration-docpulse` (typo) | `docpulse` |
| EkaCare | `ncx-integrations-ekacare` | `eka-care` (the name also becomes "Eka Care", per integrations.md) |
| Akhil Miracle HMS | `ncx-integrations-akhil-miracle-hms` | `akhil-miracle-hms` |
| Razorpay | `ncx-integrations-razorpay` | `razorpay` |
| Practo | `ncx-integrations-practo` | `practo` |
| LeadSquared | `ncx-integrations-leadsquared` | `leadsquared` |
| Exotel | `exotel` | unchanged |

How: edit each slug in the admin and publish, or a one-off Local API script that updates `slug` only. Saving also rewrites `waLink` from the new slug.

Redirects: no page or redirect in the local copy uses the old slugs today, and `/integrations/[slug]` does not exist on the website yet. The prefixed slugs look like addresses from the previous site. To confirm before launch: which old addresses were live, for example `/ncx-integrations-leadsquared`. Then add a redirect from each old address to `/integrations/<target slug>` in the Redirects collection, once the integration pages exist. integrations.md already calls for redirects from the old LeadSquared and DocPulse pages.

Check: the slug clash check refuses any target slug already used by an integrations master record. Also make sure no master record uses `docpulse`, `leadsquared` and so on.

Rollback: set the old slugs back (the table above is the record), and remove the redirects.

### Step 4. Make slug required

Only after Step 3, when every entry has a slug.

Code: `required: true` on the integration slug, plus the lowercase-and-dashes format check the taxonomies use. Data: none.

Rollback: revert the code change.

### Step 5. Move `logo` to `image`

Matches the shared card group in fields_reference.md.

1. Code: add `image` (upload, media) next to `logo`. Deploy.
2. Data: copy each entry's `logo` into `image` (Local API script, `image` only).
3. Website: read `image`, falling back to `logo`. Deploy.
4. Code: remove `logo` once the website no longer reads it. Deploy. The old values stay in the database until cleaned up, so this step loses nothing.

Rollback: at any point before 4, revert the code and the website; `logo` still holds every value. After 4, restore `logo` from `image` with the reverse copy.

### Step 6. Raise the `summary` cap from 120 to 140

Matches the shared card group (hard cap 140, aim for 120). A looser cap, so no data step: every existing summary already fits. Update the admin description to "Aim for 120 characters."

Rollback: set the cap back to 120. Check first that no summary has grown past 120 in the meantime.

## Step 7. Cutover: /integrations from the main master record

When the website starts rendering `/integrations` from the main Integrations master record (the one with Is main on), on the same deploy:

1. Unpublish the CMS pages `integrations` and `integration`. Unpublish, do not delete, so they stay in the admin as a record.
2. Add a redirect from `/integration` to `/integrations` in the Redirects collection.
3. Check `/integrations` and `/integration` on the live site straight after the deploy.

No code check against pages is needed: the cutover is this one deliberate step.

Rollback: republish both pages, remove the redirect, and switch the website back to the page route.

Before the cutover, move everything below into the master record, the categories and the items, so nothing is lost. Contents as of the local copy of production, 12 Oct 2026:

### Page `integrations` (published, title "integrations", no SEO title)

| Block | Content today | Where it goes |
| --- | --- | --- |
| Stat Hero | Eyebrow "Integrations". Headline "Plugged into the systems you already run". Subhead "The assistant reads live availability, writes bookings back, and logs every conversation where your team already works. No second system to keep up to date." Buttons "Submit enquiry" to /contact, "See Omnichannel CX" to /omnichannel-cx | Master: `eyebrow`, `h1`, `subheading`. The second button has no master field yet |
| Integrations Marquee | Manual list of 12 names: WhatsApp, LeadSquared, DocPulse, Eka Care, Practo, Razorpay, Exotel, Knowlarity, Tata Smartflo, Asttecs, Medics, Zenoti | Master: `heroSystems` (up to 7), from items. WhatsApp, Medics and Zenoti are not integration items yet (integrations.md section 11 lists them as not yet entered) |
| Integrations, "Messaging channels" | Heading "Where your customers already talk to you", filter by Messaging channels, plus one empty leftover manual row | Category Messaging channels: `hubHeading` |
| Integrations, "Telephony and dialers" | Heading "Calls on the same record as chats", filter by Telephony and dialers, plus one empty leftover manual row | Category Telephony and dialers: `hubHeading` |
| Integrations, "CRM and marketing" | Heading "Leads and answers written back where sales works", filter by CRM and marketing | Category CRM and marketing: `hubHeading` |
| Integrations, "Hospital systems" | Heading "Live doctor availability, bookings and patient records", filter by Hospital systems | Category Hospital systems: `hubHeading` |
| Integrations, "Booking and operations" | Heading "Third-party bookings brought into the same journeys", filter with no category chosen | Needs a "Booking and operations" category first (integrations.md section 12, step 1), then its `hubHeading` |
| Closing CTA | Heading "Tell us what you're running". Subhead "If your CRM or HIS isn't listed, it usually still connects, send us the system and we'll tell you what's involved." (it uses an em dash today; rewrite without it). Button "Submit enquiry" to /contact | Master: `cta`. The heading and subhead have no master field; `waFallback` can carry the same idea for WhatsApp |

### Page `integration` (published, title "Integrations", low impact hero, no SEO title)

| Block | Content today | Where it goes |
| --- | --- | --- |
| Hero Right Placement | Eyebrow "Integrations". Headline "Integration with the systems you already run". The same subhead as above. Buttons "Book an integration demo" and "See all integrations" (links not set). An image (media 6accbf98db047676fb5d8146, the hub diagram) | Mostly a duplicate of the page above. The image has no master field yet |
| Integrations Marquee | Title "Works with the platforms your teams already use." Manual list of 8 names: WhatsApp, LeadSquared, DocPulse, Eka Care, Practo, Razorpay, Exotel, Knowlarity | Covered by `heroSystems` |
| How It Works | Label "How it works". Heading "Connect once, then every conversation keeps your systems current". Intro "Your team keeps working in the tools it knows. NeuronCx sits between them and WhatsApp." Steps: 1 "Connect each system once": By API, webhook or a native connector, set up with your team. 2 "Conversations read and write": The assistant checks live data before it answers, and writes back what the customer chose. 3 "Every event lands on the record": Bookings, calls, payments and status changes all sit on the same customer history. Button to /contact | Master: `fiveThings` (3 to 5 rows of title and line) |
| Integrations, "Messaging channels" | Heading "Where your customers already talk to you", plus one manual row "WhatsApp Business Platform" | Category `hubHeading`; WhatsApp Business Platform becomes an item |
| Integrations, "Telephony and dialers" | Heading "Calls on the same record as chats" | Category `hubHeading` |
| Integrations, "CRM and Marketing" | No heading | Nothing to move |

Gaps to decide before the cutover: a second hero button, the closing heading and subhead, and the hero image have no field on the master record.

## Order

1. Step 0, backup
2. Step 1, cap check
3. Deploy `feat/integrations-restructure`
4. Step 2, taxonomy versions, straight after the deploy
5. Step 3, slugs, then redirects once pages exist
6. Step 4, slug required
7. Step 5, logo to image, in its four parts
8. Step 6, summary cap
9. Step 7, cutover, on the deploy where the website starts reading the master record

Each of Steps 3 to 7 is its own deploy, with a backup before any step that writes data.
