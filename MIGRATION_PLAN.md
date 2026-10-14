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

### Step 2. Give existing categories and connection types their first version (decision needed)

The branch turns drafts on for integration categories and connection types. Their 9 existing entries were saved before drafts existed, so they have no `_status` and no saved version.

- **Visitors and the website:** unaffected. Their read access shows published entries and entries with no `_status`.
- **The admin:** affected. It looks relationship values up as drafts, which reads from the versions collection. Until each entry has a version, existing categories and connection types show as "Untitled - ID: ..." on integration items and are missing from the pickers.

Fix: publish each of the 9 entries once, through the Local API with `_status: 'published'` and no other change. This creates the first version and sets `_status` to published. It was tested locally on 14 Oct 2026: after it, visitors still see all 6 categories and 3 connection types, and the admin shows their names.

Rollback: restore `integrationcategories` and `connectiontypes` from the Step 0 backup and drop `_integrationcategories_versions` and `_connectiontypes_versions`.

Alternative, if no data change is wanted: turn drafts off again for the two taxonomies (one option in `IntegrationTaxonomies.ts`).

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

## Order

1. Step 0, backup
2. Step 1, cap check
3. Step 2, taxonomy versions (or drafts off)
4. Deploy `feat/integrations-restructure`
5. Step 3, slugs, then redirects once pages exist
6. Step 4, slug required
7. Step 5, logo to image, in its four parts
8. Step 6, summary cap

Each of Steps 3 to 6 is its own deploy, with a backup before any step that writes data.

## Also worth knowing

- The CMS already has published pages with the slugs `integration` and `integrations`. The slug clash checks only compare integration items with master records, not with pages. If the main master record takes the slug `integrations`, decide which one serves `/integrations` before the website reads the master.
