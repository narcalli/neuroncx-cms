import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import '@/collections/Sectors'
import { MicroApps } from '@/collections/MicroApps'
import { byLinked, byVerticals, industryPathsWith, revalidateIndustriesShowing } from '@/collections/Sectors/revalidate'
import { placementPaths } from '@/collections/SharedContent'
import { contentBlocks } from '@/content/sections/blocks'

/**
 * The industry sections drawn from other collections, and the industry pages
 * refreshed when an agent, integration, customer or topic changes. Runs
 * against a small in-memory stand-in for Payload.
 */

type Doc = Record<string, any>
const get = (doc: Doc, path: string) => path.split('.').reduce((v, k) => (v == null ? v : v[k]), doc as any)
const matches = (doc: Doc, where: any): boolean => {
  if (!where) return true
  if (where.and) return where.and.every((w: any) => matches(doc, w))
  return Object.entries(where).every(([path, cond]: [string, any]) => {
    const v = get(doc, path)
    if ('equals' in cond) return String(v) === String(cond.equals)
    if ('in' in cond) return (Array.isArray(v) ? v : [v]).some((x) => cond.in.map(String).includes(String(x)))
    return true
  })
}
const fakeReq = (store: Record<string, Doc[]>) =>
  ({
    context: {},
    payload: {
      find: async ({ collection, where }: any) => {
        const docs = (store[collection] ?? []).filter((d) => matches(d, where))
        return { docs, totalDocs: docs.length }
      },
      findByID: async ({ collection, id }: any) => (store[collection] ?? []).find((d) => String(d.id) === String(id)) ?? null,
      logger: { info: () => undefined, error: () => undefined },
    },
  }) as any

const flat = (fields: any[]): any[] => fields.flatMap((f) => (f.type === 'row' || f.type === 'collapsible' ? flat(f.fields) : [f]))
const block = (slug: string) => contentBlocks().find((b) => b.slug === slug)!

const page = (id: string, extra: Doc) => ({ id, hasOwnPage: true, path: `/${id}`, slug: id, _status: 'published', ...extra })
const industries = () => ({
  sectors: [
    page('health', { verticals: ['healthcare'], layout: ['industryAgents', 'industryIntegrations', 'industryCustomers', 'industryTopics'].map((k) => ({ blockType: `${k}Section` })) }),
    page('education', { verticals: ['education'], layout: [{ blockType: 'industryAgentsSection' }, { blockType: 'industryTopicsSection' }] }),
    page('plain', { verticals: ['education', 'healthcare'], layout: [{ blockType: 'industryProblemsSection' }] }),
    { id: 'draft', verticals: ['education'], hasOwnPage: true, path: '/draft', _status: 'draft', layout: [{ blockType: 'industryAgentsSection' }] },
  ],
})

describe('the sections', () => {
  it('Industry topics takes extra pages, each a page with its stage and stage order', () => {
    const extra = flat(block('industryTopicsSection').fields).find((f: any) => f.name === 'extraPages')
    expect(extra.type).toBe('array')
    expect(flat(extra.fields).map((f: any) => [f.name, f.type, f.relationTo])).toEqual([
      ['page', 'relationship', 'pages'],
      ['stage', 'text', undefined],
      ['stageOrder', 'number', undefined],
    ])
  })

  it('Shared content takes one item, a shared content record', () => {
    const item = flat(block('sharedSection').fields).find((f: any) => f.name === 'item')
    expect(item).toMatchObject({ type: 'relationship', relationTo: 'sharedContent', required: true })
  })
})

describe('which industry pages show a record', () => {
  it('only published industries with their own page whose layout holds the section', async () => {
    const req = fakeReq(industries())
    expect(await industryPathsWith(req, 'industryAgents', { verticals: { in: ['education'] } })).toEqual(['/education'])
    expect((await industryPathsWith(req, 'industryAgents', { verticals: { in: ['education', 'healthcare'] } })).sort()).toEqual(['/education', '/health'])
    expect(await industryPathsWith(req, 'industryCustomers', { id: { in: ['education'] } })).toEqual([])
  })

  it('matches agents and integrations by verticals, customers by sectors and topics by industry, before or after', () => {
    expect(byVerticals([{ verticals: ['education'] }, { verticals: ['healthcare', 'education'] }])).toEqual({ verticals: { in: ['education', 'healthcare'] } })
    expect(byVerticals([{ verticals: [] }])).toBeNull()
    expect(byLinked('sectors')([{ sectors: ['health', { id: 'education' }] }, { sectors: ['health'] }])).toEqual({ id: { in: ['health', 'education'] } })
    expect(byLinked('industry')([{ industry: { id: 'education' } }, { industry: 'health' }])).toEqual({ id: { in: ['education', 'health'] } })
    expect(byLinked('industry')([{}])).toBeNull()
  })
})

describe('refreshing the website', () => {
  const sent: { paths: string[]; collection: string }[] = []
  beforeAll(() => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://site.test')
    vi.stubEnv('REVALIDATE_SECRET', 'test-secret')
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init: RequestInit) => {
        if (String(url) === 'http://site.test/api/revalidate') sent.push(JSON.parse(String(init.body)))
        return new Response('{}', { status: 200 })
      }),
    )
  })
  afterAll(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })
  const run = async (hook: any, doc: Doc, previousDoc: Doc) => {
    sent.length = 0
    await hook({ doc, previousDoc, req: fakeReq(industries()) })
    return sent.flatMap((b) => b.paths).sort()
  }

  it('an agent: the pages listing agents for its verticals, before and after', async () => {
    // Every afterChange hook the agents collection runs, the knowledge base one skipped.
    const hook = async (args: any) => {
      args.req.context.skipRag = true
      for (const h of MicroApps.hooks?.afterChange ?? []) await h({ ...args, collection: MicroApps } as any)
    }
    expect(await run(hook, { slug: 'fees', _status: 'published', verticals: ['healthcare'] }, { _status: 'published', verticals: ['education'] })).toEqual(expect.arrayContaining(['/education', '/health']))
    expect(sent.find((b) => b.collection === 'sectors')?.paths.sort()).toEqual(['/education', '/health'])
  })

  it('a customer: the pages for its sectors with a customers section', async () => {
    const hook = revalidateIndustriesShowing('industryCustomers', byLinked('sectors'))
    expect(await run(hook, { slug: 'x', _status: 'published', sectors: ['health', 'education'] }, {})).toEqual(['/health'])
  })

  it('a topic: its industry page, and the one it moved from', async () => {
    const hook = revalidateIndustriesShowing('industryTopics', byLinked('industry'))
    expect(await run(hook, { slug: 't', _status: 'published', industry: 'education' }, { _status: 'published', industry: 'health' })).toEqual(['/education', '/health'])
  })

  it('nothing for a record that was never published and is not now', async () => {
    const hook = revalidateIndustriesShowing('industryTopics', byLinked('industry'))
    expect(await run(hook, { slug: 't', _status: 'draft', industry: 'education' }, { _status: 'draft' })).toEqual([])
  })
})

describe('shared content placed on an industry page', () => {
  it('counts the Shared content section as a placement', async () => {
    const req = fakeReq({ sectors: [page('health', { layout: [{ blockType: 'sharedSection', item: 'sc1' }] })] })
    expect(await placementPaths(req, 'sc1')).toEqual(['/health'])
    expect(await placementPaths(req, 'sc2')).toEqual([])
  })
})
