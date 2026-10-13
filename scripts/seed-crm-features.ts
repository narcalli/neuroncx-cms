/**
 * Creates one draft B2C CRM entry, Customer 360, if it doesn't exist, from
 * the worked examples in docs/cms/collections/b2c_crm.md (sections 5, 6 and
 * 7). A test entry for checking the collection: status Planned, saved as a
 * draft, so visitors never see it. Needs the CRM areas from seed-lists.ts.
 *
 * Usage (from neuroncx-cms):
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" node --env-file=.env scripts/seed-crm-features.ts
 *
 * Runs only against a database on this machine. Add --remote to run it
 * anywhere else; it says which database first.
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

const SLUG = 'customer-360'
const payload = await getPayload({ config })

const existing = await payload.find({
  collection: 'crmFeatures',
  where: { slug: { equals: SLUG } },
  draft: true,
  limit: 1,
  depth: 0,
  overrideAccess: true,
})
if (existing.docs.length) {
  say(`  Customer 360: exists, skipped (id ${existing.docs[0].id})`)
  process.exit(0)
}

const area = (
  await payload.find({
    collection: 'lists',
    where: { and: [{ type: { equals: 'crmArea' } }, { slug: { equals: 'know-every-customer' } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
).docs[0]
if (!area) {
  say('  The CRM area "Know every customer" is missing. Run scripts/seed-lists.ts first.')
  process.exit(1)
}

const doc = await payload.create({
  collection: 'crmFeatures',
  draft: true,
  overrideAccess: true,
  context: { disableRevalidate: true },
  data: {
    _status: 'draft',
    name: 'Customer 360',
    slug: SLUG,
    generateSlug: false,
    status: 'planned',
    area: area.id,
    problemSolved: ['duplicateRecords', 'strangerFollowUp'],
    // Section 5
    tagline: 'One record for every person',
    summary:
      'Every chat, call, booking and visit on one record, so no one asks a returning customer to start again.',
    legacyGap: 'Sales CRMs create a new lead each time a past customer gets in touch.',
    heroHeading: "Know who you're talking to, every time",
    benefits: [
      {
        title: 'No more starting again',
        line: 'Returning customers are recognised on their first message.',
      },
    ],
    // Section 6
    waRowTitle: 'Customer 360',
    waRowDescription: 'One record for every customer, across every channel',
    waHeader: 'Customer 360',
    waBody:
      "Every chat, call, booking and visit lands on one record, so your team knows who they're talking to before they reply.",
    waKeyPoints: [
      { line: 'WhatsApp, calls and walk-ins on one record' },
      { line: 'Past bookings and visits in view' },
      { line: 'Works across all your locations' },
    ],
    // The doc gives the labels only; these replies are placeholders.
    waButtons: [
      { label: 'See it in a demo', action: 'book-demo' },
      { label: 'Other features', action: 'other-features' },
    ],
    // Section 7
    kbAnswer:
      "Customer 360 is the NeuronCx record that brings together everything about one customer: their WhatsApp chats, calls, bookings, carts and visits, across every location. Front desk and call centre teams use it to see a customer's history before replying, so a returning customer is never treated as a new lead.",
    kbFacts: [{ fact: 'WhatsApp chats and phone calls for the same person appear on one record.' }],
    kbQuestions: [
      { question: "Can I see a customer's full history?" },
      { question: 'Does NeuronCx merge duplicate contacts?' },
    ],
    kbSynonyms: [
      { synonym: 'Patient 360' },
      { synonym: 'customer profile' },
      { synonym: 'single customer view' },
    ],
  },
})

say(`  Customer 360: created as a draft (id ${doc.id}, status planned)`)
process.exit(0)
