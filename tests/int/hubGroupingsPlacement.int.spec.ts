import type { Field } from 'payload'
import { describe, expect, it } from 'vitest'

import { buildHubs } from '@/collections/Hubs'
import { Lists } from '@/collections/Lists'
import '@/collections/MicroApps'
import { contentBlocks } from '@/content/sections/blocks'
import { placementProblem } from '@/fields/layout'

/**
 * The "Grouping sections" block places a hub's grouping sections in its
 * layout, and a grouping (Lists) has its own heading, intro and primary
 * keyword.
 */

const findField = (fields: Field[], name: string): any => {
  for (const f of fields) {
    if ('name' in f && f.name === name) return f
    if (f.type === 'tabs') for (const t of f.tabs) { const hit = findField(t.fields, name); if (hit) return hit }
  }
  return undefined
}

describe('the Grouping sections block', () => {
  const block = contentBlocks().find((b) => b.slug === 'hubGroupingsSection')

  it('is offered in the hub layout only, not in the default entry layout', () => {
    const hubs = buildHubs()
    expect(findField(hubs.fields, 'layout').blockReferences).toContain('hubGroupingsSection')
    expect(findField(hubs.fields, 'defaultLayout').blockReferences).not.toContain('hubGroupingsSection')
  })

  it('has no fields of its own: no heading, no appearance options', () => {
    expect(block?.labels).toEqual({ singular: 'Grouping sections', plural: 'Grouping sections' })
    expect(block?.fields).toEqual([])
  })

  it('may be in a layout once', () => {
    const one = [{ blockType: 'hubIntroSection' }, { blockType: 'hubGroupingsSection' }, { blockType: 'howItWorks2' }]
    expect(placementProblem(one)).toBeNull()
    expect(placementProblem([...one, { blockType: 'hubGroupingsSection' }])).toBe(
      'Grouping sections can be in the layout once. Remove the extra one.',
    )
    expect(placementProblem(null)).toBeNull()
  })
})

describe("a grouping's hub copy", () => {
  const field = (name: string) => findField(Lists.fields, name)

  it('has a heading (was painLine), up to 120, and no pain line', () => {
    expect(field('heading')).toMatchObject({ type: 'text', label: 'Heading (optional)', maxLength: 120 })
    expect(field('heading').required).toBeFalsy()
    expect(field('painLine')).toBeUndefined()
  })

  it('has an intro up to 200, as the hub section does', () => {
    expect(field('intro')).toMatchObject({ type: 'text', maxLength: 200 })
    const row = findField(buildHubs().fields, 'groupingSections').fields.find((f: any) => f.name === 'intro')
    expect(row.maxLength).toBe(200)
  })

  it('has an optional primary keyword up to 60', () => {
    expect(field('primaryKeyword')).toMatchObject({ type: 'text', maxLength: 60 })
    expect(field('primaryKeyword').required).toBeFalsy()
  })
})
