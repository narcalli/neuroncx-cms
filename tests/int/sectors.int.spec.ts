import 'dotenv/config'
import type { Field } from 'payload'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import { AgenticCartsDemo } from '@/blocks/AgenticCartsDemo/config'
import { AudienceTabs } from '@/blocks/AudienceTabs/config'
import { BentoGrid } from '@/blocks/BentoGrid/config'
import { ContextEngine } from '@/blocks/ContextEngine/config'
import { PlatformLayersTwo } from '@/blocks/PlatformLayersTwo/config'
import { ProductSuite2 } from '@/blocks/ProductSuite2/config'
import { validateColumns, validateRows } from '@/blocks/ComparisonTable/config'
import { RecordAnatomy } from '@/blocks/RecordAnatomy/config'
import { Sectors } from '@/collections/Sectors'
import { hidePendingRowsFromVisitors, withoutPendingRows } from '@/content/pending'
import { getContentCollection } from '@/content/registry'
import { plainText } from '@/fields/validators/plainText'
import { VERTICAL_OPTIONS } from '@/fields/verticals'
import { serializeEntry } from '@/rag/content'

/**
 * Industries: the sectors collection rebuilt on the factory. The last two
 * groups use the local database with temporary records (zz-sec-), deleted
 * afterwards.
 */

// Loading the Payload config adds an id to every array row; it is not one of the fields here.
const flat = (fields: any[]): any[] =>
  fields
    .flatMap((f) => (f.type === 'row' || f.type === 'collapsible' ? flat(f.fields) : f.type === 'tabs' ? f.tabs.flatMap((t: any) => flat(t.fields)) : [f]))
    .filter((f) => f.name !== 'id')
const named = (fields: Field[], name: string): any => flat(fields).find((f) => f.name === name)
const tabs = () => (Sectors.fields.find((f: any) => f.type === 'tabs') as any).tabs
const tab = (label: string) => tabs().find((t: any) => t.label === label)
const shape = (f: any): any => ({
  name: f.name,
  type: f.type,
  ...(f.maxLength ? { maxLength: f.maxLength } : {}),
  ...(f.minRows ? { minRows: f.minRows } : {}),
  ...(f.maxRows ? { maxRows: f.maxRows } : {}),
  ...(f.fields ? { fields: flat(f.fields).map(shape) } : {}),
})

describe('the collection', () => {
  it('keeps the slug sectors, as Industries, at the root of the site', () => {
    expect(Sectors.slug).toBe('sectors')
    expect(Sectors.labels).toEqual({ singular: 'Industry', plural: 'Industries' })
    expect(getContentCollection('sectors')).toMatchObject({ routing: { kind: 'root' }, route: null, ownPage: true, seo: true, kbase: true, kb: { resolve: [] } })
  })

  it('keeps name, slug and order, so customers and the sector filters keep working', () => {
    for (const n of ['name', 'slug', 'order']) expect(named(Sectors.fields, n), n).toBeTruthy()
  })

  it('has status, a menu label and verticals in the sidebar', () => {
    const sidebar = flat(Sectors.fields).filter((f: any) => f.admin?.position === 'sidebar').map((f: any) => f.name)
    expect(sidebar).toEqual(expect.arrayContaining(['status', 'menuLabel', 'verticals', 'hasOwnPage', 'path']))
    expect(named(Sectors.fields, 'menuLabel')).toMatchObject({ type: 'text', maxLength: 30, validate: plainText })
    expect(named(Sectors.fields, 'verticals')).toMatchObject({ type: 'select', hasMany: true, options: [...VERTICAL_OPTIONS] })
  })

  it('places Industry, By team, Record and Comparison after the Page tab', () => {
    const labels = tabs().map((t: any) => t.label)
    expect(labels.slice(labels.indexOf('Page'), labels.indexOf('Page') + 5)).toEqual(['Page', 'Industry', 'By team', 'Record', 'Comparison'])
  })
})

describe('the Industry tab', () => {
  const fields = () => tab('Industry').fields
  it('has problems, the episode, key dates, stats and roles with their limits', () => {
    expect(fields().map(shape)).toEqual([
      { name: 'problems', type: 'array', minRows: 2, maxRows: 4, fields: [{ name: 'title', type: 'text', maxLength: 70 }, { name: 'description', type: 'textarea', maxLength: 240 }] },
      { name: 'episodeName', type: 'text', maxLength: 30 },
      {
        name: 'episodePoints', type: 'array', minRows: 3, maxRows: 10,
        fields: [{ name: 'title', type: 'text', maxLength: 40 }, { name: 'caption', type: 'textarea', maxLength: 200 }, { name: 'pending', type: 'checkbox' }],
      },
      { name: 'keyDates', type: 'array', maxRows: 6, fields: [{ name: 'label', type: 'text', maxLength: 40 }] },
      {
        name: 'stats', type: 'array', maxRows: 4,
        fields: [{ name: 'value', type: 'text', maxLength: 10 }, { name: 'label', type: 'text', maxLength: 140 }, { name: 'pending', type: 'checkbox' }],
      },
      {
        name: 'roles', type: 'array', minRows: 2, maxRows: 6,
        fields: [{ name: 'name', type: 'text', maxLength: 40 }, { name: 'caption', type: 'textarea', maxLength: 160 }, { name: 'icon', type: 'select' }],
      },
    ])
  })

  it('checks every text field with the shared plain-text validator', () => {
    const texts = flat(fields()).flatMap((f: any) => (f.type === 'array' ? flat(f.fields) : [f])).filter((f: any) => ['text', 'textarea'].includes(f.type))
    expect(texts.length).toBeGreaterThan(8)
    for (const f of texts) expect(f.validate, f.name).toBe(plainText)
  })
})

describe('the reused block fields', () => {
  it('By team: audiences with the audienceTabs tabs fields and limits', () => {
    const audiences = tab('By team').fields[0]
    const blockTabs = named(AudienceTabs.fields, 'tabs')
    expect(audiences).toMatchObject({ name: 'audiences', type: 'array', minRows: 2, maxRows: 4, required: false })
    expect(shape(audiences).fields).toEqual(shape(blockTabs).fields)
  })

  it('Record: the recordAnatomy record name, column headings and entities', () => {
    const fields = flat(tab('Record').fields)
    expect(fields.map((f: any) => f.name)).toEqual(['recordLabel', 'fieldColumnLabel', 'sourceColumnLabel', 'entities'])
    expect(shape(fields[3])).toEqual(shape(named(RecordAnatomy.fields, 'entities')))
    expect(fields[3].required).toBe(false)
  })

  it('Comparison: the comparisonTable columns, rows and footnote, with its validation', () => {
    const fields = flat(tab('Comparison').fields)
    expect(fields.map((f: any) => f.name)).toEqual(['columns', 'rows', 'footnote'])
    expect(fields[0]).toMatchObject({ minRows: 2, maxRows: 4, validate: validateColumns, required: false })
    expect(fields[1]).toMatchObject({ minRows: 2, maxRows: 10, validate: validateRows, required: false })
  })
})

describe('platform sections (interim)', () => {
  const platform = () => tab('Platform sections (interim)')
  const sections: [string, any][] = [
    ['carts', AgenticCartsDemo],
    ['enquiryCapture', ContextEngine],
    ['answersFromContent', ProductSuite2],
    ['campaigns', BentoGrid],
    ['reporting', ProductSuite2],
    ['callQuality', PlatformLayersTwo],
    ['campusSystems', ProductSuite2],
  ]
  // Every field at any depth, with its limits, to compare a group with its block.
  const limits = (fields: any[]): any[] =>
    flat(fields).map((f: any) => ({
      name: f.name,
      type: f.type,
      maxLength: f.maxLength,
      minRows: f.minRows,
      maxRows: f.maxRows,
      ...(f.fields ? { fields: limits(f.fields) } : {}),
    }))

  it('follows the Comparison tab, with the interim note at the top', () => {
    const labels = tabs().map((t: any) => t.label)
    expect(labels[labels.indexOf('Comparison') + 1]).toBe('Platform sections (interim)')
    expect(platform().description).toBe(
      'Interim. These move to the CRM features and call quality assessments collections once those have entries.',
    )
  })

  it("holds one group per section, each with its block's own fields and limits", () => {
    expect(platform().fields.map((f: any) => [f.name, f.type])).toEqual(sections.map(([name]) => [name, 'group']))
    for (const [name, block] of sections) {
      const group = platform().fields.find((f: any) => f.name === name)
      // Payload adds blockName to a block when the config loads; it is not one of the block's own fields.
      const own = flat(block.fields).filter((f: any) => !['theme', 'anchorId', 'blockName'].includes(f.name))
      expect(limits(group.fields), name).toEqual(limits(own))
    }
  })

  it('leaves out the Appearance fields, including platformLayersTwo theme and anchor', () => {
    for (const group of platform().fields) {
      const names = flat(group.fields).map((f: any) => f.name)
      for (const n of ['background', 'width', 'spacingTop', 'spacingBottom', 'align', 'hidden', 'htmlId', 'theme', 'anchorId']) {
        expect(names, `${group.name} ${n}`).not.toContain(n)
      }
    }
  })

  it('requires nothing at the top of a section, so an industry can publish with one empty', () => {
    for (const group of platform().fields) {
      for (const f of flat(group.fields)) expect(f.required ?? false, `${group.name}.${f.name}`).toBe(false)
    }
    // Inside a list, a row keeps its own required fields.
    const layers = flat(platform().fields.find((f: any) => f.name === 'callQuality').fields).find((f: any) => f.name === 'layers')
    expect(layers).toMatchObject({ minRows: 3, maxRows: 6 })
    expect(flat(layers.fields).some((f: any) => f.required)).toBe(true)
  })
})

describe('pending rows', () => {
  const doc = {
    name: 'Higher education',
    episodePoints: [{ title: 'Enquiry' }, { title: 'Scholarship check', pending: true }, { title: 'Enrolment', pending: false }],
    stats: [{ value: '40%', label: 'fewer calls', pending: true }],
    problems: [{ title: 'Leads go cold' }],
  }

  it('are left out of a document, every top-level list', () => {
    expect(withoutPendingRows(doc)).toEqual({
      ...doc,
      episodePoints: [{ title: 'Enquiry' }, { title: 'Enrolment', pending: false }],
      stats: [],
    })
  })

  it('reach signed-in readers (and so draft preview) and server code, never anonymous API readers', () => {
    const read = (req: object) => hidePendingRowsFromVisitors({ doc, req } as any) as any
    expect(read({ user: { id: 'u1' }, payloadAPI: 'REST' }).episodePoints).toHaveLength(3)
    expect(read({ payloadAPI: 'local' }).episodePoints).toHaveLength(3)
    expect(read({ payloadAPI: 'REST' }).episodePoints).toHaveLength(2)
    expect(read({ payloadAPI: 'GraphQL' }).stats).toEqual([])
  })
})

describe('with the local database', () => {
  let payload: Payload
  const pages: string[] = []
  const sectors: string[] = []
  const quiet = { context: { disableRevalidate: true }, depth: 0 } as const

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
  })
  afterAll(async () => {
    for (const id of sectors) await payload.delete({ ...quiet, collection: 'sectors', id }).catch(() => undefined)
    for (const id of pages) await payload.delete({ ...quiet, collection: 'pages', id }).catch(() => undefined)
  })

  it('leaves pending rows out of the knowledge base', async () => {
    const sections = await serializeEntry(payload, getContentCollection('sectors')!, {
      name: 'ZZ SEC kb',
      episodeName: 'Admission',
      episodePoints: [
        { title: 'Enquiry arrives', caption: 'A lead comes in.' },
        { title: 'Secret pending step', caption: 'Not confirmed.', pending: true },
        { title: 'Enrolment', caption: 'The student joins.' },
      ],
    })
    const text = sections.map((s) => `${s.heading}\n${s.body}`).join('\n')
    expect(text).toContain('Enquiry arrives')
    expect(text).not.toContain('Secret pending step')
  })

  it('refuses an industry page at the address of an existing page, naming it', async () => {
    const page = await payload.create({
      ...quiet,
      collection: 'pages',
      data: { title: 'ZZ SEC page', slug: 'zz-sec-clash', hero: { type: 'none' }, layout: [{ blockType: 'content', columns: [] }], _status: 'published' } as any,
    })
    pages.push(String(page.id))
    let message = ''
    try {
      const s = await payload.create({ ...quiet, collection: 'sectors', draft: true, data: { name: 'ZZ SEC clash', slug: 'zz-sec-clash', hasOwnPage: true, _status: 'draft' } as any })
      sectors.push(String(s.id))
    } catch (e: any) {
      message = e?.data?.errors?.[0]?.message ?? String(e?.message)
    }
    expect(message).toBe('The address /zz-sec-clash is already used by the page "ZZ SEC page". Choose a different slug.')
  })

  it('stores /{slug} for an industry with its own page, and nothing without one', async () => {
    const own = await payload.create({ ...quiet, collection: 'sectors', draft: true, data: { name: 'ZZ SEC own', slug: 'zz-sec-own', hasOwnPage: true, _status: 'draft' } as any })
    sectors.push(String(own.id))
    const off = await payload.create({ ...quiet, collection: 'sectors', draft: true, data: { name: 'ZZ SEC off', slug: 'zz-sec-off', _status: 'draft' } as any })
    sectors.push(String(off.id))
    expect((await payload.findByID({ ...quiet, collection: 'sectors', id: own.id, draft: true })).path).toBe('/zz-sec-own')
    expect((await payload.findByID({ ...quiet, collection: 'sectors', id: off.id, draft: true })).path ?? null).toBeNull()
  })
})
