import { describe, expect, it } from 'vitest'

import type { Entry, Refs } from '../../scripts/benchmark/entry'
import { HAND_SCORES_V3 } from '../../scripts/benchmark/handScores'
import { fingerprintOf, readWorksheet, worksheetFor, type WorksheetMeta } from '../../scripts/benchmark/worksheet'
import { decide, decideOrganisations, decideProductNames } from '../../scripts/benchmark/mechanical'
import { RUBRIC_V5 } from '../../scripts/seed-rubric-v5'

/**
 * The scoring CLI's parts (scripts/benchmark/): checks decided in code, the
 * two name checks decided from the names a person lists, and the worksheet
 * for the checks code cannot decide.
 */

const refs: Refs = {
  catalogue: ['Payment services', 'Appointment assistance', 'Razorpay'],
  integrations: ['Razorpay', 'LeadSquared'],
  customers: [],
  thirdParties: ['Google Ads', 'Meta', 'WhatsApp'],
  terms: ['Bot swarm', 'Family', 'Episode', 'Cart', 'Context Engine'],
  audiences: ['front desk', 'manager', 'clinic'],
  channels: ['WhatsApp', 'call', 'chat'],
}

const agent = (over: Partial<Entry> = {}, doc: Record<string, unknown> = {}): Entry => ({
  collection: 'microApps',
  slug: 'payment-services',
  name: 'Payment services',
  ownPage: false,
  posts: [
    {
      key: 'tab:Panel',
      heading: 'How Payment services works',
      body: 'How Payment services works\n\nStarts when: A booking is made.\nActs: Sends the link through Razorpay.\nResult: Fewer manual checks.\n\nMore: https://neuroncx.in/bot-swarm',
    },
  ],
  page: [],
  doc: { name: 'Payment services', summary: 'Sends a payment link in the chat.', result: 'Fewer manual checks.', ...doc },
  images: [],
  links: [],
  raw: 'Payment services\nSends a payment link in the chat.',
  ...over,
})

const verdictOf = (id: string, e: Entry) => {
  const d = decide(id, e, refs)
  return 'verdict' in d ? d.verdict : 'judge'
}

describe('checks decided in code', () => {
  it('leaves page and SEO checks out for an entry with no page of its own', () => {
    for (const id of ['en-hero-says-what', 'en-next-action', 'seo-meta-title', 'seo-meta-description', 'seo-share-image', 'seo-keyword-in-heading', 'seo-internal-links']) {
      expect(verdictOf(id, agent()), id).toBe('na')
    }
  })

  it('passes an agent whose steps sit under labels and that has a Result, and fails one without', () => {
    expect(verdictOf('en-task-completes', agent())).toBe('pass')
    expect(verdictOf('en-task-completes', agent({}, { result: '' }))).toBe('fail')
  })

  it('fails a heading that pairs the entry name with an admin word, or is a bare label', () => {
    const post = (heading: string) => ({ key: 'tab:x', heading, body: 'Text.' })
    expect(verdictOf('ex-headings-name-subject', agent({ posts: [post('Payment services: Listing')] }))).toBe('fail')
    expect(verdictOf('ex-headings-name-subject', agent({ posts: [post('How it works')] }))).toBe('fail')
    expect(verdictOf('ex-headings-name-subject', agent({ posts: [post('Pricing and plans')] }))).toBe('fail')
    expect(verdictOf('ex-headings-name-subject', agent())).toBe('pass')
  })

  it('decides the knowledge base answer and facts by their wording', () => {
    expect(verdictOf('ex-kb-answer-complete', agent())).toBe('fail')
    expect(verdictOf('ex-kb-answer-complete', agent({}, { kbAnswer: 'Payment services sends links.' }))).toBe('fail')
    expect(verdictOf('ex-kb-answer-complete', agent({}, { kbAnswer: 'Payment services sends payment links for the front desk.' }))).toBe('pass')
    expect(verdictOf('ex-kb-facts-checkable', agent({}, { kbFacts: [{ fact: 'One.' }, { fact: 'Two.' }] }))).toBe('fail')
    expect(verdictOf('ex-kb-facts-checkable', agent({}, { kbFacts: [{ fact: 'Links go by WhatsApp.' }, { fact: 'It confirms payment.' }, { fact: 'Links expire.' }] }))).toBe('fail')
    expect(verdictOf('ex-kb-facts-checkable', agent({}, { kbFacts: [{ fact: 'Links go by WhatsApp.' }, { fact: 'Payment is confirmed.' }, { fact: 'Links expire.' }] }))).toBe('pass')
    expect(verdictOf('ex-kb-questions-answered', agent({}, { kbQuestions: [{ question: 'A?' }, { question: 'B?' }, { question: 'C' }] }))).toBe('fail')
  })

  it('finds the listed words and characters', () => {
    expect(verdictOf('hr-no-em-dashes', agent({ raw: 'Fast — and simple' }))).toBe('fail')
    expect(verdictOf('hr-no-filler', agent({ raw: 'It works seamlessly.' }))).toBe('fail')
    expect(verdictOf('hr-cloud-telephony', agent({ raw: 'Built on agentic telephony.' }))).toBe('fail')
    expect(verdictOf('hr-dpdp-not-hipaa', agent({ raw: 'HIPAA compliant.' }))).toBe('fail')
    expect(verdictOf('hr-no-patient-data', agent({ raw: 'Call 9876543210 to book.' }))).toBe('fail')
    expect(verdictOf('ex-no-outside-references', agent({ posts: [{ key: 'b', heading: 'Stages', body: 'Select a stage to see what is recorded.' }] }))).toBe('fail')
    expect(verdictOf('ex-no-outside-references', agent({ posts: [{ key: 'b', heading: 'Links', body: 'They can ask again.' }] }))).toBe('fail')
    expect(verdictOf('hr-dpdp-not-hipaa', agent({ posts: [{ key: 'b', heading: 'Data', body: 'Personal data stays in India.' }] }))).toBe('fail')
    expect(verdictOf('hr-dpdp-not-hipaa', agent({ posts: [{ key: 'b', heading: 'Data', body: 'Personal data is handled under the DPDP Act.' }] }))).toBe('pass')
    // Consent alone does not trigger the blocker.
    expect(verdictOf('hr-dpdp-not-hipaa', agent({ posts: [{ key: 'b', heading: 'Data', body: 'Messages go only with consent.' }] }))).toBe('pass')
    expect(verdictOf('hr-observation-not-criticism', agent({ posts: [{ key: 'b', heading: 'Today', body: 'Reports show who is stuck.' }] }))).toBe('fail')
  })

  it('decides a glossary term by how its first use reads', () => {
    const body = (text: string) => agent({ posts: [{ key: 'a', heading: 'About', body: text }] })
    expect(verdictOf('ex-terms-defined', agent())).toBe('pass')
    expect(verdictOf('ex-terms-defined', body('Each choice is a cart on the record.'))).toBe('fail')
    expect(verdictOf('ex-terms-defined', body('A cart is one course choice on the record.'))).toBe('pass')
    expect(verdictOf('ex-terms-defined', body('Each choice is a cart (a course choice) on the record.'))).toBe('pass')
  })

  it('counts joins for lists, exempting card fields and clause commas', () => {
    const panel = (body: string) => agent({ posts: [{ key: 'tab:Panel', heading: 'How Payment services works', body }] })
    const list = 'Team controls: Your team sets services, doctors and slots from the dashboard, and the chat follows.'
    expect(verdictOf('ex-lists-for-enumerations', panel(list))).toBe('fail')
    expect(verdictOf('ex-lists-for-enumerations', agent({ posts: [{ key: 'tab:Card', heading: 'Payment services in short', body: list }] }))).toBe('pass')
    // v5: a comma before so, because, which or and then ends a clause.
    expect(verdictOf('ex-lists-for-enumerations', panel('Checks: Your locations, doctors and open slots, so it shows what is free.'))).toBe('pass')
    expect(verdictOf('ex-lists-for-enumerations', panel('Acts: Reads the photo, and then saves it to the record.'))).toBe('pass')
    expect(verdictOf('ex-lists-for-enumerations', panel('Acts: Asks for the document and confirms it, then reads the fields and adds them.'))).toBe('fail')
  })

  it('finds the audience from the Content standards list, singular or plural', () => {
    const body = (text: string) => agent({ posts: [{ key: 'a', heading: 'About Payment services', body: text }] })
    expect(verdictOf('en-audience-named', body('Managers see who is improving.'))).toBe('pass')
    expect(verdictOf('en-audience-named', body('Customers pay in the chat.'))).toBe('fail')
  })

  it('finds a concrete example across one section, its heading and its text', () => {
    const section = (heading: string, text: string) => agent({ posts: [{ key: 'a', heading, body: `${heading}\n\n${text}` }] })
    // v5: the name in the heading, the channel and the figure in the text.
    expect(verdictOf('en-concrete-example', section('Payment services in short', 'Sends a link for 500 rupees on WhatsApp.'))).toBe('pass')
    expect(verdictOf('en-concrete-example', section('Pricing', 'Sends a link for 500 rupees on WhatsApp.'))).toBe('fail')
    expect(verdictOf('en-concrete-example', section('Payment services in short', 'Sends a link on WhatsApp.'))).toBe('fail')
  })

  it('blocks a percentage or multiple presented as a result or market fact with no source', () => {
    const body = (text: string) => agent({ posts: [{ key: 'a', heading: 'About', body: text }] })
    expect(verdictOf('hr-claims-have-evidence', body('Bookings rose 40% in a month.'))).toBe('fail')
    expect(verdictOf('hr-claims-have-evidence', body('80% of bookings now happen in the chat.'))).toBe('fail')
    expect(verdictOf('hr-claims-have-evidence', body('Bookings rose 40% in a month, according to a 2026 survey.'))).toBe('pass')
    expect(verdictOf('hr-claims-have-evidence', body('A reminder goes out after 7 days.'))).toBe('pass')
  })

  it('leaves a product threshold or setting alone (v5: this was a false blocker)', () => {
    const body = (text: string) => agent({ posts: [{ key: 'a', heading: 'About', body: text }] })
    expect(verdictOf('hr-claims-have-evidence', body('Reads each test from a photo on WhatsApp and sends any read under 80 percent confidence to your team.'))).toBe('pass')
    expect(verdictOf('hr-claims-have-evidence', body('Flags any read it is less than 80 percent sure of for a person to check.'))).toBe('pass')
  })

  it('accepts the keyword or a catalogue name where a section or the answer names its subject', () => {
    const sector = (doc: Record<string, unknown>, posts: Entry['posts']) => agent({ name: 'Higher Education', posts }, { name: 'Higher Education', meta: { primaryKeyword: 'admission CRM' }, ...doc })
    const ok = sector({ kbAnswer: 'The NeuronCx admission CRM keeps one record for each applicant, for the front desk.' }, [])
    expect(verdictOf('ex-kb-answer-complete', ok)).toBe('pass')
    const section = (heading: string) => sector({}, [{ key: 'a', heading, body: `${heading}\n\nOne record per applicant.` }])
    expect(verdictOf('ex-sections-stand-alone', section('How Payment services works'))).toBe('pass')
    expect(verdictOf('ex-sections-stand-alone', section('An admission CRM for colleges'))).toBe('pass')
    expect(verdictOf('ex-sections-stand-alone', section('The admission cycle'))).toBe('fail')
  })

  it('accepts any repeated word in a FAQ answer that is not a common word', () => {
    const faq = (question: string, answer: string) => agent({}, { faqs: [{ question, answer }] })
    // v5: "link" counts, though it has four letters.
    expect(verdictOf('ex-faq-answers-stand-alone', faq('What happens if a payment link expires?', 'If the customer asks again, they get a new link.'))).toBe('pass')
    expect(verdictOf('ex-faq-answers-stand-alone', faq('What happens if a payment link expires?', 'If the customer asks again, they get another one.'))).toBe('fail')
  })

  it('decides FAQ answers and the card summary by their wording', () => {
    const faq = (question: string, answer: string) => agent({}, { faqs: [{ question, answer }] })
    expect(verdictOf('ex-faq-answers-stand-alone', faq('Does it expire?', 'Yes, after a day.'))).toBe('fail')
    expect(verdictOf('ex-faq-answers-stand-alone', faq('Can a payment link expire?', 'Yes, after a day.'))).toBe('pass')
    expect(verdictOf('ex-faq-answers-stand-alone', faq('What happens when a payment link expires?', 'The customer gets a new payment link.'))).toBe('pass')
    expect(verdictOf('en-card-summary', agent({}, { summary: 'It sends links.' }))).toBe('fail')
    expect(verdictOf('en-card-summary', agent())).toBe('pass')
  })

  it('counts words for paragraphs and sentences', () => {
    const long = Array.from({ length: 40 }, () => 'word').join(' ')
    expect(verdictOf('en-sentence-length', agent({ posts: [{ key: 'a', heading: 'About', body: `${long}.` }] }))).toBe('fail')
    expect(verdictOf('en-sentence-length', agent())).toBe('pass')
  })
})

describe('the name checks, decided in code from the names a person lists', () => {
  it('blocks an organisation on no list, and allows integrations, customers and listed third parties', () => {
    expect(decideOrganisations(['Razorpay', 'Google Ads', 'NeuronCx'], agent(), refs).verdict).toBe('pass')
    expect(decideOrganisations(['Apollo Hospitals'], agent(), refs)).toEqual({
      verdict: 'fail',
      note: 'Names organisations not on any list: Apollo Hospitals.',
    })
  })

  it('blocks a NeuronCx product name that is neither a published record nor a term', () => {
    expect(decideProductNames(['Payment services', 'Context Engine', 'Bot swarm'], agent(), refs).verdict).toBe('pass')
    expect(decideProductNames(['Smart Router'], agent(), refs).verdict).toBe('fail')
  })
})

describe('the worksheet', () => {
  const items = RUBRIC_V5.filter((i) => ['ex-one-name', 'en-hero-says-what', 'hr-no-client-names'].includes(i.itemId))
  const meta: WorksheetMeta = {
    collection: 'microApps',
    entryId: 'e1',
    slug: 'payment-services',
    versionId: 'v1',
    contentHash: 'h1',
    rubricId: 'r1',
    rubricVersion: '1',
    fingerprint: 'f1',
  }
  const blank = worksheetFor(agent(), meta, items, { 'ex-one-name': 'A hint.' }, { 'hr-no-em-dashes': { state: 'pass', note: '' } })
  const fill = (text: string, id: string, state: string, note = '') =>
    text.replace(new RegExp(`(### ${id} [\\s\\S]*?)State:\\nNote:`), `$1State: ${state}\nNote: ${note}`)

  it('lists only the checks code could not decide, with the text each needs', () => {
    expect(blank).toContain('### ex-one-name (warning if failed)')
    expect(blank).toContain('Code found: A hint.')
    expect(blank).toContain('- hr-no-em-dashes: pass')
    expect(blank).not.toContain('### hr-no-em-dashes')
    expect(blank).toContain('Organisations named (comma separated, or none):')
  })

  it('reads back a filled worksheet, with the names for code to decide', () => {
    let text = fill(blank, 'ex-one-name', 'pass')
    text = fill(text, 'en-hero-says-what', 'na')
    text = text.replace('Organisations named (comma separated, or none):', 'Organisations named (comma separated, or none): Razorpay')
    const read = readWorksheet(text, items)
    // Saved on Windows, with \r\n line endings, it reads the same.
    expect(readWorksheet(text.replace(/\n/g, '\r\n'), items)).toEqual(read)
    expect(read.meta).toEqual(meta)
    expect(read.problems).toEqual([])
    expect(read.answers['ex-one-name']).toEqual({ verdict: 'pass', note: '' })
    expect(read.names['hr-no-client-names']).toEqual(['Razorpay'])
  })

  it('never lets an unscored check through, and allows na only where the pass condition does', () => {
    expect(readWorksheet(blank, items).problems).toEqual([
      'ex-one-name: State must be pass, fail or na.',
      'en-hero-says-what: State must be pass, fail or na.',
      'hr-no-client-names: fill in "Organisations named", or write none.',
    ])
    const na = readWorksheet(fill(blank, 'ex-one-name', 'na'), items)
    expect(na.problems).toContain('ex-one-name: na is not allowed; its pass condition always applies.')
    const failNoNote = readWorksheet(fill(blank, 'ex-one-name', 'fail'), items)
    expect(failNoNote.problems).toContain('ex-one-name: give a one-line note for a fail.')
  })

  it('changes the fingerprint when the rubric or the code checks change, so an old accuracy pass stops counting', () => {
    const plain = RUBRIC_V5.map(({ itemId, criterion, passCondition }) => ({ itemId, criterion, passCondition }))
    const base = fingerprintOf(plain, 1)
    expect(fingerprintOf(plain, 2)).not.toBe(base)
    expect(fingerprintOf([{ ...plain[0], passCondition: 'Changed.' }, ...plain.slice(1)], 1)).not.toBe(base)
    expect(fingerprintOf(plain, 1)).toBe(base)
  })
})

describe('the hand scores', () => {
  it('cover the ten calibration entries on every check of rubric v3', () => {
    expect(HAND_SCORES_V3).toHaveLength(10)
    for (const hand of HAND_SCORES_V3) expect(Object.keys(hand.states).sort(), hand.slug).toEqual(RUBRIC_V5.map((i) => i.itemId).sort())
  })
})

describe('rubric v5', () => {
  // The only checks a person still decides (scripts/seed-rubric-v5.ts header).
  const HUMAN = ['ex-one-name', 'ex-facts-stated-once', 'ex-kb-questions-answered', 'en-task-completes', 'hr-no-patient-data', 'hr-no-client-names', 'ex-product-claims-exist']

  it('hands a person only the seven judgement checks, for an agent and for an entry with a page of its own', () => {
    const page = agent(
      { collection: 'sectors', ownPage: true },
      { hasOwnPage: true, faqs: [{ question: 'Can a payment link expire?', answer: 'Yes.' }], kbQuestions: [{ question: 'A?' }, { question: 'B?' }, { question: 'C?' }] },
    )
    for (const e of [agent(), page]) {
      const toPerson = RUBRIC_V5.map((i) => i.itemId).filter((id) => verdictOf(id, e) === 'judge')
      for (const id of toPerson) expect(HUMAN, `${e.collection}: ${id}`).toContain(id)
    }
  })
})
