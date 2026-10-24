/**
 * Puts the Bot swarm hub's three family sections between the Agentic Flow
 * Demo and How it works (24 Oct 2026 brief), saved as drafts:
 *
 * - each family (Lists, agentFamily) gets its hub heading and intro;
 * - the hub's grouping sections become one row per family, in brief order,
 *   with the family's name as the eyebrow, the heading and intro below, the
 *   feature card design and "Show key points" on; each row keeps the agents
 *   it had hand-picked;
 * - the hub layout moves the flow demo to directly above How it works and
 *   puts the "Grouping sections" block between the two.
 *
 * Nothing is published. Safe to re-run: a record already in this shape is
 * left alone. Families or blocks it cannot find are reported and nothing of
 * the hub is written.
 *
 * Usage (from neuroncx-cms):
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" node --env-file=.env scripts/update-bot-swarm-hub.ts [--dry-run]
 *
 * Local only; refuses any other database.
 */
import fs from 'fs'
import { getPayload, ValidationError } from 'payload'

import config from '../src/payload.config'

const say = (s = '') => fs.writeSync(1, s + '\n')
if (!/^mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(process.env.DATABASE_URL || '')) {
  say('Refusing to run: this database is not on this machine.')
  process.exit(1)
}
const DRY = process.argv.includes('--dry-run')

const FAMILIES = [
  {
    name: 'Book and get paid',
    heading: 'WhatsApp appointment booking and payment links',
    intro:
      "Agents that book appointments into your scheduling system, send a payment link in the same WhatsApp chat and confirm when it's paid.",
  },
  {
    name: 'Read and match documents',
    heading: 'Document reading on WhatsApp: prescriptions, marksheets and ID proofs',
    intro:
      'Agents that read photos of documents sent in the chat, match what they find to your own lists and prices, and save the details to the customer record.',
  },
  {
    name: 'Check and coach your team',
    heading: 'AI call quality monitoring and agent performance tracking',
    intro:
      "Agents that pick a sample of calls from your phone system, score each one against your scoring sheet, and track each team member's progress week by week.",
  },
]

const quiet = { overrideAccess: true, context: { disableRevalidate: true, skipRag: true } } as const
const problems: string[] = []
const done: string[] = []

const errorText = (err: unknown) =>
  err instanceof ValidationError
    ? err.data.errors.map((e) => `${e.path}: ${e.message}`).join('; ')
    : err instanceof Error
      ? err.message
      : String(err)

const payload = await getPayload({ config })

/* The families: heading and intro, as drafts. */

const families: { id: string; name: string }[] = []
for (const f of FAMILIES) {
  const doc = (
    await payload.find({
      ...quiet,
      collection: 'lists',
      where: { and: [{ type: { equals: 'agentFamily' } }, { name: { equals: f.name } }] },
      draft: true,
      limit: 1,
      depth: 0,
    })
  ).docs[0]
  if (!doc) {
    problems.push(`Family not found: ${f.name}`)
    continue
  }
  families.push({ id: String(doc.id), name: f.name })
  if (doc.heading === f.heading && doc.intro === f.intro) {
    done.push(`Family ${f.name}: already up to date`)
    continue
  }
  if (DRY) {
    done.push(`Family ${f.name}: would set heading and intro (draft)`)
    continue
  }
  try {
    await payload.update({
      ...quiet,
      collection: 'lists',
      id: doc.id,
      draft: true,
      data: { heading: f.heading, intro: f.intro, _status: 'draft' },
    })
    done.push(`Family ${f.name}: heading and intro saved (draft)`)
  } catch (err) {
    problems.push(`Family ${f.name} rejected: ${errorText(err)}`)
  }
}

/* The hub: rows and layout, as a draft. */

const hub = (
  await payload.find({ ...quiet, collection: 'hubs', where: { forCollection: { equals: 'microApps' } }, draft: true, limit: 1, depth: 0 })
).docs[0]
if (!hub) problems.push('Bot swarm hub not found')

if (hub && families.length === FAMILIES.length) {
  const groupId = (g: unknown) => String(typeof g === 'object' && g ? (g as { id: string }).id : g)
  const oldRows = hub.groupingSections ?? []

  const rows = FAMILIES.map((f, i) => {
    const id = families[i].id
    const old = oldRows.find((r) => groupId(r.group) === id)
    return {
      ...(old?.id ? { id: old.id } : {}),
      group: id,
      eyebrow: f.name,
      heading: f.heading,
      intro: f.intro,
      cardDesign: 'feature' as const,
      showKeyPoints: true,
      bentoPattern: old?.bentoPattern ?? 'even',
      // The agents the row hand-picked, as they are.
      entries: old?.entries ?? [],
    }
  })

  // The layout: flow demo, then Grouping sections, then How it works.
  const blocks = (hub.layout ?? []).filter((b) => b.blockType !== 'hubGroupingsSection')
  const flow = blocks.find((b) => b.blockType === 'agenticFlowDemo')
  const how = blocks.find((b) => b.blockType === 'howItWorks2')
  if (!flow) problems.push('Hub layout has no Agentic Flow Demo block')
  if (!how) problems.push('Hub layout has no How it works block')

  if (flow && how) {
    const rest = blocks.filter((b) => b !== flow)
    const at = rest.indexOf(how)
    const placed = (hub.layout ?? []).find((b) => b.blockType === 'hubGroupingsSection')
    const layout = [...rest.slice(0, at), flow, { ...(placed?.id ? { id: placed.id } : {}), blockType: 'hubGroupingsSection' as const }, ...rest.slice(at)]

    const shape = (l: { blockType: string }[]) => l.map((b) => b.blockType).join(',')
    const rowShape = (r: typeof rows | typeof oldRows) =>
      JSON.stringify(
        r.map((x) => [groupId(x.group), x.eyebrow, x.heading, x.intro, x.cardDesign, Boolean(x.showKeyPoints)]),
      )
    const same = shape(layout) === shape(hub.layout ?? []) && rowShape(rows) === rowShape(oldRows)

    say(`Hub layout now:  ${shape(hub.layout ?? [])}`)
    say(`Hub layout after: ${shape(layout)}`)
    if (same) done.push('Hub: already up to date')
    else if (DRY) done.push('Hub: would save rows and layout (draft)')
    else {
      try {
        await payload.update({
          ...quiet,
          collection: 'hubs',
          id: hub.id,
          draft: true,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: { groupingSections: rows, layout, _status: 'draft' } as any,
        })
        done.push('Hub: rows and layout saved (draft)')
      } catch (err) {
        problems.push(`Hub rejected: ${errorText(err)}`)
      }
    }
  }
}

say(`\n${DRY ? 'Dry run, nothing written.\n' : ''}${done.map((d) => `  ${d}`).join('\n')}`)
say(`\nProblems (${problems.length}):`)
problems.forEach((p) => say(`  ${p}`))
process.exit(problems.length ? 1 : 0)
