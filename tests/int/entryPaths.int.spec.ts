import 'dotenv/config'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'

/**
 * Entry addresses, redirects and primary keywords against the local database,
 * with the bot swarm (route base /bot-swarm) and Pages. Every record here is
 * temporary (names and slugs start ZZ EP / zz-ep-) and deleted afterwards.
 */

type Doc = Record<string, any>
const quiet = { context: { disableRevalidate: true }, depth: 0 } as const
let payload: Payload
const created: { collection: 'microApps' | 'pages' | 'lists'; id: string }[] = []
let family: Doc

const refusal = async (save: Promise<unknown>): Promise<string[]> => {
  try {
    await save
    return []
  } catch (e: any) {
    const errors = e?.data?.errors
    return Array.isArray(errors) ? errors.map((x: any) => x.message) : [String(e?.message)]
  }
}

const agentData = (slug: string, extra: Doc = {}) => ({
  name: `ZZ EP ${slug}`,
  slug: `zz-ep-${slug}`,
  status: 'live',
  order: 1,
  family: family.id,
  summary: `${slug} summary for the address test.`,
  keyPoints: [{ line: 'One' }, { line: 'Two' }, { line: 'Three' }],
  waBody: `${slug} body.`,
  waButtons: [{ label: 'Book a demo', action: 'bookDemo' }],
  hasOwnPage: true,
  usePageDefaults: false,
  layout: [],
  heroHeading: `ZZ EP ${slug} heading`,
  heroDesign: 'stats',
  heroStats: [
    { value: '2x', label: 'faster replies' },
    { value: '40%', label: 'fewer calls' },
  ],
  meta: { title: `ZZ EP ${slug}`, description: `ZZ EP ${slug} description for search.` },
  _status: 'published',
  ...extra,
})

const agent = async (slug: string, extra: Doc = {}) => {
  const doc = await payload.create({ ...quiet, collection: 'microApps', data: agentData(slug, extra) as any })
  created.push({ collection: 'microApps', id: String(doc.id) })
  return doc as Doc
}

const page = async (slug: string, extra: Doc = {}) => {
  const doc = await payload.create({
    ...quiet,
    collection: 'pages',
    data: { title: `ZZ EP ${slug}`, slug: `zz-ep-${slug}`, hero: { type: 'none' }, layout: [{ blockType: 'content', columns: [] }], _status: 'published', ...extra } as any,
  })
  created.push({ collection: 'pages', id: String(doc.id) })
  return doc as Doc
}

const redirectsFrom = async (from: string) =>
  (await payload.find({ ...quiet, collection: 'redirects', where: { from: { equals: from } } })).docs as Doc[]

beforeAll(async () => {
  payload = await getPayload({ config: await config })
  family = await payload.create({
    ...quiet,
    collection: 'lists',
    data: { name: 'ZZ EP family', slug: 'zz-ep-family', type: 'agentFamily', order: 99, _status: 'published' } as any,
  })
  created.push({ collection: 'lists', id: String(family.id) })
})

afterAll(async () => {
  for (const c of created.reverse()) await payload.delete({ ...quiet, collection: c.collection, id: c.id }).catch(() => undefined)
  const left = await payload.find({ ...quiet, collection: 'redirects', where: { from: { like: 'zz-ep-' } }, limit: 100 })
  for (const r of left.docs) await payload.delete({ ...quiet, collection: 'redirects', id: r.id })
})

describe('stored address', () => {
  it('stores the address of an agent with its own page, and none without one', async () => {
    const own = await agent('stored')
    expect((await payload.findByID({ ...quiet, collection: 'microApps', id: own.id })).path).toBe('/bot-swarm/zz-ep-stored')
    const cardOnly = await agent('card-only', { hasOwnPage: false })
    expect((await payload.findByID({ ...quiet, collection: 'microApps', id: cardOnly.id })).path ?? null).toBeNull()
  })
})

describe('redirect when a published agent moves', () => {
  it('redirects the old address to the new one when the slug changes', async () => {
    const a = await agent('moving')
    await payload.update({ ...quiet, collection: 'microApps', id: a.id, data: { slug: 'zz-ep-moved', _status: 'published' } as any })
    expect((await redirectsFrom('/bot-swarm/zz-ep-moving'))[0]?.to).toMatchObject({ type: 'custom', url: '/bot-swarm/zz-ep-moved' })
  })

  it('makes no redirect for a draft change', async () => {
    const a = await agent('draft-move')
    await payload.update({ ...quiet, collection: 'microApps', id: a.id, draft: true, data: { slug: 'zz-ep-draft-moved' } as any })
    expect(await redirectsFrom('/bot-swarm/zz-ep-draft-move')).toHaveLength(0)
  })
})

describe('primary keyword across Pages and collections', () => {
  it('refuses on an agent a keyword a page has, ignoring case and spacing, naming the page', async () => {
    await page('kw-page', { meta: { primaryKeyword: 'ZZ EP keyword one' } })
    const messages = await refusal(agent('kw-agent', { meta: { ...agentData('kw-agent').meta, primaryKeyword: '  zz ep KEYWORD   one' } }))
    expect(messages).toContain(
      '"zz ep KEYWORD   one" is already the primary keyword of the page "ZZ EP kw-page" (/zz-ep-kw-page). Choose a different keyword.',
    )
  })

  it('refuses on a page a keyword an agent has, naming the agent and its address', async () => {
    await agent('kw-owner', { meta: { ...agentData('kw-owner').meta, primaryKeyword: 'ZZ EP keyword two' } })
    const messages = await refusal(page('kw-second', { meta: { primaryKeyword: 'zz ep keyword two' } }))
    expect(messages).toContain(
      '"zz ep keyword two" is already the primary keyword of the agent "ZZ EP kw-owner" (/bot-swarm/zz-ep-kw-owner). Choose a different keyword.',
    )
  })

  it('accepts an agent keeping its own keyword', async () => {
    const a = await agent('kw-keep', { meta: { ...agentData('kw-keep').meta, primaryKeyword: 'ZZ EP keyword three' } })
    const messages = await refusal(
      payload.update({ ...quiet, collection: 'microApps', id: a.id, data: { meta: { ...agentData('kw-keep').meta, primaryKeyword: 'zz ep keyword three' }, _status: 'published' } as any }),
    )
    expect(messages).toEqual([])
  })
})
