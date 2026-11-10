import { describe, expect, it } from 'vitest'

import config from '@/payload.config'
import { Pages } from '@/collections/Pages'
import { withVersion } from '@/history/build'
import { collectRefs } from '@/history/check'
import { CONTENT_EVENTS, ContentEvents } from '@/history/ContentEvents'
import { historyFields } from '@/history/fields'
import { draftRollbackOnly, eventFor, LIVE_ROLLBACK_REFUSED, ROLLBACK_FROM, stampEditor } from '@/history/hooks'
import { summariseChange } from '@/history/summary'

/** History: who saved each version, what changed, events, and rollback to a draft only. */

const req = (extra: Record<string, unknown> = {}) => ({ context: {}, ...extra }) as any

const hero: any = { slug: 'heroBanner', labels: { singular: 'Hero', plural: 'Heroes' }, fields: [
  { name: 'heading', type: 'text', label: 'Heading' },
  { name: 'intro', type: 'textarea' },
  { name: 'image', type: 'upload', relationTo: 'media' },
] }
const faq: any = { slug: 'faq', labels: { singular: 'FAQ', plural: 'FAQs' }, fields: [
  { name: 'items', type: 'array', label: 'Questions', fields: [{ name: 'q', type: 'text' }] },
] }
const fields: any[] = [
  { name: 'title', type: 'text', label: 'Title' },
  { type: 'row', fields: [{ name: 'slug', type: 'text' }] },
  { name: 'layout', type: 'blocks', label: 'Layout', blocks: [hero, faq] },
  { name: 'points', type: 'array', label: 'Key points', fields: [{ name: 'text', type: 'text' }] },
  { name: 'seo', type: 'group', label: 'SEO', fields: [{ name: 'metaTitle', type: 'text', label: 'Meta title' }] },
  { name: 'path', type: 'text', admin: { readOnly: true } },
  { name: 'tags', type: 'relationship', relationTo: ['categories', 'posts'], hasMany: true },
]
const base = {
  title: 'Home',
  slug: 'home',
  layout: [
    { id: 'a', blockType: 'heroBanner', heading: 'Old heading', intro: 'x' },
    { id: 'b', blockType: 'faq', items: [{ id: 'q1', q: 'Why?' }] },
  ],
  points: [{ id: 'p1', text: 'One' }],
  seo: { metaTitle: 'Home' },
  path: '/home',
}

describe('the change summary', () => {
  it('says Created with no earlier version, and No content changes for an identical one', () => {
    expect(summariseChange(fields, null, base)).toEqual(['Created'])
    expect(summariseChange(fields, base, structuredClone(base))).toEqual(['No content changes'])
  })

  it('names changed fields by label, and the fields inside a changed block', () => {
    const next = structuredClone(base)
    next.title = 'Start'
    next.layout[0].heading = 'New heading'
    next.layout[0].intro = 'y'
    next.seo.metaTitle = 'Start'
    expect(summariseChange(fields, base, next)).toEqual([
      'Title changed',
      'Hero ("New heading"): Heading, Intro changed',
      'SEO: Meta title changed',
    ])
  })

  it('matches blocks by id: a move is one change, and added or removed blocks are named', () => {
    const moved = structuredClone(base)
    moved.layout.reverse()
    expect(summariseChange(fields, base, moved)).toEqual(['Layout: order changed'])

    const edited = structuredClone(base)
    edited.layout = [edited.layout[1], { id: 'c', blockType: 'heroBanner', heading: 'Second hero' } as any]
    // Only the FAQ is in both, so there is no order to change.
    expect(summariseChange(fields, base, edited)).toEqual([
      'Hero ("Second hero") added',
      'Hero ("Old heading") removed',
    ])
  })

  it('counts array rows added, removed and edited, by id', () => {
    const next = structuredClone(base)
    next.points = [{ id: 'p1', text: 'One, edited' }, { id: 'p2', text: 'Two' }, { id: 'p3', text: 'Three' }]
    expect(summariseChange(fields, base, next)).toEqual(['Key points: 2 added, 1 edited'])
  })

  it('looks inside arrays held by a block', () => {
    const next = structuredClone(base)
    next.layout[1].items![0].q = 'Why not?'
    expect(summariseChange(fields, base, next)).toEqual(['FAQ: Questions changed'])
  })

  it('leaves out read-only fields and treats empty values as equal', () => {
    const next = structuredClone(base) as any
    next.path = '/elsewhere'
    next.tags = []
    next.seo.metaTitle = 'Home'
    expect(summariseChange(fields, { ...base, tags: null } as any, next)).toEqual(['No content changes'])
  })

  it('finds reusable blocks by slug from the config-level list', () => {
    const shared: any[] = [{ name: 'layout', type: 'blocks', label: 'Layout', blocks: [], blockReferences: ['faq'] }]
    expect(
      summariseChange(shared, { layout: [] }, { layout: [{ id: 'x', blockType: 'faq' }] }, { faq }),
    ).toEqual(['FAQ added'])
  })

  it('keeps long lists short', () => {
    const many: any[] = Array.from({ length: 12 }, (_, i) => ({ name: `f${i}`, type: 'text', label: `Field ${i}` }))
    const before = Object.fromEntries(many.map((f) => [f.name, 'a']))
    const after = Object.fromEntries(many.map((f) => [f.name, 'b']))
    const lines = summariseChange(many, before, after)
    expect(lines).toHaveLength(8)
    expect(lines[7]).toBe('and 5 more changes')
  })

  it('works on the real Pages fields', () => {
    expect(summariseChange(Pages.fields, { title: 'A', layout: [] }, { title: 'B', layout: [] })).toContain('Title changed')
  })
})

describe('rollback', () => {
  it('refuses a restore straight to live, with a plain message', () => {
    expect(() => draftRollbackOnly({ args: { id: 'v1' }, operation: 'restoreVersion', req: req() } as any)).toThrow(
      LIVE_ROLLBACK_REFUSED,
    )
    expect(() =>
      draftRollbackOnly({ args: { id: 'v1', draft: false }, operation: 'restoreVersion', req: req() } as any),
    ).toThrow(LIVE_ROLLBACK_REFUSED)
  })

  it('lets a draft rollback through, noting the version and skipping the website refresh and RAG sync', () => {
    const r = req()
    const args = { id: 'v1', draft: true }
    expect(draftRollbackOnly({ args, operation: 'restoreVersion', req: r } as any)).toBe(args)
    expect(r.context).toEqual({ [ROLLBACK_FROM]: 'v1', disableRevalidate: true, skipRag: true })
  })

  it('leaves every other operation alone', () => {
    const r = req()
    const args = { id: 'doc' }
    expect(draftRollbackOnly({ args, operation: 'update', req: r } as any)).toBe(args)
    expect(r.context).toEqual({})
  })
})

describe('who saved', () => {
  it('records a signed-in editor, and nobody for scripts or MCP keys', () => {
    expect(stampEditor({ data: {}, req: req({ user: { id: 'u1', collection: 'users' } }) } as any)).toEqual({
      updatedBy: 'u1',
      rolledBackFrom: null,
    })
    expect(stampEditor({ data: {}, req: req({ user: { id: 'k1', collection: 'payload-mcp-api-keys' } }) } as any)).toMatchObject({
      updatedBy: null,
    })
    expect(stampEditor({ data: {}, req: req() } as any)).toMatchObject({ updatedBy: null })
  })

  it('marks a rollback with the version it came from, and clears the mark on any other save', () => {
    const r = req({ user: { id: 'u1', collection: 'users' } })
    r.context[ROLLBACK_FROM] = 'v9'
    expect(stampEditor({ data: { rolledBackFrom: 'old' }, req: r } as any)).toMatchObject({ rolledBackFrom: 'v9' })
    expect(stampEditor({ data: { rolledBackFrom: 'old' }, req: req() } as any)).toMatchObject({ rolledBackFrom: null })
  })

  it('keeps both fields away from visitors and out of editors\' hands', () => {
    for (const f of historyFields() as any[]) {
      expect(f.access.read({ req: { user: null } })).toBe(false)
      expect(f.access.read({ req: { user: { id: 'u1' } } })).toBe(true)
      expect(f.access.update({ req: { user: { id: 'u1' } } })).toBe(false)
    }
  })
})

describe('events', () => {
  const stored = (status: string) => async () => status

  it('tells a rollback, a publish and an unpublish apart, and ignores draft saves', async () => {
    const rollback = req()
    rollback.context[ROLLBACK_FROM] = 'v1'
    expect(await eventFor({ doc: { _status: 'draft' }, req: rollback, storedStatus: stored('published') })).toBe('rolledBack')
    expect(await eventFor({ doc: { _status: 'published' }, req: req(), storedStatus: stored('published') })).toBe('published')
    expect(
      await eventFor({ doc: { _status: 'draft' }, previousDoc: { _status: 'published' }, req: req(), storedStatus: stored('draft') }),
    ).toBe('unpublished')
    // A draft saved over a live entry leaves the stored entry published.
    expect(
      await eventFor({ doc: { _status: 'draft' }, previousDoc: { _status: 'published' }, req: req(), storedStatus: stored('published') }),
    ).toBeNull()
    expect(await eventFor({ doc: { _status: 'draft' }, previousDoc: { _status: 'draft' }, req: req(), storedStatus: stored('draft') })).toBeNull()
  })

  it('are kept in a hidden log only the server writes to', () => {
    expect(ContentEvents.slug).toBe(CONTENT_EVENTS)
    expect(ContentEvents.admin?.hidden).toBe(true)
    for (const op of ['create', 'update', 'delete'] as const) expect((ContentEvents.access as any)[op]()).toBe(false)
    expect((ContentEvents.access as any).read({ req: { user: null } })).toBe(false)
  })
})

describe('rollback warnings', () => {
  it('finds uploads and relationships in blocks, arrays, groups and polymorphic fields', () => {
    const data = {
      layout: [{ id: 'a', blockType: 'heroBanner', image: 'm1' }],
      tags: [{ relationTo: 'categories', value: 'c1' }, { relationTo: 'posts', value: { id: 'p9' } }],
    }
    expect(collectRefs(fields, data, {})).toEqual([
      { collection: 'media', id: 'm1', label: 'image' },
      { collection: 'categories', id: 'c1', label: 'tags' },
      { collection: 'posts', id: 'p9', label: 'tags' },
    ])
  })
})

describe('preview links', () => {
  it('add the version to the usual preview link', () => {
    const url = withVersion('https://neuroncx.in/next/preview?path=%2Fhome&previewSecret=s', 'pages', 'v1', '2026-11-03T10:00:00.000Z')
    const u = new URL(url)
    expect(u.searchParams.get('path')).toBe('/home')
    expect(u.searchParams.get('version')).toBe('pages:v1')
    expect(u.searchParams.get('versionAt')).toBe('2026-11-03T10:00:00.000Z')
  })
})

describe('where History is on', () => {
  it('is on every collection with drafts, keeping every version, with the History tab and the live-restore block', async () => {
    const sanitized = await config
    const withDrafts = sanitized.collections.filter((c) => typeof c.versions === 'object' && c.versions?.drafts)
    expect(withDrafts.map((c) => c.slug).sort()).toEqual(
      [
        'connectionTypes',
        'crmFeatures',
        'customers',
        'features',
        'hubs',
        'industryTopics',
        'integrationCategories',
        'integrations',
        'integrationsMaster',
        'lists',
        'microApps',
        'pages',
        'posts',
        'rubrics',
        'sectors',
        'sharedContent',
      ].sort(),
    )
    for (const c of withDrafts) {
      expect(c.fields.some((f: any) => f.name === 'updatedBy'), c.slug).toBe(true)
      expect((c.versions as any).maxPerDoc, c.slug).toBe(0)
      expect((c.admin.components?.views?.edit as any)?.versions?.Component, c.slug).toBe('@/history/HistoryView#HistoryView')
      expect(c.hooks.beforeOperation, c.slug).toContain(draftRollbackOnly)
      expect(c.endpoints && c.endpoints.some((e) => e.path === '/:id/rollback-check'), c.slug).toBe(true)
    }
  })

  it('leaves collections without drafts as they were', async () => {
    const sanitized = await config
    for (const slug of ['media', 'users', 'categories', 'enquiries', CONTENT_EVENTS]) {
      const c = sanitized.collections.find((x) => x.slug === slug)!
      expect(c.fields.some((f: any) => f.name === 'updatedBy'), slug).toBe(false)
    }
  })
})
