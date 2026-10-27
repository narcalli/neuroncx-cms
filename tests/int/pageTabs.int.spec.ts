import 'dotenv/config'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import { IndustryTopics } from '@/collections/IndustryTopics'
import { MicroApps } from '@/collections/MicroApps'
import { Sectors } from '@/collections/Sectors'
import { sectionPublishProblems } from '@/content/publishCheck'
import { getContentCollection } from '@/content/registry'
import { serializeEntry } from '@/rag/content'

/**
 * Industries and industry topics are edited like a Page: the Page tab
 * first, the field tabs only while a section that reads them is in the
 * layout, then Listing, SEO, WhatsApp and Knowledge base. The last group
 * uses the local database with a temporary industry (zz-pt-), deleted
 * afterwards.
 */

type Doc = Record<string, any>
const tabsOf = (config: { fields: any[] }) => (config.fields.find((f: any) => f.type === 'tabs') as any).tabs as any[]
const labels = (config: { fields: any[] }) => tabsOf(config).map((t) => t.label)
const tab = (config: { fields: any[] }, label: string) => tabsOf(config).find((t) => t.label === label)
const shownFor = (config: { fields: any[] }, data: Doc) =>
  tabsOf(config)
    .filter((t) => !t.admin?.condition || t.admin.condition(data, data, {}))
    .map((t) => t.label)
const flat = (fields: any[]): any[] => fields.flatMap((f) => (f.type === 'row' || f.type === 'collapsible' ? flat(f.fields) : [f]))
const section = (key: string) => ({ blockType: `${key}Section` })

describe('tab order', () => {
  it('industries: Page, the field tabs, then Listing, SEO, WhatsApp and Knowledge base', () => {
    expect(labels(Sectors)).toEqual([
      'Page',
      'Industry',
      'By team',
      'Record',
      'Comparison',
      'Platform sections (interim)',
      'FAQ',
      'Listing',
      'SEO',
      'WhatsApp',
      'Knowledge base',
    ])
  })

  it('industry topics: Page, Topic, Links and FAQ while read, then Listing, SEO, WhatsApp and Knowledge base', () => {
    expect(labels(IndustryTopics)).toEqual(['Page', 'Topic', 'Links', 'FAQ', 'Listing', 'SEO', 'WhatsApp', 'Knowledge base'])
  })

  it('a new industry, whose default layout reads no field tab, shows only the fixed tabs', () => {
    const data = { hasOwnPage: true, layout: getContentCollection('sectors')!.defaultLayout.filter((r) => typeof r === 'string').map((k) => section(k as string)) }
    expect(shownFor(Sectors, data)).toEqual(['Page', 'Listing', 'SEO', 'WhatsApp', 'Knowledge base'])
  })

  it('Listing holds the Card and Detail fields together', () => {
    const names = flat(tab(Sectors, 'Listing').fields).map((f: any) => f.name)
    expect(names).toEqual(expect.arrayContaining(['tagline', 'summary', 'icon', 'image', 'cardDesign', 'description', 'whoItsFor']))
  })

  it('a new entry starts on Hero block from the layout, with its own layout', () => {
    const fields = flat(tabsOf(Sectors).flatMap((t) => t.fields).concat(Sectors.fields))
    expect(fields.find((f: any) => f.name === 'heroDesign').defaultValue).toBe('blockHero')
    expect(fields.find((f: any) => f.name === 'usePageDefaults').defaultValue).toBe(false)
    // Own page starts on, so the Page tab is the one a new entry opens on.
    expect(fields.find((f: any) => f.name === 'hasOwnPage').defaultValue).toBe(true)
  })
})

describe('conditional tabs', () => {
  const cases: [any, string, string[]][] = [
    [Sectors, 'Industry', ['industryProblems', 'industryEpisode', 'industryRoles']],
    [Sectors, 'By team', ['industryAudiences']],
    [Sectors, 'Record', ['industryRecord']],
    [Sectors, 'Comparison', ['industryComparison']],
    [Sectors, 'Platform sections (interim)', ['industryCarts', 'industryEnquiry', 'industryAnswers', 'industryCampaigns', 'industryReporting', 'industryCallQuality', 'industryCampusSystems']],
    [Sectors, 'FAQ', ['faq']],
    [IndustryTopics, 'Topic', ['topicOverview', 'topicSteps', 'topicRecorded', 'topicComparison']],
    [IndustryTopics, 'Links', ['topicAgents', 'topicIntegrations']],
    [IndustryTopics, 'FAQ', ['faq']],
  ]

  it.each(cases)('%#: the tab appears with a section that reads it and hides when it is removed', (config, label, keys) => {
    const condition = tab(config, label).admin.condition
    for (const key of keys) {
      expect(condition({ layout: [{ blockType: 'bentoGrid' }, section(key)] }), `${label} with ${key}`).toBe(true)
      // A hidden row is still in the layout.
      expect(condition({ layout: [{ ...section(key), hidden: true }] })).toBe(true)
    }
    expect(condition({ layout: [{ blockType: 'bentoGrid' }] }), `${label} without`).toBe(false)
    expect(condition({})).toBe(false)
  })

  it('the plain FAQ block does not show the FAQ tab: its questions live in the block', () => {
    expect(tab(Sectors, 'FAQ').admin.condition({ layout: [{ blockType: 'faq' }] })).toBe(false)
  })
})

describe('the publish check', () => {
  it('requires the fields of sections in the layout only', async () => {
    const entry = getContentCollection('sectors')!
    const own = { usePageDefaults: false, faqs: [] }
    expect(await sectionPublishProblems(entry, { ...own, layout: [{ blockType: 'faq' }] })).toEqual([])
    expect((await sectionPublishProblems(entry, { ...own, layout: [section('faq')] })).map((p) => p.path)).toEqual(['faqs'])
  })
})

describe('agent pages', () => {
  it('keep the fixed tab order, the FAQ tab always shown, and follow the page defaults', () => {
    expect(labels(MicroApps)[0]).toBe('Card')
    expect(labels(MicroApps)).not.toContain('Listing')
    expect(tab(MicroApps, 'FAQ').admin?.condition).toBeUndefined()
    const fields = flat(tabsOf(MicroApps).flatMap((t) => t.fields).concat(MicroApps.fields))
    expect(fields.find((f: any) => f.name === 'usePageDefaults').defaultValue).toBe(true)
    expect(fields.find((f: any) => f.name === 'hasOwnPage').defaultValue).toBe(false)
    expect(fields.find((f: any) => f.name === 'heroDesign').defaultValue).toBe('conversation')
  })
})

describe('the knowledge base', () => {
  it("still sends a hidden tab's fields", async () => {
    const payload = { collections: { sectors: { config: { fields: Sectors.fields } } }, blocks: {}, find: async () => ({ docs: [] }) } as any
    const doc = {
      id: 'x',
      name: 'Higher education',
      slug: 'higher-education',
      summary: 'Admissions on one record.',
      hasOwnPage: true,
      layout: [{ blockType: 'audienceTabs' }],
      audiences: [{ label: 'Counsellors', title: 'ZZ counsellors work from qualified applicants', points: [{ text: 'ZZ scorecards for every call' }] }],
    }
    const out = JSON.stringify(await serializeEntry(payload, getContentCollection('sectors')!, doc))
    expect(out).toContain('ZZ counsellors work from qualified applicants')
    expect(out).toContain('ZZ scorecards for every call')
  })
})

describe('with the local database', () => {
  let payload: Payload
  let id: string | null = null
  const context = { disableRevalidate: true, skipRag: true }

  beforeAll(async () => {
    payload = await getPayload({ config })
    if (!/127\.0\.0\.1|localhost/.test(String(process.env.DATABASE_URL))) throw new Error('not the local database')
    for (const d of (await payload.find({ collection: 'sectors', draft: true, where: { slug: { like: 'zz-pt' } } })).docs) {
      await payload.delete({ collection: 'sectors', id: d.id, context })
    }
  }, 60000)

  afterAll(async () => {
    if (id) await payload.delete({ collection: 'sectors', id, context })
  })

  it('keeps a hidden tab’s data through saves, and does not check it until its section is back', async () => {
    const created = await payload.create({
      collection: 'sectors',
      context,
      data: {
        name: 'ZZ page tabs',
        slug: 'zz-pt-industry',
        status: 'live',
        summary: 'A temporary industry for the page tabs test.',
        hasOwnPage: false,
        usePageDefaults: false,
        layout: [{ blockType: 'bentoGrid', title: 'Free block', cards: [] }],
        // One problem where the tab asks for 2 to 4: fine while the tab is hidden.
        problems: [{ title: 'ZZ hidden problem' }],
        audiences: [{ label: 'Counsellors', title: 'ZZ hidden audience' }],
        _status: 'published',
      } as any,
    })
    id = String(created.id)

    const renamed = (await payload.update({ collection: 'sectors', id, context, data: { name: 'ZZ page tabs, renamed' } as any })) as Doc
    expect(renamed.problems.map((p: Doc) => p.title)).toEqual(['ZZ hidden problem'])
    expect(renamed.audiences.map((a: Doc) => a.title)).toEqual(['ZZ hidden audience'])

    // With the problems section in the layout, the Industry tab shows, and its rules apply.
    await expect(
      payload.update({ collection: 'sectors', id, context, data: { layout: [section('industryProblems')], _status: 'published' } as any }),
    ).rejects.toThrow(/Problems/)
    const after = (await payload.findByID({ collection: 'sectors', id, depth: 0 })) as Doc
    expect(after.problems.map((p: Doc) => p.title)).toEqual(['ZZ hidden problem'])
  })
})
