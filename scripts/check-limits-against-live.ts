/**
 * Checks every character limit in the page blocks against the copy that is
 * already published, and fails if a limit is shorter than something live.
 *
 * A limit lives in the code and the copy lives in the database, so nothing
 * else can see both: typecheck, lint, the tests and the build all pass while
 * the pair is broken, and the first anyone knows of it is an editor being
 * refused a save on text they did not touch. That has happened once already,
 * when five limits were set from the conventions in the configs without
 * anyone reading what was in the database, so run this before changing a
 * maxLength, and after.
 *
 * Reads the Pages collection directly rather than payload.config, so it needs
 * no database and no running CMS, and reads production over its public pages
 * API, which is the same read any visitor makes.
 *
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" node scripts/check-limits-against-live.ts
 *
 * PROD_URL points it at another environment. Exit code 1 means something is
 * over a limit. A site it cannot reach is a warning and exit 0, so a network
 * that is down does not read as a content problem.
 *
 * Two things it does not cover. Drafts: reading them needs an API key, so a
 * draft can still hold copy that is over and will refuse to publish. And the
 * other collections: Sectors and IndustryTopics declare their own section
 * fields with their own limits, which are not these.
 */
import fs from 'fs'

import { Pages } from '../src/collections/Pages'

const say = (s: string) => fs.writeSync(1, s + '\n')

const PROD_URL = process.env.PROD_URL ?? 'https://main.duebzy83yxxuo.amplifyapp.com'

/** How close to its limit a field has to be to be worth mentioning. */
const TIGHT = 0.15

// Read loosely on purpose: this walks every field shape Payload has, and the
// full Field union would need a type guard at every property it touches.
type AnyField = Record<string, any>

/** blockType -> field path -> the limit on it. */
const limits = new Map<string, Map<string, number>>()

const walk = (fields: AnyField[] | undefined, slug: string, prefix: string): void => {
  for (const f of fields ?? []) {
    if (f.type === 'row' || f.type === 'collapsible') {
      walk(f.fields, slug, prefix)
      continue
    }
    if (f.type === 'tabs') {
      for (const t of f.tabs ?? []) walk(t.fields, slug, t.name ? `${prefix}${t.name}.` : prefix)
      continue
    }
    const name = f.name ? `${prefix}${f.name}` : prefix.replace(/\.$/, '')
    if (f.type === 'array' || f.type === 'group') {
      walk(f.fields, slug, `${name}.`)
      continue
    }
    if (typeof f.maxLength === 'number') {
      if (!limits.has(slug)) limits.set(slug, new Map())
      limits.get(slug)!.set(name, f.maxLength)
    }
  }
}

/** The blocks a page's layout offers, wherever the tabs put the field. */
const findLayoutBlocks = (fields: AnyField[]): AnyField[] => {
  for (const f of fields) {
    if (f.type === 'blocks' && f.name === 'layout') return f.blocks
    if (f.type === 'tabs') {
      for (const t of f.tabs ?? []) {
        const hit = findLayoutBlocks(t.fields ?? [])
        if (hit.length) return hit
      }
    }
    if (Array.isArray(f.fields)) {
      const hit = findLayoutBlocks(f.fields)
      if (hit.length) return hit
    }
  }
  return []
}

for (const b of findLayoutBlocks(Pages.fields as AnyField[])) walk(b.fields, b.slug, '')

/** Every string in a saved block, with the field path it sits at. */
function* strings(data: unknown, prefix = ''): Generator<[string, string]> {
  if (Array.isArray(data)) {
    for (const item of data) yield* strings(item, prefix)
    return
  }
  if (!data || typeof data !== 'object') return
  for (const [k, v] of Object.entries(data)) {
    // Not content: an id, and the two names Payload puts on every block.
    if (k === 'id' || k === 'blockType' || k === 'blockName') continue
    const path = prefix ? `${prefix}.${k}` : k
    if (typeof v === 'string') yield [path, v]
    else if (v && typeof v === 'object') yield* strings(v, path)
  }
}

/**
 * Everything below sets process.exitCode and returns rather than calling
 * process.exit. Killing the process while the sockets from the fetch above
 * are still closing trips a libuv assertion on Windows, and the run then
 * reports 127, which to anything reading the exit code is a failure that
 * never happened.
 */
const main = async (): Promise<void> => {
let docs: { slug?: string; layout?: AnyField[] }[]
try {
  const res = await fetch(`${PROD_URL}/api/pages?limit=200&depth=0&draft=false`)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  docs = (await res.json()).docs ?? []
} catch (err) {
  say(`Could not read ${PROD_URL}: ${(err as Error).message}`)
  say('Nothing was checked. This is a warning, not a content problem.')
  return
}

say(`Published pages read from ${PROD_URL}: ${docs.length}\n`)

type Seen = { max: number; limit: number; where: Set<string> }
const seen = new Map<string, Seen>()
const over: string[] = []

for (const page of docs) {
  for (const block of page.layout ?? []) {
    const perBlock = limits.get(String(block.blockType))
    if (!perBlock) continue
    for (const [path, value] of strings(block)) {
      const limit = perBlock.get(path)
      if (typeof limit !== 'number') continue
      const key = `${block.blockType}.${path}`
      const row = seen.get(key) ?? { max: 0, limit, where: new Set<string>() }
      if (value.length > row.max) row.max = value.length
      if (value.length > limit) {
        row.where.add(String(page.slug))
        over.push(`  /${page.slug}  ${key}\n      ${value.length} characters, limit ${limit}\n      "${value.slice(0, 80)}${value.length > 80 ? '...' : ''}"`)
      }
      seen.set(key, row)
    }
  }
}

if (over.length) {
  say(`OVER THE LIMIT. An editor cannot save these pages:\n`)
  over.forEach((line) => say(line))
  const fields = [...seen.values()].filter((r) => r.max > r.limit).length
  say(`\n${over.length} value(s) across ${fields} field(s). Raise the limit, or shorten the copy.`)
  process.exitCode = 1
  return
}

say('Nothing is over a limit.')

const tight = [...seen.entries()]
  .map(([field, r]) => ({ field, ...r, spare: r.limit - r.max }))
  .filter((r) => r.spare < r.limit * TIGHT)
  .sort((a, b) => a.spare - b.spare)

if (tight.length) {
  say(`\nTight, and worth knowing about before the next edit:`)
  for (const r of tight) say(`  ${r.field}: longest ${r.max}, limit ${r.limit}, ${r.spare} spare`)
}

say(`\nFields with a limit and something live in them: ${seen.size}`)
}

await main()
