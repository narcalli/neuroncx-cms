/**
 * Creates the three starting agent families in Lists, as drafts, from
 * docs/cms/collections/micro_apps_swarm.md section 3. A family that already
 * exists (same slug, or same name, within the agentFamily type) is left as
 * it is, so the script is safe to run again.
 *
 * waRowTitle is the name where it fits WhatsApp's 24 characters, and is left
 * empty otherwise. waRowDescription is left empty for an editor to write.
 *
 * Order is the hub order. The home page puts Read and match documents first;
 * that is the home page's own choice, not this order.
 *
 * Usage (from neuroncx-cms):
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" node --env-file=.env scripts/seed-agent-families.ts
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

const ROW_TITLE_MAX = 24

const FAMILIES = [
  {
    name: 'Book and get paid',
    slug: 'book-and-get-paid',
    order: 10,
    painLine: 'Your team spends the day confirming slots and chasing payments.',
    summary:
      "One agent books the appointment in your system, the next sends the payment link and stays with it until it's settled.",
  },
  {
    name: 'Read and match documents',
    slug: 'read-and-match-documents',
    order: 20,
    painLine: 'Someone on your team retypes every prescription, marksheet and ID.',
    summary:
      'One agent reads the document from a photo, the next matches what it found to your own lists and fills the record.',
  },
  {
    name: 'Check and coach your team',
    slug: 'check-and-coach-your-team',
    order: 30,
    painLine: "Managers can't listen to every call, or tell who is actually improving.",
    summary:
      "One agent picks a fair sample of calls, the next scores them against your sheet, and the third shows each person's progress week by week.",
  },
]

const payload = await getPayload({ config })

for (const family of FAMILIES) {
  const found = await payload.find({
    collection: 'lists',
    where: {
      and: [
        { type: { equals: 'agentFamily' } },
        { or: [{ slug: { equals: family.slug } }, { name: { equals: family.name } }] },
      ],
    },
    draft: true,
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (found.docs.length) {
    say(`exists, left as is: ${family.name} (${found.docs[0].id})`)
    continue
  }

  const fitsRow = family.name.length <= ROW_TITLE_MAX
  const doc = await payload.create({
    collection: 'lists',
    draft: true,
    overrideAccess: true,
    context: { disableRevalidate: true },
    data: {
      ...family,
      type: 'agentFamily',
      ...(fitsRow ? { waRowTitle: family.name } : {}),
      _status: 'draft',
    },
  })
  say(
    `created draft: ${family.name} (${doc.id})` +
      (fitsRow
        ? ''
        : `. waRowTitle left empty: the name is ${family.name.length} characters, over ${ROW_TITLE_MAX}`),
  )
}

process.exit(0)
