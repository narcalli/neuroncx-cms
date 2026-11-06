import { describe, expect, it } from 'vitest'

import { validateLinkUrl } from '@/blocks/AudienceTabs/config'
import { ExpandingCardCta } from '@/blocks/ExpandingCardCta/config'
import { PAGE_LAYOUT_BLOCKS } from '@/blocks/pageLayoutBlocks'
import { NAVY_BY_DESIGN, validateHighlight } from '@/collections/Pages/hooks/validateHighlight'
import { contentBlocks } from '@/content/sections/blocks'
import { ALL_LAYOUT_BLOCK_SLUGS, HUB_LAYOUT_BLOCK_SLUGS } from '@/content/sections/siteBlocks'
import { doublesProblem, NAVY_BY_DESIGN_BLOCKS, navyProblem } from '@/fields/layout'

/** Expanding Card CTA: a closing block, a navy card that opens out to full bleed. */

type Doc = Record<string, any>
const flatten = (fields: any[]): Doc =>
  Object.assign(
    {},
    ...fields.map((f) => (f.type === 'row' || f.type === 'collapsible' ? flatten(f.fields) : f.name ? { [f.name]: f } : {})),
  )
const all: Doc = flatten(ExpandingCardCta.fields)

/** Every field with a name, nested ones included, with where it sits. */
const named = (fields: any[], at = ''): { path: string; field: Doc }[] =>
  fields.flatMap((f) => {
    if (f.type === 'row' || f.type === 'collapsible') return named(f.fields, at)
    const path = at ? `${at}.${f.name}` : f.name
    return [{ path, field: f }, ...(f.fields ? named(f.fields, path) : [])]
  })

const row = (blockType: string, extra: Doc = {}) => ({ blockType, ...extra })

describe('the block', () => {
  it('is the Expanding Card CTA, with its own interface', () => {
    expect(ExpandingCardCta.slug).toBe('expandingCardCta')
    expect(ExpandingCardCta.interfaceName).toBe('ExpandingCardCtaBlock')
    expect(ExpandingCardCta.labels).toEqual({ singular: 'Expanding Card CTA', plural: 'Expanding Card CTAs' })
  })

  it('has the heading lines, description, button, start shape and Motion, in that order', () => {
    expect(Object.keys(all)).toEqual(['headingLine1', 'headingLine2', 'description', 'ctaLabel', 'ctaUrl', 'startShape', 'motion'])
    // The button sits on one row.
    const buttonRow = ExpandingCardCta.fields.find((f: any) => f.type === 'row') as any
    expect(buttonRow.fields.map((f: Doc) => f.name)).toEqual(['ctaLabel', 'ctaUrl'])
  })

  it('caps each text field', () => {
    expect(all.headingLine1).toMatchObject({ type: 'text', required: true, maxLength: 48 })
    expect(all.headingLine2).toMatchObject({ type: 'text', maxLength: 48 })
    expect(all.headingLine2.required).toBeFalsy()
    expect(all.description).toMatchObject({ type: 'textarea', required: true, maxLength: 260 })
    expect(all.ctaLabel).toMatchObject({ type: 'text', required: true, maxLength: 28 })
    expect(all.ctaUrl).toMatchObject({ type: 'text', required: true })
  })

  it('checks the button address as every link field does', () => {
    expect(all.ctaUrl.validate).toBe(validateLinkUrl)
    // What Payload hands a validator: the field's own settings and a translator.
    const opts = { required: true, req: { t: (key: string) => key, payload: { config: {} } } } as never
    expect(validateLinkUrl('/contact', opts)).toBe(true)
    expect(validateLinkUrl('#pricing', opts)).toBe(true)
    expect(validateLinkUrl('https://neuroncx.in', opts)).toBe(true)
    expect(validateLinkUrl('neuroncx.in', opts)).toMatch(/^Start the address with/)
  })

  it('starts as a square by default, or a tall square or a wide card', () => {
    expect(all.startShape).toMatchObject({ type: 'select', required: true, defaultValue: 'square' })
    expect(all.startShape.options).toEqual([
      { label: 'Square', value: 'square' },
      { label: 'Tall square', value: 'portrait' },
      { label: 'Wide card', value: 'wide' },
    ])
    expect(all.startShape.admin.description).toBe('The shape of the closed card before it opens out. Ignored when motion is off.')
  })

  it('has the standard Motion panel', () => {
    const panel = ExpandingCardCta.fields.find((f: any) => f.type === 'collapsible' && f.label === 'Motion') as any
    expect(panel).toBeTruthy()
    expect(all.motion).toMatchObject({ type: 'select', defaultValue: 'follow' })
  })

  it('gives every field plain help, with no em dashes anywhere', () => {
    for (const { path, field } of named(ExpandingCardCta.fields)) {
      expect(field.admin?.description, path).toBeTruthy()
    }
    expect(all.headingLine1.admin.description).toBe(
      'First line of the heading. It is revealed on its own line, so break the sentence where it reads well.',
    )
    expect(all.headingLine2.admin.description).toBe('Second line. Leave empty for a one line heading.')
    expect(JSON.stringify(ExpandingCardCta, (_k, v) => (typeof v === 'function' ? undefined : v))).not.toContain('—')
  })
})

describe('where it is offered', () => {
  const wrapped = PAGE_LAYOUT_BLOCKS.find((b) => b.slug === 'expandingCardCta')!

  it('is a page block with the minimal Appearance set: hide and anchor ID only', () => {
    expect(wrapped).toBeTruthy()
    const appearance = wrapped.fields.find((f: any) => f.type === 'collapsible' && f.label === 'Appearance') as any
    expect(Object.keys(flatten(appearance.fields))).toEqual(['hidden', 'htmlId'])
    const names = named(wrapped.fields).map((f) => f.path)
    for (const name of ['background', 'width', 'spacingTop', 'spacingBottom', 'align']) expect(names).not.toContain(name)
  })

  it('reaches hub and entry layouts through the derived lists', () => {
    expect(HUB_LAYOUT_BLOCK_SLUGS).toContain('expandingCardCta')
    expect(ALL_LAYOUT_BLOCK_SLUGS).toContain('expandingCardCta')
    expect(contentBlocks().filter((b) => b.slug === 'expandingCardCta')).toHaveLength(1)
  })
})

describe('navy by design', () => {
  const highlight = (layout: Doc[]) => () => (validateHighlight as any)({ data: { layout } })

  it('counts on Pages beside the blocks set to Highlight (navy)', () => {
    expect(NAVY_BY_DESIGN).toEqual(['expandingCardCta'])
    expect(highlight([row('testimonial'), row('expandingCardCta')])).not.toThrow()
    expect(highlight([row('testimonial', { background: 'navy' }), row('expandingCardCta')])).toThrow(
      'Only one block per page can use Highlight (navy). This page has 2: #1 testimonial and #2 expandingCardCta (navy by design).',
    )
    // Without a block that is navy by design, the message is as before.
    expect(highlight([row('testimonial', { background: 'navy' }), row('benefits', { background: 'navy' })])).toThrow(
      'Only one block per page can use Highlight (navy). This page has 2: #1 testimonial and #2 benefits. Set all but one back to another background.',
    )
  })

  it('counts in hub and collection layouts, and is refused beside the closing panel the page shows', () => {
    const free = { allowed: ['industry episode', 'closing panel'], freeBlocks: true }
    expect(NAVY_BY_DESIGN_BLOCKS).toEqual(['closingCta', 'expandingCardCta'])
    expect(navyProblem([row('expandingCardCta')], free)).toBeNull()
    expect(navyProblem([row('testimonial', { background: 'navy' }), row('expandingCardCta')], free)).toMatch(
      /#2 Expanding Card CTA \(navy by design\)/,
    )
    expect(navyProblem([row('closingCta'), row('expandingCardCta')], free)).toMatch(/^Highlight \(navy\) marks the one part/)
    expect(navyProblem([row('expandingCardCta')], { ...free, showsClosing: true })).toBe(
      'This page shows the closing panel, and #1 Expanding Card CTA (navy by design) is a second one. Remove it, or turn off Show the closing panel on the Page tab.',
    )
    // Where page blocks keep their list, it is not counted, as with the closing CTA block.
    expect(navyProblem([row('expandingCardCta')])).toBeNull()
  })
})

describe('one closing panel', () => {
  it('is refused beside the closing panel section, as the closing CTA block is', () => {
    expect(doublesProblem([row('expandingCardCta'), row('closingSection')])).toMatch(
      /^The Expanding Card CTA block and the closing panel section both end the page/,
    )
    expect(doublesProblem([row('expandingCardCta'), row('closingSection', { hidden: true })])).toBeNull()
    expect(doublesProblem([row('expandingCardCta')])).toBeNull()
  })
})
