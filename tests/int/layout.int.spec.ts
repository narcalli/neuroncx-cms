import type { BlocksField, CollectionConfig, Field, Tab } from 'payload'
import { describe, expect, it } from 'vitest'

import { AgenticHero } from '../../src/blocks/AgenticHero/config'
import { ConversationHero } from '../../src/blocks/ConversationHero/config'
import { FAQ } from '../../src/blocks/FAQ/config'
import { HeroFullBackground } from '../../src/blocks/HeroFullBackground/config'
import { HeroRightPlacement } from '../../src/blocks/HeroRightPlacement/config'
import { HeroStack } from '../../src/blocks/HeroStack/config'
import { HeroWorkforceGrid } from '../../src/blocks/HeroWorkforceGrid/config'
import { StatHero } from '../../src/blocks/StatHero/config'
import { buildHubs } from '../../src/collections/Hubs'
import { MicroApps } from '../../src/collections/MicroApps'
import { getContentCollection } from '../../src/content/registry'
import { contentBlocks } from '../../src/content/sections/blocks'
import { fillHeading, getSection } from '../../src/content/sections/defineSection'
import { layoutField, layoutWarnings, navyProblem } from '../../src/fields/layout'

/**
 * Sections, the layout field and the section-based publish check, on the
 * real Bot swarm config. Nothing here touches the database.
 */

type Doc = Record<string, any>

const tabsOf = (config: CollectionConfig): Tab[] =>
  (config.fields.find((f) => f.type === 'tabs') as { tabs: Tab[] }).tabs

const layoutOf = (config: CollectionConfig): BlocksField =>
  tabsOf(config)
    .find((t) => t.label === 'Page')!
    .fields.find((f: Field) => 'name' in f && f.name === 'layout') as BlocksField

/** Runs the beforeChange hooks in order, as a save does. `hub` is what the hubs lookup finds. */
const save = async (data: Doc, originalDoc?: Doc, hub?: Doc): Promise<Doc> => {
  const queries: any[] = []
  const req = {
    context: {},
    payload: {
      find: async (args: any) => {
        queries.push(args)
        return { docs: hub ? [hub] : [] }
      },
    },
  } as any
  let out: Doc = structuredClone(data)
  for (const hook of MicroApps.hooks?.beforeChange ?? []) {
    out = (await hook({ data: out, originalDoc, operation: 'update', req, collection: MicroApps as any, context: {} } as any)) ?? out
  }
  return out
}

/** The fields a refused publish names, in order, or [] when it saves. */
const refused = async (data: Doc, hub?: Doc): Promise<string[]> => {
  try {
    await save(data, undefined, hub)
    return []
  } catch (err: any) {
    return (err?.data?.errors ?? []).map((e: { path: string }) => e.path)
  }
}

// Passes the Own page checks, so only section requirements remain.
const ownPage = {
  name: 'Payment services',
  slug: 'payment-services',
  summary: 'Sends the link.',
  heroHeading: 'Payment links that follow through',
  hasOwnPage: true,
  _status: 'published',
}

describe('navy', () => {
  it('lets the closing panel use navy', () => {
    expect(navyProblem([{ blockType: 'agentPanelSection' }, { blockType: 'closingSection', background: 'navy' }])).toBeNull()
  })

  it('refuses navy on any other section or page block, naming each', () => {
    expect(
      navyProblem([
        { blockType: 'agentPanelSection', background: 'navy' },
        { blockType: 'closingSection', background: 'navy' },
        { blockType: 'testimonial', background: 'navy' },
      ]),
    ).toBe(
      'Only the closing panel can use Highlight (navy). Set #1 Agent panel (five steps), #3 Testimonial back to another background.',
    )
  })

  it('is the layout field validation', async () => {
    const validate = layoutOf(MicroApps).validate!
    const options = { req: { t: (k: string) => k }, required: false } as any
    expect(await validate([{ blockType: 'faqSection', background: 'navy' }] as any, options)).toMatch(
      /Only the closing panel/,
    )
    expect(await validate([{ blockType: 'faqSection', background: 'white' }] as any, options)).toBe(true)
  })

  it('warns, without refusing, when the closing panel is not last', () => {
    expect(layoutWarnings(['closingSection', 'faqSection'])).toHaveLength(1)
    expect(layoutWarnings(['faqSection', 'closingSection'])).toEqual([])
    expect(layoutWarnings(['faqSection'])).toEqual([])
  })
})

describe('required fields follow the layout', () => {
  it('requires every field of the default layout while following the page defaults', async () => {
    expect(await refused(ownPage)).toEqual([
      'hears',
      'checks',
      'acts',
      'handsOver',
      'records',
      'teamControls',
      'result',
      'proof',
      'useCases',
      'faqs',
    ])
  })

  it("requires only the fields of the entry's own sections when it has its own layout", async () => {
    expect(
      await refused({ ...ownPage, usePageDefaults: false, layout: [{ blockType: 'faqSection' }, { blockType: 'testimonial' }] }),
    ).toEqual(['faqs'])
  })

  it('skips hidden rows', async () => {
    expect(
      await refused({
        ...ownPage,
        usePageDefaults: false,
        layout: [{ blockType: 'agentPanelSection', hidden: true }, { blockType: 'useCasesSection' }],
      }),
    ).toEqual(['useCases'])
  })

  it('publishes once the sections in the layout are filled', async () => {
    expect(
      await refused({
        ...ownPage,
        usePageDefaults: false,
        layout: [{ blockType: 'faqSection' }],
        faqs: [{ question: 'Q?', answer: 'A.' }],
      }),
    ).toEqual([])
  })

  it('requires nothing from sections while Own page is off, or for drafts', async () => {
    expect(await refused({ ...ownPage, hasOwnPage: false })).toEqual([])
    expect(await refused({ ...ownPage, _status: 'draft' })).toEqual([])
  })

  it('writes the default layout into the field while following the defaults, and leaves an own layout alone', async () => {
    const following = await save({ ...ownPage, _status: 'draft' })
    expect(following.layout.map((b: Doc) => b.blockType)).toEqual([
      'agentPanelSection',
      'agentChainSection',
      'agentTeamControlsSection',
      'agentResultSection',
      'useCasesSection',
      'integrationsSection',
      'faqSection',
      'relatedSection',
    ])
    const own = await save({ ...ownPage, _status: 'draft', usePageDefaults: false, layout: [{ blockType: 'faqSection' }] })
    expect(own.layout).toEqual([{ blockType: 'faqSection' }])
  })
})

describe('block picker', () => {
  const heroes = [StatHero, ConversationHero, HeroStack, HeroFullBackground, HeroRightPlacement, HeroWorkforceGrid, AgenticHero]

  it('never offers a hero block or the plain faq block', () => {
    const offered = layoutOf(MicroApps).blockReferences as string[]
    const defined = contentBlocks().map((b) => b.slug)
    for (const block of [...heroes, FAQ]) {
      expect(offered).not.toContain(block.slug)
      expect(defined).not.toContain(block.slug)
    }
  })

  it('offers the allowed sections and the shared page blocks, by reference', () => {
    const field = layoutOf(MicroApps)
    expect(field.blocks).toEqual([])
    expect(field.blockReferences).toEqual(
      expect.arrayContaining(['agentPanelSection', 'faqSection', 'closingSection', 'testimonial', 'statBand']),
    )
    const defined = new Set(contentBlocks().map((b) => b.slug))
    for (const slug of field.blockReferences as string[]) expect(defined).toContain(slug)
  })

  it('refuses a section that is not registered, or a default outside the allowed list', () => {
    expect(() => layoutField({ collection: 'x', sections: ['nope'], defaultLayout: [] })).toThrow(/no section/)
    expect(() => layoutField({ collection: 'x', sections: ['faq'], defaultLayout: ['benefits'] })).toThrow(
      /not an allowed section/,
    )
  })
})

describe('headings', () => {
  it('fills {name} and the grouping token', () => {
    expect(fillHeading(getSection('agentPanel')!.headingDefault, { name: 'Payment services' })).toBe(
      'What Payment services does, step by step',
    )
    expect(
      fillHeading(getContentCollection('microApps')!.headings.related, { family: 'Book and get paid' }),
    ).toBe('Other agents in Book and get paid')
  })

  it("shows a collection's own default heading in the admin", () => {
    const related = contentBlocks().find((b) => b.slug === 'relatedSection')!
    const heading = related.fields.find((f) => 'name' in f && f.name === 'heading') as Doc
    expect(heading.admin.description).toContain('"Other agents in {family}" for Bot swarm')
  })
})

describe('hub default layout', () => {
  const hub = {
    forCollection: 'microApps',
    _status: 'published',
    defaultLayout: [
      { id: 'a1', blockType: 'useCasesSection', heading: 'Where it works' },
      { id: 'a2', blockType: 'faqSection' },
      { id: 'a3', blockType: 'agentPanelSection', hidden: true },
    ],
  }

  it("follows the published hub's default layout instead of the code default", async () => {
    expect(await refused(ownPage, hub)).toEqual(['useCases', 'faqs'])
  })

  it('copies the hub rows, headings included and ids left for Payload to set', async () => {
    const out = await save({ ...ownPage, _status: 'draft' }, undefined, hub)
    expect(out.layout).toEqual([
      { blockType: 'useCasesSection', heading: 'Where it works' },
      { blockType: 'faqSection' },
      { blockType: 'agentPanelSection', hidden: true },
    ])
  })

  it('falls back to the code default when the hub has no default layout', async () => {
    expect(await refused(ownPage, { ...hub, defaultLayout: [] })).toContain('hears')
  })
})

describe('hubs collection', () => {
  const hubs = buildHubs()
  const tab = (label: string) => tabsOf(hubs).find((t) => t.label === label)!
  const field = (t: Tab, name: string) => t.fields.find((f: Field) => 'name' in f && f.name === name) as Doc

  it('lists the registered collections, one hub each', () => {
    const forCollection = hubs.fields.find((f) => 'name' in f && f.name === 'forCollection') as Doc
    expect(forCollection.options).toEqual([{ label: 'Bot swarm', value: 'microApps' }])
    expect(forCollection.unique).toBe(true)
  })

  it('has drafts on, published-only reads for visitors, and the tabs in order', async () => {
    expect(hubs.versions).toEqual({ drafts: { autosave: false } })
    expect(await hubs.access!.read!({ req: { user: null } } as any)).toEqual({ _status: { equals: 'published' } })
    expect(tabsOf(hubs).map((t) => t.label)).toEqual([
      'SEO',
      'Hero',
      'Grouping sections',
      'Hub layout',
      'Entry defaults',
      'FAQ',
      'Closing',
      'WhatsApp',
      'Knowledge base',
    ])
  })

  it("offers only the hub's collection sections in the default entry layout", async () => {
    const defaults = field(tab('Entry defaults'), 'defaultLayout')
    expect(await defaults.filterOptions({ data: { forCollection: 'microApps' } })).toEqual(
      getContentCollection('microApps')!.sections.map((k) => `${k}Section`),
    )
  })

  it('never offers a hero block or the plain faq block in the hub layout', () => {
    const refs = field(tab('Hub layout'), 'layout').blockReferences as string[]
    for (const block of [StatHero, ConversationHero, HeroStack, HeroFullBackground, HeroRightPlacement, HeroWorkforceGrid, AgenticHero, FAQ]) {
      expect(refs).not.toContain(block.slug)
    }
    expect(refs).toEqual(expect.arrayContaining(['hubIntroSection', 'hubStepsSection', 'hubTrustSection', 'testimonial']))
    expect(refs).not.toContain('agentPanelSection')
  })
})
