import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig, type CollectionConfig, type Field, type SanitizedConfig } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { publicLiveOrPilot } from '@/access/publicLiveOrPilot'
import {
  cardTab,
  coreFields,
  detailTab,
  faqTab,
  kbaseTab,
  ownPage,
  seoTab,
  statusField,
  whatsappTab,
} from '@/fields/shared'

// A collection that uses every shared group, built into a throwaway config so
// Payload checks it the way it checks the real one. Nothing is registered in
// the app and no database is opened.
const page = ownPage('sharedGroupsTest' as any)
const testCollection: CollectionConfig = {
  slug: 'sharedGroupsTest',
  access: { read: publicLiveOrPilot },
  admin: { useAsTitle: 'name' },
  versions: { drafts: true },
  fields: [
    ...coreFields(),
    statusField(),
    page.sidebar,
    {
      type: 'tabs',
      tabs: [cardTab(), detailTab(), page.tab, faqTab(), whatsappTab(), kbaseTab(), seoTab()],
    },
  ],
}

let config: SanitizedConfig
let fields: Record<string, any>

// Every named field, by dotted path (unnamed rows and tabs are see-through).
const collect = (list: Field[], prefix = '', out: Record<string, any> = {}) => {
  for (const f of list as any[]) {
    if (f.type === 'tabs') {
      for (const tab of f.tabs)
        collect(tab.fields, tab.name ? `${prefix}${tab.name}.` : prefix, out)
    } else if (f.type === 'row' || f.type === 'collapsible') {
      collect(f.fields, prefix, out)
    } else if (f.name) {
      out[`${prefix}${f.name}`] = f
      if (f.fields) collect(f.fields, `${prefix}${f.name}.`, out)
    }
  }
  return out
}

const t = (key: string) => key
const opts = (field: any, extra: Record<string, unknown> = {}) =>
  ({ ...field, req: { payload: { config: {} }, t }, ...extra }) as any

beforeAll(async () => {
  config = await buildConfig({
    secret: 'test',
    db: mongooseAdapter({ url: 'mongodb://127.0.0.1:27017/shared-groups-test-unused' }),
    editor: lexicalEditor(),
    collections: [
      { slug: 'media', upload: true, fields: [] },
      { slug: 'pages', fields: [{ name: 'title', type: 'text' }] },
      { slug: 'posts', fields: [{ name: 'title', type: 'text' }] },
      testCollection,
    ],
  })
  fields = collect(
    config.collections.find((c) => (c.slug as string) === 'sharedGroupsTest')!.fields,
  )
})

describe('shared field groups', () => {
  it('builds into a valid Payload collection', () => {
    expect(fields.name).toBeDefined()
  })

  it('uses the field names and hard caps from fields_reference.md', () => {
    const caps: Record<string, number | undefined> = {
      name: undefined,
      slug: undefined,
      tagline: 60,
      summary: 140,
      whoItsFor: 300,
      'meta.title': 60,
      'meta.description': 155,
      heroHeading: 70,
      heroSubheading: 200,
      'benefits.title': 50,
      'benefits.line': 140,
      'howItWorks.title': 50,
      'useCases.line': 140,
      'cta.label': 30,
      'faqs.question': 120,
      'faqs.answer': 600,
      waRowTitle: 24,
      // WhatsApp allows 72; the NCX dashboard's list description allows 70.
      waRowDescription: 70,
      waHeader: 60,
      waBody: 1024,
      'waKeyPoints.line': 60,
      waFooter: 60,
      'waButtons.label': 20,
      kbAnswer: 600,
      'kbFacts.fact': 160,
      'kbQuestions.question': 120,
      'kbSynonyms.synonym': 40,
    }
    for (const [path, cap] of Object.entries(caps)) {
      expect(fields[path], path).toBeDefined()
      expect(fields[path].maxLength, path).toBe(cap)
    }
    for (const path of [
      'featured',
      'order',
      'isUSP',
      'status',
      'icon',
      'image',
      'description',
      'meta.image',
      'hasOwnPage',
      'related',
      'cta.link',
      'waLink',
      'includeInKbase',
      'kbLastReviewed',
    ]) {
      expect(fields[path], path).toBeDefined()
    }
  })

  it('sets the defaults, row limits and sidebar placement', () => {
    expect(fields.order.defaultValue).toBe(100)
    expect(fields.status.defaultValue).toBe('planned')
    expect(fields.hasOwnPage.defaultValue).toBe(false)
    expect(fields.includeInKbase.defaultValue).toBe(true)
    expect(fields.summary.required).toBe(true)
    expect([fields.slug.required, fields.slug.unique, fields.slug.index]).toEqual([
      true,
      true,
      true,
    ])
    expect([fields.benefits.minRows, fields.benefits.maxRows]).toEqual([3, 6])
    expect([fields.howItWorks.minRows, fields.howItWorks.maxRows]).toEqual([3, 5])
    expect(fields.useCases.maxRows).toBe(4)
    expect([fields.related.hasMany, fields.related.maxRows, fields.related.relationTo]).toEqual([
      true,
      3,
      'sharedGroupsTest',
    ])
    expect(fields.faqs.maxRows).toBe(6)
    expect([fields.waKeyPoints.minRows, fields.waKeyPoints.maxRows]).toEqual([3, 5])
    expect(fields.waButtons.maxRows).toBe(3)
    for (const name of ['name', 'featured', 'order', 'isUSP', 'status', 'hasOwnPage']) {
      expect(fields[name].admin?.position, name).toBe('sidebar')
    }
  })

  it('shows the Page tab only while Own page is on', () => {
    const condition = page.tab.admin!.condition!
    expect(condition({ hasOwnPage: true }, {}, {} as any)).toBe(true)
    expect(condition({ hasOwnPage: false }, {}, {} as any)).toBe(false)
  })

  it('needs a hero heading only when publishing with Own page on', async () => {
    const f = fields.heroHeading
    const check = (value: unknown, data: Record<string, unknown>) =>
      f.validate(value, opts(f, { data }))
    expect(await check('', { hasOwnPage: true, _status: 'published' })).toBe(
      'Add a hero heading before publishing with Own page on.',
    )
    expect(await check('', { hasOwnPage: true, _status: 'draft' })).toBe(true)
    expect(await check('', { hasOwnPage: false, _status: 'published' })).toBe(true)
    expect(
      await check('Know who you are talking to', { hasOwnPage: true, _status: 'published' }),
    ).toBe(true)
  })

  it('keeps WhatsApp and knowledge base text plain', async () => {
    for (const path of [
      'waRowTitle',
      'waBody',
      'waKeyPoints.line',
      'waButtons.label',
      'kbAnswer',
      'kbFacts.fact',
      'faqs.answer',
    ]) {
      const f = fields[path]
      expect(await f.validate('**Bold**', opts(f)), path).toBe(
        'Remove the * character. This field is plain text.',
      )
      expect(await f.validate('Plain words', opts(f)), path).toBe(true)
    }
    // Hard caps still apply alongside the plain-text check.
    expect(await fields.waRowTitle.validate('x'.repeat(25), opts(fields.waRowTitle))).toBe(
      'validation:shorterThanMax',
    )
  })

  it('accepts a path or a full address in waLink', async () => {
    const f = fields.waLink
    expect(await f.validate('', opts(f))).toBe(true)
    expect(await f.validate('/crm/customer-360', opts(f))).toBe(true)
    expect(await f.validate('/crm-for-agentic-workflows#customer_360', opts(f))).toBe(true)
    expect(await f.validate('https://neuroncx.com/crm', opts(f))).toBe(true)
    expect(await f.validate('crm page', opts(f))).not.toBe(true)
  })

  it('checks the slug format', async () => {
    const f = fields.slug
    expect(await f.validate('customer-360', opts(f, { required: true }))).toBe(true)
    expect(await f.validate('Customer 360', opts(f, { required: true }))).not.toBe(true)
  })

  it('lets visitors read only published Live and Pilot entries', () => {
    expect(publicLiveOrPilot({ req: { user: { id: '1' } } } as any)).toBe(true)
    expect(publicLiveOrPilot({ req: { user: null } } as any)).toEqual({
      and: [{ _status: { equals: 'published' } }, { status: { in: ['live', 'pilot'] } }],
    })
  })
})
