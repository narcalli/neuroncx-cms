import { describe, expect, it } from 'vitest'

import { Sectors } from '@/collections/Sectors'
import { INDUSTRY_SECTION_KEYS } from '@/collections/Sectors/sections'
import { contentBlocks } from '@/content/sections/blocks'
import { getSection } from '@/content/sections/defineSection'
import { getContentCollection } from '@/content/registry'
import { navyProblem, resolveDefaultLayout } from '@/fields/layout'
import { plainText } from '@/fields/validators/plainText'

/** The industry page sections, and Highlight (navy) on an industry page. */

const flat = (fields: any[]): any[] => fields.flatMap((f) => (f.type === 'row' || f.type === 'collapsible' ? flat(f.fields) : [f]))
const block = (key: string) => contentBlocks().find((b) => b.slug === `${key}Section`)!

describe('the sections', () => {
  it('are the industry sections, then the FAQ and the closing panel', () => {
    expect(INDUSTRY_SECTION_KEYS).toEqual([
      'industryProblems', 'industryAudiences', 'industryEpisode', 'industryRoles', 'industryRecord', 'industryComparison',
      'industryCarts', 'industryEnquiry', 'industryAnswers', 'industryCampaigns', 'industryReporting', 'industryCallQuality', 'industryCampusSystems',
      'industryAgents', 'industryIntegrations', 'industryCustomers', 'industryTopics', 'shared', 'faq', 'closing',
    ])
    expect(getContentCollection('sectors')).toMatchObject({ sections: INDUSTRY_SECTION_KEYS })
  })

  it('start a new industry with blocks and the pulled sections, placing the hosting and implementation shared content', () => {
    expect(getContentCollection('sectors')?.defaultLayout).toEqual([
      { block: 'heroCustom' },
      'industryAgents',
      'industryIntegrations',
      { key: 'shared', sharedContent: 'hosting' },
      { key: 'shared', sharedContent: 'implementation' },
      'industryTopics',
      'industryCustomers',
      { block: 'faq' },
      { block: 'closingCta' },
    ])
  })

  it('each take the heading override, an eyebrow, an intro, and of the Appearance only background and anchor ID', () => {
    for (const key of INDUSTRY_SECTION_KEYS.filter((k) => k !== 'faq' && k !== 'closing')) {
      const fields = flat(block(key).fields)
      // Industry topics adds extra pages, Shared content its item.
      const own = key === 'industryTopics' ? ['extraPages'] : key === 'shared' ? ['item'] : []
      expect(fields.map((f: any) => f.name), key).toEqual(['heading', 'eyebrow', 'intro', ...own, 'background', 'htmlId'])
      expect(fields[1]).toMatchObject({ type: 'text', maxLength: 60, validate: plainText })
      expect(fields[2]).toMatchObject({ type: 'textarea', maxLength: 300, validate: plainText })
    }
  })

  it('read the entry fields named in the brief', () => {
    expect(getSection('industryProblems')?.reads).toEqual(['problems'])
    expect(getSection('industryAudiences')?.reads).toEqual(['audiences'])
    expect(getSection('industryEpisode')?.reads).toEqual(['episodeName', 'episodePoints', 'keyDates', 'stats'])
    expect(getSection('industryRecord')?.reads).toEqual(['recordLabel', 'fieldColumnLabel', 'sourceColumnLabel', 'entities'])
    expect(getSection('industryComparison')?.reads).toEqual(['columns', 'rows', 'footnote'])
    expect(getSection('industryCampusSystems')?.reads).toEqual(['campusSystems'])
  })

  it('let only the episode and the closing panel use navy', () => {
    expect(INDUSTRY_SECTION_KEYS.filter((k) => getSection(k)?.navyAllowed)).toEqual(['industryEpisode', 'closing'])
  })
})

describe('the default layout', () => {
  const req = (records: { id: string; key: string }[]) =>
    ({ payload: { find: async ({ where }: any) => ({ docs: records.filter((r) => where.key.in.includes(r.key)) }) } }) as any

  it('places the shared content record with each key, and leaves a row out while no record has its key', async () => {
    const rows = await resolveDefaultLayout(
      ['industryProblems', { key: 'shared', sharedContent: 'hosting' }, { key: 'shared', sharedContent: 'implementation' }, 'faq'],
      req([{ id: 'sc1', key: 'hosting' }]),
    )
    expect(rows).toEqual([{ blockType: 'industryProblemsSection' }, { blockType: 'sharedSection', item: 'sc1' }, { blockType: 'faqSection' }])
  })

  it('is what a new industry starts with', async () => {
    const field = flat((Sectors.fields.find((f: any) => f.type === 'tabs') as any).tabs.flatMap((t: any) => t.fields)).find((f: any) => f.name === 'layout')
    const rows = await field.defaultValue({ req: req([{ id: 'h', key: 'hosting' }, { id: 'i', key: 'implementation' }]) })
    expect(rows.filter((r: any) => r.blockType === 'sharedSection').map((r: any) => r.item)).toEqual(['h', 'i'])
    expect(rows[0]).toEqual({ blockType: 'heroCustom' })
    expect(rows.at(-1)).toEqual({ blockType: 'closingCta' })
  })
})

describe('Highlight (navy) on an industry page', () => {
  const allowed = ['industry episode']
  const row = (blockType: string, background = 'default') => ({ blockType, background })

  it('allows the episode alone', () => {
    expect(navyProblem([row('industryProblemsSection'), row('industryEpisodeSection', 'navy')], { allowed })).toBeNull()
  })

  it('refuses navy on any other section, naming the one that may use it', () => {
    expect(navyProblem([row('industryProblemsSection', 'navy')], { allowed })).toBe(
      'Only the industry episode can use Highlight (navy). Set #1 Industry problems back to another background.',
    )
  })

  it('refuses the episode in navy while the page shows the closing panel, saying why', () => {
    expect(navyProblem([row('industryEpisodeSection', 'navy')], { allowed, showsClosing: true })).toBe(
      'This page shows the closing panel, which is navy, and a page has one navy section. Set #1 Industry episode back to another background, or turn off Show the closing panel on the Page tab.',
    )
  })

  it('refuses two navy sections, even both allowed', () => {
    expect(navyProblem([row('industryEpisodeSection', 'navy'), row('closingSection', 'navy')], { allowed: ['industry episode', 'closing panel'] })).toBe(
      'Highlight (navy) marks the one section the page most wants read, so a page has one. #1 Industry episode and #2 Closing panel both use it: keep it on one and set the other back to another background.',
    )
  })

  it('keeps the closing panel message elsewhere', () => {
    expect(navyProblem([row('testimonial', 'navy')])).toBe('Only the closing panel can use Highlight (navy). Set #1 Testimonial back to another background.')
  })
})
