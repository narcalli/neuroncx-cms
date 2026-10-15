# NCX post content sync

**Repo:** neuroncx-cms (Payload) → dashboard-backend (`/cms-sync`)
**Code:** `src/rag/`, `src/collections/NcxPostContents.ts`, `scripts/ncx-backfill.ts`

## What it does

- Every published section of the website becomes one post content in NCX (IID 4), so the WhatsApp bot can answer from it.
- New sections arrive in NCX as **Awaiting Approval**. Nothing reaches the bot until someone approves it in the dashboard (status dropdown on the post content).
- Edited sections update the same post content in place: title, text and embedding. An approved section stays approved.
- A section removed from a page, an unpublished page, or a deleted page: its post contents are set to **Archived**.

## What counts as a section

- Each block on a page (Hero, Stat Band, FAQ...) is one section.
- Each tab of a collection entry (Card, Story, FAQ, Knowledge base...) is one section.
- A long post body is split at its headings.
- Sections over 2,400 characters are split into parts; sections under 40 characters are skipped.
- Only words a visitor reads are sent: text, textarea and rich text. Not sent: SEO, WhatsApp fields, links, buttons, URLs, ids, selects, numbers, dates, media, relationships.
- Each section ends with a "More:" link to the page on neuroncx.in.

## Collections and when they are sent

- **Pages, posts, features:** when published.
- **Customers:** when published and not marked Past. Customers with "Show real name" off are sent under their anonymised name; the name fields are never sent.
- **Integrations:** when published, Live, and "Include in knowledge base" is on.
- **Integrations master:** when published and "Include in knowledge base" is on.
- Not sent: Enquiries, Users, Media, Categories, Sectors, the taxonomy lists, header and footer.
- To add a collection: add it to `src/rag/sources.ts` and wrap it with `withRag()` in `payload.config.ts`.

## How it runs

- Publishing queues a job on the `ncx-sync` queue, 30 seconds later so quick edits settle. One job per document at a time; a newer job replaces a waiting one.
- The job compares each section with what was last sent (the **NCX post contents** list under System in the admin) and sends only what changed.
- Failed jobs retry 5 times, 1, 2, 4, 8 and 16 minutes apart. A section edited before NCX finished indexing it is resent on the next retry.

## Setup

- **Backend env** (dashboard-backend): `CMS_SYNC_KEY` (shared secret), `CMS_SYNC_TREATMENT_ID` (55 today), optional `CMS_SYNC_SHARD_ID` to point at another shard.
- **CMS env** (Amplify): `NCX_SYNC_URL`, `NCX_SYNC_KEY` (same value as `CMS_SYNC_KEY`), `NCX_SITE_URL`, and `CRON_SECRET`. With `NCX_SYNC_URL` or `NCX_SYNC_KEY` unset the sync does nothing.
- **Job runner:** Amplify does not run background jobs, so a scheduler calls the runner every 2 minutes:
  - `GET {CMS URL}/api/payload-jobs/run?queue=ncx-sync&limit=3`
  - header `Authorization: Bearer {CRON_SECRET}`
  - an EventBridge rule with an API destination does this; keep `limit` low so a run finishes inside the request timeout.
- **First load:** run once from a machine with the CMS `.env`:
  - `NODE_OPTIONS="--no-deprecation --import=tsx/esm" node --env-file=.env scripts/ncx-backfill.ts --dry-run` to see the sections
  - the same without `--dry-run` to send them
