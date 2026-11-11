/**
 * The worksheet for the checks code cannot decide (scripts/benchmark.ts): a
 * Markdown file a person or an agent fills in, with the text each check needs.
 * Read back, it becomes the human half of a benchmark run. Nothing is left as
 * Not applicable unless its pass condition allows it: an unscored check would
 * otherwise shrink the denominator and raise the score.
 */
import { createHash } from 'crypto'

import { asDoc, rows, sectionsOf, sentencesOf, str, textOf, type Entry } from './entry'
import type { Verdict } from './mechanical'

export type RubricItem = { itemId: string; criterion: string; passCondition: string; severityIfFailed: 'blocker' | 'warning' }

export type WorksheetMeta = {
  collection: string
  entryId: string
  slug: string
  versionId: string
  contentHash: string
  rubricId: string
  rubricVersion: string
  fingerprint: string
}

export type Answer = { verdict: Verdict; note: string }

/** Checks whose answer is a list of names, which code then checks against the lists. */
export const NAME_CHECKS: Record<string, string> = {
  'hr-no-client-names': 'Organisations named',
  'ex-product-claims-exist': 'NeuronCx names',
}

/** Bump when the worksheet's questions or evidence change. */
export const WORKSHEET_VERSION = 1

/** Changes whenever scoring could change: the rubric, the code checks or the worksheet. */
export const fingerprintOf = (items: Pick<RubricItem, 'itemId' | 'criterion' | 'passCondition'>[], mechanicalVersion: number) =>
  createHash('sha256').update(JSON.stringify({ items, mechanicalVersion, worksheet: WORKSHEET_VERSION })).digest('hex').slice(0, 16)

const quote = (lines: string[]) => (lines.length ? lines.map((l) => `> ${l}`).join('\n') : '> (nothing found)')
const matching = (e: Entry, re: RegExp) => sentencesOf(textOf(e)).filter((s) => re.test(s))

/** The text a check needs, so the person scoring does not have to hunt for it. */
const evidenceFor = (itemId: string, e: Entry, hint?: string): string => {
  const d = e.doc
  const field = (label: string, v: unknown) => `${label}: ${str(v) || '(empty)'}`
  const lines: string[] = []
  switch (itemId) {
    case 'ex-kb-answer-complete':
      lines.push(field('Answer', d.kbAnswer))
      break
    case 'ex-kb-facts-checkable':
      lines.push(...rows(d.kbFacts).map((r) => `Fact: ${str(r.fact)}`))
      break
    case 'ex-kb-questions-answered':
      lines.push(...rows(d.kbQuestions).map((r) => `Question: ${str(r.question)}`), 'Look for each answer in the entry text above.')
      break
    case 'ex-faq-answers-stand-alone':
      lines.push(...rows(d.faqs).map((f) => `Q: ${str(f.question)} | A: ${str(f.answer)}`))
      break
    case 'en-hero-says-what':
      lines.push(field('Hero heading', d.heroHeading), field('Hero subheading', d.heroSubheading))
      break
    case 'en-card-summary':
      lines.push(field('Summary', d.summary))
      break
    case 'ex-headings-name-subject':
      lines.push(...sectionsOf(e).map((s) => `Heading: ${s.heading}`))
      break
    case 'ex-terms-defined':
      lines.push(...matching(e, /\b(bot swarm|family|episode|cart|context engine)\b/i))
      break
    case 'ex-no-outside-references':
      lines.push(...matching(e, /^(it|this|they|these)\b/i))
      break
    case 'hr-observation-not-criticism':
      lines.push(...matching(e, /\b(outdated|broken|fail\w*|struggl\w*|chaos\w*|nightmare|stuck|still using|old-fashioned)\b/i))
      break
    case 'hr-dpdp-not-hipaa':
      lines.push(...matching(e, /\b(data protection|privacy|personal data|compliance|compliant|consent|DPDP|GDPR)\b/i))
      break
    case 'hr-claims-have-evidence':
      lines.push(...matching(e, /\d/))
      break
    case 'seo-meta-title':
      lines.push(field('SEO title', asDoc(d.meta)?.title))
      break
    default:
      lines.push('Read the entry text above.')
  }
  return [hint ? `Code found: ${hint}` : '', 'Evidence:', quote(lines)].filter(Boolean).join('\n')
}

/** The worksheet for one entry: the entry text once, then each check to fill in. */
export const worksheetFor = (
  e: Entry,
  meta: WorksheetMeta,
  items: RubricItem[],
  hints: Record<string, string | undefined>,
  decided: Record<string, { state: string; note: string }>,
): string =>
  [
    `# Benchmark worksheet: ${e.name} (${e.collection}/${e.slug})`,
    '',
    'Fill in every "State:" with pass, fail or na, and a one-line "Note:" for anything that is not a pass.',
    'Use na only where the pass condition says the check does not apply. Then run:',
    `  node --env-file=.env scripts/benchmark.ts record --worksheet <this file> --as <email>`,
    '',
    '```json',
    JSON.stringify(meta, null, 1),
    '```',
    '',
    `## Decided by code (${Object.keys(decided).length})`,
    '',
    ...Object.entries(decided).map(([id, r]) => `- ${id}: ${r.state}${r.note ? `. ${r.note}` : ''}`),
    '',
    '## The entry',
    '',
    ...sectionsOf(e).flatMap((s) => [`### ${s.heading}`, '', s.body, '']),
    `## To decide (${items.length})`,
    '',
    ...items.flatMap((i) => [
      `### ${i.itemId} (${i.severityIfFailed} if failed)`,
      `Criterion: ${i.criterion}`,
      `Pass when: ${i.passCondition}`,
      evidenceFor(i.itemId, e, hints[i.itemId]),
      ...(NAME_CHECKS[i.itemId]
        ? [`${NAME_CHECKS[i.itemId]} (comma separated, or none):`, 'Code decides pass or fail from this list; leave State empty.']
        : ['State:', 'Note:']),
      '',
    ]),
  ].join('\n')

export type ReadWorksheet = {
  meta: WorksheetMeta
  answers: Record<string, Answer>
  names: Record<string, string[]>
  problems: string[]
}

/** A filled worksheet: the answers, and anything missing or not allowed. */
export const readWorksheet = (input: string, items: RubricItem[]): ReadWorksheet => {
  // A worksheet saved on Windows has \r\n line endings.
  const text = input.replace(/\r\n/g, '\n')
  const json = text.match(/```json\n([\s\S]*?)\n```/)
  if (!json) throw new Error('This is not a benchmark worksheet: its details block is missing.')
  const meta = JSON.parse(json[1]) as WorksheetMeta
  const body = text.slice(text.indexOf('## To decide'))
  const answers: Record<string, Answer> = {}
  const names: Record<string, string[]> = {}
  const problems: string[] = []
  for (const block of body.split(/\n(?=### )/).slice(1)) {
    const itemId = block.match(/^### (\S+)/)?.[1]
    const item = items.find((i) => i.itemId === itemId)
    if (!itemId || !item) continue
    const label = NAME_CHECKS[itemId]
    if (label) {
      const line = block.match(new RegExp(`^${label} \\(comma separated, or none\\):(.*)$`, 'm'))?.[1]?.trim() ?? ''
      if (!line) problems.push(`${itemId}: fill in "${label}", or write none.`)
      names[itemId] = /^none$/i.test(line) ? [] : line.split(',').map((n) => n.trim()).filter(Boolean)
      continue
    }
    const state = block.match(/^State:(.*)$/m)?.[1]?.trim().toLowerCase() ?? ''
    const note = block.match(/^Note:(.*)$/m)?.[1]?.trim() ?? ''
    if (!['pass', 'fail', 'na'].includes(state)) {
      problems.push(`${itemId}: State must be pass, fail or na.`)
      continue
    }
    if (state === 'na' && !/Not applicable when/i.test(item.passCondition)) {
      problems.push(`${itemId}: na is not allowed; its pass condition always applies.`)
      continue
    }
    if (state === 'fail' && !note) problems.push(`${itemId}: give a one-line note for a fail.`)
    answers[itemId] = { verdict: state as Verdict, note }
  }
  for (const i of items) if (!(i.itemId in answers) && !(i.itemId in names) && !problems.some((p) => p.startsWith(`${i.itemId}:`))) problems.push(`${i.itemId}: missing.`)
  return { meta, answers, names, problems }
}
