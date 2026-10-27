import 'dotenv/config'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import config from '@/payload.config'
import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'
import '@/collections/Sectors'
import { Integrations } from '@/collections/Integrations'
import { revalidateIndustriesForIntegration } from '@/collections/integrations/revalidateIndustries'
import {
  placementPaths,
  revalidateSharedPlacements,
  SHARED_BLOCKS,
  SharedContent,
  validateKey,
} from '@/collections/SharedContent'
import { VERTICAL_OPTIONS } from '@/fields/verticals'

/**
 * Shared content, integrations' verticals, and the pages each one refreshes.
 * The refresh logic runs against a small in-memory stand-in for Payload; the
 * last group uses the local database with temporary records (zz-sc-).
 */

vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }))

type Doc = Record<string, any>
const get = (doc: Doc, path: string) => path.split('.').reduce((v, k) => (v == null ? v : v[k]), doc as any)
const matches = (doc: Doc, where: any): boolean => {
  if (!where) return true
  if (where.and) return where.and.every((w: any) => matches(doc, w))
  return Object.entries(where).every(([path, cond]: [string, any]) => {
    const v = get(doc, path)
    if ('equals' in cond) return String(v) === String(cond.equals)
    if ('in' in cond) return (Array.isArray(v) ? v : [v]).some((x) => cond.in.includes(x))
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

const named = (name: string): any => (SharedContent.fields as any[]).find((f) => f.name === name)

describe('the collection', () => {
  it('is Shared content, beside Industries, with drafts, and no route', () => {
    expect(SharedContent.slug).toBe('sharedContent')
    expect(SharedContent.labels).toEqual({ singular: 'Shared content', plural: 'Shared content' })
    expect(SharedContent.admin?.group).toBe('Industries')
    // Loading the config expands drafts: true into its full form.
    expect((SharedContent.versions as any)?.drafts).toBeTruthy()
    expect(SharedContent.access?.read).toBe(authenticatedOrPublished)
  })

  it('has a name, a unique key and exactly one block of the allowed kinds', () => {
    expect(named('name')).toMatchObject({ type: 'text', maxLength: 60, required: true })
    expect(named('key')).toMatchObject({ type: 'text', maxLength: 30, unique: true, validate: validateKey })
    expect(named('block')).toMatchObject({ type: 'blocks', required: true, minRows: 1, maxRows: 1 })
    expect(named('block').blockReferences).toEqual(['trustPanel', 'howItWorks2', 'productSuite2', 'bentoGrid', 'statBand'])
    expect([...SHARED_BLOCKS]).toEqual(named('block').blockReferences)
  })

  it('takes keys of lowercase letters, numbers and single dashes only', () => {
    const v = (value: string) => validateKey(value, { req: { t: (k: string) => k, payload: { config: {} } }, maxLength: 30 } as any)
    expect(v('industry-trust')).toBe(true)
    for (const bad of ['Industry-trust', 'industry_trust', 'industry--trust', '-trust', 'with space']) {
      expect(v(bad), bad).toBe('Lowercase letters, numbers and single dashes only, such as industry-trust.')
    }
  })
})

describe('pages that place a record', () => {
  const store = () => ({
    pages: [
      { id: 'p1', slug: 'admissions', _status: 'published', layout: [{ blockType: 'sharedPlacement', sharedContent: 's1' }] },
      { id: 'p2', slug: 'other', _status: 'published', layout: [{ blockType: 'content' }] },
      { id: 'p3', slug: 'fees', parent: 'p1', breadcrumbs: [{ url: '/admissions' }, { url: '/admissions/fees' }], _status: 'published', layout: [{ sharedContent: { id: 's1' } }] },
    ],
    hubs: [{ id: 'h1', forCollection: 'microApps', _status: 'published', layout: [{ blockType: 'x', sharedContent: 's1' }] }],
    sectors: [{ id: 'i1', slug: 'healthcare', hasOwnPage: true, path: '/healthcare', _status: 'published', episodePoints: [{ sharedContent: 's1' }] }],
  })

  it('finds every page, hub and entry whose content links to the record', async () => {
    // The hub is the bot swarm's, at its route.
    expect((await placementPaths(fakeReq(store()), 's1')).sort()).toEqual(['/admissions', '/admissions/fees', '/bot-swarm', '/healthcare'].sort())
  })

  it('finds nothing for a record no page places', async () => {
    expect(await placementPaths(fakeReq(store()), 's9')).toEqual([])
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

  it('refreshes the pages that place a published record, and nothing for a draft that never was published', async () => {
    const req = fakeReq({ pages: [{ id: 'p1', slug: 'admissions', _status: 'published', layout: [{ sharedContent: 's1' }] }] })
    sent.length = 0
    await revalidateSharedPlacements({ doc: { id: 's1', key: 'trust', _status: 'published' }, previousDoc: {}, req } as any)
    expect(sent).toEqual([expect.objectContaining({ collection: 'sharedContent', paths: ['/admissions'] })])
    sent.length = 0
    await revalidateSharedPlacements({ doc: { id: 's1', _status: 'draft' }, previousDoc: { _status: 'draft' }, req } as any)
    expect(sent).toEqual([])
  })

  it('refreshes the industry pages listing integrations whose verticals overlap a published one, before or after the change', async () => {
    const req = fakeReq({
      sectors: [
        { id: 'i1', slug: 'healthcare', verticals: ['healthcare', 'diagnostics'], hasOwnPage: true, path: '/healthcare', _status: 'published', layout: [{ blockType: 'industryIntegrationsSection' }] },
        { id: 'i2', slug: 'higher-education', verticals: ['education'], hasOwnPage: true, path: '/higher-education', _status: 'published', layout: [{ blockType: 'industryIntegrationsSection' }] },
        { id: 'i3', slug: 'no-page', verticals: ['education'], hasOwnPage: false, _status: 'published', layout: [{ blockType: 'industryIntegrationsSection' }] },
        // No integrations section on its page, so nothing there shows the integration.
        { id: 'i4', slug: 'no-section', path: '/no-section', verticals: ['education'], hasOwnPage: true, _status: 'published', layout: [{ blockType: 'industryProblemsSection' }] },
      ],
    })
    sent.length = 0
    await revalidateIndustriesForIntegration({ doc: { slug: 'lsq', _status: 'published', verticals: ['diagnostics'] }, previousDoc: { _status: 'published', verticals: ['education'] }, req } as any)
    expect(sent.flatMap((b) => b.paths).sort()).toEqual(['/healthcare', '/higher-education'])
    sent.length = 0
    await revalidateIndustriesForIntegration({ doc: { slug: 'lsq', _status: 'published', verticals: [] }, previousDoc: { _status: 'draft' }, req } as any)
    expect(sent).toEqual([])
  })
})

describe('integrations', () => {
  it('have verticals in the sidebar, from the shared list', () => {
    const field = (Integrations.fields as any[]).find((f) => f.name === 'verticals')
    expect(field).toMatchObject({ type: 'select', hasMany: true, options: [...VERTICAL_OPTIONS], admin: { position: 'sidebar' } })
  })
})

describe('with the local database', () => {
  let payload: Payload
  const ids: string[] = []
  const quiet = { context: { disableRevalidate: true }, depth: 0 } as const

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
  })
  afterAll(async () => {
    for (const id of ids) await payload.delete({ ...quiet, collection: 'sharedContent', id }).catch(() => undefined)
  })

  it('shows visitors published records only', async () => {
    const block = [{ blockType: 'statBand', stats: [{ value: '2x', label: 'faster' }, { value: '40%', label: 'fewer calls' }] }]
    const live = await payload.create({ ...quiet, collection: 'sharedContent', data: { name: 'ZZ SC live', key: 'zz-sc-live', block, _status: 'published' } as any })
    const draft = await payload.create({ ...quiet, collection: 'sharedContent', draft: true, data: { name: 'ZZ SC draft', key: 'zz-sc-draft', block, _status: 'draft' } as any })
    ids.push(String(live.id), String(draft.id))
    const visitor = await payload.find({ ...quiet, collection: 'sharedContent', overrideAccess: false, where: { key: { like: 'zz-sc-' } } })
    expect(visitor.docs.map((d: any) => d.key)).toEqual(['zz-sc-live'])
  })

  it('refuses a second record with the same key', async () => {
    let failed = false
    try {
      const again = await payload.create({ ...quiet, collection: 'sharedContent', draft: true, data: { name: 'ZZ SC again', key: 'zz-sc-live', _status: 'draft' } as any })
      ids.push(String(again.id))
    } catch {
      failed = true
    }
    expect(failed).toBe(true)
  })
})
