import type { Field } from 'payload'
import { describe, expect, it } from 'vitest'

import { AudienceTabs, validateLinkUrl } from '@/blocks/AudienceTabs/config'
import { PAGE_LAYOUT_BLOCKS } from '@/blocks/pageLayoutBlocks'

/** Audience tabs: fields, limits, guidance and the link address rule. */

const named = (fields: Field[], name: string): any => fields.find((f) => 'name' in f && f.name === name)
const flat = (fields: any[]): any[] => fields.flatMap((f) => (f.type === 'row' ? flat(f.fields) : [f]))
// What Payload hands a validator: the field's own settings and a translator.
const t = (key: string, o?: { maxLength?: number }) => `${key} ${o?.maxLength ?? ''}`.trim()
const opts = { required: true, req: { t, payload: { config: {} } } } as never

describe('the block', () => {
  it('is audienceTabs, "Audience tabs", in the Pages layout with the full Appearance set', () => {
    expect(AudienceTabs.slug).toBe('audienceTabs')
    expect(AudienceTabs.labels).toEqual({ singular: 'Audience tabs', plural: 'Audience tabs' })
    const registered = PAGE_LAYOUT_BLOCKS.find((b) => b.slug === 'audienceTabs')!
    const appearance = registered.fields.at(-1) as any
    expect(appearance).toMatchObject({ type: 'collapsible', label: 'Appearance' })
    const names = JSON.stringify(appearance)
    for (const n of ['background', 'width', 'spacingTop', 'spacingBottom', 'align', 'hidden', 'htmlId']) expect(names, n).toContain(`"name":"${n}"`)
  })

  it('has its fields in order, with their limits', () => {
    expect(AudienceTabs.fields.map((f: any) => f.name)).toEqual(['eyebrow', 'heading', 'intro', 'tabs'])
    expect(named(AudienceTabs.fields, 'eyebrow')).toMatchObject({ type: 'text', maxLength: 60 })
    expect(named(AudienceTabs.fields, 'heading')).toMatchObject({ type: 'text', maxLength: 140, required: true })
    expect(named(AudienceTabs.fields, 'intro')).toMatchObject({ type: 'textarea', maxLength: 300 })
  })

  it('takes 2 to 4 tabs, each a name, title, intro, points and links', () => {
    const tabs = named(AudienceTabs.fields, 'tabs')
    expect(tabs).toMatchObject({ type: 'array', minRows: 2, maxRows: 4, required: true })
    expect(tabs.fields.map((f: any) => f.name)).toEqual(['label', 'title', 'intro', 'points', 'links'])
    expect(named(tabs.fields, 'label')).toMatchObject({ type: 'text', maxLength: 30, required: true })
    expect(named(tabs.fields, 'title')).toMatchObject({ type: 'text', maxLength: 70 })
    expect(named(tabs.fields, 'intro')).toMatchObject({ type: 'textarea', maxLength: 240 })
  })

  it('takes 2 to 5 points of up to 160, with the editor guidance', () => {
    const points = named(named(AudienceTabs.fields, 'tabs').fields, 'points')
    expect(points).toMatchObject({ type: 'array', minRows: 2, maxRows: 5, required: true })
    expect(points.admin.description).toBe(
      'One capability per line, stated as what the platform does. No stories or invented figures.',
    )
    expect(points.fields[0]).toMatchObject({ type: 'text', maxLength: 160 })
  })

  it('takes up to 3 links, each a label up to 40 and a checked address', () => {
    const links = named(named(AudienceTabs.fields, 'tabs').fields, 'links')
    expect(links).toMatchObject({ type: 'array', maxRows: 3 })
    expect(links.minRows).toBeUndefined()
    const inner = flat(links.fields)
    expect(inner.map((f) => f.name)).toEqual(['label', 'url'])
    expect(inner[0]).toMatchObject({ type: 'text', maxLength: 40, required: true })
    expect(inner[1]).toMatchObject({ type: 'text', required: true, validate: validateLinkUrl })
  })
})

describe('the link address rule', () => {
  it('accepts a page, a section on the page or a secure address', () => {
    for (const url of ['/pricing', '/', '#how-it-works', 'https://example.com/guide']) expect(validateLinkUrl(url, opts), url).toBe(true)
  })

  it('refuses anything else, saying how to start it', () => {
    const message =
      'Start the address with "/" for a page on this site, "#" for a section on this page, or "https://" for another site.'
    for (const url of ['http://example.com', 'pricing', 'www.example.com', 'mailto:hello@example.com', 'javascript:alert(1)']) {
      expect(validateLinkUrl(url, opts), url).toBe(message)
    }
  })

  it('still applies the standard required check', () => {
    expect(validateLinkUrl(undefined, opts)).toBe('validation:required')
    expect(validateLinkUrl('   ', opts)).toBe('Add a link address.')
  })
})
