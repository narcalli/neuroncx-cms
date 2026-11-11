/**
 * Throwaway: lays out published entries for scoring the rubric by hand
 * (11 Nov 2026). Calls no LLM and records no benchmark runs.
 *
 * Reads the published entries of sectors, industryTopics and microApps from the
 * live CMS's public API (what visitors get), flattens each with serializeEntry
 * (src/rag/content.ts, built on src/rag/serialize.ts) and shows every section as
 * the NCX post it becomes (composePostContent, title line included): exactly
 * what the knowledge base receives. Also shows the page body the knowledge base
 * does not receive, the fields the flattener leaves out (card, hero, images,
 * SEO, knowledge base, links), some counts to save scoring by eye, and the
 * rubric v3 checks to work through. Writes one file per entry to calibration/,
 * ignored through .git/info/exclude, plus calibration/_reference.md with the
 * catalogue, customers and the Content standards lists.
 *
 * Usage (from neuroncx-cms):
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" node --env-file=.env scripts/calibrate-rubric.ts [--from <cms url>]
 *
 * Needs the local database only to load Payload, resolve related names and
 * read Content standards (ids match, as the local database is a copy of
 * production). Writes nothing to any database.
 */
import fs from 'fs'
import path from 'path'
import { getPayload, type Block } from 'payload'

import config from '../src/payload.config'
import { getContentCollection } from '../src/content/registry'
import { LIFECYCLE_SLUGS } from '../src/lifecycle/scope'
import { contentRagSource, serializeEntry } from '../src/rag/content'
import { projectDoc } from '../src/rag/serialize'
import { composePostContent } from '../src/rag/sync'
import { RUBRIC_V3 } from './seed-rubric-v3'

type Doc = Record<string, unknown>

const say = (s = '') => fs.writeSync(1, s + '\n')
const arg = (flag: string) => {
  const i = process.argv.indexOf(flag)
  return i === -1 ? undefined : process.argv[i + 1]
}
const FROM = (arg('--from') || 'https://main.duebzy83yxxuo.amplifyapp.com').replace(/\/$/, '')
const OUT = path.resolve('calibration')

const get = async (url: string): Promise<Doc[]> => {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`${res.status} ${url}`)
      return ((await res.json()) as { docs: Doc[] }).docs
    } catch (e) {
      if (attempt === 4) throw e
      await new Promise((r) => setTimeout(r, 2000))
    }
  }
}
const published = (collection: string, depth = 1) =>
  get(`${FROM}/api/${collection}?depth=${depth}&limit=200&where[_status][equals]=published`)

const str = (v: unknown) => (typeof v === 'string' ? v : '')
const nameOf = (d: Doc) => str(d.name) || str(d.title) || str(d.slug)
const asDoc = (v: unknown): Doc | null => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Doc) : null)
const rows = (v: unknown): Doc[] => (Array.isArray(v) ? v.map(asDoc).filter((d): d is Doc => d !== null) : [])

// Every value in a document, with its path: for images, links and characters
// the flattener does not keep.
const walk = (v: unknown, at: string, visit: (value: unknown, at: string) => void) => {
  visit(v, at)
  if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${at}[${i}]`, visit))
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, at ? `${at}.${k}` : k, visit)
}

const imagesOf = (doc: Doc) => {
  const found: string[] = []
  walk(doc, '', (v, at) => {
    const d = asDoc(v)
    if (d && typeof d.mimeType === 'string' && d.mimeType.startsWith('image/')) {
      found.push(`${at}: ${str(d.filename)} | alt: ${str(d.alt) ? `"${str(d.alt)}"` : '(none)'}`)
    }
    if (typeof v === 'string' && /Alt$/.test(at)) found.push(`${at}: "${v}"`)
  })
  return found
}

const linksOf = (doc: Doc) => {
  const found: string[] = []
  walk(doc, '', (v, at) => {
    const d = asDoc(v)
    if (!d) return
    const ref = asDoc(d.reference)
    if (ref) found.push(`${at}: ${str(d.label) || '(no label)'} -> ${str(ref.relationTo)}/${str(asDoc(ref.value)?.slug) || str(ref.value)}`)
    else if (typeof d.url === 'string' && d.url && !d.mimeType) found.push(`${at}: ${str(d.label) || '(no label)'} -> ${d.url}`)
    else if (typeof d.relationTo === 'string' && asDoc(d.value)?.slug) found.push(`${at}: related ${d.relationTo}/${str(asDoc(d.value)?.slug)}`)
  })
  // Relationship fields that hold entries directly (integrations, passesTo, ...).
  for (const [k, v] of Object.entries(doc)) {
    const related = rows(v).filter((r) => typeof r.slug === 'string' && !r.mimeType && !r.blockType)
    if (related.length) found.push(`${k}: related ${related.map((r) => r.slug).join(', ')}`)
  }
  return [...new Set(found)]
}

const sentencesOf = (text: string) =>
  text
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+(?=[A-Z0-9"])/))
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).length >= 3)
const words = (s: string) => s.split(/\s+/).filter(Boolean).length

// Phrases the checks name, found mechanically so they are not missed by eye.
const SCANS: [string, RegExp][] = [
  ['ex-no-outside-references', /\b(as mentioned|above|below|earlier|previous section|as shown|on the left|on the right|the icon|the green|the highlighted)\b/gi],
  ['hr-no-filler', /\b(leverag\w*|seamless\w*|robust\w*|unlock\w*|revolutioni[sz]\w*|fast-paced world|not just\b)/gi],
  ['hr-dpdp-not-hipaa', /\b(HIPAA|DPDP\w*)\b/g],
  ['hr-cloud-telephony', /\b(agentic telephony|cloud telephony)\b/gi],
  ['hr-observation-not-criticism', /\b(outdated|broken|fail\w*|struggl\w*|chaos\w*|nightmare|stuck|still using|old-fashioned)\b/gi],
  ['en-task-completes', /\b(set up|setup|configur\w*|integrat\w*)\b/gi],
  ['bare-label headings', /^(Overview|Introduction|Benefits|Features|How it works|Why us|Details|More)$/gim],
]

type Section = { key: string; heading: string; body: string }

const layout = (slug: string, doc: Doc, kbSections: Section[], pageSections: Section[], ref: string) => {
  const sections = [...kbSections, ...pageSections]
  const text = sections.map((s) => `${s.heading}\n${s.body}`).join('\n\n')
  const allStrings: string[] = []
  walk(doc, '', (v) => typeof v === 'string' && allStrings.push(v))
  const raw = allStrings.join('\n')
  const sentences = sentencesOf(text)
  const longest = sentences.reduce((a, b) => (words(b) > words(a) ? b : a), '')
  const avg = sentences.length ? sentences.reduce((n, s) => n + words(s), 0) / sentences.length : 0
  const paragraphs = text.split(/\n+/).filter((p) => words(p) > 60)
  const meta = asDoc(doc.meta) ?? {}
  const numbers = sentences.filter((s) => /\d/.test(s))

  const out: string[] = [
    `# ${nameOf(doc)} (${slug}/${str(doc.slug)})`,
    '',
    `Own page: ${doc.hasOwnPage ? `yes, ${str(doc.path)}` : 'no'} | status: ${str(doc.status)} | updated ${str(doc.updatedAt).slice(0, 10)}`,
    '',
    '## Fields the flattener leaves out',
    '',
    `- Card: tagline "${str(doc.tagline)}" | summary "${str(doc.summary)}"`,
    `- Hero: heading "${str(doc.heroHeading)}" | subheading "${str(doc.heroSubheading)}"`,
    `- SEO: title "${str(meta.title)}" (${str(meta.title).length}) | description "${str(meta.description)}" (${str(meta.description).length}) | image ${meta.image ? 'set' : 'none'} | primary keyword "${str(meta.primaryKeyword)}" | noIndex ${String(meta.noIndex ?? false)}`,
    `- Knowledge base: include ${String(doc.includeInKbase ?? true)} | answer "${str(doc.kbAnswer)}"`,
    `- Facts (${rows(doc.kbFacts).length}): ${rows(doc.kbFacts).map((r) => `"${str(r.fact)}"`).join(' ') || '(none)'}`,
    `- Questions (${rows(doc.kbQuestions).length}): ${rows(doc.kbQuestions).map((r) => `"${str(r.question)}"`).join(' ') || '(none)'}`,
    `- FAQs: ${rows(doc.faqs).length}`,
    '- Images:',
    ...(imagesOf(doc).map((i) => `  - ${i}`).length ? imagesOf(doc).map((i) => `  - ${i}`) : ['  - (none)']),
    '- Links and related entries:',
    ...(linksOf(doc).length ? linksOf(doc).map((l) => `  - ${l}`) : ['  - (none)']),
    '',
    '## Counts (aids, not verdicts)',
    '',
    `- Sections ${sections.length} | words ${words(text)} | sentences ${sentences.length} | average ${avg.toFixed(1)} words`,
    `- Longest sentence (${words(longest)} words): ${longest}`,
    `- Paragraphs over 60 words: ${paragraphs.length}${paragraphs.map((p) => `\n  - (${words(p)}) ${p.slice(0, 120)}...`).join('')}`,
    `- Em dashes in any field: ${(raw.match(/—/g) || []).length}`,
    ...SCANS.map(([id, re]) => {
      const hits = [...new Set((id === 'bare-label headings' ? sections.map((s) => s.heading).join('\n') : raw).match(re) || [])]
      return `- ${id}: ${hits.length ? hits.join(', ') : '(none)'}`
    }),
    `- Sentences with a number (${numbers.length}):${numbers.map((s) => `\n  - ${s}`).join('')}`,
    '',
    `Reference lists (products, customers): ${ref}`,
    '',
    '## What NCX receives: one post per section (composePostContent), title line included',
    '',
    ...kbSections.flatMap((s) => [`### ${s.heading}  [${s.key}]`, '', s.body, '']),
    ...(pageSections.length
      ? [
          '## Page body (layout, through projectDoc): on the page but NOT sent to the knowledge base',
          '',
          ...pageSections.flatMap((s) => [`### ${s.heading}  [${s.key}]`, '', s.body, '']),
        ]
      : []),
    '## Checklist (rubric v3)',
    '',
    ...RUBRIC_V3.flatMap((i) => [
      `### ${i.itemId} (${i.dimension}, ${i.severityIfFailed})`,
      `Criterion: ${i.criterion}`,
      `Pass when: ${i.passCondition}`,
      'Result:',
      'Reason:',
      '',
    ]),
  ]
  return out.join('\n')
}

fs.mkdirSync(OUT, { recursive: true })
const payload = await getPayload({ config })

// What the product, customer and terms checks compare against.
const refLines: string[] = ['# Reference lists (published, live)', '']
// Content standards as this code reads it (its defaults until it is saved).
const standards = await payload.findGlobal({ slug: 'contentStandards', depth: 0, overrideAccess: true })
refLines.push(
  '## Third parties that may be named (Content standards)',
  '',
  ...(standards.allowedThirdParties ?? []).map((r) => `- ${r.name}`),
  '',
  '## NeuronCx terms (Content standards)',
  '',
  ...(standards.terms ?? []).map((r) => `- ${r.term}${r.meaning ? `: ${r.meaning}` : ''}`),
  '',
)
for (const c of ['features', 'microApps', 'integrations', 'crmFeatures', 'customers']) {
  const docs = await published(c, 0)
  refLines.push(`## ${c} (${docs.length})`, '', ...docs.map((d) => `- ${nameOf(d)}${d.slug ? ` (${str(d.slug)})` : ''}`), '')
}
const refFile = path.join(OUT, '_reference.md')
fs.writeFileSync(refFile, refLines.join('\n'))

let n = 0
for (const slug of LIFECYCLE_SLUGS) {
  const entry = getContentCollection(slug)
  if (!entry) throw new Error(`No content collection ${slug}`)
  const docs = await published(slug)
  say(`${slug}: ${docs.length} published`)
  for (const doc of docs) {
    const sections = await serializeEntry(payload, entry, doc)
    // Each section as the NCX post it becomes, which is what the rubric scores.
    const source = contentRagSource(slug)
    if (!source) throw new Error(`${slug} is not a knowledge base source`)
    const posts = sections.map((s) => {
      const post = composePostContent(source.titleOf(doc), source.urlOf(doc), s)
      return { key: s.key, heading: post.title, body: post.text }
    })
    // Everything on the page, then only what serializeEntry left out (the
    // layout blocks, which the knowledge base never receives).
    const fields = payload.collections[slug].config.fields
    const blocks = payload.blocks as unknown as Record<string, Block | undefined>
    const sent = new Set(sections.map((s) => s.key))
    const page = projectDoc(fields, doc, { getBlock: (b) => blocks[b] }).filter((s) => !sent.has(s.key))
    const file = path.join(OUT, `${String(++n).padStart(2, '0')}-${slug}-${str(doc.slug)}.md`)
    fs.writeFileSync(file, layout(slug, doc, posts, page, refFile))
    say(`  ${path.basename(file)}: ${sections.length} knowledge base sections, ${page.length} page sections`)
  }
}
say(`${n} files in ${OUT}`)
process.exit(0)
