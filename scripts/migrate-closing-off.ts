/**
 * Closing panel off by default (24 Oct 2026). See
 * src/content/closingMigration.ts. Turns the closing switch off on every
 * microApps and hubs record and saved version where it is on, in place, so
 * no new version is made.
 *
 * Usage (from neuroncx-cms):
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" node --env-file=.env scripts/migrate-closing-off.ts [--dry-run]
 *
 * --dry-run counts what would change and writes nothing. Runs only against a
 * database on this machine; add --remote to run it anywhere else. Back up
 * first.
 */
import fs from 'fs'
import { getPayload } from 'payload'

import config from '../src/payload.config'
import { closingOffPatch } from '../src/content/closingMigration'
import { versionPatch } from '../src/content/heroMigration'

const say = (s = '') => fs.writeSync(1, s + '\n')
const DRY = process.argv.includes('--dry-run')
const local = /^mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(process.env.DATABASE_URL || '')
if (!local && !process.argv.includes('--remote')) {
  say('Refusing to run: this database is not on this machine. Add --remote to run it anyway.')
  process.exit(1)
}
say(`${local ? 'Local' : 'Remote'} database${DRY ? ', dry run: nothing is written' : ''}.`)

const payload = await getPayload({ config })
const db = payload.db as any

for (const slug of ['microApps', 'hubs'] as const) {
  let docs = 0
  let versions = 0
  for (const doc of await db.collections[slug].find({}).lean()) {
    const patch = closingOffPatch(doc)
    if (!Object.keys(patch).length) continue
    if (!DRY) await db.collections[slug].updateOne({ _id: doc._id }, { $set: patch })
    docs++
  }
  for (const v of await db.versions[slug].find({}).lean()) {
    const patch = closingOffPatch(v.version ?? {})
    if (!Object.keys(patch).length) continue
    if (!DRY) await db.versions[slug].updateOne({ _id: v._id }, { $set: versionPatch(patch) })
    versions++
  }
  say(`${slug}: closing turned off on ${docs} records and ${versions} versions${DRY ? ' (would be)' : ''}`)
}
process.exit(0)
