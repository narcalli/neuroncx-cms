/**
 * Creates the candidate agents from docs/cms/collections/micro_apps_swarm.md
 * section 12 in the Bot swarm collection (microApps), as drafts with status
 * Planned. Payment services also gets the worked content from sections 5 to
 * 8. An agent that already exists (same slug or name) is left as it is, so
 * the script is safe to run again.
 *
 * Needs the agent families first (scripts/seed-agent-families.ts). Qualify,
 * Recover and Status updates belong to a Follow up family that is still to
 * be confirmed; while it does not exist they are created without a family.
 *
 * Order within a family follows the table in section 12, so Prescription
 * understanding leads Read and match documents.
 *
 * Every value is checked against its field's limit and the plain-text rule
 * first. Drafts skip Payload's own checks, so nothing is written if any value
 * would fail them on publish.
 *
 * Usage (from neuroncx-cms):
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" node --env-file=.env scripts/seed-micro-apps.ts
 *
 * Runs only against a database on this machine. Add --remote to run it
 * anywhere else; it says which database first.
 */
import fs from 'fs'
import { getPayload } from 'payload'

import config from '../src/payload.config'
import { toSlug } from '../src/fields/core'
import { plainTextProblem } from '../src/fields/validators/plainText'

const say = (s: string) => fs.writeSync(1, s + '\n')
const url = process.env.DATABASE_URL || ''
const host = url.replace(/^mongodb(\+srv)?:\/\/([^@/]*@)?([^/?]+).*$/, '$3')
const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)

say(`Database: ${host || '(DATABASE_URL not set)'}`)
if (!local && !process.argv.includes('--remote')) {
  say('Refusing to run: this database is not on this machine. Add --remote to run it anyway.')
  process.exit(1)
}

/* ------------------------------------------------------------------ */
/* Checks                                                              */
/* ------------------------------------------------------------------ */

const problems: string[] = []
const t = (where: string, value: string, max: number): string => {
  if (value.length > max) problems.push(`${where}: ${value.length} of ${max} characters`)
  const plain = plainTextProblem(value)
  if (plain) problems.push(`${where}: ${plain}`)
  return value
}
const lines = (where: string, key: string, values: string[], max: number) =>
  values.map((v, i) => ({ [key]: t(`${where} ${i + 1}`, v, max) }))

/* ------------------------------------------------------------------ */
/* Section 12: the candidates                                          */
/* ------------------------------------------------------------------ */

// slug: only where the name has changed since the page went live, so the address and the other scripts' keys hold.
type Candidate = { name: string; slug?: string; family: string | null; channel: string; searchName?: string }

const CANDIDATES: Candidate[] = [
  { name: 'Appointment assistance', family: 'book-and-get-paid', channel: 'whatsapp', searchName: 'WhatsApp appointment booking' },
  { name: 'Payment services', family: 'book-and-get-paid', channel: 'whatsapp', searchName: 'WhatsApp payment link' },
  { name: 'Prescription understanding', family: 'read-and-match-documents', channel: 'whatsapp', searchName: 'Prescription reading AI' },
  { name: 'Test matching and pricing', family: 'read-and-match-documents', channel: 'whatsapp', searchName: 'Diagnostic test pricing' },
  { name: 'Student transcript assessment', slug: 'student-mark-statement-assessment', family: 'read-and-match-documents', channel: 'whatsapp', searchName: 'University admission chatbot' },
  { name: 'Identity and KYC', family: 'read-and-match-documents', channel: 'whatsapp', searchName: 'WhatsApp KYC' },
  { name: 'Assessment sampling', family: 'check-and-coach-your-team', channel: 'calls', searchName: 'Call sampling' },
  { name: 'Call quality assessment', family: 'check-and-coach-your-team', channel: 'calls', searchName: 'AI call quality monitoring' },
  { name: 'Longitudinal analysis and feedback', family: 'check-and-coach-your-team', channel: 'calls', searchName: 'Agent performance tracking' },
  { name: 'Qualify', family: 'follow-up', channel: 'whatsapp' },
  { name: 'Recover', family: 'follow-up', channel: 'whatsapp' },
  { name: 'Status updates', family: 'follow-up', channel: 'whatsapp' },
]

/* ------------------------------------------------------------------ */
/* Sections 5 to 8: Payment services                                   */
/* ------------------------------------------------------------------ */

const P = 'Payment services'
const paymentServices = {
  tagline: t(`${P} tagline`, 'Sends the link and sees it through', 60),
  summary: t(
    `${P} summary`,
    'Customers get a working payment link in the chat, and your team stops checking payment status by hand.',
    140,
  ),
  keyPoints: lines(`${P} key point`, 'line', [
    'Sends the link as soon as a booking is made',
    'Returns the live link, or a new one if it expired',
    'Confirms payment in the same chat',
  ], 60),
  startsWhen: t(`${P} startsWhen`, 'A booking or order is created, or your team sends a link by hand.', 200),
  customerSees: t(
    `${P} customerSees`,
    'A payment link with the amount. They can ask about it, ask again if they lost it, and get a confirmation in the same chat once they pay.',
    240,
  ),
  hears: t(`${P} hears`, 'Payment questions and requests for the link.', 200),
  checks: t(
    `${P} checks`,
    'Whether this booking source should get a link, whether the customer is new or returning for your discount rule, and whether the last link is active, expired or already paid.',
    300,
  ),
  acts: t(
    `${P} acts`,
    'Sends the link through Razorpay. If the customer asks again, it returns the live link, issues a new one if the old one expired, or confirms the payment already went through.',
    300,
  ),
  // handsOver and proof stay empty: both are still to confirm in the brief.
  records: t(`${P} records`, 'The payment status against the right order and customer.', 200),
  teamControls: t(
    `${P} teamControls`,
    'Which booking sources get a link, and the discount percentages, caps and thresholds. These are settings, not code changes.',
    240,
  ),
  result: t(
    `${P} result`,
    'Fewer manual status checks, and customers who lose a link get a working one without calling.',
    140,
  ),
  waRowTitle: t(`${P} waRowTitle`, 'Payment services', 24),
  waRowDescription: t(`${P} waRowDescription`, 'Sends a payment link and confirms payment in the chat', 70),
  waHeader: t(`${P} waHeader`, 'Payment services', 60),
  waBody: t(
    `${P} waBody`,
    "Once a booking is made, this agent sends a payment link in the same chat. If the customer loses it, they get the live link again, a new one if it expired, or a note that they've already paid.",
    1024,
  ),
  waKeyPoints: lines(`${P} waKeyPoint`, 'line', [
    'Link sent as soon as a booking is made',
    'Lost or expired links handled in the chat',
    'Payment confirmed without a call',
  ], 60),
  // The brief names the labels only. The actions follow the integrations'
  // naming until the WhatsApp endpoint fixes the list (foundation.md 7.4).
  waButtons: [
    { label: t(`${P} waButton 1`, 'See it in a demo', 20), action: 'bookDemo' },
    { label: t(`${P} waButton 2`, 'Other agents', 20), action: 'otherAgents' },
  ],
  kbAnswer: t(
    `${P} kbAnswer`,
    'Payment services is the NeuronCx agent that sends WhatsApp payment links through Razorpay once a booking is made. If a customer loses the link or it expires, they can ask in the chat and get the live link, a new one, or a confirmation that they have already paid. Front desk teams no longer check payment status by hand.',
    600,
  ),
  kbFacts: lines(`${P} kbFact`, 'fact', [
    'Payment links are sent through Razorpay.',
    'Discount rules for new and returning customers are set in the dashboard.',
  ], 160),
  kbQuestions: lines(`${P} kbQuestion`, 'question', [
    'Can I send payment links on WhatsApp?',
    'What happens if a payment link expires?',
  ], 120),
  kbSynonyms: lines(`${P} kbSynonym`, 'synonym', [
    'WhatsApp payment link',
    'payment bot',
    'payment collection',
  ], 40),
}

for (const c of CANDIDATES) {
  t(`${c.name} name`, c.name, Infinity)
  if (c.searchName) t(`${c.name} searchName`, c.searchName, 60)
}

if (problems.length) {
  say('Nothing written. Fix these first:')
  for (const p of problems) say(`  ${p}`)
  process.exit(1)
}

/* ------------------------------------------------------------------ */
/* Write                                                               */
/* ------------------------------------------------------------------ */

const payload = await getPayload({ config })

const familyIds = new Map<string, string>()
for (const slug of new Set(CANDIDATES.map((c) => c.family).filter(Boolean) as string[])) {
  const found = await payload.find({
    collection: 'lists',
    where: { and: [{ type: { equals: 'agentFamily' } }, { slug: { equals: slug } }] },
    draft: true,
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (found.docs[0]) familyIds.set(slug, String(found.docs[0].id))
}

const razorpay = await payload.find({
  collection: 'integrations',
  where: { name: { equals: 'Razorpay' } },
  draft: true,
  limit: 1,
  depth: 0,
  overrideAccess: true,
})
const razorpayId = razorpay.docs[0] ? String(razorpay.docs[0].id) : null

const orderIn = new Map<string, number>()
const noFamily: string[] = []

for (const c of CANDIDATES) {
  const key = c.family ?? 'none'
  const order = (orderIn.get(key) ?? 0) + 10
  orderIn.set(key, order)

  const slug = c.slug ?? toSlug(c.name)
  const existing = await payload.find({
    collection: 'microApps',
    where: { or: [{ slug: { equals: slug } }, { name: { equals: c.name } }] },
    draft: true,
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (existing.docs.length) {
    say(`exists, left as is: ${c.name} (${existing.docs[0].id})`)
    continue
  }

  const family = c.family ? familyIds.get(c.family) : undefined
  if (!family) noFamily.push(c.name)

  const extra =
    c.name === P
      ? { ...paymentServices, ...(razorpayId ? { integrations: [razorpayId] } : {}) }
      : {}

  const doc = await payload.create({
    collection: 'microApps',
    draft: true,
    overrideAccess: true,
    context: { disableRevalidate: true },
    data: {
      name: c.name,
      slug,
      status: 'planned',
      order,
      channel: [c.channel],
      ...(c.searchName ? { searchName: c.searchName } : {}),
      ...(family ? { family } : {}),
      ...extra,
      _status: 'draft',
    } as any,
  })
  say(`created draft: ${c.name} (${doc.id})${family ? '' : ', no family'}`)
}

if (noFamily.length) {
  say(`Without a family (needed before publishing): ${noFamily.join(', ')}`)
}
if (!razorpayId) say('Razorpay integration not found: Payment services has no Works with link.')

process.exit(0)
