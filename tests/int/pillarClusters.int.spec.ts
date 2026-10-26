import 'dotenv/config'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

// The CMS's own cache calls only work inside a Next request; the website
// revalidation is checked through fetch instead.
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }))

import config from '@/payload.config'
import { HAS_CLUSTERS_MESSAGE, ONE_LEVEL_MESSAGE, pagePath } from '../../src/collections/Pages/nesting'

/**
 * Pillar and cluster pages, against the local database: temporary pages
 * (slugs starting zz-pc-) and their redirects, all deleted afterwards.
 */

type Doc = Record<string, any>
const quiet = { context: { disableRevalidate: true }, depth: 0 } as const
let payload: Payload
const pageIds: string[] = []

const page = async (slug: string, extra: Doc = {}, status: 'published' | 'draft' = 'published') => {
  const doc = await payload.create({
    ...quiet,
    collection: 'pages',
    draft: status === 'draft',
    data: {
      title: `ZZ PC ${slug}`,
      slug: `zz-pc-${slug}`,
      hero: { type: 'none' },
      layout: [{ blockType: 'content', columns: [] }],
      _status: status,
      ...extra,
    } as any,
  })
  pageIds.push(String(doc.id))
  return doc as Doc
}

const publish = (id: string | number, data: Doc) =>
  payload.update({ ...quiet, collection: 'pages', id, data: { ...data, _status: 'published' } as any }) as Promise<Doc>

/** The validation messages a save was refused with, or [] when it saved. */
const refusal = async (save: Promise<unknown>): Promise<string[]> => {
  try {
    await save
    return []
  } catch (e: any) {
    const errors = e?.data?.errors
    return Array.isArray(errors) ? errors.map((x: any) => x.message) : [String(e?.message)]
  }
}

const redirectsFrom = async (from: string) =>
  (await payload.find({ ...quiet, collection: 'redirects', where: { from: { equals: from } } })).docs as Doc[]

beforeAll(async () => {
  payload = await getPayload({ config: await config })
})

afterAll(async () => {
  // Clusters before pillars, then every redirect these pages made.
  for (const id of pageIds.reverse()) {
    await payload.delete({ ...quiet, collection: 'pages', id }).catch(() => undefined)
  }
  const left = await payload.find({ ...quiet, collection: 'redirects', where: { from: { like: '/zz-pc-' } }, limit: 100 })
  for (const r of left.docs) await payload.delete({ ...quiet, collection: 'redirects', id: r.id })
})

describe('paths', () => {
  it('keeps a page without a parent at /slug, and home at /', () => {
    expect(pagePath([{ slug: 'crm' }])).toBe('/crm')
    expect(pagePath([{ slug: 'home' }])).toBe('/')
    // No slug yet: no address, rather than the home page's /.
    expect(pagePath([{ slug: null }])).toBe('')
    expect(pagePath([{ slug: 'higher-education' }, {}])).toBe('')
    expect(pagePath([{ slug: 'higher-education' }, { slug: 'student-lead-qualification' }])).toBe(
      '/higher-education/student-lead-qualification',
    )
  })

  it('stores breadcrumbs: the pillar, then the cluster at /pillar/cluster', async () => {
    const pillar = await page('pillar-a')
    const cluster = await page('cluster-a', { parent: pillar.id, stage: 'Qualification', stageOrder: 2 })
    const saved = (await payload.findByID({ ...quiet, collection: 'pages', id: cluster.id })) as Doc
    expect(saved.breadcrumbs.map((b: Doc) => b.url)).toEqual(['/zz-pc-pillar-a', '/zz-pc-pillar-a/zz-pc-cluster-a'])
    expect(saved.breadcrumbs.map((b: Doc) => b.label)).toEqual(['ZZ PC pillar-a', 'ZZ PC cluster-a'])
    expect(saved).toMatchObject({ stage: 'Qualification', stageOrder: 2 })
    const top = (await payload.findByID({ ...quiet, collection: 'pages', id: pillar.id })) as Doc
    expect(top.breadcrumbs?.at(-1)?.url ?? '/zz-pc-pillar-a').toBe('/zz-pc-pillar-a')
  })
})

describe('one level only', () => {
  it('refuses a page under a cluster page', async () => {
    const pillar = await page('pillar-b')
    const cluster = await page('cluster-b', { parent: pillar.id })
    expect(await refusal(page('grandchild-b', { parent: cluster.id }))).toContain(ONE_LEVEL_MESSAGE)
  })

  it('refuses a parent for a page that already has cluster pages', async () => {
    const pillar = await page('pillar-c')
    await page('cluster-c', { parent: pillar.id })
    const other = await page('other-c')
    expect(await refusal(publish(pillar.id, { parent: other.id }))).toContain(HAS_CLUSTERS_MESSAGE)
  })

  it('accepts a page directly under a pillar', async () => {
    const pillar = await page('pillar-d')
    expect(await refusal(page('cluster-d', { parent: pillar.id }))).toEqual([])
  })
})

describe('primary keyword', () => {
  it('refuses a keyword another page has, whatever the case or spacing, naming that page', async () => {
    await page('kw-first', { meta: { primaryKeyword: 'ZZ Student Lead Qualification' } })
    const messages = await refusal(page('kw-second', { meta: { primaryKeyword: '  zz student   lead qualification ' } }))
    expect(messages).toContain(
      '"zz student   lead qualification" is already the primary keyword of the page "ZZ PC kw-first" (/zz-pc-kw-first). Choose a different keyword.',
    )
  })

  it('accepts a different keyword, and a page keeping its own', async () => {
    const own = await page('kw-own', { meta: { primaryKeyword: 'ZZ admissions chatbot' } })
    expect(await refusal(page('kw-other', { meta: { primaryKeyword: 'ZZ admissions chatbot pricing' } }))).toEqual([])
    expect(await refusal(publish(own.id, { title: 'ZZ PC kw-own renamed', meta: { primaryKeyword: 'ZZ Admissions Chatbot' } }))).toEqual([])
  })
})

describe('redirect when a published page moves', () => {
  it('redirects the old path when the slug changes', async () => {
    const p = await page('move-slug')
    await publish(p.id, { slug: 'zz-pc-move-slug-new' })
    const [r] = await redirectsFrom('/zz-pc-move-slug')
    expect(r?.to).toMatchObject({ type: 'custom', url: '/zz-pc-move-slug-new' })
  })

  it('redirects the old path when the page moves under a pillar, and keeps one hop after a second move', async () => {
    const pillar = await page('move-pillar')
    const p = await page('move-parent')
    await publish(p.id, { parent: pillar.id })
    expect((await redirectsFrom('/zz-pc-move-parent'))[0]?.to?.url).toBe('/zz-pc-move-pillar/zz-pc-move-parent')

    await publish(p.id, { slug: 'zz-pc-move-parent-2' })
    // The first redirect now goes straight to the newest path.
    expect((await redirectsFrom('/zz-pc-move-parent'))[0]?.to?.url).toBe('/zz-pc-move-pillar/zz-pc-move-parent-2')
    expect((await redirectsFrom('/zz-pc-move-pillar/zz-pc-move-parent'))[0]?.to?.url).toBe(
      '/zz-pc-move-pillar/zz-pc-move-parent-2',
    )
  })

  it("redirects a cluster's old path when its pillar is renamed", async () => {
    const pillar = await page('rename-pillar')
    await page('rename-cluster', { parent: pillar.id })
    await publish(pillar.id, { slug: 'zz-pc-rename-pillar-2' })
    expect((await redirectsFrom('/zz-pc-rename-pillar'))[0]?.to?.url).toBe('/zz-pc-rename-pillar-2')
    expect((await redirectsFrom('/zz-pc-rename-pillar/zz-pc-rename-cluster'))[0]?.to?.url).toBe(
      '/zz-pc-rename-pillar-2/zz-pc-rename-cluster',
    )
  })

  it('removes a redirect away from the path a page moves to', async () => {
    const p = await page('back')
    await publish(p.id, { slug: 'zz-pc-back-2' })
    expect(await redirectsFrom('/zz-pc-back')).toHaveLength(1)
    await publish(p.id, { slug: 'zz-pc-back' })
    // The page lives at /zz-pc-back again, so nothing may redirect away from it.
    expect(await redirectsFrom('/zz-pc-back')).toHaveLength(0)
    expect((await redirectsFrom('/zz-pc-back-2'))[0]?.to?.url).toBe('/zz-pc-back')
  })

  it('makes no redirect for a draft change, or for a page never published', async () => {
    const live = await page('draft-move')
    await payload.update({ ...quiet, collection: 'pages', id: live.id, draft: true, data: { slug: 'zz-pc-draft-move-2' } as any })
    expect(await redirectsFrom('/zz-pc-draft-move')).toHaveLength(0)

    const never = await page('never', {}, 'draft')
    await publish(never.id, { slug: 'zz-pc-never-2' })
    expect(await redirectsFrom('/zz-pc-never')).toHaveLength(0)
  })
})

describe('website revalidation', () => {
  const sent: { paths: string[]; collection: string }[] = []
  const live = { context: {}, depth: 0 } as const

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

  it('refreshes the cluster, its new pillar, and its old path and old pillar when it moves', async () => {
    const oldPillar = await page('rv-old')
    const newPillar = await page('rv-new')
    const cluster = await page('rv-cluster', { parent: oldPillar.id })
    sent.length = 0
    await payload.update({ ...live, collection: 'pages', id: cluster.id, data: { parent: newPillar.id, _status: 'published' } as any })
    const paths = sent.filter((b) => b.collection === 'pages').flatMap((b) => b.paths)
    expect(paths).toEqual(
      expect.arrayContaining(['/zz-pc-rv-new/zz-pc-rv-cluster', '/zz-pc-rv-new', '/zz-pc-rv-old/zz-pc-rv-cluster', '/zz-pc-rv-old']),
    )
  })

  it("refreshes the other cluster pages under the pillar, so their next-stage links follow", async () => {
    const pillar = await page('rv-sib-pillar')
    await page('rv-sib-one', { parent: pillar.id, stage: 'Enquiry', stageOrder: 1 })
    await page('rv-sib-two', { parent: pillar.id, stage: 'Application', stageOrder: 3 })
    const added = await page('rv-sib-new', { parent: pillar.id, stage: 'Qualification', stageOrder: 2 }, 'draft')
    sent.length = 0
    await payload.update({ ...live, collection: 'pages', id: added.id, data: { _status: 'published' } as any })
    const paths = sent.flatMap((b) => b.paths)
    expect(paths).toEqual(
      expect.arrayContaining([
        '/zz-pc-rv-sib-pillar/zz-pc-rv-sib-new',
        '/zz-pc-rv-sib-pillar',
        '/zz-pc-rv-sib-pillar/zz-pc-rv-sib-one',
        '/zz-pc-rv-sib-pillar/zz-pc-rv-sib-two',
      ]),
    )
  })

  it('refreshes the cluster and its pillar when it is unpublished, and nothing for a later draft save', async () => {
    const pillar = await page('rv-un-pillar')
    const cluster = await page('rv-un-cluster', { parent: pillar.id })
    sent.length = 0
    await payload.update({ ...live, collection: 'pages', id: cluster.id, data: { _status: 'draft' } as any })
    expect(sent.at(-1)?.paths).toEqual(expect.arrayContaining(['/zz-pc-rv-un-pillar/zz-pc-rv-un-cluster', '/zz-pc-rv-un-pillar']))
    sent.length = 0
    await payload.update({ ...live, collection: 'pages', id: cluster.id, draft: true, data: { title: 'ZZ PC still a draft' } as any })
    expect(sent).toHaveLength(0)
  })
})
