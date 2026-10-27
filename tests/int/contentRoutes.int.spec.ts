import type { Field } from 'payload'
import { ValidationError } from 'payload'
import { describe, expect, it } from 'vitest'

import { defineContentCollection } from '@/content/defineContentCollection'
import {
  computeEntryPath,
  findKeywordOwner,
  findPathOwner,
  noteEntryLivePath,
  pageSlugClashCheck,
  pathClashMessage,
  redirectMovedEntry,
  refreshChildPaths,
  validatePrimaryKeyword,
} from '@/content/paths'
import { getContentCollection, hubPagePath } from '@/content/registry'

/**
 * Root and parent routes on content collections, the address clash check,
 * the primary keyword check and redirects on a move. The collections are
 * defined here only (no database collection exists for them), so the hooks
 * run against a small in-memory stand-in for Payload.
 */

type Doc = Record<string, any>
type Store = Record<string, Doc[]>

const get = (doc: Doc, path: string) => path.split('.').reduce((v, k) => (v == null ? v : v[k]), doc as any)
const matches = (doc: Doc, where: any): boolean => {
  if (!where) return true
  if (where.and) return where.and.every((w: any) => matches(doc, w))
  return Object.entries(where).every(([path, cond]: [string, any]) => {
    const v = get(doc, path)
    if ('equals' in cond) return String(v) === String(cond.equals)
    if ('not_equals' in cond) return String(v) !== String(cond.not_equals)
    if ('like' in cond)
      return String(cond.like).toLowerCase().split(/\s+/).filter(Boolean).every((w) => String(v ?? '').toLowerCase().includes(w))
    return true
  })
}

const fakeReq = (store: Store) => {
  const calls: { op: string; collection: string; id?: unknown; data?: Doc; draft?: boolean }[] = []
  let n = 0
  const payload = {
    config: {},
    find: async ({ collection, where, limit }: any) => {
      const docs = (store[collection] ?? []).filter((d) => matches(d, where))
      return { docs: limit ? docs.slice(0, limit) : docs, totalDocs: docs.length }
    },
    findByID: async ({ collection, id }: any) => (store[collection] ?? []).find((d) => String(d.id) === String(id)) ?? null,
    count: async ({ collection, where }: any) => ({ totalDocs: (store[collection] ?? []).filter((d) => matches(d, where)).length }),
    create: async ({ collection, data }: any) => {
      const doc = { id: `new-${++n}`, ...data }
      ;(store[collection] ??= []).push(doc)
      calls.push({ op: 'create', collection, data })
      return doc
    },
    update: async ({ collection, id, data, draft }: any) => {
      calls.push({ op: 'update', collection, id, data, draft })
      const doc = (store[collection] ?? []).find((d) => String(d.id) === String(id))
      if (doc && collection === 'redirects') Object.assign(doc, data)
      return doc
    },
    delete: async ({ collection, id }: any) => {
      calls.push({ op: 'delete', collection, id })
      store[collection] = (store[collection] ?? []).filter((d) => String(d.id) !== String(id))
    },
    logger: { info: () => undefined, error: () => undefined },
  }
  return { req: { payload, context: {}, t: (k: string) => k } as any, calls }
}

const flat = (fields: any[]): any[] => fields.flatMap((f) => (f.type === 'row' || f.type === 'collapsible' ? flat(f.fields) : [f]))
const sidebarNames = (fields: Field[]) => flat(fields).filter((f: any) => f.admin?.position === 'sidebar').map((f: any) => f.name)
const seoTabOf = (fields: Field[]) => (fields.find((f: any) => f.type === 'tabs') as any).tabs.find((t: any) => t.label === 'SEO')

// The collections under test: topics at the root, lessons under a topic, and
// one with a route base whose hub is a preview address.
const Topics = defineContentCollection({ slug: 'zzTopics', label: 'Topic', route: { entries: 'root' }, groups: ['core', 'card', 'ownPage'] })
const Lessons = defineContentCollection({
  slug: 'zzLessons',
  label: 'Lesson',
  route: { parent: { collection: 'zzTopics', field: 'topic' } },
  groups: ['core', 'card', 'ownPage'],
})
defineContentCollection({ slug: 'zzBase', label: 'Base', route: '/zz-base', groups: ['core', 'card', 'ownPage'] })
const topics = getContentCollection('zzTopics')!
const lessons = getContentCollection('zzLessons')!

describe('route forms', () => {
  it('serves root entries at /{slug}, with a read-only stored path and no hub address', () => {
    expect(topics).toMatchObject({ route: null, hasRoute: true, routing: { kind: 'root' }, ownPage: true, seo: true })
    expect(hubPagePath(topics)).toBeNull()
    const path = flat(Topics.fields).find((f: any) => f.name === 'path')
    expect(path).toMatchObject({ type: 'text', admin: { position: 'sidebar', readOnly: true } })
    expect(sidebarNames(Topics.fields).at(-1)).toBe('path')
  })

  it('serves parent entries at /{parent slug}/{slug}, adding the parent field when the collection has none', () => {
    expect(lessons.routing).toEqual({ kind: 'parent', collection: 'zzTopics', field: 'topic' })
    const topic = flat(Lessons.fields).find((f: any) => f.name === 'topic')
    expect(topic).toMatchObject({ type: 'relationship', relationTo: 'zzTopics', required: true })
    expect(sidebarNames(Lessons.fields).slice(-2)).toEqual(['topic', 'path'])
  })

  it("uses the collection's own parent field, and refuses one of the wrong kind", () => {
    const own = defineContentCollection({
      slug: 'zzOwnParent',
      label: 'Own parent',
      route: { parent: { collection: 'zzTopics', field: 'topic' } },
      groups: ['core', 'card', 'ownPage'],
      fields: { sidebar: [{ name: 'topic', type: 'relationship', relationTo: 'zzTopics' as any, required: true }] },
    })
    expect(flat(own.fields).filter((f: any) => f.name === 'topic')).toHaveLength(1)
    expect(() =>
      defineContentCollection({
        slug: 'zzBadParent',
        label: 'Bad parent',
        route: { parent: { collection: 'zzTopics', field: 'topic' } },
        groups: ['core', 'card', 'ownPage'],
        fields: { sidebar: [{ name: 'topic', type: 'text' }] },
      }),
    ).toThrow('topic must be a single relationship to zzTopics')
  })

  it('refuses a root or parent route without own pages, and a collection that is its own parent', () => {
    expect(() => defineContentCollection({ slug: 'zzNoPage', label: 'x', route: { entries: 'root' }, groups: ['core', 'card'] })).toThrow(
      'a root or parent route needs the ownPage group',
    )
    expect(() =>
      defineContentCollection({ slug: 'zzSelf', label: 'x', route: { parent: { collection: 'zzSelf', field: 'up' } }, groups: ['core', 'card', 'ownPage'] }),
    ).toThrow('the parent collection must be another collection')
  })

  it("gives the factory's SEO tab a primary keyword of up to 60 characters", () => {
    const keyword = seoTabOf(Topics.fields).fields.find((f: any) => f.name === 'primaryKeyword')
    expect(keyword).toMatchObject({ type: 'text', maxLength: 60, validate: validatePrimaryKeyword })
  })
})

describe('entry addresses', () => {
  const { req } = fakeReq({ zzTopics: [{ id: 't1', slug: 'admissions', name: 'Admissions' }] })

  it('works out the address from the route, the slug and the parent', async () => {
    expect(await computeEntryPath(req, topics, { slug: 'admissions', hasOwnPage: true })).toBe('/admissions')
    expect(await computeEntryPath(req, lessons, { slug: 'fees', hasOwnPage: true, topic: 't1' })).toBe('/admissions/fees')
    expect(await computeEntryPath(req, getContentCollection('zzBase')!, { slug: 'x', hasOwnPage: true })).toBe('/zz-base/x')
  })

  it('has no address without an own page, a slug or a parent', async () => {
    expect(await computeEntryPath(req, topics, { slug: 'admissions', hasOwnPage: false })).toBeNull()
    expect(await computeEntryPath(req, lessons, { slug: 'fees', hasOwnPage: true })).toBeNull()
    expect(await computeEntryPath(req, lessons, { slug: 'fees', hasOwnPage: true, topic: 'missing' })).toBeNull()
  })
})

describe('address clashes', () => {
  const store = (): Store => ({
    pages: [
      { id: 'p1', slug: 'fees', title: 'Fees page' },
      { id: 'p2', slug: 'admissions-guide', title: 'Admissions guide' },
      { id: 'p3', slug: 'deadlines', title: 'Deadlines page', parent: 'p2', breadcrumbs: [{ url: '/admissions-guide' }, { url: '/admissions-guide/deadlines' }] },
    ],
    zzTopics: [
      { id: 't1', slug: 'fees', name: 'Fees topic', hasOwnPage: true, path: '/fees' },
      { id: 't2', slug: 'admissions-guide', name: 'Admissions guide topic', hasOwnPage: true, path: '/admissions-guide' },
    ],
    zzLessons: [{ id: 'l1', slug: 'deadlines', name: 'Deadlines lesson', hasOwnPage: true, path: '/admissions-guide/deadlines' }],
    hubs: [{ id: 'h1', forCollection: 'zzBase', name: 'Base hub' }],
  })

  it('finds a page with the same slug as a root entry, and the other way round', async () => {
    const { req } = fakeReq(store())
    expect(await findPathOwner(req, '/fees', { collection: 'zzTopics', id: 't9' })).toEqual({ what: 'the page', title: 'Fees page' })
    expect(await findPathOwner(req, '/fees', { collection: 'pages', id: 'p9' })).toEqual({ what: 'the page', title: 'Fees page' })
    expect(await findPathOwner(req, '/fees', { collection: 'pages', id: 'p1' })).toEqual({ what: 'the topic', title: 'Fees topic' })
  })

  it('finds a child page with the same path as a child entry, and the other way round', async () => {
    const { req } = fakeReq(store())
    expect(await findPathOwner(req, '/admissions-guide/deadlines', { collection: 'zzLessons', id: 'l1' })).toEqual({
      what: 'the page',
      title: 'Deadlines page',
    })
    expect(await findPathOwner(req, '/admissions-guide/deadlines', { collection: 'pages', id: 'p3' })).toEqual({
      what: 'the lesson',
      title: 'Deadlines lesson',
    })
  })

  it('finds a hub address, and nothing for a free address or the record itself', async () => {
    const { req } = fakeReq(store())
    expect(await findPathOwner(req, '/zz-base-preview', { collection: 'pages' })).toEqual({ what: 'the hub', title: 'Base hub' })
    expect(await findPathOwner(req, '/free', { collection: 'pages' })).toBeNull()
    expect(await findPathOwner(req, '/admissions-guide', { collection: 'pages', id: 'p2' })).toEqual({
      what: 'the topic',
      title: 'Admissions guide topic',
    })
    expect(await findPathOwner(req, '/admissions-guide', { collection: 'zzTopics', id: 't2' })).toEqual({
      what: 'the page',
      title: 'Admissions guide',
    })
  })

  it('refuses the save on the slug field, naming the other record', async () => {
    const { req } = fakeReq(store())
    const hook = (flat(Topics.fields).find((f: any) => f.name === 'path') as any).hooks.beforeChange[0]
    const refused = await hook({ data: { slug: 'fees', hasOwnPage: true }, originalDoc: { id: 't9' }, req }).catch((e: unknown) => e)
    expect(refused).toBeInstanceOf(ValidationError)
    expect((refused as ValidationError).data.errors).toEqual([{ path: 'slug', message: pathClashMessage('/fees', { what: 'the page', title: 'Fees page' }) }])
    expect(pathClashMessage('/fees', { what: 'the page', title: 'Fees page' })).toBe(
      'The address /fees is already used by the page "Fees page". Choose a different slug.',
    )
    expect(await hook({ data: { slug: 'fresh', hasOwnPage: true }, originalDoc: { id: 't9' }, req })).toBe('/fresh')

    const page = await pageSlugClashCheck({ value: 'fees', data: { slug: 'fees' }, originalDoc: { id: 'p9' }, req } as any).catch((e: unknown) => e)
    expect((page as ValidationError).data.errors[0].message).toBe('The address /fees is already used by the page "Fees page". Choose a different slug.')
  })
})

describe('primary keyword', () => {
  const store = (): Store => ({
    pages: [{ id: 'p1', title: 'Education CRM', slug: 'education-crm', meta: { primaryKeyword: 'Education CRM' } }],
    zzTopics: [{ id: 't1', name: 'Admissions topic', slug: 'admissions', hasOwnPage: true, path: '/admissions', meta: { primaryKeyword: 'Admissions   automation' } }],
  })
  const validate = (value: string, collectionSlug: string, id: string) => {
    const { req } = fakeReq(store())
    return validatePrimaryKeyword(value, { req, collectionSlug, id, maxLength: 60 } as any)
  }

  it('refuses a keyword a page has, on an entry, naming the page', async () => {
    expect(await validate('  education   crm ', 'zzTopics', 't9')).toBe(
      '"education   crm" is already the primary keyword of the page "Education CRM" (/education-crm). Choose a different keyword.',
    )
  })

  it('refuses a keyword an entry has, on a page, naming the entry and its address', async () => {
    expect(await validate('admissions automation', 'pages', 'p9')).toBe(
      '"admissions automation" is already the primary keyword of the topic "Admissions topic" (/admissions). Choose a different keyword.',
    )
  })

  it('accepts a record keeping its own keyword, and a new keyword', async () => {
    expect(await validate('Admissions Automation', 'zzTopics', 't1')).toBe(true)
    expect(await validate('Education CRM', 'pages', 'p1')).toBe(true)
    expect(await validate('Fee reminders', 'zzLessons', 'l1')).toBe(true)
    const { req } = fakeReq(store())
    expect(await findKeywordOwner(req, 'EDUCATION crm', { collection: 'zzLessons' })).toMatchObject({ what: 'the page', title: 'Education CRM' })
  })
})

describe('redirect when a published entry moves', () => {
  const live = { id: 't1', slug: 'old', name: 'Topic', hasOwnPage: true, path: '/old', _status: 'published' }

  it('notes the live address before a publish and redirects it to the new one after', async () => {
    const store: Store = { zzTopics: [{ ...live }], redirects: [] }
    const { req } = fakeReq(store)
    await noteEntryLivePath(topics)({ data: { _status: 'published' }, operation: 'update', originalDoc: live, req } as any)
    await redirectMovedEntry(topics)({ doc: { ...live, slug: 'new', path: '/new' }, req } as any)
    expect(store.redirects).toEqual([expect.objectContaining({ from: '/old', to: { type: 'custom', url: '/new' } })])
  })

  it('makes no redirect for a draft save, an unchanged address, or an entry never published', async () => {
    for (const [data, original, after] of [
      [{ _status: 'draft' }, live, { ...live, path: '/new' }],
      [{ _status: 'published' }, live, live],
      [{ _status: 'published' }, { ...live, _status: 'draft' }, { ...live, path: '/new' }],
    ] as const) {
      const store: Store = { zzTopics: [{ ...original }], redirects: [] }
      const { req } = fakeReq(store)
      await noteEntryLivePath(topics)({ data, operation: 'update', originalDoc: original, req } as any)
      await redirectMovedEntry(topics)({ doc: after, req } as any)
      expect(store.redirects).toEqual([])
    }
  })
})

describe('children follow a renamed parent', () => {
  it('saves each child again, published as it is and then its newer draft, only when its address changes', async () => {
    const parent = { id: 't1', slug: 'renamed', name: 'Topic', hasOwnPage: true, _status: 'published' }
    const store: Store = {
      zzTopics: [parent],
      zzLessons: [
        { id: 'l1', slug: 'fees', topic: 't1', hasOwnPage: true, path: '/old/fees', _status: 'published' },
        { id: 'l2', slug: 'dates', topic: 't1', hasOwnPage: true, path: '/renamed/dates', _status: 'published' },
        { id: 'l3', slug: 'draft', topic: 't1', hasOwnPage: true, path: '/old/draft', _status: 'draft' },
      ],
    }
    const { req, calls } = fakeReq(store)
    await refreshChildPaths(topics)({ doc: parent, req } as any)
    const updates = calls.filter((c) => c.op === 'update').map((c) => [c.id, c.draft])
    expect(updates).toEqual([
      ['l1', false],
      ['l3', true],
    ])
  })

  it('does nothing while the parent is a draft', async () => {
    const { req, calls } = fakeReq({ zzLessons: [{ id: 'l1', topic: 't1', slug: 'fees', hasOwnPage: true, path: '/old/fees', _status: 'published' }] })
    await refreshChildPaths(topics)({ doc: { id: 't1', slug: 'renamed', _status: 'draft' }, req } as any)
    expect(calls).toEqual([])
  })
})
