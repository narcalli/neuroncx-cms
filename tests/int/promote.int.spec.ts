import fs from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  changedKeys,
  createPromoter,
  describeError,
  matchOf,
  orderCollections,
  ruleFor,
} from '../../scripts/promote-page.mjs'

/**
 * scripts/promote-page.mjs --collection: ordering, slug matching, remapping
 * and refusals, against a stubbed fetch standing in for local and live.
 */

type Doc = Record<string, any>

const LIVE = 'http://live.test'
const LOCAL = 'http://local.test'

// Live: records with ids unlike local's, so a passed-through local id shows.
const liveData: Record<string, Doc[]> = {
  lists: [{ id: 'live-fam', slug: 'book-and-get-paid', type: 'agentFamily' }],
  integrations: [{ id: 'live-razorpay', slug: 'ncx-integrations-razorpay' }],
  microApps: [{ id: 'live-pay', slug: 'payment-services', name: 'Payment services', summary: 'Old summary.' }],
  posts: [{ id: 'live-post', slug: 'a-post' }],
  media: [],
}

const stubFetch = () =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL) => {
      const url = new URL(String(input))
      const [, , collection] = url.pathname.split('/')
      if (url.origin === LIVE) {
        const wheres = [...url.searchParams.entries()].filter(([k]) => k.startsWith('where['))
        const docs = (liveData[collection] ?? []).filter((d) =>
          wheres.every(([k, v]) => String(d[k.slice(6, k.indexOf(']'))]) === v),
        )
        return new Response(JSON.stringify({ docs }), { status: 200 })
      }
      return new Response('{}', { status: 404 })
    }),
  )

afterEach(() => vi.unstubAllGlobals())

const fam = { id: 'local-fam', slug: 'book-and-get-paid', type: 'agentFamily', name: 'Book and get paid', createdAt: 'x', updatedAt: 'x' }
const doc = (o: Doc) => ({ createdAt: 'x', updatedAt: 'x', ...o })

describe('order and matching', () => {
  it('promotes Lists entries, then agents, then hubs, whatever order they are given in', () => {
    expect(orderCollections(['hubs', 'microApps', 'lists'])).toEqual(['lists', 'microApps', 'hubs'])
    expect(orderCollections(['hubs', 'pages', 'lists'])).toEqual(['lists', 'hubs', 'pages'])
  })

  it('matches by slug, Lists entries by slug and type, media by filename, never by id', () => {
    expect(matchOf('microApps', { id: 'x', slug: 'a' })).toEqual({ slug: 'a' })
    expect(matchOf('lists', { id: 'x', slug: 'a', type: 'agentFamily' })).toEqual({ slug: 'a', type: 'agentFamily' })
    expect(matchOf('media', { id: 'x', filename: 'f.png' })).toEqual({ filename: 'f.png' })
  })

  it('knows which block a layout relationship belongs to', () => {
    expect(ruleFor('hubs', ['layout', 3, 'selectedDocs', 0], 'hubWorksWithSection')?.to).toBe('integrations')
    expect(ruleFor('hubs', ['layout', 3, 'selectedDocs', 0], 'hubArticlesSection')?.to).toBe('posts')
    expect(ruleFor('microApps', ['passesTo', 2], undefined)?.to).toBe('microApps')
  })
})

describe('remapping', () => {
  it('replaces every relationship with the live id of the record with the same slug', async () => {
    stubFetch()
    const p = createPromoter({ LIVE, LOCAL, liveHeaders: {}, WRITE: false })
    const { body, problems } = await p.toLiveRecord(
      'microApps',
      doc({
        id: 'local-agent',
        slug: 'payment-services',
        status: 'planned',
        family: fam,
        integrations: [doc({ id: 'local-razorpay', slug: 'ncx-integrations-razorpay', name: 'Razorpay' })],
      }),
      new Set(),
    )
    expect(problems).toEqual([])
    expect(body).toMatchObject({ slug: 'payment-services', status: 'planned', family: 'live-fam', integrations: ['live-razorpay'] })
    expect(JSON.stringify(body)).not.toMatch(/local-/)
  })

  it('remaps hub chat agents, grouping rows, industries and block selections', async () => {
    stubFetch()
    const p = createPromoter({ LIVE, LOCAL, liveHeaders: {}, WRITE: false })
    const pay = doc({ id: 'local-pay', slug: 'payment-services' })
    const { body, problems } = await p.toLiveRecord(
      'hubs',
      doc({
        id: 'local-hub',
        slug: 'bot-swarm',
        heroChat: [{ id: 'row', sender: 'entry', entry: { relationTo: 'microApps', value: pay }, text: 'Hi' }],
        groupingSections: [{ id: 'row', group: fam, entries: [{ relationTo: 'microApps', value: pay }] }],
        layout: [
          { id: 'b1', blockType: 'hubWorksWithSection', selectedDocs: [doc({ id: 'local-razorpay', slug: 'ncx-integrations-razorpay' })] },
          { id: 'b2', blockType: 'hubArticlesSection', selectedDocs: [doc({ id: 'local-post', slug: 'a-post' })] },
          { id: 'b3', blockType: 'hubIndustriesSection', industries: [{ id: 'r', entries: [{ relationTo: 'microApps', value: pay }] }] },
        ],
      }),
      new Set(),
    )
    expect(problems).toEqual([])
    expect(body.heroChat[0].entry).toEqual({ relationTo: 'microApps', value: 'live-pay' })
    expect(body.groupingSections[0]).toEqual({ group: 'live-fam', entries: [{ relationTo: 'microApps', value: 'live-pay' }] })
    expect(body.layout[0].selectedDocs).toEqual(['live-razorpay'])
    expect(body.layout[1].selectedDocs).toEqual(['live-post'])
    expect(body.layout[2].industries[0].entries).toEqual([{ relationTo: 'microApps', value: 'live-pay' }])
  })

  it('refuses a record whose target is not on live, naming it', async () => {
    stubFetch()
    const p = createPromoter({ LIVE, LOCAL, liveHeaders: {}, WRITE: true })
    const { problems } = await p.toLiveRecord(
      'microApps',
      doc({ id: 'a', slug: 'qualify', family: { ...fam, slug: 'follow-up' } }),
      new Set(),
    )
    expect(problems).toEqual(['family: lists "follow-up" does not exist on live yet'])
  })

  it('refuses a target with no slug, and a linked record with no rule', async () => {
    stubFetch()
    const p = createPromoter({ LIVE, LOCAL, liveHeaders: {}, WRITE: true })
    const { problems } = await p.toLiveRecord(
      'microApps',
      doc({
        id: 'a',
        slug: 'a',
        integrations: [doc({ id: 'local-k', name: 'Knowlarity' })],
        layout: [{ id: 'b', blockType: 'testimonial', customer: doc({ id: 'local-c', slug: 'c' }) }],
      }),
      new Set(),
    )
    expect(problems).toEqual([
      'integrations.0: integrations "Knowlarity" has no slug, so it cannot be matched on live',
      'layout.0.customer: a linked record with no promote rule (add one to RELATIONS)',
    ])
  })

  it('holds back a link to a record this run creates later, never sending a local id', async () => {
    stubFetch()
    const plan = new Set(['microApps:{"slug":"test-matching-and-pricing"}'])
    const record = doc({ id: 'a', slug: 'prescription-understanding', passesTo: [doc({ id: 'local-tm', slug: 'test-matching-and-pricing' })] })
    const dry = await createPromoter({ LIVE, LOCAL, liveHeaders: {}, WRITE: false }).toLiveRecord('microApps', record, plan)
    expect(dry.body.passesTo).toEqual(['(new in this run: microApps "test-matching-and-pricing")'])
    const write = await createPromoter({ LIVE, LOCAL, liveHeaders: {}, WRITE: true }).toLiveRecord('microApps', record, plan)
    expect(write).toMatchObject({ deferred: true, problems: [] })
    expect(write.body.passesTo).toEqual([])
  })
})

describe('changes and safety', () => {
  it('reports the fields that differ, ignoring ids, timestamps and empty values', () => {
    const live = { id: 'x', name: 'A', summary: 'Old', faqs: [], tagline: null, rows: [{ id: 'r1', line: 'One' }] }
    expect(changedKeys({ name: 'A', summary: 'New', faqs: [], tagline: '', rows: [{ line: 'One' }] }, live)).toEqual(['summary'])
  })

  it('names the fields live refused, instead of raw JSON', () => {
    const body = JSON.stringify({ errors: [{ data: { errors: [{ label: 'Card > Summary', message: 'This field is required.' }, { path: 'family', message: 'This field is required.' }] } }] })
    expect(describeError(body)).toBe('Card > Summary: This field is required.; family: This field is required.')
    expect(describeError('Bad gateway')).toBe('Bad gateway')
  })

  it('never deletes anything on live', () => {
    const source = fs.readFileSync('scripts/promote-page.mjs', 'utf8')
    expect(source).not.toMatch(/method:\s*['"]DELETE['"]/)
    expect(source).not.toMatch(/\.delete\(\s*\{/)
  })
})
