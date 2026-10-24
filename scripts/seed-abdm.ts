/**
 * Writes the ABDM integration entry from content/integrations/abdm.md (v2,
 * 23 Oct 2026, from content/integrations/abdm-outline.md) as a draft. The
 * published version, and the entry's status and Own page switch, are left as
 * they are: the outline keeps ABDM Planned until NHA certification, and
 * publishing is a separate decision.
 *
 * The copy keeps its [CONFIRM] markers. FAQ answers reject them, so the
 * entry cannot be published while an FAQ holds one. Glance lines, What
 * moves and Edge cases do not, so a marker there would go live as it is:
 * the script lists every field that still holds one.
 *
 * Integrations have no page sections yet, so the contrast strip, benefits,
 * how it works, use cases, what's next and consent copy stay in the content
 * file until they do.
 *
 * Usage (from neuroncx-cms):
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" node --env-file=.env scripts/seed-abdm.ts
 *
 * Runs only against a database on this machine. Add --remote to run it
 * anywhere else; it says which database first.
 */
import fs from 'fs'
import { getPayload, type Where } from 'payload'

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

/* ------------------------------------------------------------------ */
/* Limits                                                              */
/* ------------------------------------------------------------------ */

const tooLong: string[] = []
const fit = (where: string, value: string, max: number) => {
  if (value.length > max) tooLong.push(`${where}: ${value.length} of ${max}`)
  return value
}

/* ------------------------------------------------------------------ */
/* Lookups                                                             */
/* ------------------------------------------------------------------ */

const payload = await getPayload({ config })

const one = async (collection: any, where: Where, what: string) => {
  const found = await payload.find({ collection, where, draft: true, limit: 1, depth: 0, overrideAccess: true })
  if (!found.docs.length) {
    say(`Missing ${what}. Nothing written.`)
    process.exit(1)
  }
  return found.docs[0] as { id: string }
}

const category = await one('integrationCategories', { name: { equals: 'EMR and Healthcare Systems' } }, 'the category "EMR and Healthcare Systems"')
const connection = await one('connectionTypes', { name: { equals: 'API and webhooks' } }, 'the connection type "API and webhooks"')
// The positioning order: CRM, Workflows, Bots.
const products = await Promise.all(
  ['CRM', 'Workflows', 'Bots'].map((name) => one('products', { name: { equals: name } }, `the product "${name}"`)),
)
const related = await Promise.all(
  ['eka-care', 'docpulse'].map((slug) => one('integrations', { slug: { equals: slug } }, `the integration "${slug}"`)),
)

/* ------------------------------------------------------------------ */
/* The entry                                                           */
/* ------------------------------------------------------------------ */

const entry = {
  name: 'ABDM',
  slug: 'abdm',
  category: category.id,
  connection: connection.id,
  products: products.map((x) => x.id),
  featured: false,

  // Card: no channel words
  tagline: fit('tagline', 'ABHA on every patient record', 45),
  summary: fit('summary', 'Verified ABHA on each patient record, with reports linked to it and consent tracked for every visit.', 120),
  glance: [
    ['ABHA verified on the record', 'Checked with ABDM, saved once, used on every visit'],
    ['One record per patient', 'ABHA helps match records across branches [CONFIRM]'],
    ['Reports linked to each visit', 'The patient sees them in their health records app'],
    ['Consent kept with the visit', 'Who asked, for which records, and until when'],
  ].map(([title, line], i) => ({ title: fit(`glance ${i + 1} title`, title, 40), line: fit(`glance ${i + 1} line`, line, 60) })),

  // SEO
  primaryKeyword: 'abdm integration',
  secondaryKeywords: ['abha integration', 'abdm compliant software', 'abdm compliant hmis', 'abdm scan and share', 'abdm m1 m2 m3'].map(
    (keyword) => ({ keyword }),
  ),
  meta: {
    title: fit('SEO title', 'ABDM Integration: ABHA on Every Patient Record | NeuronCx', 60),
    description: fit(
      'SEO description',
      'Verified ABHA on each patient record, reports linked to every visit, and consent tracked for audit. Works alongside your ABDM-certified HMIS.',
      155,
    ),
  },

  // Page
  heroHeading: fit('hero heading', 'ABHA on every patient record, linked to every visit', 70),
  heroSubheading: fit(
    'hero subheading',
    'Verify ABHA once and keep it on the patient record, with reports and consent beside each visit. Your HMIS keeps the clinical record. NeuronCx keeps the patient record.',
    200,
  ),
  cta: { label: 'Book a demo', link: { type: 'custom', url: '/contact', newTab: false } },
  related: related.map((x) => x.id),
  headingOverrides: {
    statusTable: fit('heading, what moves', 'What moves, and when', 70),
    edgeCases: fit('heading, edge cases', 'Questions teams ask before they switch it on', 70),
    setup: fit('heading, setup', 'Setting it up', 70),
  },

  // What moves: record-first. Keep only the rows live at launch.
  statusFlow: [
    ['ABHA added at booking', 'ABHA verified', 'Checked with ABDM and saved on the patient record, so nobody asks for it again'],
    ['Patient scans the facility QR', 'Token issued', 'The patient record is found or created, and a token joins the queue [CONFIRM in first release]'],
    ['Report ready', 'Linked to ABHA', "Linked to the patient's ABHA, marked on the visit, and the patient is told [CONFIRM M2 role]"],
    ['Another facility asks for records', 'Consent granted', 'Shared only as the patient consented, and the consent is saved on the record [CONFIRM]'],
    ['Consent withdrawn', 'Consent revoked', 'Sharing stops, and the withdrawal is saved on the patient record [CONFIRM]'],
  ].map(([event, inPartner, whatHappens], i) => ({
    event: fit(`status ${i + 1} event`, event, 40),
    inPartner: fit(`status ${i + 1} pill`, inPartner, 40),
    whatHappens: fit(`status ${i + 1} action`, whatHappens, 120),
  })),

  // Questions teams ask before they switch it on
  edgeCases: [
    [
      'The patient has no ABHA',
      'They can still book. The record is saved without one, and the patient gets a link to create an ABHA [CONFIRM].',
    ],
    [
      "The ABHA and the phone number don't match",
      'Nothing is saved until ABDM verifies the ABHA. If the check fails, a person on your team takes over.',
    ],
    [
      'Your HMIS also links the same report',
      "Setup checks your HMIS's ABDM status, so each report is linked to ABHA once [CONFIRM].",
    ],
    [
      'The patient withdraws consent',
      'Sharing stops, and the withdrawal is saved on the patient record beside the visit it covers.',
    ],
  ].map(([situation, whatWeDo], i) => ({
    situation: fit(`edge case ${i + 1}`, situation, 80),
    whatWeDo: fit(`edge case ${i + 1} answer`, whatWeDo, 160),
  })),

  // Setting it up: one lane each (From You, From NeuronCx). WhatsApp is named only here.
  setupChecklist: (
    [
      ['Your facility and doctors registered on NHPR, the provider registry', 'you'],
      ['Your facility ID and ABDM settings added in NeuronCx', 'neuroncx'],
      ["Your HMIS's ABDM status checked, so reports aren't linked twice", 'neuroncx'],
      ['WhatsApp templates approved for the ABHA step and report notices', 'neuroncx'],
      ['The Scan and Share QR code at your front desk, if you use it', 'you'],
      ['A test booking and a test report checked in a health records app', 'neuroncx'],
    ] as const
  ).map(([item, providedBy], i) => ({ item: fit(`setup ${i + 1}`, item, 80), providedBy })),
  // The checklist is written here, so the connection type's default must not replace it.
  setupChecklistSource: connection.id,

  // The main visual is the patient record, not a chat transcript.
  chatExample: [],

  // FAQ (plain text answers, 600). Questions 1 and 2 are written for the day
  // NHA certifies NeuronCx; until then the entry stays Planned.
  faqs: [
    [
      'Does NeuronCx integrate with ABDM?',
      "Yes. NeuronCx is certified by the National Health Authority for [CONFIRM milestones and date]. ABDM puts a verified ABHA on each patient record in NeuronCx, links each visit's reports to it, and keeps the patient's consent beside the visit it covers.",
    ],
    [
      'Is NeuronCx ABDM certified?',
      'Yes, for [CONFIRM milestones, usually M1 for ABHA and M2 for sharing records], certified by the National Health Authority on [CONFIRM date]. Certification covers NHA functional tests, a security audit by an empanelled auditor and a demo. Go-live then happens facility by facility.',
    ],
    [
      'Do we still need an ABDM-compliant HMIS?',
      "Yes. Your HMIS keeps the clinical record. NeuronCx keeps the patient record: who they are, every visit, and the consent they've given. The two work side by side, and setup checks your HMIS's ABDM status so the same report isn't linked twice.",
    ],
    [
      'Can patients add their ABHA on WhatsApp?',
      'Yes. During a booking, the patient adds their ABHA number or ABHA address and confirms it with a one-time password [CONFIRM the steps NHA allows]. It is then saved on their record, so nobody asks again. Patients without an ABHA can still book.',
    ],
    [
      'How is patient consent recorded?',
      "Every request for a patient's records goes through ABDM's consent manager. The patient sees who is asking, for which records and until when, and can approve or refuse. The decision is saved on the patient record beside the visit it covers, ready for audit and DPDP [CONFIRM].",
    ],
    [
      'Does ABHA help us avoid duplicate patient records?',
      '[CONFIRM the matching key. If it is not confirmed, swap this question for "Which health records can be linked to ABHA?"] Yes. ABHA is a matching key on the patient record, so records that share an ABHA across branches and channels are flagged for your team to merge.',
    ],
  ].map(([question, answer], i) => ({ question: fit(`FAQ ${i + 1} question`, question, 120), answer: fit(`FAQ ${i + 1} answer`, answer, 600) })),

  // WhatsApp (read by the bot, not shown on the page)
  waRowTitle: fit('WhatsApp row title', 'ABDM', 24),
  waRowDescription: fit('WhatsApp row description', 'ABHA on your record, reports in your health app', 70),
  waHeaderType: 'text',
  waHeader: fit('WhatsApp header', 'ABDM integration', 60),
  waBody: fit(
    'WhatsApp body',
    "ABHA is checked once and kept on your record. Reports from each visit reach your health records app, and nothing is shared without your consent. NeuronCx works alongside your hospital's HMIS, which keeps the clinical record.",
    1024,
  ),
  waKeyPoints: [
    'ABHA verified and kept on the record',
    'Reports linked to each visit',
    'Nothing shared without consent',
    'Works alongside your HMIS',
  ].map((line, i) => ({ line: fit(`WhatsApp key point ${i + 1}`, line, 60) })),
  waFooter: fit('WhatsApp footer', 'NeuronCx integrations', 60),
  waButtons: [
    { label: fit('button 1', 'Book a demo', 20), action: 'bookDemo' },
    { label: fit('button 2', 'Other integrations', 20), action: 'otherSystems' },
  ],

  // Knowledge base: off while Planned. The answer is true today; switch its
  // first sentence to "Yes" once NHA certifies NeuronCx.
  includeInKbase: false,
  kbAnswer: fit(
    'knowledge base answer',
    "Not yet. NeuronCx's ABDM integration is in ABDM's sandbox and waits for certification by the National Health Authority. Once certified, it puts a verified ABHA on each patient record, links each visit's reports to it, and keeps the patient's consent beside the visit it covers. The hospital's HMIS keeps the clinical record. NeuronCx keeps the patient record.",
    600,
  ),
  kbFacts: [
    "NeuronCx's ABDM integration is built on ABDM's v3 APIs and is in ABDM's sandbox.",
    'NHA certification needs at least two ABDM milestones, functional tests, a security audit and a demo.',
    'Once certified, a verified ABHA is saved on each patient record in NeuronCx.',
    "The hospital's HMIS keeps the clinical record. NeuronCx keeps the patient record.",
    "Every request for a patient's records goes through ABDM's consent manager.",
  ].map((fact, i) => ({ fact: fit(`fact ${i + 1}`, fact, 160) })),
  kbQuestions: [
    'Do you integrate with ABDM?',
    'Is NeuronCx ABDM certified?',
    'Does NeuronCx support ABHA?',
    'Can patients add their ABHA on WhatsApp?',
    "Will reports reach the patient's health records app?",
  ].map((question, i) => ({ question: fit(`question ${i + 1}`, question, 120) })),
  kbSynonyms: ['Ayushman Bharat Digital Mission', 'ABHA', 'ABHA ID', 'Ayushman Bharat Health Account', 'Health ID', 'NDHM'].map(
    (synonym, i) => ({ synonym: fit(`synonym ${i + 1}`, synonym, 40) }),
  ),
}

if (tooLong.length) {
  say(`Over a field limit, nothing written:\n  ${tooLong.join('\n  ')}`)
  process.exit(1)
}

/* ------------------------------------------------------------------ */
/* Write                                                               */
/* ------------------------------------------------------------------ */

const existing = await payload.find({
  collection: 'integrations',
  where: { slug: { equals: 'abdm' } },
  draft: true,
  limit: 1,
  depth: 0,
  overrideAccess: true,
})
const args = {
  collection: 'integrations',
  draft: true,
  overrideAccess: true,
  context: { disableRevalidate: true, skipRag: true },
} as any
// A new entry starts Planned with Own page off; an existing one keeps its own.
const saved = (
  existing.docs.length
    ? await payload.update({ ...args, id: existing.docs[0].id, data: { ...entry, _status: 'draft' } })
    : await payload.create({ ...args, data: { ...entry, status: 'planned', hasOwnPage: false, _status: 'draft' } })
) as { id: string; status?: string | null; hasOwnPage?: boolean | null }
say(
  `  ABDM integration: ${existing.docs.length ? 'updated' : 'created'} as a draft (id ${saved.id}, status ${saved.status}, own page ${saved.hasOwnPage ? 'on' : 'off'})`,
)

// Every field that still holds a [CONFIRM] marker. FAQ answers block
// publishing; the others would be published as they are.
const markers: string[] = []
const scan = (where: string, value: unknown) => {
  if (typeof value === 'string' && value.includes('[CONFIRM')) markers.push(where)
}
entry.glance.forEach((g, i) => scan(`glance ${i + 1} line`, g.line))
entry.statusFlow.forEach((r, i) => scan(`status ${i + 1} action`, r.whatHappens))
entry.edgeCases.forEach((r, i) => scan(`edge case ${i + 1} answer`, r.whatWeDo))
entry.faqs.forEach((f, i) => scan(`FAQ ${i + 1} answer`, f.answer))
say(`  Fields with a [CONFIRM] marker (${markers.length}): ${markers.join(', ') || 'none'}`)
process.exit(0)
