import type { Field } from 'payload'
import { describe, expect, it } from 'vitest'

import { IntegrationsMaster } from '@/collections/IntegrationsMaster'
import { contentBlocks } from '@/content/sections/blocks'
import { INTEGRATIONS_LANDING_SECTION_KEYS } from '@/content/sections/integrationsLanding'
import { LAYOUT_HERO_BLOCKS } from '@/content/sections/siteBlocks'

/**
 * The Integrations master's Page layout: the record's own parts and any page
 * block, one hero (the first row, with Hero design set to Hero block from the
 * layout), each part once and one closing panel.
 */

const findField = (fields: Field[], name: string): any => {
  for (const f of fields) {
    if ('name' in f && f.name === name) return f
    if (f.type === 'tabs') for (const t of f.tabs) { const hit = findField(t.fields, name); if (hit) return hit }
  }
  return undefined
}
const layout = findField(IntegrationsMaster.fields, 'layout')
const refs: string[] = layout.blockReferences
const validate = (rows: Record<string, unknown>[], heroDesign: 'fields' | 'blockHero' = 'fields') =>
  layout.validate(rows, { data: { heroDesign }, collectionSlug: 'integrationsMaster', req: {} })

describe('the Integrations master page layout', () => {
  it("offers the record's parts, the layout heroes and the blocks the hand-made /integrations page uses", () => {
    for (const key of INTEGRATIONS_LANDING_SECTION_KEYS) expect(refs).toContain(`${key}Section`)
    for (const slug of LAYOUT_HERO_BLOCKS) expect(refs).toContain(slug)
    expect(refs).toEqual(expect.arrayContaining(['integrations', 'integrationsMarquee', 'closingCta', 'howItWorks2', 'content']))
    expect(refs).not.toContain('integrationsLanding')
    expect(refs).not.toContain('faq')
    expect(new Set(refs).size).toBe(refs.length)
    // Every referenced block exists in the config's top-level blocks.
    const defined = new Set(contentBlocks().map((b) => b.slug))
    for (const key of INTEGRATIONS_LANDING_SECTION_KEYS) expect(defined.has(`${key}Section`), key).toBe(true)
  })

  it('accepts an empty layout and the hand-made page rebuilt with a hero block first', async () => {
    expect(await validate([])).toBe(true)
    expect(
      await validate(
        [
          { blockType: 'statHero', headline: 'Plugged into the systems you already run' },
          { blockType: 'integrationsMarquee' },
          { blockType: 'integrations', heading: 'Calls on the same record as chats' },
          { blockType: 'closingCta', heading: "Tell us what you're running" },
        ],
        'blockHero',
      ),
    ).toBe(true)
  })

  it('keeps the hero to the first row, and only with Hero block from the layout', async () => {
    expect(await validate([{ blockType: 'statHero' }])).toMatch(/hero fields/)
    expect(await validate([{ blockType: 'integrationsCategoriesSection' }], 'blockHero')).toMatch(/first row must be a hero block/)
    expect(await validate([{ blockType: 'statHero' }, { blockType: 'conversationHero' }], 'blockHero')).toMatch(/one hero/)
    // A hidden row is not drawn, so it does not count.
    expect(await validate([{ blockType: 'statHero', hidden: true }, { blockType: 'integrationsFaqSection' }])).toBe(true)
  })

  it('holds each part of the record once, and one closing panel', async () => {
    expect(await validate([{ blockType: 'integrationsFaqSection' }, { blockType: 'integrationsFaqSection' }])).toMatch(/once/)
    expect(await validate([{ blockType: 'integrationsClosingSection' }, { blockType: 'closingCta' }])).toMatch(/one closing panel/)
    expect(await validate([{ blockType: 'integrationsClosingSection' }, { blockType: 'closingCta', hidden: true }])).toBe(true)
  })
})
