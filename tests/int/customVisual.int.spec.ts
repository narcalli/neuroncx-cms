import { describe, expect, it } from 'vitest'

import { CustomVisual, validateCardCount } from '@/blocks/CustomVisual/config'
import { anchorGuide, CUSTOM_VISUAL_LAYOUTS, spokeCount } from '@/blocks/CustomVisual/layouts'
import { heroCustomVisualFields } from '@/blocks/HeroCustom/config'
import { PAGE_LAYOUT_BLOCKS } from '@/blocks/pageLayoutBlocks'
import { productSuite2CardFields, ProductSuite2 } from '@/blocks/ProductSuite2/config'
import { HUB_PAGE_BLOCKS } from '@/content/sections/siteBlocks'

/** Custom Visual (HTML/CSS): a hub, up to four real cards and a sealed connector visual. */

const flat = (fields: any[]): any[] =>
  fields.flatMap((f) => (f.type === 'row' || f.type === 'collapsible' ? flat(f.fields) : [f]))
const names = (fields: any[]) => flat(fields).map((f) => f.name)
const field = (name: string) => flat(CustomVisual.fields as any[]).find((f) => f.name === name)
const opts = (siblingData: object) => ({ siblingData, data: {}, req: { t: (k: string) => k } }) as any

describe('the block', () => {
  it('is customVisual, labelled "Custom Visual (HTML/CSS)"', () => {
    expect(CustomVisual.slug).toBe('customVisual')
    expect(CustomVisual.labels?.singular).toBe('Custom Visual (HTML/CSS)')
  })

  it('has its fields in order, with the visual last', () => {
    expect(names(CustomVisual.fields as any[])).toEqual([
      'eyebrow',
      'heading',
      'intro',
      'layout',
      'hub',
      'cards',
      'visualHtml',
      'visualCss',
      'visualPreview',
      'visualAlt',
      'aspect',
      'maxWidth',
    ])
    expect([field('eyebrow').maxLength, field('heading').maxLength, field('intro').maxLength]).toEqual([60, 140, 300])
  })

  it('has no em dashes in any label, description or default', () => {
    expect(JSON.stringify(CustomVisual)).not.toContain('—')
    expect(anchorGuide()).not.toContain('—')
  })
})

describe('the layout', () => {
  it('offers the three hub layouts and none, hubSpoke3 by default', () => {
    expect(field('layout').options.map((o: any) => o.value)).toEqual(['hubSpoke2', 'hubSpoke3', 'hubSpoke4', 'none'])
    expect(field('layout').defaultValue).toBe('hubSpoke3')
  })

  it('states every anchor point from the one table', () => {
    const guide = field('layout').admin.description
    expect(guide).toBe(anchorGuide())
    for (const key of ['hubSpoke2', 'hubSpoke3', 'hubSpoke4'] as const) {
      const { hub, spokes } = CUSTOM_VISUAL_LAYOUTS[key]
      for (const [x, y] of [hub!, ...spokes]) expect(guide).toContain(`${x}%, ${y}%`)
    }
    expect(spokeCount('hubSpoke2')).toBe(2)
    expect(spokeCount('hubSpoke4')).toBe(4)
    expect(spokeCount('none')).toBeNull()
    expect(spokeCount(undefined)).toBe(3)
  })

  it('hides the hub when the layout is none', () => {
    const hub = field('hub')
    expect(names(hub.fields)).toEqual(['icon', 'label', 'caption'])
    expect(hub.admin.condition({}, { layout: 'none' })).toBe(false)
    expect(hub.admin.condition({}, { layout: 'hubSpoke2' })).toBe(true)
    expect(hub.admin.condition({}, {})).toBe(true)
  })
})

describe('the cards', () => {
  it("use Product Suite 2's card fields, so the two never drift", () => {
    const suiteCards = (ProductSuite2.fields as any[]).find((f) => f.name === 'cards')
    expect(names(field('cards').fields)).toEqual(names(suiteCards.fields))
    expect(names(field('cards').fields)).toEqual(names(productSuite2CardFields()))
    expect([field('cards').minRows, field('cards').maxRows]).toEqual([0, 4])
  })

  it('must match the spoke count unless the layout is none', () => {
    const rows = (n: number) => Array.from({ length: n }, () => ({ title: 'x' }))
    expect(validateCardCount(rows(3), opts({ layout: 'hubSpoke3' }))).toBe(true)
    expect(validateCardCount(rows(2), opts({}))).toMatch(/needs exactly 3 cards.*There are 2/)
    expect(validateCardCount(rows(1), opts({ layout: 'hubSpoke2' }))).toMatch(/needs exactly 2 cards.*There is 1/)
    expect(validateCardCount(rows(4), opts({ layout: 'hubSpoke4' }))).toBe(true)
    expect(validateCardCount(rows(0), opts({ layout: 'none' }))).toBe(true)
    expect(validateCardCount(rows(3), opts({ layout: 'none' }))).toBe(true)
    // In the admin the value may be the row count.
    expect(validateCardCount(2 as any, opts({ layout: 'hubSpoke2' }))).toBe(true)
  })

  it('still refuses more than four, through the standard array check', () => {
    expect(validateCardCount(Array.from({ length: 5 }, () => ({})), { ...opts({ layout: 'none' }), maxRows: 4 })).not.toBe(true)
  })
})

describe('the visual', () => {
  it("reuses the Hero (custom CSS) fields and their checks, changing only the HTML and CSS guidance", () => {
    const own = flat(heroCustomVisualFields)
    for (const f of flat(CustomVisual.fields as any[]).filter((f) => own.some((o) => o.name === f.name))) {
      const original = own.find((o) => o.name === f.name)
      if (f.name === 'visualHtml' || f.name === 'visualCss') {
        expect(f.validate).toBe(original.validate)
        expect(f.admin.description).toMatch(/^This renders in a sealed box: .*Card content goes in the Cards field, not here\.$/)
      } else {
        expect(f).toBe(original)
      }
    }
  })

  it('refuses unsafe HTML and CSS on save', () => {
    expect(field('visualHtml').validate('<p onclick="x()">a</p>')).not.toBe(true)
    expect(field('visualHtml').validate('<div class="hub"></div>')).toBe(true)
    expect(field('visualCss').validate('@import url(x.css);')).not.toBe(true)
  })
})

describe('where it can be used', () => {
  it('is on Pages, with the full Appearance set, and in hub layouts', () => {
    const onPages = PAGE_LAYOUT_BLOCKS.find((b) => b.slug === 'customVisual')!
    expect(names(onPages.fields as any[])).toEqual(
      expect.arrayContaining(['background', 'width', 'spacingTop', 'spacingBottom', 'align', 'hidden', 'htmlId']),
    )
    expect(HUB_PAGE_BLOCKS.some((b) => b.slug === 'customVisual')).toBe(true)
  })
})
