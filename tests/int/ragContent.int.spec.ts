import { describe, expect, it, vi } from 'vitest'

import { buildHubs } from '../../src/collections/Hubs'
import { MicroApps } from '../../src/collections/MicroApps'
import { defineContentCollection } from '../../src/content/defineContentCollection'
import { contentRagSource, hubRagSource } from '../../src/rag/content'
import { getRagSource, isRagSource } from '../../src/rag/sources'

/**
 * Knowledge base sources for content collections and hubs, on the real Bot
 * swarm and Hubs configs. The payload is a stand-in whose find returns only
 * what a visitor could read.
 */

type Doc = Record<string, any>

// What an anonymous read returns, by collection and id.
const VISIBLE: Record<string, Doc[]> = {
  lists: [{ id: 'fam1', name: 'Book and get paid' }],
  integrations: [{ id: 'int1', name: 'Razorpay' }],
  microApps: [{ id: 'agent2', name: 'Test matching and pricing' }],
  customers: [
    { id: 'c1', name: 'Real Hospital', anonymisedName: 'A hospital group', showName: false },
    { id: 'c2', name: 'Named Clinic', showName: true },
  ],
}

const fakePayload = () => {
  const find = vi.fn(async ({ collection, where, overrideAccess }: any) => {
    expect(overrideAccess).toBe(false)
    const ids: string[] = where.id.in
    return { docs: (VISIBLE[collection] ?? []).filter((d) => ids.includes(d.id)) }
  })
  return {
    find,
    blocks: {},
    collections: { microApps: { config: MicroApps }, hubs: { config: buildHubs() } },
  } as any
}

const agent: Doc = {
  id: 'agent1',
  _status: 'published',
  status: 'live',
  includeInKbase: true,
  name: 'Payment services',
  slug: 'payment-services',
  hasOwnPage: false,
  family: 'fam1',
  tagline: 'Sends the link and sees it through',
  summary: 'Customers get a working payment link in the chat, and your team stops checking by hand.',
  // Detail is one section; under 40 characters a section carries too little and is dropped.
  whoItsFor: 'Front desk teams and billing staff at clinics and hotels.',
  searchName: 'WhatsApp payment link',
  hears: 'Payment questions and requests for the link.',
  checks: 'Whether this booking source should get a link.',
  result: 'Fewer manual status checks.',
  teamControls: 'Which booking sources get a link, and the discount percentages.',
  // A draft agent and a Planned one are never named.
  passesTo: ['agent2', 'agentPlanned'],
  integrations: ['int1'],
  customers: ['c1', 'c2'],
  kbAnswer: 'Payment services is the NeuronCx agent that sends WhatsApp payment links through Razorpay.',
  kbFacts: [{ fact: 'Payment links are sent through Razorpay.' }],
  kbQuestions: [{ question: 'Can I send payment links on WhatsApp?' }],
  faqs: [{ question: 'What happens if a link expires?', answer: 'The customer gets a new one in the chat.' }],
  waBody: 'WHATSAPP BODY SHOULD NEVER BE SENT',
  meta: { title: 'SEO TITLE SHOULD NEVER BE SENT', description: 'SEO DESCRIPTION SHOULD NEVER BE SENT' },
  layout: [{ blockType: 'faqSection', heading: 'LAYOUT HEADING SHOULD NEVER BE SENT' }],
}

describe('sources', () => {
  it('finds registered content collections with the kbase group, and hubs, without listing them', () => {
    expect(isRagSource('microApps')).toBe(true)
    expect(isRagSource('hubs')).toBe(true)
    expect(isRagSource('integrations')).toBe(true)
    expect(isRagSource('pages')).toBe(false)
    defineContentCollection({ slug: 'zzNoKbase', label: 'X', groups: ['faq'] })
    expect(getRagSource('zzNoKbase')).toBeUndefined()
  })

  it('sends published Live or Pilot entries with the knowledge base switch on, and nothing else', () => {
    const source = contentRagSource('microApps')!
    expect(source.shouldIndex(agent)).toBe(true)
    expect(source.shouldIndex({ ...agent, status: 'pilot' })).toBe(true)
    expect(source.shouldIndex({ ...agent, status: 'planned' })).toBe(false)
    expect(source.shouldIndex({ ...agent, _status: 'draft' })).toBe(false)
    expect(source.shouldIndex({ ...agent, includeInKbase: false })).toBe(false)
  })

  it('marks a pilot in the title every section carries', () => {
    const source = contentRagSource('microApps')!
    expect(source.titleOf(agent)).toBe('Payment services')
    expect(source.titleOf({ ...agent, status: 'pilot' })).toBe('Payment services (in pilot)')
  })

  it('links to the own page, else the hub', () => {
    const source = contentRagSource('microApps')!
    expect(source.urlOf(agent)).toBe('/bot-swarm')
    expect(source.urlOf({ ...agent, hasOwnPage: true })).toBe('/bot-swarm/payment-services')
  })
})

describe('entry sections', () => {
  it('puts the knowledge base first, then FAQ and detail, then the collection tabs', async () => {
    const sections = await contentRagSource('microApps')!.serialize!(fakePayload(), agent)
    expect(sections.map((s) => s.key)).toEqual([
      'tab:Knowledge base',
      'tab:FAQ',
      'tab:Detail',
      'tab:Card',
      'tab:Panel',
    ])
    expect(sections.map((s) => s.heading)).toEqual(['About', 'Questions', 'Detail', 'In short', 'How it works'])
  })

  it('weights the answer, then the facts, and adds the resolved names a visitor would see', async () => {
    const about = (await contentRagSource('microApps')!.serialize!(fakePayload(), agent))[0]
    const lines = about.body.split('\n')
    expect(lines[0]).toBe(agent.kbAnswer)
    expect(lines[1]).toBe('Payment links are sent through Razorpay.')
    expect(lines).toEqual(
      expect.arrayContaining([
        'Family: Book and get paid.',
        'Passes to: Test matching and pricing.',
        'Works with: Razorpay.',
        // The customers collection's own rule: no real name without Show real name.
        'Live at: A hospital group, Named Clinic.',
      ]),
    )
    expect(about.body).not.toContain('Real Hospital')
  })

  it('sends the panel fields, the result and team controls', async () => {
    const panel = (await contentRagSource('microApps')!.serialize!(fakePayload(), agent)).find(
      (s) => s.key === 'tab:Panel',
    )!
    for (const text of [agent.hears, agent.checks, agent.result, agent.teamControls]) {
      expect(panel.body).toContain(text)
    }
  })

  it('never sends the SEO or WhatsApp tabs, or the layout', async () => {
    const all = (await contentRagSource('microApps')!.serialize!(fakePayload(), agent)).map((s) => s.body).join('\n')
    expect(all).not.toMatch(/SHOULD NEVER BE SENT/)
  })

  it('leaves the Page tab out while Own page is off, as the site does', async () => {
    const off = await contentRagSource('microApps')!.serialize!(fakePayload(), { ...agent, proof: 'Live at a group.' })
    expect(off.map((s) => s.key)).not.toContain('tab:Page')
    const on = await contentRagSource('microApps')!.serialize!(fakePayload(), {
      ...agent,
      hasOwnPage: true,
      proof: 'Live at a hospital group in two cities, since March.',
    })
    expect(on.find((s) => s.key === 'tab:Page')?.body).toContain('Live at a hospital group in two cities, since March.')
  })
})

describe('hub sections', () => {
  const hub: Doc = {
    _status: 'published',
    includeInKbase: true,
    name: 'Bot swarm',
    forCollection: 'microApps',
    h1: 'HERO SHOULD NEVER BE SENT',
    kbAnswer: 'The bot swarm is a team of small NeuronCx agents, each with one job, working from one customer record.',
    kbFacts: [{ fact: 'Every agent hands over to a person when a decision needs one.' }],
    faqHeading: 'Questions buyers ask',
    faqs: [{ question: 'What is a bot swarm?', answer: 'A team of small agents, each with one job, sharing one record.' }],
    closing: { heading: 'CLOSING SHOULD NEVER BE SENT' },
    waIntro: 'WHATSAPP SHOULD NEVER BE SENT',
  }

  it("sends the hub's answer, facts and FAQ under its name, and nothing else", async () => {
    expect(hubRagSource.titleOf(hub)).toBe('Bot swarm')
    expect(hubRagSource.urlOf(hub)).toBe('/bot-swarm')
    const sections = await hubRagSource.serialize!(fakePayload(), hub)
    expect(sections.map((s) => s.heading)).toEqual(['About', 'Questions'])
    expect(sections[0].body.split('\n')[0]).toBe(hub.kbAnswer)
    expect(sections.map((s) => s.body).join('\n')).not.toMatch(/SHOULD NEVER BE SENT/)
  })

  it('sends only published hubs with the knowledge base switch on', () => {
    expect(hubRagSource.shouldIndex(hub)).toBe(true)
    expect(hubRagSource.shouldIndex({ ...hub, _status: 'draft' })).toBe(false)
    expect(hubRagSource.shouldIndex({ ...hub, includeInKbase: false })).toBe(false)
  })
})
