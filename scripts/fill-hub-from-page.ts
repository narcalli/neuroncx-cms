/**
 * Finishes the Bot swarm hub draft from the old bot-swarm page (Pages, slug
 * bot-swarm), the copy the first migration had nowhere to put:
 *
 * - each hub section's eyebrow and intro, and the button under the five
 *   steps, from the matching page block;
 * - the Hospitality industry line cut to 200 characters (one comma);
 * - the FAQ: "Can my staff take over a conversation?" back in, in place of
 *   "What happens if a payment link expires?", which is about one agent and
 *   moves to Payment services' FAQs;
 * - the knowledge base answer and facts, from the page's own sentences.
 *
 * Only empty fields are filled, except the two changes above. Saved as
 * drafts. Values are checked against their limits and the plain-text rule
 * first. Local only.
 *
 * Usage (from neuroncx-cms):
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" node --env-file=.env scripts/fill-hub-from-page.ts
 */
import fs from 'fs'
import { getPayload } from 'payload'

import config from '../src/payload.config'
import { plainTextProblem } from '../src/fields/validators/plainText'

const say = (s = '') => fs.writeSync(1, s + '\n')
if (!/127\.0\.0\.1|localhost/.test(process.env.DATABASE_URL || '')) {
  say('Refusing to run: this database is not on this machine.')
  process.exit(1)
}

type Doc = Record<string, any>
const empty = (v: unknown) => v == null || v === '' || (Array.isArray(v) && v.length === 0)
const textOf = (n: any): string => (!n ? '' : typeof n.text === 'string' ? n.text : (n.children ?? []).map(textOf).join(''))

const problems: string[] = []
const check = (where: string, value: string, max: number, plain = true) => {
  if (value.length > max) problems.push(`${where}: ${value.length} of ${max} characters`)
  const p = plain ? plainTextProblem(value) : null
  if (p) problems.push(`${where}: ${p}`)
  return value
}

const payload = await getPayload({ config })
const quiet = { overrideAccess: true, context: { disableRevalidate: true, skipRag: true } } as const

const page = (await payload.find({ collection: 'pages', where: { slug: { equals: 'bot-swarm' } }, depth: 0, limit: 1, overrideAccess: true })).docs[0] as Doc
const pageBlock = (type: string) => (page.layout as Doc[]).find((b) => b.blockType === type)
const hub = (await payload.find({ collection: 'hubs', where: { slug: { equals: 'bot-swarm' } }, draft: true, depth: 0, limit: 1, overrideAccess: true })).docs[0] as Doc
if (!page || !hub) {
  say('The bot-swarm page or hub is missing. Nothing written.')
  process.exit(1)
}

const done: string[] = []
const kept: string[] = []

/* Section eyebrows, intros and the steps button. */
const SOURCES: Record<string, { from: string; eyebrow: string }> = {
  hubStepsSection: { from: 'howItWorks', eyebrow: 'label' },
  hubLayersSection: { from: 'platformLayers', eyebrow: 'eyebrow' },
  hubWorksWithSection: { from: 'integrations', eyebrow: 'label' },
  hubIndustriesSection: { from: 'useCases', eyebrow: 'label' },
  hubTrustSection: { from: 'trustPanel', eyebrow: 'eyebrow' },
}
const layout = (hub.layout as Doc[]).map((block) => {
  const src = SOURCES[block.blockType]
  if (!src) return block
  const from = pageBlock(src.from)
  if (!from) return block
  const next = { ...block }
  const name = block.blockType.replace('Section', '')
  for (const [field, value, max] of [
    ['eyebrow', from[src.eyebrow], 60],
    ['intro', from.intro, 200],
  ] as const) {
    if (typeof value !== 'string' || !value.trim()) continue
    if (empty(block[field])) {
      next[field] = check(`${name} ${field}`, value, max)
      done.push(`${name}: ${field} "${value}"`)
    } else kept.push(`${name} ${field}`)
  }
  if (block.blockType === 'hubStepsSection' && from.ctaLabel && empty(block.cta?.label)) {
    next.cta = { type: 'custom', label: check('steps button label', from.ctaLabel, 30), url: from.ctaLink || '', newTab: false }
    done.push(`hubSteps: button "${from.ctaLabel}" to ${from.ctaLink}`)
  }
  if (block.blockType === 'hubTrustSection' && from.buttonHref) {
    done.push(`hubTrust: the page's button link (${from.buttonHref}) has no label on the page, so it was not added`)
  }
  if (block.blockType === 'hubIndustriesSection') {
    next.industries = (block.industries as Doc[]).map((row) => {
      const problem = String(row.problem ?? '')
      if (problem.length <= 200) return row
      const fixed = problem.replace('Guests pay to hold a booking, and managers', 'Guests pay to hold a booking and managers')
      check(`industry ${row.vertical} problem`, fixed, 200)
      done.push(`hubIndustries: ${row.vertical} line cut from ${problem.length} to ${fixed.length} characters (comma before "and managers" removed)`)
      return { ...row, problem: fixed }
    })
  }
  return next
})

/* FAQ: the staff takeover question back in, the payment link one out. */
const PAYMENT_Q = 'What happens if a payment link expires?'
const STAFF_Q = 'Can my staff take over a conversation?'
const faqBlock = (page.layout as Doc[]).filter((b) => b.blockType === 'content')[1]
const nodes: Doc[] = faqBlock?.columns?.[0]?.richText?.root?.children ?? []
const pageFaqs: { question: string; answer: string }[] = []
for (const n of nodes) {
  if (n.type === 'heading' && n.tag === 'h3') pageFaqs.push({ question: textOf(n), answer: '' })
  else if (n.type === 'paragraph' && pageFaqs.length) pageFaqs[pageFaqs.length - 1].answer += textOf(n)
}
const staff = pageFaqs.find((f) => f.question === STAFF_Q)
const payment = pageFaqs.find((f) => f.question === PAYMENT_Q)
let faqs = hub.faqs as Doc[]
if (staff && faqs.some((f) => f.question === PAYMENT_Q) && !faqs.some((f) => f.question === STAFF_Q)) {
  faqs = faqs.map((f) => (f.question === PAYMENT_Q ? { question: staff.question, answer: check('FAQ staff answer', staff.answer, 600) } : f))
  done.push(`FAQ: "${PAYMENT_Q}" replaced by "${STAFF_Q}"`)
}

/* Knowledge base: what the bot swarm is, from the hero and the intro. */
const KB_ANSWER =
  "The bot swarm is NeuronCx's team of small AI agents for customer service, each with one job, all working from the same customer record. On WhatsApp they book appointments, take payments and read documents. On a team's calls they score, coach and track progress. When one agent finishes, it passes the customer to the next agent or to a person, so nobody asks the same question twice."
const trust = pageBlock('trustPanel')
const KB_FACTS = (trust?.cards ?? []).map((c: Doc) => String(c.description))
const data: Doc = { layout, faqs }
if (empty(hub.kbAnswer)) {
  data.kbAnswer = check('kbAnswer', KB_ANSWER, 600)
  done.push('knowledge base answer drafted from the hero and the intro')
} else kept.push('kbAnswer')
if (empty(hub.kbFacts) && KB_FACTS.length) {
  data.kbFacts = KB_FACTS.map((fact: string, i: number) => ({ fact: check(`kbFact ${i + 1}`, fact, 160) }))
  done.push(`knowledge base facts: the ${KB_FACTS.length} trust cards`)
} else kept.push('kbFacts')

/* Payment services gets the payment link question. */
const pay = (await payload.find({ collection: 'microApps', where: { slug: { equals: 'payment-services' } }, draft: true, depth: 0, limit: 1, overrideAccess: true })).docs[0] as Doc
const payAnswer = payment?.answer.replace(/\s*See the full payment flow\.?$/, '').trim()
const payFaq = pay && payment && empty(pay.faqs) ? [{ question: payment.question, answer: check('Payment services FAQ answer', payAnswer!, 600) }] : null

if (problems.length) {
  say('Nothing written. Fix these first:')
  for (const p of problems) say(`  ${p}`)
  process.exit(1)
}

await payload.update({ ...quiet, collection: 'hubs', id: hub.id, draft: true, data: { ...data, _status: 'draft' } as any })
if (payFaq) {
  await payload.update({ ...quiet, collection: 'microApps', id: pay.id, draft: true, data: { faqs: payFaq, _status: 'draft' } as any })
  done.push(`Payment services: FAQ "${PAYMENT_Q}" added (the page's "See the full payment flow" link text left out)`)
}

say('Hub draft updated:')
for (const d of done) say(`  - ${d}`)
if (kept.length) say(`Kept as they were: ${kept.join(', ')}`)
process.exit(0)
