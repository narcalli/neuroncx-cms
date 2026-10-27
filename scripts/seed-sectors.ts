/**
 * Creates the starting sectors, in this order, if they are missing, as
 * planned drafts. Matched by slug, so running it twice changes nothing.
 *
 * Usage (from neuroncx-cms):
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" node --env-file=.env scripts/seed-sectors.ts
 *
 * Works on whichever database DATABASE_URL points at, and says which first.
 */
import fs from 'fs'
import { getPayload } from 'payload'

import config from '../src/payload.config'

const SECTORS = ['Hospitals', 'Diagnostics', 'Dental', 'Skin and hair', 'Ayurveda', 'Higher education', 'Hospitality']

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const host = (process.env.DATABASE_URL || '').replace(/^mongodb(\+srv)?:\/\/([^@/]*@)?([^/?]+).*$/, '$3')
const out: string[] = [`Database: ${host || '(DATABASE_URL not set)'}`]

const payload = await getPayload({ config })
const existing = await payload.find({ collection: 'sectors', limit: 1000, depth: 0, overrideAccess: true })
const have = new Set(existing.docs.map((d) => d.slug))

let order = 10
for (const name of SECTORS) {
  const slug = slugify(name)
  if (have.has(slug)) out.push(`  ${name}: exists, skipped`)
  else {
    // Sectors are industries now (src/collections/Sectors): new ones start as
    // planned drafts, to be filled in and published from the admin.
    await payload.create({
      collection: 'sectors',
      draft: true,
      data: { name, slug, order, status: 'planned', _status: 'draft' },
      overrideAccess: true,
      context: { disableRevalidate: true },
    })
    out.push(`  ${name}: created (slug ${slug}, order ${order})`)
  }
  order += 10
}

fs.writeSync(1, out.join('\n') + '\n')
process.exit(0)
