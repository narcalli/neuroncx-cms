import type { ArrayField, Block, Field } from 'payload'
import { describe, expect, it } from 'vitest'

import { HowItWorks2 } from '@/blocks/HowItWorks2/config'
import { buildHubs } from '@/collections/Hubs'
import { Pages } from '@/collections/Pages'
import '@/collections/MicroApps'
import { SITE_BLOCKS } from '@/content/sections/siteBlocks'

/** How it works 2: its fields and limits, no button, and where it is allowed. */

const named = (fields: Field[], name: string) => fields.find((f) => 'name' in f && f.name === name) as any
const findField = (fields: Field[], name: string): Field | undefined => {
  for (const f of fields) {
    if ('name' in f && f.name === name) return f
    if (f.type === 'tabs') for (const t of f.tabs) { const hit = findField(t.fields, name); if (hit) return hit }
  }
  return undefined
}

describe('How it works 2', () => {
  it('has an optional eyebrow, a required heading, an optional intro and 2 to 5 steps, with their limits', () => {
    expect(HowItWorks2.slug).toBe('howItWorks2')
    expect(HowItWorks2.labels?.singular).toBe('How it works 2')
    expect(named(HowItWorks2.fields, 'eyebrow')).toMatchObject({ type: 'text', maxLength: 40 })
    expect(named(HowItWorks2.fields, 'eyebrow').required).toBeFalsy()
    expect(named(HowItWorks2.fields, 'heading')).toMatchObject({ type: 'text', maxLength: 70, required: true })
    expect(named(HowItWorks2.fields, 'intro')).toMatchObject({ type: 'textarea', maxLength: 200 })
    const steps = named(HowItWorks2.fields, 'steps') as ArrayField
    expect(steps).toMatchObject({ minRows: 2, maxRows: 5 })
    expect(named(steps.fields, 'title')).toMatchObject({ type: 'text', maxLength: 30, required: true })
    expect(named(steps.fields, 'description')).toMatchObject({ type: 'textarea', maxLength: 140, required: true })
    expect(String(steps.admin?.description)).toMatch(/01, 02/)
  })

  it('has no button fields', () => {
    expect(JSON.stringify(HowItWorks2.fields)).not.toMatch(/cta|button|link/i)
  })

  it('is offered on Pages, in content layouts and in the hub layout, with the Appearance options', () => {
    const pageBlocks = (findField(Pages.fields, 'layout') as any).blocks as Block[]
    const onPages = pageBlocks.find((b) => b.slug === 'howItWorks2')!
    expect(onPages).toBeTruthy()
    expect(JSON.stringify(onPages.fields)).toMatch(/"name":"background"/)
    expect(SITE_BLOCKS.map((b) => b.slug)).toContain('howItWorks2')
    const hubLayout = findField(buildHubs().fields, 'layout') as any
    expect(hubLayout.blockReferences ?? hubLayout.blocks?.map((b: Block) => b.slug)).toContain('howItWorks2')
  })

  it('leaves the original How it works block as it was', () => {
    const pageBlocks = (findField(Pages.fields, 'layout') as any).blocks as Block[]
    const original = pageBlocks.find((b) => b.slug === 'howItWorks')!
    expect(JSON.stringify(original.fields)).toMatch(/ctaLabel/)
  })
})
