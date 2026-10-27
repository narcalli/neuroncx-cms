import 'dotenv/config'
import type { Field } from 'payload'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import { ComparisonTable, validateColumns, validateRows } from '@/blocks/ComparisonTable/config'
import { IndustryTopics } from '@/collections/IndustryTopics'
import { getContentCollection } from '@/content/registry'
import { plainText } from '@/fields/validators/plainText'
import { serializeEntry } from '@/rag/content'

/**
 * Industry topics: pages under an industry at /{industry}/{topic}. The last
 * group uses the local database with a temporary industry and topic (zz-it-),
 * deleted afterwards.
 */

// Loading the Payload config adds an id to array rows and blockName to blocks; neither is a field here.
const flat = (fields: any[]): any[] =>
  fields
    .flatMap((f) => (f.type === 'row' || f.type === 'collapsible' ? flat(f.fields) : f.type === 'tabs' ? f.tabs.flatMap((t: any) => flat(t.fields)) : [f]))
    .filter((f) => f.name !== 'id' && f.name !== 'blockName')
const named = (fields: Field[], name: string): any => flat(fields).find((f) => f.name === name)
const tab = (label: string) => (IndustryTopics.fields.find((f: any) => f.type === 'tabs') as any).tabs.find((t: any) => t.label === label)
const shape = (f: any): any => ({
  name: f.name,
  type: f.type,
  ...(f.maxLength ? { maxLength: f.maxLength } : {}),
  ...(f.minRows ? { minRows: f.minRows } : {}),
  ...(f.maxRows ? { maxRows: f.maxRows } : {}),
  ...(f.fields ? { fields: flat(f.fields).map(shape) } : {}),
})

describe('the collection', () => {
  it('is Industry topics, beside Industries, under the industry it links to', () => {
    expect(IndustryTopics.slug).toBe('industryTopics')
    expect(IndustryTopics.labels).toEqual({ singular: 'Industry topic', plural: 'Industry topics' })
    expect(IndustryTopics.admin?.group).toBe('Industries')
    expect(getContentCollection('industryTopics')).toMatchObject({
      routing: { kind: 'parent', collection: 'sectors', field: 'industry' },
      ownPage: true,
      kbase: true,
      kb: { resolve: ['industry', 'agents', 'integrations'] },
    })
  })

  it('has status, the industry, stage and stage order in the sidebar, then the address', () => {
    const sidebar = flat(IndustryTopics.fields).filter((f: any) => f.admin?.position === 'sidebar').map((f: any) => f.name)
    expect(sidebar).toEqual(expect.arrayContaining(['status', 'industry', 'stage', 'stageOrder']))
    expect(sidebar.at(-1)).toBe('path')
    expect(flat(IndustryTopics.fields).filter((f: any) => f.name === 'industry')).toHaveLength(1)
    expect(named(IndustryTopics.fields, 'industry')).toMatchObject({ type: 'relationship', relationTo: 'sectors', required: true })
    expect(named(IndustryTopics.fields, 'stage')).toMatchObject({ type: 'text', maxLength: 30, validate: plainText })
    expect(named(IndustryTopics.fields, 'stageOrder')).toMatchObject({ type: 'number', required: true })
  })
})

describe('the Topic tab', () => {
  it('has the overview, steps and what is recorded, with their limits', () => {
    const [overview, steps, recorded] = tab('Topic').fields
    expect(overview).toMatchObject({ name: 'overview', type: 'textarea', maxLength: 600, required: true, validate: plainText })
    expect(overview.admin.description).toMatch(/^What this topic covers, feature first/)
    expect(shape(steps)).toEqual({
      name: 'steps', type: 'array', minRows: 2, maxRows: 8,
      fields: [{ name: 'title', type: 'text', maxLength: 60 }, { name: 'description', type: 'textarea', maxLength: 240 }],
    })
    expect(shape(recorded)).toEqual({
      name: 'recorded', type: 'array', maxRows: 10,
      fields: [{ name: 'field', type: 'text', maxLength: 60 }, { name: 'source', type: 'text', maxLength: 80 }],
    })
    for (const f of [...flat(steps.fields), ...flat(recorded.fields)]) expect(f.validate, f.name).toBe(plainText)
  })

  it('has an optional comparison with the comparisonTable fields and validation', () => {
    const comparison = named(tab('Topic').fields, 'comparison')
    expect(comparison.type).toBe('group')
    expect(flat(comparison.fields).map(shape)).toEqual(flat(ComparisonTable.fields).map(shape))
    expect(named(comparison.fields, 'columns').validate).toBe(validateColumns)
    expect(named(comparison.fields, 'rows').validate).toBe(validateRows)
    for (const f of flat(comparison.fields)) expect(f.required ?? false, f.name).toBe(false)
  })
})

describe('the Links tab', () => {
  it('links agents, integrations and customers', () => {
    expect(tab('Links').fields.map((f: any) => [f.name, f.type, f.relationTo, f.hasMany])).toEqual([
      ['agents', 'relationship', 'microApps', true],
      ['integrations', 'relationship', 'integrations', true],
      ['customers', 'relationship', 'customers', true],
    ])
  })
})

describe('with the local database', () => {
  let payload: Payload
  const quiet = { context: { disableRevalidate: true }, depth: 0 } as const
  const created: { collection: 'sectors' | 'industryTopics'; id: string }[] = []
  let industry: any

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    industry = await payload.create({
      ...quiet,
      collection: 'sectors',
      data: {
        name: 'ZZ IT industry',
        slug: 'zz-it-ind',
        status: 'live',
        summary: 'A temporary industry for the topic test.',
        keyPoints: [{ line: 'One' }, { line: 'Two' }, { line: 'Three' }],
        waBody: 'Temporary.',
        waButtons: [{ label: 'Book a demo', action: 'bookDemo' }],
        // No page of its own: a new industry starts with one, and its blocks to fill.
        hasOwnPage: false,
        _status: 'published',
      } as any,
    })
    created.push({ collection: 'sectors', id: String(industry.id) })
  })

  afterAll(async () => {
    for (const c of created.reverse()) await payload.delete({ ...quiet, collection: c.collection, id: c.id }).catch(() => undefined)
    const left = await payload.find({ ...quiet, collection: 'redirects', where: { from: { like: 'zz-it-' } }, limit: 50 })
    for (const r of left.docs) await payload.delete({ ...quiet, collection: 'redirects', id: r.id })
  })

  it('stores /{industry slug}/{topic slug}, and moves the topic when the industry is renamed', async () => {
    const t = await payload.create({
      ...quiet,
      collection: 'industryTopics',
      draft: true,
      data: { name: 'ZZ IT topic', slug: 'zz-it-topic', industry: industry.id, stageOrder: 1, hasOwnPage: true, _status: 'draft' } as any,
    })
    created.push({ collection: 'industryTopics', id: String(t.id) })
    const read = async () => (await payload.findByID({ ...quiet, collection: 'industryTopics', id: t.id, draft: true })).path
    expect(await read()).toBe('/zz-it-ind/zz-it-topic')

    await payload.update({ ...quiet, collection: 'sectors', id: industry.id, data: { slug: 'zz-it-ind-2', _status: 'published' } as any })
    expect(await read()).toBe('/zz-it-ind-2/zz-it-topic')
  })

  it('sends the industry, agents and integrations to the knowledge base by name', async () => {
    const sections = await serializeEntry(payload, getContentCollection('industryTopics')!, {
      name: 'ZZ IT kb topic',
      overview: 'Collects fees on WhatsApp, then confirms the seat.',
      industry: industry.id,
      agents: [],
      integrations: [],
    })
    const text = sections.map((s) => `${s.heading}\n${s.body}`).join('\n')
    expect(text).toContain('Collects fees on WhatsApp')
    expect(text).toContain('ZZ IT industry')
  })
})
