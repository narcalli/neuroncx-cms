/**
 * MIGRATION_PLAN.md, Step 2: publishes every integration category and
 * connection type once, with no other change. Entries saved before drafts
 * were turned on have no saved version, so the admin cannot show them in
 * relationship fields; publishing gives each one its first version and sets
 * _status to published. Visitors see the same entries before and after.
 *
 * Usage (from neuroncx-cms):
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" node --env-file=.env scripts/publish-integration-taxonomies.ts
 *
 * Runs only against a database on this machine. For production at release
 * time, after a backup, add --remote; it says which database first.
 * Running it twice changes nothing new: already published entries with a
 * version are skipped.
 */
import fs from 'fs'
import { getPayload } from 'payload'

import config from '../src/payload.config'

const say = (s: string) => fs.writeSync(1, s + '\n')
const url = process.env.DATABASE_URL || ''
const host = url.replace(/^mongodb(\+srv)?:\/\/([^@/]*@)?([^/?]+).*$/, '$3')
const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)

say(`Database: ${host || '(DATABASE_URL not set)'}`)
if (!local && !process.argv.includes('--remote')) {
  say('Refusing to run: this database is not on this machine. Add --remote to run it anyway.')
  process.exit(1)
}

const payload = await getPayload({ config })
let failed = 0

for (const collection of ['integrationCategories', 'connectionTypes'] as const) {
  const visibleBefore = (await payload.find({ collection, overrideAccess: false, limit: 0 })).totalDocs
  // Raw documents, past Payload's read hooks, so a missing _status shows as missing.
  const docs = (await payload.db.find({ collection, limit: 0, pagination: false })).docs as any[]
  for (const doc of docs) {
    const versions = (
      await payload.findVersions({
        collection,
        where: { parent: { equals: doc.id } },
        limit: 1,
        overrideAccess: true,
      })
    ).totalDocs
    if (doc._status === 'published' && versions > 0) {
      say(`  ${collection} "${doc.name}": already published with a version, skipped`)
      continue
    }
    if (doc._status === 'draft') {
      say(`  ${collection} "${doc.name}": a real draft, left as it is`)
      continue
    }
    try {
      await payload.update({
        collection,
        id: doc.id,
        data: { _status: 'published' },
        overrideAccess: true,
        context: { disableRevalidate: true },
      })
      say(`  ${collection} "${doc.name}": published`)
    } catch (err: any) {
      failed++
      say(`  ${collection} "${doc.name}": FAILED ${err?.message || err}`)
    }
  }
  const visibleAfter = (await payload.find({ collection, overrideAccess: false, limit: 0 })).totalDocs
  say(`  ${collection}: visitors see ${visibleBefore} before, ${visibleAfter} after`)
  if (visibleAfter !== visibleBefore) failed++
}

say(failed ? `${failed} problem(s)` : 'Done')
process.exit(failed ? 1 : 0)
