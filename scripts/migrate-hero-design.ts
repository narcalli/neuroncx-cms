/**
 * Hero design and optional closing migration (23 Oct 2026). See
 * src/content/heroMigration.ts for what changes. Updates every microApps and
 * hubs record and every saved version of them in place, so drafts and the
 * published version both carry the new fields and no new version is made.
 *
 * Usage (from neuroncx-cms):
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" node --env-file=.env scripts/migrate-hero-design.ts [--dry-run]
 *
 * --dry-run counts what would change and writes nothing. Runs only against a
 * database on this machine; add --remote to run it anywhere else (production
 * after the CMS deploy). Back up first.
 */
import fs from 'fs'
import { getPayload } from 'payload'

import config from '../src/payload.config'
import { entryHeroPatch, hubHeroPatch, versionPatch } from '../src/content/heroMigration'

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

const migrate = async (slug: 'microApps' | 'hubs', patchFor: (doc: any) => Record<string, unknown>) => {
  let docs = 0
  let versions = 0
  const fields = new Set<string>()
  for (const doc of await db.collections[slug].find({}).lean()) {
    const patch = patchFor(doc)
    if (!Object.keys(patch).length) continue
    Object.keys(patch).forEach((k) => fields.add(k))
    if (!DRY) await db.collections[slug].updateOne({ _id: doc._id }, { $set: patch })
    docs++
  }
  for (const v of await db.versions[slug].find({}).lean()) {
    const patch = patchFor(v.version ?? {})
    if (!Object.keys(patch).length) continue
    if (!DRY) await db.versions[slug].updateOne({ _id: v._id }, { $set: versionPatch(patch) })
    versions++
  }
  say(`${slug}: ${docs} records and ${versions} versions ${DRY ? 'would be' : ''} updated (${[...fields].join(', ') || 'nothing'})`)
}

await migrate('microApps', entryHeroPatch)
await migrate('hubs', hubHeroPatch)

if (!DRY) {
  // What the agents and hubs use now.
  for (const a of await db.collections.microApps.find({}, { slug: 1, heroDesign: 1, heroMedia: 1, showClosing: 1 }).lean()) {
    say(`  ${a.slug}: ${a.heroDesign}${a.heroMedia ? ', picture kept' : ''}, closing ${a.showClosing ? 'on' : 'off'}`)
  }
  for (const h of await db.collections.hubs.find({}, { slug: 1, heroChat: 1, showClosing: 1 }).lean()) {
    say(`  hub ${h.slug}: chat senders ${(h.heroChat ?? []).map((r: any) => r.sender).join(', ')}, closing ${h.showClosing ? 'on' : 'off'}`)
  }
}
process.exit(0)
