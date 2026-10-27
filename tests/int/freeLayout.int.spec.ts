import { describe, expect, it } from 'vitest'

import { PAGE_LAYOUT_BLOCKS } from '@/blocks/pageLayoutBlocks'
import { buildHubs } from '@/collections/Hubs'
import { IndustryTopics } from '@/collections/IndustryTopics'
import { MicroApps } from '@/collections/MicroApps'
import { Sectors } from '@/collections/Sectors'
import { defineContentCollection } from '@/content/defineContentCollection'
import { ownPageProblems } from '@/content/publishCheck'
import { getContentCollection } from '@/content/registry'
import { contentBlocks } from '@/content/sections/blocks'
import { sectionBlockSlug } from '@/content/sections/defineSection'
import { ALL_LAYOUT_BLOCK_SLUGS, HUB_LAYOUT_BLOCK_SLUGS, LAYOUT_HERO_BLOCKS, SITE_BLOCKS } from '@/content/sections/siteBlocks'
import { doublesProblem, heroProblem, navyProblem } from '@/fields/layout'
import { serializeEntry } from '@/rag/content'

/**
 * Industry and industry topic pages take every page block, as a Page does
 * (siteBlocks 'all'), under the rules that keep one hero, one FAQ, one
 * closing panel and one navy part. Agent pages and the bot swarm hub keep
 * their lists.
 */

type Doc = Record<string, any>
const flat = (fields: any[]): any[] =>
  fields.flatMap((f) => (f.type === 'row' || f.type === 'collapsible' ? flat(f.fields) : f.type === 'tabs' ? f.tabs.flatMap((t: any) => flat(t.fields)) : [f]))
const field = (config: { fields: any[] }, name: string) => flat(config.fields).find((f: any) => f.name === name)
const refs = (config: { fields: any[] }) => field(config, 'layout').blockReferences as string[]
const row = (blockType: string, extra: Doc = {}) => ({ blockType, ...extra })

// Two heroes draw an H1 but are not layout heroes, so no row could hold them.
const NOT_OFFERED = ['heroStack', 'integrationsLanding']

describe('the block picker', () => {
  it('offers every Pages block on industries and industry topics, with their own sections', () => {
    const pages = PAGE_LAYOUT_BLOCKS.map((b) => b.slug).filter((slug) => !NOT_OFFERED.includes(slug))
    for (const config of [Sectors, IndustryTopics]) {
      expect(refs(config)).toEqual(expect.arrayContaining(pages))
      for (const slug of NOT_OFFERED) expect(refs(config)).not.toContain(slug)
    }
    expect(refs(Sectors)).toEqual(expect.arrayContaining(['industryProblemsSection', 'industryEpisodeSection', 'sharedSection', 'faqSection']))
    expect(refs(IndustryTopics)).toEqual(expect.arrayContaining(['topicStepsSection', 'topicAgentsSection', 'closingSection']))
    // Every offered block is defined once, in the config's top-level blocks.
    const defined = new Set(contentBlocks().map((b) => b.slug))
    for (const slug of refs(Sectors)) expect(defined.has(slug), slug).toBe(true)
  })

  it('derives the list from the Pages blocks, so a new page block reaches Pages, hubs and these pages alike', () => {
    expect(getContentCollection('sectors')?.siteBlocks).toEqual(ALL_LAYOUT_BLOCK_SLUGS)
    expect(ALL_LAYOUT_BLOCK_SLUGS).toEqual(expect.arrayContaining(HUB_LAYOUT_BLOCK_SLUGS))
    const hubRefs = field(buildHubs(), 'layout').blockReferences as string[]
    expect(hubRefs).toEqual(expect.arrayContaining(HUB_LAYOUT_BLOCK_SLUGS))
  })

  it('leaves agent pages and the bot swarm hub as they were', () => {
    const agent = getContentCollection('microApps')!
    expect(refs(MicroApps)).toEqual([...agent.sections.map(sectionBlockSlug), ...SITE_BLOCKS.map((b) => b.slug)])
    expect(agent).toMatchObject({ freeLayout: false, heroDesigns: ['conversation', 'rightPlacement', 'stats', 'customCss'] })
    expect(field(MicroApps, 'heroDesign').options.map((o: Doc) => o.value)).not.toContain('blockHero')
    const hubRefs = field(buildHubs(), 'layout').blockReferences as string[]
    for (const slug of [...LAYOUT_HERO_BLOCKS, 'faq', 'heroStack', 'integrationsLanding']) expect(hubRefs).not.toContain(slug)
  })

  it('keeps a fixed list for a collection that names one, and refuses the block hero without every block', () => {
    const fixed = defineContentCollection({ slug: 'zzFixedBlocks', label: { singular: 'Z', plural: 'Zs' }, route: '/zz-fixed', groups: ['core', 'ownPage'], sections: ['faq'], siteBlocks: ['testimonial'] })
    expect(refs(fixed)).toEqual(['faqSection', 'testimonial'])
    expect(() =>
      defineContentCollection({ slug: 'zzNoHero', label: { singular: 'Z', plural: 'Zs' }, route: '/zz-no-hero', groups: ['core', 'ownPage'], heroDesigns: ['blockHero'] }),
    ).toThrow(/needs siteBlocks: 'all'/)
    expect(() =>
      defineContentCollection({ slug: 'zzBadBlocks', label: { singular: 'Z', plural: 'Zs' }, route: '/zz-bad', groups: ['core', 'ownPage'], siteBlocks: ['statHero2'] }),
    ).toThrow(/statHero2/)
  })
})

describe('the hero', () => {
  it('offers Hero block from the layout on industries and topics', () => {
    for (const config of [Sectors, IndustryTopics]) {
      expect(field(config, 'heroDesign').options).toContainEqual({ label: 'Hero block from the layout', value: 'blockHero' })
    }
  })

  it('hides the entry hero fields while it is chosen', () => {
    for (const name of ['heroEyebrow', 'heroHeading', 'heroSubheading', 'heroChips', 'heroSecondaryCta', 'heroChat', 'heroMedia', 'heroStats']) {
      const condition = field(Sectors, name).admin.condition
      expect(condition({ heroDesign: 'blockHero' }, {}, {}), name).toBe(false)
    }
    expect(field(Sectors, 'heroHeading').admin.condition({ heroDesign: 'conversation' }, {}, {})).toBe(true)
    expect(field(Sectors, 'heroStats').admin.condition({ heroDesign: 'stats' }, {}, {})).toBe(true)
    // The button feeds the closing panel too, so it stays.
    expect(field(Sectors, 'cta').admin?.condition).toBeUndefined()
  })

  it('needs no hero heading or hero design content to publish', () => {
    const designs = getContentCollection('sectors')!.heroDesigns
    expect(ownPageProblems({ heroDesign: 'blockHero', meta: { title: 'T', description: 'D' } }, designs)).toEqual([])
    expect(ownPageProblems({ heroDesign: 'conversation', meta: { title: 'T', description: 'D' } }, designs).map((p) => p.path)).toEqual(['heroChat', 'heroHeading'])
  })

  it('is the first row, and the only hero row', () => {
    const hero = row('statHero')
    expect(heroProblem([hero, row('industryProblemsSection'), row('bentoGrid')], { blockHero: true })).toBeNull()
    for (const slug of LAYOUT_HERO_BLOCKS) expect(heroProblem([row(slug)], { blockHero: true }), slug).toBeNull()
    expect(heroProblem([row('industryProblemsSection'), hero], { blockHero: true })).toMatch(/first row must be a hero block/)
    expect(heroProblem([row('industryProblemsSection')], { blockHero: true, usesDefaults: true })).toMatch(/^Hero design is Hero block from the layout.*Turn off Use page defaults/)
    expect(heroProblem([hero, row('bentoGrid'), row('agenticHero')], { blockHero: true })).toBe(
      'A page has one hero, its one H1, and the first row holds it. Remove #3 Agentic Hero.',
    )
    // A hidden row is never drawn.
    expect(heroProblem([row('conversationHero', { hidden: true }), hero], { blockHero: true })).toBeNull()
  })

  it('is refused in every row while another hero design draws the hero', () => {
    expect(heroProblem([row('heroCustom'), row('industryProblemsSection')])).toMatch(/^#1 Hero \(custom CSS\) is a hero block, but Hero design draws/)
    expect(heroProblem([row('industryProblemsSection'), row('bentoGrid')])).toBeNull()
  })
})

describe('one FAQ and one closing panel', () => {
  it('refuses the FAQ block beside the FAQ section, and the closing CTA beside the closing panel', () => {
    expect(doublesProblem([row('faq')])).toBeNull()
    expect(doublesProblem([row('faqSection')])).toBeNull()
    expect(doublesProblem([row('faqSection'), row('bentoGrid'), row('faq')])).toBe(
      'The FAQ block and the FAQ section both send FAQ data to search engines, so a page has one FAQ. Keep one: remove #3 FAQ, or #1 FAQ.',
    )
    expect(doublesProblem([row('closingCta'), row('closingSection')])).toMatch(/^The closing call to action block and the closing panel section both end the page/)
    expect(doublesProblem([row('closingCta'), row('closingSection', { hidden: true })])).toBeNull()
  })
})

describe('one navy part, across sections and blocks', () => {
  const free = { allowed: ['industry episode', 'closing panel'], freeBlocks: true }

  it('lets a page block use navy, as on a Page, once', () => {
    expect(navyProblem([row('bentoGrid', { background: 'navy' })], free)).toBeNull()
    expect(navyProblem([row('bentoGrid', { background: 'navy' }), row('industryEpisodeSection', { background: 'navy' })], free)).toMatch(
      /^Highlight \(navy\) marks the one part of the page most wanted read, so a page has one, across sections and blocks\. #1 Bento Grid and #2 Industry episode use it/,
    )
  })

  it('still keeps navy off sections that do not allow it', () => {
    expect(navyProblem([row('industryProblemsSection', { background: 'navy' })], free)).toBe(
      'Of the sections, only the industry episode or the closing panel can use Highlight (navy); any page block can. Set #1 Industry problems back to another background.',
    )
  })

  it('counts the closing CTA block as navy, and refuses it beside the closing panel the page shows', () => {
    expect(navyProblem([row('closingCta')], free)).toBeNull()
    expect(navyProblem([row('testimonial', { background: 'navy' }), row('closingCta')], free)).toMatch(/#2 Closing call to action \(navy by design\)/)
    expect(navyProblem([row('closingCta')], { ...free, showsClosing: true })).toBe(
      'This page shows the closing panel, and #1 Closing call to action (navy by design) is a second one. Remove it, or turn off Show the closing panel on the Page tab.',
    )
  })

  it('is unchanged where page blocks keep their list', () => {
    expect(navyProblem([row('testimonial', { background: 'navy' })])).toBe('Only the closing panel can use Highlight (navy). Set #1 Testimonial back to another background.')
    expect(navyProblem([row('closingCta')])).toBeNull()
  })
})

describe('row labels', () => {
  it('name the kind: sections as sections, page blocks as blocks', () => {
    const label = (slug: string) => contentBlocks().find((b) => b.slug === slug)!.admin!.components!.Label as any
    expect(label('industryCampaignsSection').clientProps).toMatchObject({ kind: 'section', label: 'Campaigns (interim)' })
    expect(label('bentoGrid').clientProps).toMatchObject({ kind: 'block', label: 'Bento Grid' })
    expect(label('statHero').clientProps).toMatchObject({ kind: 'block' })
  })
})

describe('the knowledge base', () => {
  it("keeps reading the entry's fields; free blocks stay on the page", async () => {
    const payload = { collections: { sectors: { config: { fields: Sectors.fields } } }, blocks: {}, find: async () => ({ docs: [] }) } as any
    const doc = {
      id: 'x',
      name: 'Higher education',
      slug: 'higher-education',
      summary: 'Admissions, from the first enquiry to enrolment, on one student record.',
      layout: [row('bentoGrid', { title: 'ZZ free block title', cards: [{ title: 'ZZ free card', description: 'Only on the page.' }] })],
    }
    const out = JSON.stringify(await serializeEntry(payload, getContentCollection('sectors')!, doc))
    expect(out).toContain('Admissions, from the first enquiry')
    expect(out).not.toContain('ZZ free')
  })
})
