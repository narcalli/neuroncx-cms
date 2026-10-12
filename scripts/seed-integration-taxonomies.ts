/**
 * One-off: creates the starting Integration Categories, Connection Types and
 * Products, then converts everything saved while those were fixed lists into
 * links to the new entries:
 * - integrations: category, connection and products
 * - page blocks (Integrations, Integrations Marquee, Partner Strip): the
 *   Categories and Products filters
 *
 * Usage (from neuroncx-cms):
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" node --env-file=.env scripts/seed-integration-taxonomies.ts
 *       dry run: reports what it would do, changes nothing
 *   ... scripts/seed-integration-taxonomies.ts --write
 *       applies it
 *
 * It works on whichever database DATABASE_URL points at, and says which one
 * first. Running it twice is safe: existing entries are skipped, and values
 * already converted are left alone.
 *
 * Old codes are converted in place, in the current record and in every saved
 * version (drafts included), rather than through a normal save. A normal save
 * would publish any pending draft as a side effect. Payload stores links as
 * ObjectIds, so that is what is written.
 */
import fs from 'fs'
import mongoose from 'mongoose'
import { getPayload } from 'payload'

import config from '../src/payload.config'

const WRITE = process.argv.includes('--write')
const log: string[] = []
const say = (s: string) => log.push(s)

const START = {
  integrationCategories: [
    ['Messaging channels', 'messaging'],
    ['Telephony and dialers', 'telephony'],
    ['CRM and marketing', 'crm-marketing'],
    ['Hospital systems', 'hospital-systems'],
    ['Payments', 'payments'],
    ['Data and BI', 'data-bi'],
  ],
  connectionTypes: [
    ['Native connector', 'native'],
    ['API and webhooks', 'api-webhooks'],
    ['File import', 'file-import'],
  ],
  products: [
    ['CRM', 'crm'],
    ['Campaigns', 'campaigns'],
    ['Call quality', 'call-quality'],
    ['Bots', 'bots'],
    ['Knowledge base', 'knowledge-base'],
    ['Workflows', 'workflows'],
  ],
} as const
type ListSlug = keyof typeof START

const host = (process.env.DATABASE_URL || '').replace(/^mongodb(\+srv)?:\/\/([^@/]*@)?([^/?]+).*$/, '$3')
say(`Database: ${host || '(DATABASE_URL not set)'}   Mode: ${WRITE ? 'WRITE' : 'dry run, nothing will change'}`)

const payload = await getPayload({ config })
const ctx = { disableRevalidate: true, skipRag: true }

// 1. Starting entries, matched by slug. In a dry run, missing ones get a
//    placeholder so the rest of the report can still say what would convert.
const idBySlug: Record<ListSlug, Map<string, mongoose.Types.ObjectId>> = {
  integrationCategories: new Map(),
  connectionTypes: new Map(),
  products: new Map(),
}
say('Starting entries:')
for (const list of Object.keys(START) as ListSlug[]) {
  const existing = await payload.find({ collection: list, limit: 1000, depth: 0, overrideAccess: true })
  for (const d of existing.docs) idBySlug[list].set(String(d.slug), new mongoose.Types.ObjectId(String(d.id)))
  let order = 10
  const made: string[] = []
  const skipped: string[] = []
  for (const [name, slug] of START[list]) {
    if (idBySlug[list].has(slug)) skipped.push(name)
    else {
      if (WRITE) {
        const doc = await payload.create({ collection: list, data: { name, slug, order } as any, overrideAccess: true, context: ctx })
        idBySlug[list].set(slug, new mongoose.Types.ObjectId(String(doc.id)))
      } else {
        idBySlug[list].set(slug, new mongoose.Types.ObjectId())
      }
      made.push(name)
    }
    order += 10
  }
  say(`  ${list}: ${WRITE ? 'created' : 'would create'} ${made.length} (${made.join(', ') || 'none'})${skipped.length ? `; ${skipped.length} already exist` : ''}`)
}

// An old code is a plain string that is not already an id.
const isOldCode = (v: unknown) => typeof v === 'string' && !/^[a-f0-9]{24}$/.test(v)
const unknownCodes: string[] = []
const mapOne = (list: ListSlug, v: unknown, where: string) => {
  if (!isOldCode(v)) return v
  const id = idBySlug[list].get(v as string)
  if (!id) unknownCodes.push(`${where}: "${v}"`)
  return id ?? v
}
const mapMany = (list: ListSlug, arr: unknown, where: string) =>
  Array.isArray(arr) ? arr.map((v) => mapOne(list, v, where)) : arr
const hasOld = (v: unknown) => isOldCode(v) || (Array.isArray(v) && v.some(isOldCode))

// 2. Integrations: the record and every saved version.
const fixIntegration = (d: any, where: string) => {
  if (!d) return null
  if (!hasOld(d.category) && !hasOld(d.connection) && !hasOld(d.products)) return null
  return {
    category: mapOne('integrationCategories', d.category, where),
    connection: mapOne('connectionTypes', d.connection, where),
    products: mapMany('products', d.products, where),
  }
}
const IMain = (payload.db as any).collections.integrations
const IVer = (payload.db as any).versions.integrations
say('Integrations:')
let iCount = 0
for (const doc of await IMain.find({}).lean()) {
  const set = fixIntegration(doc, `integration "${doc.name}"`)
  const versions = await IVer.find({ parent: doc._id }).lean()
  const vSets = versions.map((v: any) => ({ _id: v._id, set: fixIntegration(v.version, `integration "${doc.name}" version`) }))
  const vCount = vSets.filter((v: any) => v.set).length
  if (!set && !vCount) continue
  iCount++
  if (WRITE) {
    if (set) await IMain.collection.updateOne({ _id: doc._id }, { $set: set })
    for (const v of vSets) {
      if (!v.set) continue
      await IVer.collection.updateOne(
        { _id: v._id },
        { $set: Object.fromEntries(Object.entries(v.set).map(([k, val]) => [`version.${k}`, val])) },
      )
    }
  }
  say(`  "${doc.name}": ${WRITE ? 'converted' : 'would convert'}${set ? ' the record' : ''} and ${vCount} saved version(s)`)
}
if (!iCount) say('  none hold old codes')

// 3. Page blocks: only the three integration blocks. Other blocks have
//    fields with the same names (the Archive block's categories are post
//    categories) and must not be touched.
const SOURCE_BLOCKS = new Set(['integrations', 'integrationsMarquee', 'partnerStrip'])
const fixLayout = (layout: any, where: string) => {
  if (!Array.isArray(layout)) return null
  let changed = false
  const next = layout.map((b: any) => {
    if (!b || !SOURCE_BLOCKS.has(b.blockType) || (!hasOld(b.categories) && !hasOld(b.products))) return b
    changed = true
    return {
      ...b,
      categories: mapMany('integrationCategories', b.categories, `${where} ${b.blockType}`),
      products: mapMany('products', b.products, `${where} ${b.blockType}`),
    }
  })
  return changed ? next : null
}
const PMain = (payload.db as any).collections.pages
const PVer = (payload.db as any).versions.pages
say('Page block filters:')
let pCount = 0
for (const doc of await PMain.find({}).lean()) {
  const layout = fixLayout(doc.layout, `page "${doc.slug}"`)
  const versions = await PVer.find({ parent: doc._id }).lean()
  const vSets = versions.map((v: any) => ({ _id: v._id, layout: fixLayout(v.version?.layout, `page "${doc.slug}" version`) }))
  const vCount = vSets.filter((v: any) => v.layout).length
  if (!layout && !vCount) continue
  pCount++
  if (WRITE) {
    if (layout) await PMain.collection.updateOne({ _id: doc._id }, { $set: { layout } })
    for (const v of vSets) if (v.layout) await PVer.collection.updateOne({ _id: v._id }, { $set: { 'version.layout': v.layout } })
  }
  say(`  "${doc.slug}": ${WRITE ? 'converted' : 'would convert'}${layout ? ' the page' : ''} and ${vCount} saved version(s)`)
}
if (!pCount) say('  none hold old codes')

if (unknownCodes.length) {
  say(`Codes with no matching entry, left as they are (${unknownCodes.length}):`)
  for (const u of [...new Set(unknownCodes)]) say(`  ${u}`)
}

fs.writeSync(1, log.join('\n') + '\n')
process.exit(0)
