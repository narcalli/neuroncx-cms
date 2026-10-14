/**
 * One-off content fixes from the 14 Oct 2026 integrations audit.
 *
 *   1. Adds the "Booking and operations" category and moves Practo into it
 *      (integrations.md: Practo's category should be Booking and operations).
 *   2. Points the /integrations "Booking and operations" block at that
 *      category (it was a Filter with nothing chosen, so it listed every
 *      integration), and removes empty leftover manual rows from the page's
 *      other integration blocks.
 *   3. Corrects DocPulse (hero heading about LeadSquared, a duplicate At a
 *      glance line, a "he patient" typo, stray spaces) and LeadSquared (stray
 *      spaces, empty link button text). Slugs are left as they are.
 *   4. Adds WhatsApp Business Platform to Messaging channels as a DRAFT, for
 *      review. Nothing about it is visible until someone publishes it.
 *
 * Usage (from neuroncx-cms):
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" node --env-file=.env scripts/fix-integrations-content.ts [--write] [--remote]
 *
 * Without --write it only reports what it would change. It stops before
 * writing if a document it would change has an unpublished newer draft.
 */
import fs from 'fs'
import { getPayload } from 'payload'

import config from '../src/payload.config'

const say = (s: string) => fs.writeSync(1, s + '\n')
const write = process.argv.includes('--write')
const url = process.env.DATABASE_URL || ''
const host = url.replace(/^mongodb(\+srv)?:\/\/([^@/]*@)?([^/?]+).*$/, '$3')
const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)
say(`Database: ${host || '(not set)'}${write ? '' : ' (dry run, nothing is written)'}`)
if (!local && !process.argv.includes('--remote')) {
  say('Refusing: not a database on this machine. Add --remote.')
  process.exit(1)
}

const payload = await getPayload({ config })
const op = { overrideAccess: true as const, context: { disableRevalidate: true } }

// Stop if the newest version of a document is an unpublished draft: saving
// the published data over it would bury an editor's pending changes.
const pendingDraft = async (collection: 'integrations' | 'pages', id: string) => {
  const v = await payload.findVersions({
    collection,
    where: { parent: { equals: id } },
    sort: '-updatedAt',
    limit: 1,
    ...op,
  })
  return (v.docs[0] as any)?.version?._status === 'draft'
}

const items = (await payload.find({ collection: 'integrations', limit: 100, depth: 0, ...op }))
  .docs as any[]
const page = (
  await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'integrations' } },
    depth: 0,
    ...op,
  })
).docs[0] as any
const blockers: string[] = []
for (const d of items)
  if (await pendingDraft('integrations', d.id)) blockers.push(`integration ${d.name}`)
if (page && (await pendingDraft('pages', page.id))) blockers.push('page integrations')
if (blockers.length) {
  say(`Stopping: unpublished drafts would be overwritten: ${blockers.join(', ')}`)
  process.exit(1)
}

/* 1. Category and Practo */
let booking = (
  await payload.find({
    collection: 'integrationCategories',
    where: { slug: { equals: 'booking-and-operations' } },
    ...op,
  })
).docs[0] as any
if (booking) say('1. Category "Booking and operations" exists already')
else if (write) {
  booking = await payload.create({
    collection: 'integrationCategories',
    data: {
      name: 'Booking and operations',
      slug: 'booking-and-operations',
      order: 45,
      hubHeading: 'Third-party bookings brought into the same journeys',
      _status: 'published',
    } as any,
    ...op,
  })
  say(`1. Created category "Booking and operations" (order 45, id ${booking.id})`)
} else say('1. Would create category "Booking and operations" (order 45), published')

const practo = items.find((d) => d.name === 'Practo')
if (practo && booking && String(practo.category) !== String(booking.id)) {
  if (write)
    await payload.update({
      collection: 'integrations',
      id: practo.id,
      data: { category: booking.id },
      ...op,
    })
  say(`   ${write ? 'Moved' : 'Would move'} Practo into it`)
} else if (!booking) say('   Would move Practo into it')

/* 2. The /integrations page blocks */
if (!page) say('2. Page integrations not found, skipped')
else {
  let changed = false
  const layout = (page.layout || []).map((b: any) => {
    if (b.blockType !== 'integrations') return b
    const next = { ...b }
    const before = (b.items || []).length
    const kept = (b.items || []).filter((row: any) => row?.name)
    if (kept.length !== before) {
      next.items = kept
      changed = true
      say(
        `2. Block "${b.label}": ${write ? 'removed' : 'would remove'} ${before - kept.length} empty leftover row(s)`,
      )
    }
    if (b.populateBy === 'filter' && !(b.categories || []).length && !(b.products || []).length) {
      next.categories = booking ? [booking.id] : ['(new category)']
      changed = true
      say(
        `2. Block "${b.label}": ${write ? 'now filters' : 'would filter'} by Booking and operations`,
      )
    }
    return next
  })
  if (changed && write) {
    await payload.update({
      collection: 'pages',
      id: page.id,
      data: { layout, _status: 'published' } as any,
      ...op,
    })
    say('2. Page integrations saved and published')
  }
}

/* 3. Content corrections (the integration slugs are left as they are) */
const trimRows = (rows: any[] | undefined, key: string) =>
  (rows || []).map((r) => ({ ...r, [key]: typeof r[key] === 'string' ? r[key].trim() : r[key] }))
const corrections: Record<string, (d: any) => Record<string, unknown>> = {
  DocPulse: (d) => ({
    ...(d.heroHeading === 'LeadSquared WhatsApp integration with a chat assistant'
      ? { heroHeading: 'Book DocPulse appointments on WhatsApp' }
      : {}),
    glance: (d.glance || []).map((g: any) =>
      g.title === '5 booking statuses' && g.line === '5 booking statuses'
        ? { ...g, line: 'Confirmed, arrived, no-show, completed and cancelled' }
        : g,
    ),
    statusFlow: (d.statusFlow || []).map((r: any) =>
      typeof r.whatHappens === 'string' && r.whatHappens.startsWith('he patient ')
        ? { ...r, whatHappens: `T${r.whatHappens}` }
        : r,
    ),
    waKeyPoints: trimRows(d.waKeyPoints, 'line'),
    ...(typeof d.kbAnswer === 'string' ? { kbAnswer: d.kbAnswer.trim() } : {}),
  }),
  LeadSquared: (d) => ({
    meta: {
      ...d.meta,
      title: typeof d.meta?.title === 'string' ? d.meta.title.trim() : d.meta?.title,
    },
    waKeyPoints: trimRows(d.waKeyPoints, 'line'),
    ...(!d.waLinkLabel ? { waLinkLabel: 'See how it works' } : {}),
  }),
}
for (const d of items) {
  const fix = corrections[d.name]
  if (!fix) continue
  const data = fix(d)
  const changed = Object.keys(data).filter((k) => JSON.stringify(data[k]) !== JSON.stringify(d[k]))
  if (!changed.length) {
    say(`3. ${d.name}: nothing to correct`)
    continue
  }
  if (write)
    await payload.update({
      collection: 'integrations',
      id: d.id,
      data: Object.fromEntries(changed.map((k) => [k, data[k]])),
      ...op,
    })
  say(`3. ${d.name}: ${write ? 'corrected' : 'would correct'} ${changed.join(', ')}`)
}

/* 4. WhatsApp Business Platform, as a draft */
const messaging = (
  await payload.find({
    collection: 'integrationCategories',
    where: { slug: { equals: 'messaging' } },
    ...op,
  })
).docs[0] as any
const native = (
  await payload.find({
    collection: 'connectionTypes',
    where: { name: { equals: 'Native connector' } },
    ...op,
  })
).docs[0] as any
const existing = (
  await payload.find({
    collection: 'integrations',
    where: { name: { equals: 'WhatsApp Business Platform' } },
    draft: true,
    ...op,
  })
).docs[0]
if (existing) say('4. WhatsApp Business Platform exists already')
else if (write) {
  const wa: any = await payload.create({
    collection: 'integrations',
    draft: true,
    data: {
      name: 'WhatsApp Business Platform',
      slug: 'whatsapp-business-platform',
      category: messaging?.id,
      connection: native?.id,
      status: 'live',
      order: 10,
      summary:
        'Customers message your WhatsApp Business number, and each chat lands on their record in NeuronCx.',
      _status: 'draft',
    } as any,
    ...op,
  })
  say(
    `4. Created WhatsApp Business Platform as a DRAFT (id ${wa.id}), for review before publishing`,
  )
} else say('4. Would create WhatsApp Business Platform as a draft in Messaging channels')

const visible = (c: 'integrations' | 'integrationCategories') =>
  payload.find({ collection: c, overrideAccess: false, limit: 0 }).then((r) => r.totalDocs)
say(
  `Visitors now see ${await visible('integrations')} integrations and ${await visible('integrationCategories')} categories`,
)
process.exit(0)
