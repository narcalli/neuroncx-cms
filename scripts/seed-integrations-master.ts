/**
 * Replaces the Integrations master records with the main one, "Integrations",
 * using the wording agreed on 14 Oct 2026. Deletes every existing master
 * record first (there is meant to be one main record), then creates this one,
 * published, with Is main on.
 *
 * Usage (from neuroncx-cms):
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" node --env-file=.env scripts/seed-integrations-master.ts
 *
 * Runs only against a database on this machine. For production, after a
 * backup, add --remote; it says which database first.
 */
import fs from 'fs'
import { getPayload } from 'payload'

import config from '../src/payload.config'

const say = (s: string) => fs.writeSync(1, s + '\n')
const url = process.env.DATABASE_URL || ''
const host = url.replace(/^mongodb(\+srv)?:\/\/([^@/]*@)?([^/?]+).*$/, '$3')
const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)
say(`Database: ${host || '(not set)'}`)
if (!local && !process.argv.includes('--remote')) {
  say('Refusing: not a database on this machine. Add --remote.')
  process.exit(1)
}

const payload = await getPayload({ config })
const op = { overrideAccess: true as const, context: { disableRevalidate: true } }
const custom = (path: string) => ({ type: 'custom', url: path })

// The systems in the hero, by item name. EkaCare is "Eka Care" in the copy.
const HERO_SYSTEMS = [
  'DocPulse',
  'EkaCare',
  'LeadSquared',
  'Exotel',
  'Knowlarity',
  'Practo',
  'Razorpay',
]
const items = (await payload.find({ collection: 'integrations', limit: 100, depth: 0, ...op }))
  .docs as any[]
const heroSystems = HERO_SYSTEMS.map((n) => {
  const hit = items.find((d) => d.name === n || d.name === n.replace('EkaCare', 'Eka Care'))
  if (!hit) throw new Error(`No integration called ${n}`)
  return hit.id
})
const hubDiagram = (
  await payload.find({
    collection: 'media',
    where: { id: { equals: '6accbf98db047676fb5d8146' } },
    limit: 1,
    ...op,
  })
).docs[0]

const existing = (
  await payload.find({ collection: 'integrationsMaster', limit: 100, draft: true, depth: 0, ...op })
).docs as any[]
for (const d of existing) {
  await payload.delete({ collection: 'integrationsMaster', id: d.id, ...op })
  say(`Deleted master record ${d.id} (${d.name ?? 'no name'}, ${d._status})`)
}

const doc: any = await payload.create({
  collection: 'integrationsMaster',
  ...op,
  data: {
    _status: 'published',
    name: 'Integrations',
    slug: 'integrations',
    isMain: true,
    filter: { categories: [], products: [] },

    primaryKeyword: 'whatsapp crm integration',
    secondaryKeywords: [
      'integrate whatsapp with crm',
      'crm integration with whatsapp',
      'whatsapp integrated crm',
      'cloud telephony integration',
      'payment gateway integration',
    ].map((keyword) => ({ keyword })),
    meta: {
      title: 'WhatsApp CRM Integration for Your Systems | NeuronCx',
      description:
        'WhatsApp CRM integration for the software you already use. Connect booking, phone, CRM and payment systems to one customer record.',
    },

    eyebrow: 'Integrations',
    h1: 'WhatsApp CRM integration for the systems you already use',
    subheading:
      'NeuronCx connects to your booking software, phone system, CRM and payment gateway. Bookings, calls and payments from each one are saved on the same customer record.',
    heroSystems,
    hero: {
      secondaryCta: { label: 'See omnichannel CX', link: custom('/omnichannel-cx') },
      image: hubDiagram?.id,
    },

    fiveThings: [
      {
        title: 'Every booking status reaches the record',
        line: "When a booking is confirmed, cancelled, missed or completed in your booking software, the customer's record shows it.",
      },
      {
        title: 'Bookings from every source in one place',
        line: 'Bookings made on WhatsApp, at your front desk or on an online booking site all land on the same record.',
      },
      {
        title: 'Every call saved with its details',
        line: "Each call is saved on the caller's record with who answered, how long it lasted and the recording.",
      },
      {
        title: 'Payments confirmed by the gateway',
        line: 'A booking shows as paid only after the payment company confirms it, not when the customer closes the page.',
      },
      {
        title: 'Your CRM stays up to date',
        line: 'Leads, chats and call scores are written into the CRM your team already uses.',
      },
    ],
    whenFeedsGoWrong: [
      {
        problem: 'The same booking is sent twice',
        whatHappens:
          'Only one booking, one confirmation and one payment link are made. The repeat is recognised and set aside.',
      },
      {
        problem: 'A system changes how it sends dates and times',
        whatHappens:
          'Both the old and the new format are read, so customers always see the right appointment time.',
      },
      {
        problem: 'A payment confirmation never arrives',
        whatHappens:
          'A regular check asks the payment gateway for the latest status, so a paid booking is never left showing as unpaid.',
      },
      {
        problem: 'A booking cannot be saved in your booking software',
        whatHappens:
          'Your staff get a WhatsApp alert with the details, so they can sort it out before the customer arrives.',
      },
      {
        problem: 'A step fails part way through',
        whatHappens:
          'Every message from your systems is saved before it is handled, so nothing is lost and the cause can be found.',
      },
    ],
    apiCard: {
      heading: "Don't see your system?",
      line: 'NeuronCx has its own API and webhooks. Most systems can connect, even if they are not listed here.',
      link: custom('/contact'),
    },

    labels: {
      statusTable: 'What moves between {name} and NeuronCx',
      edgeCases: 'How {name} errors and repeats are handled',
      setup: 'What you need to connect {name}',
      related: 'Other integrations to use with {name}',
    },

    faqs: [
      {
        question: 'Which systems does NeuronCx integrate with?',
        answer:
          'NeuronCx works with booking and records software, online booking sites, phone systems, CRMs and payment gateways. Current integrations include DocPulse, Eka Care, Practo, Exotel, Knowlarity, Tata Smartflo, astTECS, LeadSquared and Razorpay. New systems are added as clients need them.',
      },
      {
        question: 'What happens if a system sends the same booking twice?',
        answer:
          'The repeat is recognised and set aside. Only one booking is kept, and the customer gets one confirmation and one payment link.',
      },
      {
        question: 'Do bookings made outside WhatsApp show up in NeuronCx?',
        answer:
          'Yes, for systems that send booking updates. Bookings made at your front desk or on an online booking site are added to the same customer record as bookings made on WhatsApp.',
      },
      {
        question: 'Who sets up the integration?',
        answer:
          'Our engineers set it up with your IT team. Your software vendor usually adds our webhook address and gives you an API key. We match your locations, staff and services, then test it with your team before it goes live.',
      },
      {
        question: 'Do we need to change the software we use?',
        answer:
          'No. Your team keeps using the software they know. NeuronCx connects to it and saves what happens there on the customer record.',
      },
      {
        question: 'Can you connect a system that is not listed?',
        answer:
          'Often, yes. NeuronCx has its own API and webhooks, so most systems that can send or receive data can connect. Tell us the system you use and we will tell you what is involved.',
      },
    ],

    closing: {
      heading: 'Connect the systems you already use',
      subheading:
        "If your CRM or booking software isn't listed, it can usually still connect. Tell us which one you use and we'll tell you what's involved.",
    },
    cta: { label: 'Talk to our team', link: custom('/contact') },

    waIntro:
      'NeuronCx works with the booking software, phone systems, CRMs and payment gateways you already use. Pick the type of system you use to see what connects and how.',
    waListButton: 'Choose system type',
    waSectionTitle: 'Types of systems',
    waFallback:
      "We don't list that system yet, but most systems can still connect. Tell us its name and our team will tell you what's involved.",

    includeInKbase: true,
    kbAnswer:
      'NeuronCx works with booking and records software, online booking sites, phone systems, CRMs and payment gateways. Current integrations include DocPulse, Eka Care, Practo, Exotel, Knowlarity, Tata Smartflo, astTECS, LeadSquared and Razorpay. Bookings, calls, payments and chats from these systems are saved on one customer record. Systems that are not listed can often connect through the NeuronCx API and webhooks.',
    kbFacts: [
      'NeuronCx connects to booking software, online booking sites, phone systems, CRMs and payment gateways.',
      'Bookings, calls, payments and chats from connected systems are saved on one customer record.',
      "NeuronCx engineers set up each integration with the client's IT team.",
      'Systems that are not listed can often connect through the NeuronCx API and webhooks.',
    ].map((fact) => ({ fact })),
    kbQuestions: [
      'Which systems do you integrate with?',
      'Do you work with our booking software?',
      'Can you connect to our phone system?',
      'Do you integrate with our CRM?',
    ].map((question) => ({ question })),
    kbSynonyms: ['integrations', 'connected systems', 'third party integrations'].map(
      (synonym) => ({ synonym }),
    ),
    kbLastReviewed: '2026-10-14T06:30:00.000Z',
  } as any,
})

say(
  `Created master record "${doc.name}" (${doc.id}), published, Is main on, ${doc.heroSystems?.length} hero systems, hero image ${doc.hero?.image ? 'set' : 'MISSING'}`,
)
process.exit(0)
