import { describe, expect, it } from 'vitest'
import type { Field } from 'payload'

import { buildHubs } from '@/collections/Hubs'
import { Integrations } from '@/collections/Integrations'
import { IntegrationsMaster } from '@/collections/IntegrationsMaster'
import { Pages } from '@/collections/Pages'
import { Posts } from '@/collections/Posts'
import { IndustryTopics } from '@/collections/IndustryTopics'
import { MicroApps } from '@/collections/MicroApps'
import { Sectors } from '@/collections/Sectors'
import { searchWarnings } from '@/fields/searchCheck'

/**
 * "Hide from search engines" (meta.noIndex) in every SEO tab, and the Search
 * check warnings.
 */

// Every data field's path, through tabs, groups, rows and collapsibles.
const paths = (fields: Field[], prefix = ''): string[] =>
  fields.flatMap((f: any) => {
    if (f.type === 'tabs') return f.tabs.flatMap((t: any) => paths(t.fields, t.name ? `${prefix}${t.name}.` : prefix))
    if (f.type === 'group') return paths(f.fields, f.name ? `${prefix}${f.name}.` : prefix)
    if (f.type === 'row' || f.type === 'collapsible') return paths(f.fields, prefix)
    return f.name ? [`${prefix}${f.name}`] : []
  })

const sidebar = (fields: Field[]) =>
  fields.filter((f: any) => f.admin?.position === 'sidebar').map((f: any) => f.name)

describe('hide from search engines', () => {
  it.each([Pages, Posts, Sectors, IndustryTopics, MicroApps, buildHubs(), Integrations, IntegrationsMaster])(
    '$slug has meta.noIndex, off by default',
    (collection) => {
      expect(paths(collection.fields)).toContain('meta.noIndex')
    },
  )

  it('is a checkbox labelled for editors', () => {
    const tab = (Pages.fields.find((f: any) => f.type === 'tabs') as any).tabs.find((t: any) => t.name === 'meta')
    const field = tab.fields.find((f: any) => f.name === 'noIndex')
    expect(field).toMatchObject({ type: 'checkbox', defaultValue: false, label: 'Hide from search engines (noindex)' })
  })
})

describe('Search check', () => {
  it('is in the sidebar of pages, posts and entries with a page of their own', () => {
    for (const collection of [Pages, Posts, Sectors, IndustryTopics, MicroApps]) {
      expect(sidebar(collection.fields)).toContain('searchCheck')
    }
  })

  it('warns about a missing description and title, and a hidden page', () => {
    expect(searchWarnings({ title: 'Fees', description: 'Fees, collected on time.' })).toEqual([])
    expect(searchWarnings({ title: ' ', description: '', noIndex: true })).toEqual([
      'Hidden from search engines: not listed in the sitemap.',
      "No meta description: search engines show the site's default one.",
      'SEO title is empty: the page title is used.',
    ])
  })

  it('checks only what it is asked to', () => {
    expect(searchWarnings({}, { description: true })).toEqual([
      "No meta description: search engines show the site's default one.",
    ])
    expect(searchWarnings({ noIndex: true }, {})).toEqual(['Hidden from search engines: not listed in the sitemap.'])
  })
})
