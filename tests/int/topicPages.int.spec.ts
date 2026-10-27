import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import '@/collections/Sectors'
import { IndustryTopics } from '@/collections/IndustryTopics'
import { revalidateTopicFamily, revalidateTopicFamilyAfterDelete, topicFamilyPaths } from '@/collections/IndustryTopics/revalidate'
import { TOPIC_DEFAULT_LAYOUT, TOPIC_SECTION_KEYS } from '@/collections/IndustryTopics/sections'
import { getSection } from '@/content/sections/defineSection'
import { contentBlocks } from '@/content/sections/blocks'
import { getContentCollection } from '@/content/registry'
import { navyProblem } from '@/fields/layout'

/**
 * Industry topic pages: their sections, the cluster footer switch, and the
 * pages refreshed when a topic changes. Runs against a small in-memory
 * stand-in for Payload.
 */

type Doc = Record<string, any>
const flat = (fields: any[]): any[] =>
  fields.flatMap((f) => (f.type === 'row' || f.type === 'collapsible' ? flat(f.fields) : f.type === 'tabs' ? f.tabs.flatMap((t: any) => flat(t.fields)) : [f]))
const block = (slug: string) => contentBlocks().find((b) => b.slug === slug)!
const fieldNames = (slug: string) => flat(block(slug).fields).map((f: any) => f.name)

describe('the sections', () => {
  it('are the topic sections, Shared content, the FAQ and the closing panel; the default page has all but Shared content', () => {
    expect(TOPIC_SECTION_KEYS).toEqual([
      'topicOverview',
      'topicSteps',
      'topicRecorded',
      'topicComparison',
      'topicAgents',
      'topicIntegrations',
      'shared',
      'faq',
      'closing',
    ])
    expect(TOPIC_DEFAULT_LAYOUT).toEqual(['topicOverview', 'topicSteps', 'topicRecorded', 'topicAgents', 'topicIntegrations', 'topicComparison', 'faq', 'closing'])
    expect(getContentCollection('industryTopics')).toMatchObject({ sections: TOPIC_SECTION_KEYS, defaultLayout: TOPIC_DEFAULT_LAYOUT })
  })

  it('each takes a heading override, an eyebrow, an intro, and of the Appearance options only the background and anchor ID', () => {
    for (const key of TOPIC_SECTION_KEYS.slice(0, 7)) {
      const names = fieldNames(`${key}Section`)
      expect(names, key).toEqual(expect.arrayContaining(['heading', 'eyebrow', 'intro', 'background', 'htmlId']))
      expect(names, key).not.toContain('width')
      expect(names, key).not.toContain('spacingTop')
    }
  })

  it('read the topic fields they draw', () => {
    expect(getSection('topicOverview')?.reads).toEqual(['overview'])
    expect(getSection('topicSteps')?.reads).toEqual(['steps'])
    expect(getSection('topicRecorded')?.reads).toEqual(['recorded'])
    expect(getSection('topicComparison')?.reads).toEqual(['comparison'])
    expect(getSection('topicAgents')?.reads).toEqual(['agents'])
    expect(getSection('topicIntegrations')?.reads).toEqual(['integrations'])
  })

  it('only the closing panel may use Highlight (navy)', () => {
    expect(navyProblem([{ blockType: 'topicStepsSection', background: 'navy' }], { allowed: ['closing panel'] })).toContain('Only the closing panel')
    expect(navyProblem([{ blockType: 'closingSection', background: 'navy' }], { allowed: ['closing panel'] })).toBeNull()
  })
})

describe('the cluster footer switch', () => {
  it('is Hide cluster footer in the sidebar, off by default', () => {
    const field = flat(IndustryTopics.fields).find((f: any) => f.name === 'hideClusterFooter')
    expect(field).toMatchObject({ type: 'checkbox', label: 'Hide cluster footer', defaultValue: false, admin: { position: 'sidebar' } })
  })
})

// The stand-in: finds by id, industry, hasOwnPage, _status and not_equals.
const get = (doc: Doc, path: string) => path.split('.').reduce((v, k) => (v == null ? v : v[k]), doc as any)
const matches = (doc: Doc, where: any): boolean => {
  if (!where) return true
  if (where.and) return where.and.every((w: any) => matches(doc, w))
  return Object.entries(where).every(([path, cond]: [string, any]) => {
    const v = get(doc, path)
    if ('equals' in cond) return v === cond.equals
    if ('not_equals' in cond) return String(v) !== String(cond.not_equals)
    if ('in' in cond) return cond.in.map(String).includes(String(v))
    return true
  })
}
const page = (id: string, extra: Doc) => ({ id, hasOwnPage: true, _status: 'published', ...extra })
const store = (): Record<string, Doc[]> => ({
  sectors: [
    page('edu', { path: '/higher-education' }),
    page('health', { path: '/healthcare' }),
    page('hidden', { path: '/hidden', hasOwnPage: false }),
  ],
  industryTopics: [
    page('fees', { industry: 'edu', path: '/higher-education/fees' }),
    page('leads', { industry: 'edu', path: '/higher-education/leads' }),
    page('draft', { industry: 'edu', path: '/higher-education/draft', _status: 'draft' }),
    page('beds', { industry: 'health', path: '/healthcare/beds' }),
    page('nopage', { industry: 'edu', path: '/higher-education/nopage', hasOwnPage: false }),
  ],
})
const fakeReq = () =>
  ({
    context: {},
    payload: {
      find: async ({ collection, where }: any) => {
        const docs = (store()[collection] ?? []).filter((d) => matches(d, where))
        return { docs, totalDocs: docs.length }
      },
      logger: { info: () => undefined, error: () => undefined },
    },
  }) as any

describe('refreshing the pages around a topic', () => {
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
  const run = async (hook: any, args: Doc) => {
    sent.length = 0
    await hook({ ...args, req: fakeReq() })
    return sent.flatMap((b) => b.paths).sort()
  }

  it('its industry and its published sibling topics with a page, not itself', async () => {
    expect((await topicFamilyPaths(fakeReq(), ['edu'], 'fees')).sort()).toEqual(['/higher-education', '/higher-education/leads'])
    expect(await topicFamilyPaths(fakeReq(), ['hidden'], null)).toEqual([])
  })

  it('on publish, and from the industry it moved away from too', async () => {
    const paths = await run(revalidateTopicFamily, {
      doc: { id: 'fees', slug: 'fees', _status: 'published', industry: 'health' },
      previousDoc: { id: 'fees', _status: 'published', industry: { id: 'edu' } },
    })
    expect(paths).toEqual(['/healthcare', '/healthcare/beds', '/higher-education', '/higher-education/leads'])
    expect(sent[0].collection).toBe('industryTopics')
  })

  it('on unpublish and delete; never for a draft that was never published', async () => {
    expect(await run(revalidateTopicFamily, { doc: { id: 'fees', _status: 'draft', industry: 'edu' }, previousDoc: { _status: 'published', industry: 'edu' } })).toEqual([
      '/higher-education',
      '/higher-education/leads',
    ])
    expect(await run(revalidateTopicFamilyAfterDelete, { doc: { id: 'fees', _status: 'published', industry: 'edu' } })).toEqual([
      '/higher-education',
      '/higher-education/leads',
    ])
    expect(await run(revalidateTopicFamily, { doc: { id: 'x', _status: 'draft', industry: 'edu' }, previousDoc: { _status: 'draft' } })).toEqual([])
  })

  it('is wired to the collection, after the factory hook that refreshes the topic itself', () => {
    expect(IndustryTopics.hooks?.afterChange).toContain(revalidateTopicFamily)
    expect(IndustryTopics.hooks?.afterDelete).toContain(revalidateTopicFamilyAfterDelete)
    expect((IndustryTopics.hooks?.afterChange ?? []).length).toBeGreaterThan(1)
  })
})
