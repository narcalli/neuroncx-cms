# History and rollback

**Repos:** neuroncx-cms (Payload) and neuroncx-website (Next.js)
**Code:** `src/history/` (CMS); `src/utilities/versionCookie.ts`, `src/utilities/versionPreview.ts`, `src/utilities/cms.ts`, `src/app/(frontend)/next/preview/route.ts` (website)
**Shipped:** 4 Nov 2026, CMS `52b63c8`, website `247cd20`

Every collection with drafts keeps a full history: who saved each version, what changed, and when it was live. Any version can be previewed on the website or rolled back to, always as a draft.

---

## Part 1: Using History

### Where it is

- Open any entry and choose the **History** tab (it replaced the Versions tab). The number on the tab is the version count.
- Collections with History: Pages, Posts, Features, Customers, Industries, Industry topics, Agents (micro-apps), Hubs, Lists, Shared content, Integrations, Integrations master, CRM features, Integration categories and Connection types.
- Not included: the Header, Footer, Site Settings and WhatsApp Lists globals, and collections without drafts (Media, Categories, Products, Users, Enquiries, Redirects).

### Reading an entry

Entries are newest first, 20 to a page (**Newer** and **Older** at the bottom).

| Entry | Meaning |
|---|---|
| **Published** | This version went live. |
| **Saved draft** | Saved with Save draft. Not live. |
| **Editing session** | Autosaves while someone typed (Pages, Posts and Features autosave). Shows when the session started and ended. |
| **Rolled back to (date)** | A rollback made this draft from the version of that date. |
| **Unpublished** | The entry was taken off the website. |

- **Live** marks the version visitors see now. **Current draft** marks the newest version when it is not the live one.
- Each entry names who saved it. Versions saved before 4 Nov 2026 say **Not recorded**. **System** means a script or an automatic job saved it.
- The list under each entry is what changed since the version before it, for example:
  - `Title changed`
  - `Hero ("AI Harness for CRM"): Heading, Intro changed`
  - `FAQ added`, `Benefits removed`, `Layout: order changed`
  - `Key points: 2 added, 1 edited`
  - `Created` for the first version, `No content changes` when only the status changed.
- Moving a block is reported once, as `order changed`. It does not show every block after it as changed.

### Compare

**Compare** opens Payload's own side-by-side comparison of that version with an earlier one. You can pick which version to compare against at the top.

Payload's comparison pairs blocks by their position, not by which block they are. After a block is added or moved, every block after it can look changed there. The History summary does not have this problem, so read it first.

### Preview an old version

**Preview** opens the website in a new tab, showing that version.

- A banner at the bottom says **Old version preview** and the version's date. Visitors never see this.
- Only the entry itself is shown as it was. Anything it pulls in from elsewhere (case study cards, the integrations list, the header and footer) shows as it is now.
- **Exit preview** in the banner returns to the normal site. Opening an ordinary Preview link from an editor also ends the old-version preview.
- Preview is available on Pages, Posts, Industries, Industry topics, Agents, Hubs, Lists (shown on their hub page), Integrations and Customers.

### Roll back

1. In History, find the version to go back to and choose **Roll back to this**.
2. Read the confirmation. It may warn that:
   - the version has a **different address** (slug); publishing it changes the page's address,
   - the page sits under a **different parent page**; publishing it moves the page,
   - some **links point to items that no longer exist** (deleted media or entries); they come back empty.
3. Choose **Roll back**. The editor opens with that version as the draft.
4. Check it with **Preview**, then **Publish**. Until you publish, the live page does not change.

Notes:

- A rollback always makes a draft. Rolling back straight to the live site is switched off, including Payload's own Restore button on the Compare page. That button now shows: "Rolling back is to a draft only…". Payload's **Restore as draft** still works and does the same as Roll back to this.
- The draft you had before the rollback stays in History, so nothing is lost. To undo a rollback, roll back to the entry before it.
- Publishing a rolled-back draft runs the usual checks (address clashes, the primary keyword, required fields). If the version is older than a rule, publishing can stop with a message to fix first.
- Industries, topics and agents with **Use page defaults** on keep following the current default layout after a rollback; their other fields come back.

### What History does not do

- Roll back a single block on its own. Rollback is for the whole entry.
- Keep history for the Header, Footer and Site Settings.
- Limit who can roll back. Anyone signed in to the CMS can.

---

## Part 2: How it works

### Where it is switched on

`payload.config.ts` wraps the collection list in `applyHistory()` (`src/history/index.ts`). Every collection whose `versions.drafts` is set gets `withHistory()`; the rest are left alone. A collection that gains drafts later gets History with no other change.

`withHistory()` adds, per collection:

| What | Where |
|---|---|
| Fields `updatedBy` (Last edited by) and `rolledBackFrom` | `src/history/fields.ts` |
| `beforeOperation`: `draftRollbackOnly` (first) | `src/history/hooks.ts` |
| `beforeChange`: `stampEditor` (last) | `src/history/hooks.ts` |
| `afterChange`: `logContentEvent` (last) | `src/history/hooks.ts` |
| Endpoint `GET /api/{collection}/:id/rollback-check?version=<versionId>` | `src/history/check.ts` |
| History tab: `admin.components.views.edit.versions` → `@/history/HistoryView#HistoryView`, tab label History | `src/history/HistoryView.tsx`, `HistoryList.tsx` |
| `versions.maxPerDoc: 0` (keep every version) | `src/history/index.ts` |

`maxPerDoc: 0` replaces Payload's pruning, which deleted by date only and so could remove the only published version (`payload/dist/versions/enforceMaxVersions.js`).

### Fields

- `updatedBy`: relationship to `users`, read-only in the sidebar. Set on every save by `stampEditor` to the signed-in user. Saves by scripts, jobs without a user, or MCP API keys (a different auth collection) set it to null, shown as System. Payload copies it into each version, which is how History knows who saved what.
- `rolledBackFrom`: hidden text, the version id a rollback came from. Set only during a rollback, cleared on every other save.
- Both have field access `read: signed in`, `create/update: false`. Visitors never receive them, and clients cannot write them: field access strips client values in beforeValidate, then `stampEditor` sets the real value in beforeChange.

### Draft-only rollback

A rollback is Payload's `restoreVersion` operation (`POST /api/{collection}/versions/:versionId?draft=true`). With `draft=true` Payload writes a new draft version and leaves the stored (live) entry untouched.

`draftRollbackOnly` runs before the operation:

- Without `draft=true`: throws a 400 with the "Rolling back is to a draft only…" message. This covers the REST and GraphQL restore, Payload's Restore button, and the Local API (whose `restoreVersion` has no draft option).
- With `draft=true`: puts the version id in `req.context.historyRollbackFrom`, and sets `disableRevalidate` and `skipRag`, the flags the existing website refresh hooks and RAG hooks already honour. A draft changes nothing a visitor sees.

Everything else runs as for a normal draft save: validation (skipped for drafts unless a collection asks for it), beforeChange hooks (address clash checks, fallbacks, `followPageDefaults`), afterChange hooks. Payload sets `req.context.isRestoringVersion`, which stops default values being filled in, so a field added after the version was made stays empty in the draft.

### The event log (`contentEvents`)

Hidden collection, `src/history/ContentEvents.ts`.

- Why: versions alone lose some moments. Payload writes an unpublish over the latest version in place when unpublishing all locales, so a version that was live stops saying so. The log keeps publish, unpublish and rollback with who and when.
- Fields: `collectionSlug`, `doc`, `action` (`published`, `unpublished`, `rolledBack`), `user`, `version` (the version the save produced), `fromVersion` (rollbacks).
- Access: read by signed-in users; create, update and delete refused over the API. Only `logContentEvent` writes it, with `overrideAccess`.
- How `eventFor` decides:
  - a rollback flag in the context: `rolledBack`,
  - the saved entry is published: `published`,
  - it ends in draft over a published previous version, and the stored entry is now draft: `unpublished` (a draft save leaves the stored entry published, so it is not one),
  - anything else (draft saves, autosaves): no event; the versions are the record.
- Saves made on the way by another entry's save (child pages re-saved after their pillar) are skipped: the request's route id must be this entry's.
- One event per version and action: if the entry's last event has the same action and version, nothing is written. A page is saved twice when created (the nested-docs plugin re-saves it for its breadcrumbs), and both saves end here.
- Never fails the save: errors are logged as `[history] could not record the event…`.

### Building the History list

`buildHistory()` in `src/history/build.ts`, called by the server component `HistoryView`.

- Reads versions with the editor's own access (`overrideAccess: false`), newest first by `updatedAt`, one more than the page needs so the oldest shown has something to compare with.
- Live: the newest published version, when the stored entry is published.
- Kind: rollback marker first, then published (by status or a `published` event), then unpublished (an `unpublished` event pointing at this version), then autosave session, then saved draft.
- Unpublish events that do not point at a listed version become entries of their own.
- A version with no content change, by the same person, within 5 seconds of the one before and of the same kind, is folded into it (the creation re-save).
- Preview links: the collection's own `admin.preview` link built from the current entry, or for integrations and customers a path from `src/history/previews.ts` built from the version itself. Both get `version=<collection>:<versionId>` and `versionAt=<date>` added (`withVersion()`).
- Author names come from one `users` query per page. Events are read up to 500 per entry.

### Change summaries

`summariseChange()` in `src/history/summary.ts`, a pure function over the collection's own fields.

- Blocks and array rows are matched by their row `id`. Added, removed, edited and order changes are reported separately.
- Blocks are named by their singular label plus the row's own heading, title, name or label when it has one. Reusable blocks referenced by slug are found in the config-level `blocks` list.
- Left out: hidden, disabled and read-only fields, and `id`, `_status`, `createdAt`, `updatedAt`, `publishedAt`, `updatedBy`, `rolledBackFrom`, `breadcrumbs`. These change on save and would show on every entry.
- Empty values (`null`, `''`, `[]`, missing) compare equal. At most 8 lines; longer lists end with "and N more changes".

### Rollback warnings

`rollbackCheckEndpoint()` in `src/history/check.ts`, called by the dialog before it opens.

- Checks the version belongs to the entry.
- `slug`: the version's slug when it differs from the current draft's.
- `parentChanged`: Pages only, when the parent page differs.
- `missing`: every relationship and upload in the version (`collectRefs()`, through blocks, arrays, groups, tabs and polymorphic fields), looked up by id; those not found are counted by field.
- Signed-in users only. The warnings are advisory; the rollback itself does not depend on them.

### Old-version preview on the website

1. History's Preview link opens `/next/preview?path=…&previewSecret=…&version=<collection>:<versionId>&versionAt=<date>`.
2. The preview route checks the secret as before, turns draft mode on, then:
   - `parseVersionParam()` accepts only `<collection>:<24 hex characters>` for a collection in `VERSION_COLLECTIONS` (pages, posts, sectors, industryTopics, microApps, hubs, lists, integrations, customers), and keeps the date only if it parses,
   - stores it in the `ncx-version` cookie (`collection|id|date`, httpOnly, SameSite Lax, Secure in production, path `/`),
   - any preview link without a valid version deletes the cookie, and so does `/next/exit-preview`.
3. `currentVersionTarget()` reads the cookie only while draft mode is on (draft mode needs the preview secret). Outside a request it returns null.
4. Pages, posts, industries, topics, agents, hubs and lists: every draft request goes through `request()` in `src/utilities/cms.ts`. For a list from `/api/<that collection>`, `withPreviewedVersion()` swaps the entry whose id is the version's parent for the version's content, fetched at the same depth by `getVersion()`, keeping the entry's id. Other entries and other requests are untouched.
5. Integrations and customers: their pages load only published, live entries and ignore draft mode, so `loadItem()` and `loadCustomer()` first call `previewedVersionOf()` (`src/utilities/versionPreview.ts`). It returns the version when the cookie names that collection and the version's slug matches the page's.
6. `getVersion()` reads `/api/<collection>/versions/<id>` with `CMS_PREVIEW_API_KEY`, never cached, once per request. Without the key it returns null and the page shows as an ordinary draft preview.
7. The layout passes the version's date to `DraftBanner`, which formats it in the browser's time zone (matching the CMS History tab) once it is running in the browser.

### Settings needed

| Where | Variable | Needed for |
|---|---|---|
| Amplify (CMS) | `NEXT_PUBLIC_SITE_URL` = `https://neuroncx.in` | Preview links, and where website refreshes are sent |
| Amplify (CMS) | `PREVIEW_SECRET` | Preview links |
| Amplify (CMS) | `REVALIDATE_SECRET` | The website refreshing when a rolled-back draft is published. `amplify.yml` now passes it to the server; it still has to be set in the console |
| Netlify (website) | `PREVIEW_SECRET` | Same value as Amplify |
| Netlify (website) | `REVALIDATE_SECRET` | Same value as Amplify |
| Netlify (website) | `CMS_PREVIEW_API_KEY` | Drafts and old versions in preview. Without it, Preview shows the published page |
| Netlify (website) | `CMS_URL` | Where the website reads the CMS |
| Netlify (website) | `NEXT_PUBLIC_PAYLOAD_URL` | Optional: live preview refreshing as you type. Read at build time |

History itself (the tab, who saved, rollback) needs none of these. All Amplify and Netlify variables are read at build time: redeploy after changing one.

### Tests

- CMS: `tests/int/history.int.spec.ts`. Change summaries, the draft-only rule, the editor stamp, `eventFor`, the event log's access, the rollback warnings' reference collector, preview links, and that every drafts collection (and only those) has History.
- Website: `tests/int/versionPreview.int.spec.ts`. The version parameter and cookie, the swap in `request()` (and when it must not happen), `previewedVersionOf()`, and the preview route setting and clearing the cookie.

### Checking it locally

- Run the CMS (3001) and the website (3000) against the local database. A test user with an API key is needed for REST checks and for the website's `CMS_PREVIEW_API_KEY`; remove it afterwards.
- Changes to collection hooks need a CMS dev server restart; the running server keeps the old hooks.
- The website in dev mode is awkward for preview:
  - on `127.0.0.1`, Next 16 blocks its dev scripts, so the page does not hydrate and the banner shows "the version chosen in History" without a date,
  - on `localhost`, the CMS on `localhost:3001` clears the website's draft cookie when the page loads CMS media, so preview switches off.
  - Use a production build instead: `next build` with `NEXT_PUBLIC_PAYLOAD_URL=http://localhost:3001` set at build time (without it the live-preview listener crashes the page in draft mode), then `next start`, and open it as `http://127.0.0.1:3000`.

### Known limits and next steps

- Payload's Compare view pairs rows by position. Replacing it is possible (`views.edit.version`) but not done.
- One-off scripts that write `_*_versions` directly with Mongoose bypass History and can change past versions: `scripts/migrate-closing-off.ts`, `scripts/migrate-hero-design.ts`, `scripts/seed-integration-taxonomies.ts`, and the integration categories refresh (`src/collections/integrations/hooks.ts`, `db.updateVersion`). New scripts should save through the Local API instead.
- Globals have no versions. Payload's global restore always writes the live global, even as a draft, so they need a custom rollback first.
- No roles: anyone signed in can roll back and publish. A Publisher role would come before an approval step.
- Old-version preview shows only the previewed entry as it was; content it pulls in from other entries is current.
- With every version kept, storage grows with use. At about 11 KB per page version this is small; a retention job can be added if it ever matters.
