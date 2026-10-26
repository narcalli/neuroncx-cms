import type { Field } from 'payload'
import { describe, expect, it } from 'vitest'

import { HeroCustom } from '@/blocks/HeroCustom/config'
import { cssProblems, htmlProblems } from '@/blocks/HeroCustom/visualRules'
import { PAGE_LAYOUT_BLOCKS } from '@/blocks/pageLayoutBlocks'
import { NEVER_IN_LAYOUT } from '@/content/sections/siteBlocks'

/** Hero (custom CSS): fixed hero parts, your own HTML and CSS for the visual. */

const tabs = (HeroCustom.fields[0] as any).tabs as { label: string; fields: Field[] }[]
const flatten = (fields: any[]): Record<string, any> =>
  Object.assign({}, ...fields.map((f) => (f.type === 'row' ? flatten(f.fields) : { [f.name]: f })))
const all = Object.assign({}, ...tabs.map((t) => flatten(t.fields)))

describe('the block', () => {
  it('is a page hero, offered in page layouts and never in a hub or entry layout', () => {
    expect(HeroCustom.slug).toBe('heroCustom')
    expect(HeroCustom.labels).toEqual({ singular: 'Hero (custom CSS)', plural: 'Heroes (custom CSS)' })
    expect(PAGE_LAYOUT_BLOCKS.map((b) => b.slug)).toContain('heroCustom')
    expect(NEVER_IN_LAYOUT).toContain('heroCustom')
  })

  it('has Content, Layout and Custom visual tabs', () => {
    expect(tabs.map((t) => t.label)).toEqual(['Content', 'Layout', 'Custom visual'])
    expect(Object.keys(flatten(tabs[0].fields))).toEqual(['eyebrow', 'headline', 'subhead', 'primaryCta', 'secondaryCta'])
    expect(all.headline).toMatchObject({ required: true, maxLength: 120 })
  })

  it('lays out with presets only', () => {
    const values = (n: string) => all[n].options.map((o: any) => o.value)
    expect(values('visualPosition')).toEqual(['right', 'left', 'below', 'background'])
    expect(all.visualPosition.defaultValue).toBe('right')
    expect(values('split')).toEqual(['50', '40'])
    expect(values('height')).toEqual(['natural', 'tall'])
    expect(values('phoneVisual')).toEqual(['below', 'hide'])
    expect(values('background')).toEqual(['cloud', 'white', 'navy'])
    expect(values('aspect')).toEqual(['auto', '16/9', '4/3', '1/1', '3/4'])
    // The width split only matters beside the text; the shape not as a background.
    expect(all.split.admin.condition({}, { visualPosition: 'below' })).toBe(false)
    expect(all.split.admin.condition({}, { visualPosition: 'left' })).toBe(true)
    expect(all.aspect.admin.condition({}, { visualPosition: 'background' })).toBe(false)
  })

  it('takes HTML and CSS in code boxes that anyone editing the page can change, with a live preview', () => {
    expect(all.visualHtml).toMatchObject({ type: 'code', admin: { language: 'html' } })
    expect(all.visualCss).toMatchObject({ type: 'code', admin: { language: 'css' } })
    expect(all.visualHtml.access).toBeUndefined()
    expect(all.visualCss.access).toBeUndefined()
    expect(all.visualPreview.admin.components.Field).toBe('@/blocks/HeroCustom/Preview#HeroCustomPreview')
  })
})

describe('what a visual may contain', () => {
  it('takes plain HTML and CSS, animations included', () => {
    expect(htmlProblems('<div class="hub"><span>Customer record</span><svg viewBox="0 0 10 10"><circle r="4"/></svg></div>')).toEqual([])
    expect(cssProblems('.hub{color:var(--ncx-crimson);animation:pulse 2s infinite}@keyframes pulse{50%{opacity:.5}}@container visual (max-width:480px){.hub{gap:8px}}')).toEqual([])
    expect(cssProblems('.a{background:url("data:image/svg+xml;utf8,<svg/>")} .b{background:url(/api/media/file/a.png)}')).toEqual([])
    expect(cssProblems('.a{background:url(https://bucket.s3.ap-south-1.amazonaws.com/a.png)}')).toEqual([])
  })

  it('refuses code that runs, and markup that could leave its box', () => {
    for (const html of [
      '<script>alert(1)</script>',
      '<img src=x onerror="alert(1)">',
      '<a href="javascript:alert(1)">x</a>',
      '<iframe src="https://example.com"></iframe>',
      '<style>.a{}</style>',
      '</template><p>out</p>',
      '<link rel="stylesheet" href="x.css">',
    ]) {
      expect(htmlProblems(html).length, html).toBeGreaterThan(0)
    }
  })

  it('refuses @import, HTML in the CSS, and files from other sites', () => {
    expect(cssProblems('@import url(https://fonts.example.com/a.css);')[0]).toMatch(/@import/)
    expect(cssProblems('.a{} </style><script>')[0]).toMatch(/CSS only/)
    expect(cssProblems('.a{background:url(https://cdn.example.com/a.png)}')[0]).toMatch(/media library/)
    expect(cssProblems('.a{width:expression(alert(1))}')[0]).toMatch(/Scripting/)
  })

  it('shows the problems when saving', () => {
    const validate = all.visualHtml.validate as (v: unknown) => true | string
    expect(validate('<p>ok</p>')).toBe(true)
    expect(validate('<script></script>')).toMatch(/Scripts/)
  })
})
