import type { Field } from 'payload'
import { describe, expect, it } from 'vitest'

import { ClusterLinks } from '@/blocks/ClusterLinks/config'
import { PAGE_LAYOUT_BLOCKS } from '@/blocks/pageLayoutBlocks'
import { Pages } from '@/collections/Pages'
import { HUB_PAGE_BLOCKS } from '@/content/sections/siteBlocks'

/** Cluster links block and the cluster footer switch on Pages. */

const flat = (fields: any[]): any[] => fields.flatMap((f) => (f.type === 'row' || f.type === 'collapsible' ? flat(f.fields) : [f]))
const named = (fields: Field[], name: string): any => flat(fields).find((f) => f.name === name)

describe('the block', () => {
  it('is clusterLinks, "Cluster links", in the Pages layout with the full Appearance set', () => {
    expect(ClusterLinks.slug).toBe('clusterLinks')
    expect((ClusterLinks.labels as { singular: string }).singular).toBe('Cluster links')
    const registered = PAGE_LAYOUT_BLOCKS.find((b) => b.slug === 'clusterLinks')!
    const appearance = registered.fields.at(-1) as any
    expect(appearance).toMatchObject({ type: 'collapsible', label: 'Appearance' })
    const names = JSON.stringify(appearance)
    for (const n of ['background', 'width', 'spacingTop', 'spacingBottom', 'align', 'hidden', 'htmlId']) expect(names, n).toContain(`"name":"${n}"`)
  })

  it('is kept out of hub layouts, which have no pages under them', () => {
    expect(HUB_PAGE_BLOCKS.some((b) => b.slug === 'clusterLinks')).toBe(false)
  })

  it('has eyebrow, heading, intro, extra pages and the card design, in order', () => {
    expect(ClusterLinks.fields.map((f: any) => f.name)).toEqual(['eyebrow', 'heading', 'intro', 'extraPages', 'cardDesign'])
    expect(named(ClusterLinks.fields, 'eyebrow')).toMatchObject({ type: 'text', maxLength: 60 })
    expect(named(ClusterLinks.fields, 'heading')).toMatchObject({ type: 'text', maxLength: 140 })
    expect(named(ClusterLinks.fields, 'intro')).toMatchObject({ type: 'textarea', maxLength: 300 })
    expect(named(ClusterLinks.fields, 'cardDesign')).toMatchObject({ type: 'group', label: 'Card design' })
    expect(named(named(ClusterLinks.fields, 'cardDesign').fields, 'design').defaultValue).toBe('feature')
  })

  it('takes extra pages, each a page with its own stage and stage order', () => {
    const extra = named(ClusterLinks.fields, 'extraPages')
    expect(extra.type).toBe('array')
    expect(flat(extra.fields).map((f) => f.name)).toEqual(['page', 'stage', 'stageOrder'])
    expect(named(extra.fields, 'page')).toMatchObject({ type: 'relationship', relationTo: 'pages', required: true })
    expect(named(extra.fields, 'stage')).toMatchObject({ type: 'text', maxLength: 30 })
    expect(named(extra.fields, 'stageOrder')).toMatchObject({ type: 'number' })
    // Not the page itself, nor a page already under it.
    expect(named(extra.fields, 'page').filterOptions({ id: 'p1' })).toEqual({
      and: [{ id: { not_equals: 'p1' } }, { parent: { not_equals: 'p1' } }],
    })
  })
})

describe('the cluster footer switch', () => {
  it('is a sidebar checkbox, off by default, shown only on pages with a parent', () => {
    const field = named(Pages.fields, 'hideClusterFooter')
    expect(field).toMatchObject({ type: 'checkbox', defaultValue: false, label: 'Hide cluster footer' })
    expect(field.admin.position).toBe('sidebar')
    expect(field.admin.condition({ parent: 'p1' })).toBe(true)
    expect(field.admin.condition({})).toBe(false)
  })
})
