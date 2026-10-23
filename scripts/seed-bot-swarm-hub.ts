/**
 * Creates the Bot swarm hub record, as a draft, from the copy on the
 * existing Payload page with slug bot-swarm, block by block. The page is
 * only read: it stays exactly as it is, published.
 *
 * Reports every block, or part of one, that has nowhere to go on the hub,
 * every FAQ cut by the cap of 6, and every value over its new limit or not
 * plain text. Copy is never shortened or edited here: an over-limit value is
 * copied in full (drafts save without checks) and must be fixed before the
 * hub is published.
 *
 * Skips everything if a hub for microApps, or with slug bot-swarm, exists.
 *
 * Usage (from neuroncx-cms):
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" node --env-file=.env scripts/seed-bot-swarm-hub.ts
 *
 * Runs only against a database on this machine. Add --remote to run it
 * anywhere else; it says which database first.
 */
import { createHash } from 'crypto'
import fs from 'fs'
import { getPayload } from 'payload'

import config from '../src/payload.config'
import { sectionBlockSlug } from '../src/content/sections/defineSection'
import { layoutBlocksFor } from '../src/fields/layout'
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

type Doc = Record<string, any>

const nowhere: string[] = []
const limits: string[] = []
const cuts: string[] = []
const lookups: string[] = []

/** A value for a capped, plain-text field: copied in full, problems reported. */
const t = (where: string, value: unknown, max: number, plain = true): string | undefined => {
  if (typeof value !== 'string' || !value.trim()) return undefined
  if (value.length > max) limits.push(`${where}: ${value.length} of ${max} characters`)
  const problem = plain ? plainTextProblem(value) : null
  if (problem) limits.push(`${where}: ${problem}`)
  return value
}

/** Notes the fields of a block that were not copied, if they hold anything. */
const leftOver = (block: Doc, what: string, keys: string[], why: string) => {
  const filled = keys.filter((k) => {
    const v = block[k]
    return Array.isArray(v) ? v.length > 0 : typeof v === 'string' ? v.trim() !== '' : v != null
  })
  if (filled.length) nowhere.push(`${what}: ${filled.join(', ')}. ${why}`)
}

const textOf = (node: any): string =>
  !node ? '' : typeof node.text === 'string' ? node.text : (node.children ?? []).map(textOf).join('')

const button = (label?: string, link?: string) =>
  label ? { type: 'custom', label, url: link || '', newTab: false } : undefined

const payload = await getPayload({ config })

/* ------------------------------------------------------------------ */
/* Read                                                                */
/* ------------------------------------------------------------------ */

const pageQuery = { collection: 'pages' as const, where: { slug: { equals: 'bot-swarm' } }, depth: 0, limit: 1, overrideAccess: true }
const page = (await payload.find(pageQuery)).docs[0] as Doc | undefined
if (!page) {
  say('No page with slug bot-swarm. Nothing written.')
  process.exit(1)
}
const pageHash = createHash('sha256').update(JSON.stringify(page)).digest('hex')

const existing = await payload.find({
  collection: 'hubs',
  where: { or: [{ forCollection: { equals: 'microApps' } }, { slug: { equals: 'bot-swarm' } }] },
  draft: true,
  limit: 1,
  depth: 0,
  overrideAccess: true,
})
if (existing.docs.length) {
  say(`A Bot swarm hub exists already (${existing.docs[0].id}). Nothing written.`)
  process.exit(0)
}

const idsByName = async (collection: 'microApps' | 'integrations' | 'lists', names: string[], extra: Doc = {}) => {
  const found = await payload.find({
    collection,
    where: { and: [{ name: { in: names } }, ...(Object.keys(extra).length ? [extra] : [])] },
    draft: true,
    depth: 0,
    limit: 100,
    overrideAccess: true,
  })
  const byName = new Map(found.docs.map((d: Doc) => [d.name, String(d.id)]))
  for (const n of names) if (!byName.has(n)) lookups.push(`${collection}: no entry named "${n}"`)
  return byName
}

const agentNames = (
  await payload.find({ collection: 'microApps', draft: true, depth: 0, limit: 100, overrideAccess: true })
).docs.map((d: Doc) => String(d.name))
const agents = await idsByName('microApps', agentNames)
const agentRef = (name: string) =>
  agents.has(name) ? { relationTo: 'microApps', value: agents.get(name) } : undefined

/* ------------------------------------------------------------------ */
/* Map, block by block                                                 */
/* ------------------------------------------------------------------ */

const hub: Doc = {
  name: 'Bot swarm',
  slug: 'bot-swarm',
  forCollection: 'microApps',
  isMain: true,
  meta: {
    title: t('meta.title', page.meta?.title, 60, false),
    description: t('meta.description', page.meta?.description, 155, false),
  },
  groupingSections: [],
  layout: [],
  // The agent page order; the closing panel is fixed at the end.
  defaultLayout: layoutBlocksFor([
    'agentPanel',
    'agentChain',
    'agentTeamControls',
    'agentResult',
    'useCases',
    'integrations',
    'faq',
    'related',
  ]),
  _status: 'draft',
}
const hubBlock = (key: string, data: Doc) => hub.layout.push({ blockType: sectionBlockSlug(key), ...data })
let contentBlocksSeen = 0

for (const [i, block] of (page.layout as Doc[]).entries()) {
  const at = `#${i + 1} ${block.blockType}`
  switch (block.blockType) {
    case 'conversationHero': {
      hub.eyebrow = t(`${at} eyebrow`, block.eyebrow, 40)
      hub.h1 = t(`${at} headline`, block.headline, 70)
      hub.subheading = t(`${at} subhead`, block.subhead, 200)
      hub.heroChips = (block.chips ?? []).map((c: Doc, n: number) => ({ label: t(`${at} chip ${n + 1}`, c.label, 30) }))
      if (hub.heroChips.length > 4) limits.push(`${at} chips: ${hub.heroChips.length} of 4`)
      hub.heroChatCaption = t(`${at} conversationLabel`, block.conversationLabel, 80)
      hub.heroCta = button(block.primaryButtonLabel, block.primaryButtonLink)
      hub.heroSecondaryCta = button(block.secondaryButtonLabel, block.secondaryButtonLink)
      // "them:" is the customer; "tag: <agent>" labels the "us:" line after it.
      const chat: Doc[] = []
      let tag: string | null = null
      for (const line of String(block.conversation ?? '').split('\n')) {
        const m = line.match(/^\s*(them|us|tag):\s*(.*)$/)
        if (!m) continue
        if (m[1] === 'tag') tag = m[2].trim()
        else {
          const entry = m[1] === 'us' && tag ? agentRef(tag) : undefined
          if (m[1] === 'us' && tag && !entry) lookups.push(`hero chat: no agent named "${tag}"`)
          chat.push({
            // A reply with no agent tag is the team's.
            sender: m[1] === 'them' ? 'customer' : tag ? 'entry' : 'team',
            ...(entry ? { entry } : {}),
            text: t(`${at} chat message ${chat.length + 1}`, m[2].trim(), 300, false),
          })
          tag = null
        }
      }
      if (chat.length > 8) limits.push(`${at} chat: ${chat.length} of 8 messages`)
      hub.heroChat = chat
      leftOver(block, at, ['workflowSteps', 'stats'], 'The hub hero has no steps or stats.')
      break
    }
    case 'content': {
      contentBlocksSeen++
      const root = block.columns?.[0]?.richText?.root
      const nodes: Doc[] = root?.children ?? []
      if (block.columns?.length > 1) nowhere.push(`${at}: columns after the first. The hub has one intro line.`)
      if (contentBlocksSeen === 1) {
        // The swarm intro: a heading and one paragraph.
        const heading = nodes.find((n) => n.type === 'heading')
        const paragraphs = nodes.filter((n) => n.type === 'paragraph').map(textOf).filter(Boolean)
        hubBlock('hubIntro', {
          heading: t(`${at} heading`, textOf(heading), 70),
          line: t(`${at} paragraph`, paragraphs[0], 300),
        })
        if (paragraphs.length > 1) nowhere.push(`${at}: paragraphs after the first. The intro has one line.`)
      } else {
        // The FAQ: an h2, then an h3 question and its paragraph, repeated.
        const h2 = nodes.find((n) => n.type === 'heading' && n.tag === 'h2')
        hub.faqHeading = t(`${at} FAQ heading`, textOf(h2), 70)
        const pairs: { question: string; answer: string }[] = []
        for (const n of nodes) {
          if (n.type === 'heading' && n.tag === 'h3') pairs.push({ question: textOf(n), answer: '' })
          else if (n.type === 'paragraph' && pairs.length) {
            const last = pairs[pairs.length - 1]
            last.answer = [last.answer, textOf(n)].filter(Boolean).join(' ')
          }
        }
        hub.faqs = pairs.slice(0, 6).map((p, n) => ({
          question: t(`FAQ ${n + 1} question`, p.question, 120, false),
          answer: t(`FAQ ${n + 1} answer`, p.answer, 600),
        }))
        for (const p of pairs.slice(6)) cuts.push(`"${p.question}" (answer: ${p.answer})`)
        const hasLink = (n: any): boolean => n?.type === 'link' || n?.type === 'autolink' || (n?.children ?? []).some(hasLink)
        if (nodes.some(hasLink)) {
          nowhere.push(`${at}: the links in the FAQ answers. Answers are plain text, so only the linked words were kept.`)
        }
      }
      break
    }
    case 'productSuite': {
      const families = await idsByName('lists', [block.label], { type: { equals: 'agentFamily' } })
      const products: Doc[] = block.products ?? []
      const entries = products.map((p) => agentRef(p.name)).filter(Boolean)
      for (const p of products) if (!agents.has(p.name)) lookups.push(`${at}: no agent named "${p.name}"`)
      hub.groupingSections.push({
        group: families.get(block.label),
        eyebrow: t(`${at} label`, block.label, 60),
        heading: t(`${at} heading`, block.heading, 70),
        intro: t(`${at} intro`, block.intro, 200),
        entries,
      })
      if (products.length) {
        nowhere.push(
          `${at}: each agent card's summary, five points and link label (${products.map((p) => p.name).join(', ')}). They belong on the agent entries; the hub shows the entries' own cards.`,
        )
      }
      break
    }
    case 'howItWorks': {
      const keys = ['hears', 'checks', 'acts', 'handsOver', 'records']
      const steps: Doc[] = block.steps ?? []
      const data: Doc = { heading: t(`${at} heading`, block.heading, 70), htmlId: 'how-it-works' }
      keys.forEach((k, n) => {
        data[k] = {
          title: t(`${at} step ${n + 1} title`, steps[n]?.title, 30),
          line: t(`${at} step ${n + 1} line`, steps[n]?.description, 140),
        }
      })
      if (steps.length > 5) nowhere.push(`${at}: steps after the fifth.`)
      hubBlock('hubSteps', data)
      leftOver(block, at, ['label', 'intro', 'ctaLabel', 'ctaLink'], 'The steps section has a heading only.')
      break
    }
    case 'platformLayers': {
      hubBlock('hubLayers', {
        heading: t(`${at} heading`, block.heading, 70),
        layers: (block.layers ?? []).map((l: Doc, n: number) => ({
          title: t(`${at} layer ${n + 1} title`, l.title, 60),
          line: t(`${at} layer ${n + 1} description`, l.description, 240),
        })),
      })
      leftOver(block, at, ['eyebrow', 'intro'], 'The layers section has a heading only.')
      const tags = (block.layers ?? []).map((l: Doc) => [l.tag, l.icon].filter(Boolean).join(' / ')).filter(Boolean)
      if (tags.length) nowhere.push(`${at}: each layer's tag and icon (${tags.join('; ')}). Layers have a link instead; none set.`)
      break
    }
    case 'integrations': {
      const names = (block.items ?? []).map((it: Doc) => it.name)
      const found = await idsByName('integrations', names)
      hubBlock('hubWorksWith', {
        heading: t(`${at} heading`, block.heading, 70),
        populateBy: 'selection',
        selectedDocs: names.map((n: string) => found.get(n)).filter(Boolean),
      })
      leftOver(block, at, ['label', 'intro'], 'The works with section has a heading only.')
      if (names.length) nowhere.push(`${at}: each item's summary. The hub shows the integrations' own summaries.`)
      break
    }
    case 'useCases': {
      hubBlock('hubIndustries', {
        heading: t(`${at} heading`, block.heading, 70),
        industries: (block.cases ?? []).map((c: Doc, n: number) => ({
          vertical: t(`${at} case ${n + 1} sector`, c.sector, 40),
          heading: t(`${at} case ${n + 1} title`, c.title, 70),
          problem: t(`${at} case ${n + 1} description`, c.description, 200),
          // The agents the description names, in the order it names them.
          entries: agentNames
            .filter((name) => String(c.description ?? '').includes(name))
            .sort((a, b) => c.description.indexOf(a) - c.description.indexOf(b))
            .map(agentRef)
            .filter(Boolean),
          outcome: t(`${at} case ${n + 1} outcome`, c.outcome, 140),
        })),
      })
      leftOver(block, at, ['label', 'intro'], 'The industries section has a heading only.')
      break
    }
    case 'trustPanel': {
      const cards: Doc[] = block.cards ?? []
      if (cards.length > 4) limits.push(`${at}: ${cards.length} of 4 cards`)
      hubBlock('hubTrust', {
        heading: t(`${at} heading`, block.heading, 70),
        cards: cards.map((c, n) => ({
          title: t(`${at} card ${n + 1} title`, c.title, 40),
          line: t(`${at} card ${n + 1} description`, c.description, 160),
          icon: c.icon,
        })),
      })
      leftOver(block, at, ['eyebrow', 'intro', 'buttonHref'], 'The trust section has a heading and cards only.')
      break
    }
    case 'archive': {
      hubBlock('hubArticles', {
        heading: t(`${at} intro`, textOf(block.introContent?.root), 70),
        populateBy: block.populateBy === 'selection' ? 'selection' : 'category',
        categories: block.categories ?? [],
        selectedDocs: (block.selectedDocs ?? []).map((d: Doc) => d.value ?? d),
        limit: block.limit ?? 3,
      })
      if (block.relationTo && block.relationTo !== 'posts') nowhere.push(`${at}: relationTo ${block.relationTo}. Articles are posts only.`)
      break
    }
    case 'closingCta': {
      hub.closing = {
        heading: t(`${at} heading`, block.heading, 70),
        subheading: t(`${at} subhead`, block.subhead, 200),
        cta: button(block.primaryLabel, block.primaryLink),
        secondaryCta: button(block.secondaryLabel, block.secondaryLink),
      }
      break
    }
    default:
      nowhere.push(`${at}: the whole block. The hub has no matching section.`)
  }
}

/* ------------------------------------------------------------------ */
/* Write                                                               */
/* ------------------------------------------------------------------ */

const created = await payload.create({
  collection: 'hubs',
  draft: true,
  overrideAccess: true,
  context: { disableRevalidate: true },
  data: hub as any,
})
say(`created draft hub: ${created.name} (${created.id}), ${hub.layout.length} hub sections, ${hub.groupingSections.length} grouping sections, ${hub.faqs?.length ?? 0} FAQs`)

const after = (await payload.find(pageQuery)).docs[0]
const unchanged = createHash('sha256').update(JSON.stringify(after)).digest('hex') === pageHash
say(`page bot-swarm ${unchanged ? 'unchanged' : 'CHANGED, check it'} (${page._status})`)

const list = (title: string, items: string[]) => {
  say(`\n${title}: ${items.length ? '' : 'none'}`)
  for (const item of items) say(`  - ${item}`)
}
list('Nowhere to go on the hub', nowhere)
list('FAQs cut by the cap of 6', cuts)
list('Over a limit or not plain text (copied in full; fix before publishing)', limits)
list('Lookups that found nothing', lookups)

process.exit(0)
