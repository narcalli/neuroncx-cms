import { describe, expect, it } from 'vitest'

import type { Entry, Refs } from '../../scripts/benchmark/entry'
import { HAND_SCORES_V3 } from '../../scripts/benchmark/handScores'
import { fingerprintOf, readWorksheet, worksheetFor, type WorksheetMeta } from '../../scripts/benchmark/worksheet'
import { decide, decideOrganisations, decideProductNames } from '../../scripts/benchmark/mechanical'
import { RUBRIC_V3 } from '../../scripts/seed-rubric-v3'

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
    expect(verdictOf('ex-headings-name-subject', agent())).toBe('judge')
  })

  it('counts the knowledge base fields before asking Claude anything', () => {
    expect(verdictOf('ex-kb-answer-complete', agent())).toBe('fail')
    expect(verdictOf('ex-kb-answer-complete', agent({}, { kbAnswer: 'Payment services sends links.' }))).toBe('judge')
    expect(verdictOf('ex-kb-facts-checkable', agent({}, { kbFacts: [{ fact: 'One.' }, { fact: 'Two.' }] }))).toBe('fail')
    expect(verdictOf('ex-kb-questions-answered', agent({}, { kbQuestions: [{ question: 'A?' }, { question: 'B?' }, { question: 'C' }] }))).toBe('fail')
  })

  it('finds the listed words and characters', () => {
    expect(verdictOf('hr-no-em-dashes', agent({ raw: 'Fast — and simple' }))).toBe('fail')
    expect(verdictOf('hr-no-filler', agent({ raw: 'It works seamlessly.' }))).toBe('fail')
    expect(verdictOf('hr-cloud-telephony', agent({ raw: 'Built on agentic telephony.' }))).toBe('fail')
    expect(verdictOf('hr-dpdp-not-hipaa', agent({ raw: 'HIPAA compliant.' }))).toBe('fail')
    expect(verdictOf('hr-no-patient-data', agent({ raw: 'Call 9876543210 to book.' }))).toBe('fail')
    expect(verdictOf('ex-no-outside-references', agent({ posts: [{ key: 'b', heading: 'Stages', body: 'Select a stage to see what is recorded.' }] }))).toBe('fail')
  })

  it('asks Claude about glossary terms only when the content uses one', () => {
    expect(verdictOf('ex-terms-defined', agent())).toBe('pass')
    expect(verdictOf('ex-terms-defined', agent({ posts: [{ key: 'a', heading: 'About', body: 'Each choice is a cart on the record.' }] }))).toBe('judge')
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
  const items = RUBRIC_V3.filter((i) => ['ex-one-name', 'en-hero-says-what', 'hr-no-client-names'].includes(i.itemId))
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
    const plain = RUBRIC_V3.map(({ itemId, criterion, passCondition }) => ({ itemId, criterion, passCondition }))
    const base = fingerprintOf(plain, 1)
    expect(fingerprintOf(plain, 2)).not.toBe(base)
    expect(fingerprintOf([{ ...plain[0], passCondition: 'Changed.' }, ...plain.slice(1)], 1)).not.toBe(base)
    expect(fingerprintOf(plain, 1)).toBe(base)
  })
})

describe('the hand scores', () => {
  it('cover the ten calibration entries on every check of rubric v3', () => {
    expect(HAND_SCORES_V3).toHaveLength(10)
    for (const hand of HAND_SCORES_V3) expect(Object.keys(hand.states).sort(), hand.slug).toEqual(RUBRIC_V3.map((i) => i.itemId).sort())
  })
})
