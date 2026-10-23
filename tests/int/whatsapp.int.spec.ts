import 'dotenv/config'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import config from '@/payload.config'
import { getContentCollection } from '../../src/content/registry'
import { entriesMessage, entryMessages, fallbackMessages, groupsMessage, WA } from '../../src/content/whatsapp'
import { waHandler } from '../../src/endpoints/wa'

/**
 * The WhatsApp endpoint. Builders are checked against fixtures, for every
 * limit; the endpoint against the local database with temporary agents
 * (Live, Pilot and Planned) and a family, all deleted afterwards.
 */

type Doc = Record<string, any>
const bot = () => getContentCollection('microApps')!

const long = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(' ')

describe('message builders', () => {
  const hub = {
    name: 'Bot swarm',
    waIntro: 'Pick a family to see its agents.',
    waListButton: 'See families',
    waSectionTitle: 'Agent families',
    waFallback: 'I can only show the agents listed. Please pick again.',
  }

  it('lists groupings with the hub copy, as a Cloud API list message', () => {
    const msg = groupsMessage(bot(), hub, [
      { slug: 'book-and-get-paid', name: 'Book and get paid', waRowDescription: 'Bookings and payments' },
    ]) as any
    expect(msg.type).toBe('interactive')
    expect(msg.interactive.type).toBe('list')
    expect(msg.interactive.body.text).toBe(hub.waIntro)
    expect(msg.interactive.action.button).toBe('See families')
    expect(msg.interactive.action.sections[0]).toEqual({
      title: 'Agent families',
      rows: [{ id: 'entries:book-and-get-paid', title: 'Book and get paid', description: 'Bookings and payments' }],
    })
  })

  it('enforces the limits, cutting on a whole word', () => {
    const groups = Array.from({ length: 14 }, (_, i) => ({
      slug: `g${i}`,
      name: `Group ${i} ${long(10)}`,
      waRowDescription: long(30),
    }))
    const msg = groupsMessage(bot(), { ...hub, waIntro: long(400), waListButton: long(8) }, groups) as any
    const { rows } = msg.interactive.action.sections[0]
    expect(rows).toHaveLength(WA.rows)
    for (const r of rows) {
      expect(r.title.length).toBeLessThanOrEqual(WA.rowTitle)
      expect(r.description.length).toBeLessThanOrEqual(WA.rowDescription)
      expect(r.title.endsWith(' ')).toBe(false)
      expect(r.description).toMatch(/word\d+$/)
    }
    expect(msg.interactive.body.text.length).toBeLessThanOrEqual(WA.body)
    expect(msg.interactive.body.text).toMatch(/word\d+$/)
    expect(msg.interactive.action.button.length).toBeLessThanOrEqual(WA.listButton)
  })

  it('marks a pilot entry in its row', () => {
    const msg = entriesMessage(bot(), hub, { name: 'Book and get paid' }, [
      { slug: 'a', name: 'Agent A', status: 'pilot', waRowDescription: 'Does one job' },
    ]) as any
    expect(msg.interactive.action.sections[0].rows[0]).toEqual({
      id: 'entry:a',
      title: 'Agent A',
      description: 'In pilot. Does one job',
    })
    expect(msg.interactive.header).toEqual({ type: 'text', text: 'Book and get paid' })
  })

  it('sends an entry as reply buttons, then its link as a link button', () => {
    const [main, link] = entryMessages({
      name: 'Payment services',
      status: 'live',
      waHeader: 'Payment services',
      waBody: 'Sends a payment link in the chat.',
      waKeyPoints: [{ line: 'Link sent at booking' }, { line: 'Expired links replaced' }],
      waFooter: 'NeuronCx',
      waButtons: [
        { label: 'See it in a demo', action: 'bookDemo' },
        { label: 'Other agents and more besides', action: 'otherAgents' },
        { label: 'Talk to sales', action: 'talkToSales' },
        { label: 'A fourth button', action: 'extra' },
      ],
      waLink: '/bot-swarm#payment-services',
    }) as any[]
    expect(main.interactive.type).toBe('button')
    expect(main.interactive.header).toEqual({ type: 'text', text: 'Payment services' })
    expect(main.interactive.body.text).toBe(
      'Sends a payment link in the chat.\n\n• Link sent at booking\n• Expired links replaced',
    )
    expect(main.interactive.footer).toEqual({ text: 'NeuronCx' })
    const buttons = main.interactive.action.buttons
    expect(buttons).toHaveLength(WA.buttons)
    expect(buttons[1]).toEqual({ type: 'reply', reply: { id: 'otherAgents', title: 'Other agents and' } })
    for (const b of buttons) expect(b.reply.title.length).toBeLessThanOrEqual(WA.buttonLabel)
    expect(link.interactive.type).toBe('cta_url')
    expect(link.interactive.action).toEqual({
      name: 'cta_url',
      parameters: { display_text: 'Read more', url: 'https://neuroncx.in/bot-swarm#payment-services' },
    })
  })

  it('sends one link message when an entry has no buttons, and plain text when it has neither', () => {
    const [only] = entryMessages({ name: 'A', status: 'pilot', waBody: 'Body.', waLink: '/bot-swarm#a' }) as any[]
    expect(only.interactive.type).toBe('cta_url')
    expect(only.interactive.body.text).toBe('In pilot. Body.')
    expect(entryMessages({ name: 'B', status: 'live', waBody: 'Just text.' })).toEqual([
      { type: 'text', text: { body: 'Just text.' } },
    ])
  })

  it("answers anything not found with the hub's fallback", () => {
    expect(fallbackMessages(hub)).toEqual([{ type: 'text', text: { body: hub.waFallback } }])
    expect((fallbackMessages(null)[0] as any).text.body).toMatch(/^Sorry/)
  })
})

describe('GET /api/wa/:collection, with seeded data', () => {
  let payload: Payload
  const created: { collection: 'microApps' | 'lists'; id: string }[] = []
  const quiet = { overrideAccess: true, context: { skipRag: true, disableRevalidate: true } } as const
  const family: Doc = {}

  const call = async (query: Record<string, string>, opts: { collection?: string; key?: string } = {}) => {
    const res = await waHandler({
      payload,
      headers: new Headers(opts.key === undefined ? { 'x-api-key': 'test-key' } : opts.key ? { 'x-api-key': opts.key } : {}),
      routeParams: { collection: opts.collection ?? 'microApps' },
      searchParams: new URLSearchParams(query),
    } as any)
    return { status: res.status, body: (await res.json()) as any }
  }

  const agent = async (slug: string, status: string, order: number) => {
    const doc = await payload.create({
      ...quiet,
      collection: 'microApps',
      data: {
        name: `ZZ WA ${slug}`,
        slug: `zz-wa-${slug}`,
        status,
        order,
        family: family.id,
        summary: `${slug} summary for the WhatsApp test.`,
        keyPoints: [{ line: 'One' }, { line: 'Two' }, { line: 'Three' }],
        waBody: `${slug} body.`,
        waButtons: [{ label: 'Book a demo', action: 'bookDemo' }],
        _status: 'published',
      } as any,
    })
    created.push({ collection: 'microApps', id: String(doc.id) })
    return doc
  }

  beforeAll(async () => {
    vi.stubEnv('WA_API_KEY', 'test-key')
    payload = await getPayload({ config: await config })
    const f = await payload.create({
      ...quiet,
      collection: 'lists',
      data: { name: 'ZZ WA test family', slug: 'zz-wa-test-family', type: 'agentFamily', order: 1, _status: 'published' } as any,
    })
    created.push({ collection: 'lists', id: String(f.id) })
    Object.assign(family, f)
    await agent('live', 'live', 20)
    await agent('pilot', 'pilot', 10)
    await agent('planned', 'planned', 5)
  })

  afterAll(async () => {
    for (const c of created.reverse()) await payload.delete({ ...quiet, collection: c.collection, id: c.id })
    vi.unstubAllEnvs()
  })

  it('refuses a request without the key', async () => {
    expect((await call({ step: 'groups' }, { key: '' })).status).toBe(401)
    expect((await call({ step: 'groups' }, { key: 'wrong-key' })).status).toBe(401)
  })

  it('refuses a collection that is not registered', async () => {
    expect((await call({ step: 'groups' }, { collection: 'pages' })).status).toBe(404)
  })

  it('groups: lists the family, which has public agents', async () => {
    const { status, body } = await call({ step: 'groups' })
    expect(status).toBe(200)
    expect(body).toMatchObject({ collection: 'microApps', step: 'groups', found: true })
    const rows = body.messages[0].interactive.action.sections[0].rows
    expect(rows).toContainEqual(
      expect.objectContaining({ id: 'entries:zz-wa-test-family', title: 'ZZ WA test family' }),
    )
  })

  it('entries: the live and pilot agents by order, never the planned one', async () => {
    const { body } = await call({ step: 'entries', group: 'zz-wa-test-family' })
    expect(body.found).toBe(true)
    const rows = body.messages[0].interactive.action.sections[0].rows
    expect(rows.map((r: Doc) => r.id)).toEqual(['entry:zz-wa-pilot', 'entry:zz-wa-live'])
    expect(rows[0].description).toMatch(/^In pilot\./)
    expect(rows.length).toBeLessThanOrEqual(WA.rows)
  })

  it('entry: a live agent as a message; a planned one is the fallback', async () => {
    const live = await call({ step: 'entry', slug: 'zz-wa-live' })
    expect(live.body.found).toBe(true)
    expect(live.body.messages[0].interactive.body.text).toBe('live body.')
    const planned = await call({ step: 'entry', slug: 'zz-wa-planned' })
    expect(planned.body).toMatchObject({ step: 'entry', found: false })
    expect(planned.body.messages[0].type).toBe('text')
    expect(JSON.stringify(planned.body)).not.toContain('planned body')
  })

  it('answers anything not found with the fallback', async () => {
    expect((await call({ step: 'entries', group: 'no-such-family' })).body.found).toBe(false)
    expect((await call({ step: 'entry', slug: 'no-such-agent' })).body.found).toBe(false)
    expect((await call({ step: 'entries' })).body.found).toBe(false)
  })

  it('never returns a planned entry from any step', async () => {
    const all = JSON.stringify([
      (await call({ step: 'groups' })).body,
      (await call({ step: 'entries', group: 'zz-wa-test-family' })).body,
      (await call({ step: 'entry', slug: 'zz-wa-planned' })).body,
    ])
    expect(all).not.toMatch(/zz-wa-planned|ZZ WA planned/)
  })
})
