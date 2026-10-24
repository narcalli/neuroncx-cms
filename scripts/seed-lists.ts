/**
 * Creates the starting CRM areas and agent families in the Lists collection,
 * if they are missing. Matched by slug plus type, so running it twice
 * changes nothing, and entries editors have changed are left alone.
 *
 * Usage (from neuroncx-cms):
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" node --env-file=.env scripts/seed-lists.ts
 *
 * Runs only against a database on this machine. For any other database,
 * such as production at release time, add --remote; it says which database
 * first.
 */
import fs from 'fs'
import { getPayload } from 'payload'

import config from '../src/payload.config'
import { toSlug } from '../src/fields/core'

type Entry = {
  type: 'crmArea' | 'agentFamily'
  name: string
  order: number
  intro?: string
  summary?: string
}

const ENTRIES: Entry[] = [
  {
    type: 'crmArea',
    name: 'Know every customer',
    order: 10,
    intro: 'One record per person, however they reach you',
  },
  {
    type: 'crmArea',
    name: 'Reach them',
    order: 20,
    intro: 'The right message to the right people, with their consent',
  },
  {
    type: 'crmArea',
    name: 'Run the work',
    order: 30,
    intro: 'Every enquiry and booking handled by the right person',
  },
  {
    type: 'crmArea',
    name: 'Measure what happened',
    order: 40,
    intro: 'See what worked, from first message to completed visit',
  },
  {
    type: 'agentFamily',
    name: 'Book and get paid',
    order: 10,
    summary:
      "One agent books the appointment in your system, the next sends the payment link and stays with it until it's settled.",
  },
  {
    type: 'agentFamily',
    name: 'Read and match documents',
    order: 20,
    summary:
      'One agent reads the document from a photo, the next matches what it found to your own lists and fills the record.',
  },
  {
    type: 'agentFamily',
    name: 'Check and coach your team',
    order: 30,
    summary:
      "One agent picks a fair sample of calls, the next scores them against your sheet, and the third shows each person's progress week by week.",
  },
]

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
const existing = await payload.find({
  collection: 'lists',
  limit: 1000,
  depth: 0,
  pagination: false,
  overrideAccess: true,
})
const have = new Set(existing.docs.map((d) => `${d.type}:${d.slug}`))

for (const entry of ENTRIES) {
  const slug = toSlug(entry.name)
  const label = `  ${entry.type} "${entry.name}"`
  if (have.has(`${entry.type}:${slug}`)) {
    say(`${label}: exists, skipped`)
    continue
  }
  await payload.create({
    collection: 'lists',
    data: { ...entry, slug, generateSlug: false },
    overrideAccess: true,
    context: { disableRevalidate: true },
  })
  say(`${label}: created (slug ${slug}, order ${entry.order})`)
}

process.exit(0)
