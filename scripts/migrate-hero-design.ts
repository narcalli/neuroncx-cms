/**
 * Hero design migration, local only (23 Oct 2026). See
 * src/content/heroMigration.ts for what changes. Updates every microApps and
 * hubs record and every saved version of them in place, so drafts and the
 * published version both carry the new fields and no new version is made.
 *
 * Usage (from neuroncx-cms):
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" node --env-file=.env scripts/migrate-hero-design.ts
 *
 * Refuses any database not on this machine. Back up first.
 */
import fs from 'fs'
import { getPayload } from 'payload'

import config from '../src/payload.config'
import { entryHeroPatch, hubHeroPatch, versionPatch } from '../src/content/heroMigration'

const say = (s = '') => fs.writeSync(1, s + '\n')
if (!/^mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(process.env.DATABASE_URL || '')) {
  say('Refusing to run: this database is not on this machine.')
  process.exit(1)
}

const payload = await getPayload({ config })
const db = payload.db as any

const migrate = async (slug: 'microApps' | 'hubs', patchFor: (doc: any) => Record<string, unknown>) => {
  let docs = 0
  let versions = 0
  for (const doc of await db.collections[slug].find({}).lean()) {
    const patch = patchFor(doc)
    if (!Object.keys(patch).length) continue
    await db.collections[slug].updateOne({ _id: doc._id }, { $set: patch })
    docs++
  }
  for (const v of await db.versions[slug].find({}).lean()) {
    const patch = patchFor(v.version ?? {})
    if (!Object.keys(patch).length) continue
    await db.versions[slug].updateOne({ _id: v._id }, { $set: versionPatch(patch) })
    versions++
  }
  say(`${slug}: ${docs} records and ${versions} versions updated`)
}

await migrate('microApps', entryHeroPatch)
await migrate('hubs', hubHeroPatch)

// What the agents use now.
const agents = await db.collections.microApps.find({}, { slug: 1, heroDesign: 1, heroMedia: 1, media: 1, showClosing: 1 }).lean()
for (const a of agents) {
  say(`  ${a.slug}: ${a.heroDesign}${a.heroMedia ? ', picture kept' : ''}`)
}
process.exit(0)
