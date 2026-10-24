import type { Field } from 'payload'
import { describe, expect, it } from 'vitest'

import { PAGE_LAYOUT_BLOCKS } from '@/blocks/pageLayoutBlocks'
import { buildHubs } from '@/collections/Hubs'
import { MicroApps } from '@/collections/MicroApps'
import { Pages } from '@/collections/Pages'
import { contentBlocks } from '@/content/sections/blocks'
import { HUB_PAGE_BLOCKS, NEVER_IN_LAYOUT, SITE_BLOCKS } from '@/content/sections/siteBlocks'

/**
 * A hub's layout offers every page block except the heroes and the plain
 * faq block; Pages keeps its own list; entry layouts keep the site blocks.
 */

const findField = (fields: Field[], name: string): any => {
  for (const f of fields) {
    if ('name' in f && f.name === name) return f
    if (f.type === 'tabs') for (const t of f.tabs) { const hit = findField(t.fields, name); if (hit) return hit }
  }
  return undefined
}
const pageSlugs = PAGE_LAYOUT_BLOCKS.map((b) => b.slug)
const hubRefs: string[] = findField(buildHubs().fields, 'layout').blockReferences

describe('hub layout blocks', () => {
  it('offers every page block except the heroes and the plain faq block', () => {
    const allowed = pageSlugs.filter((s) => !(NEVER_IN_LAYOUT as readonly string[]).includes(s))
    for (const slug of allowed) expect(hubRefs, slug).toContain(slug)
    for (const slug of NEVER_IN_LAYOUT) expect(hubRefs, slug).not.toContain(slug)
    expect(hubRefs).toEqual(expect.arrayContaining(['agenticCartsDemo', 'bentoGrid', 'productSuite2', 'useCases', 'howItWorks2']))
  })

  it('still offers the hub sections, and lists each block once', () => {
    expect(hubRefs).toEqual(expect.arrayContaining(['hubIntroSection', 'hubStepsSection', 'hubTrustSection']))
    expect(new Set(hubRefs).size).toBe(hubRefs.length)
  })

  it('registers every block it offers once at the top of the config', () => {
    const top = contentBlocks().map((b) => b.slug)
    expect(new Set(top).size).toBe(top.length)
    for (const slug of hubRefs) expect(top, slug).toContain(slug)
  })

  it('reuses the page definitions, with their Appearance options', () => {
    const bento = HUB_PAGE_BLOCKS.find((b) => b.slug === 'bentoGrid')!
    expect(JSON.stringify(bento.fields)).toMatch(/"name":"background"/)
    expect(HUB_PAGE_BLOCKS.some((b) => SITE_BLOCKS.some((s) => s.slug === b.slug))).toBe(false)
  })

  it('leaves Pages and entry layouts as they were', () => {
    expect(findField(Pages.fields, 'layout').blocks.map((b: { slug: string }) => b.slug)).toEqual(pageSlugs)
    expect(pageSlugs).toEqual(expect.arrayContaining(['conversationHero', 'faq', 'integrationsLanding']))
    const entryRefs: string[] = findField(MicroApps.fields, 'layout').blockReferences
    expect(entryRefs).not.toContain('agenticCartsDemo')
    expect(entryRefs).toEqual(expect.arrayContaining(SITE_BLOCKS.map((b) => b.slug)))
  })
})
