import { describe, expect, it } from 'vitest'

import { CustomVisual } from '@/blocks/CustomVisual/config'
import { heroCustomVisualFields } from '@/blocks/HeroCustom/config'
import { PAGE_LAYOUT_BLOCKS } from '@/blocks/pageLayoutBlocks'
import { HUB_PAGE_BLOCKS } from '@/content/sections/siteBlocks'

/** Custom Visual (HTML/CSS): an optional heading over a visual drawn only by the editor's HTML and CSS. */

const flat = (fields: any[]): any[] =>
  fields.flatMap((f) => (f.type === 'row' || f.type === 'collapsible' ? flat(f.fields) : [f]))
const names = (fields: any[]) => flat(fields).map((f) => f.name)
const field = (name: string) => flat(CustomVisual.fields as any[]).find((f) => f.name === name)

describe('the block', () => {
  it('is customVisual, labelled "Custom Visual (HTML/CSS)"', () => {
    expect(CustomVisual.slug).toBe('customVisual')
    expect(CustomVisual.labels?.singular).toBe('Custom Visual (HTML/CSS)')
  })

  it('has only the heading fields and the visual: no layout, hub or cards', () => {
    expect(names(CustomVisual.fields as any[])).toEqual([
      'eyebrow',
      'heading',
      'intro',
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
  })
})

describe('the visual', () => {
  it('is the Hero (custom CSS) visual fields, unchanged', () => {
    const own = flat(heroCustomVisualFields)
    for (const f of flat(CustomVisual.fields as any[]).filter((f) => own.some((o) => o.name === f.name))) {
      expect(f).toBe(own.find((o) => o.name === f.name))
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
