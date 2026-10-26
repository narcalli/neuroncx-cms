import 'dotenv/config'
import { createLocalReq, getPayload, type Field, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import config from '@/payload.config'
import { AgenticFlowDemo } from '@/blocks/AgenticFlowDemo/config'
import { MicroApps } from '@/collections/MicroApps'
import { flowDemoShows, revalidateFlowDemoPages } from '@/collections/MicroApps/flowDemoPages'
import { VERTICAL_OPTIONS } from '@/fields/verticals'

/**
 * Agentic Flow Demo, "Show agents for" Chosen industries, and refreshing the
 * pages that show an agent. The hook is called with a made-up agent, so no
 * agent is created or changed; the pages are temporary (slugs zz-fdi-).
 */

vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }))

const flat = (fields: any[]): any[] => fields.flatMap((f) => (f.type === 'row' || f.type === 'collapsible' ? flat(f.fields) : [f]))
const named = (fields: Field[], name: string): any => flat(fields).find((f) => f.name === name)

describe('one list of industries', () => {
  it("gives an agent's Verticals and the block's Industries the same options", () => {
    expect(named(MicroApps.fields, 'verticals').options).toEqual([...VERTICAL_OPTIONS])
    expect(named(AgenticFlowDemo.fields, 'industries').options).toEqual([...VERTICAL_OPTIONS])
    expect(VERTICAL_OPTIONS.map((o) => o.value)).toEqual(['healthcare', 'diagnostics', 'education', 'hospitality'])
  })
})

describe('the fields', () => {
  const agentsFor = named(AgenticFlowDemo.fields, 'agentsFor')
  const industries = named(AgenticFlowDemo.fields, 'industries')

  it('adds "Show agents for": All agents by default, or Chosen industries, in Agent features mode only', () => {
    expect(agentsFor).toMatchObject({ type: 'select', label: 'Show agents for', defaultValue: 'all' })
    expect(agentsFor.options).toEqual([
      { label: 'All agents', value: 'all' },
      { label: 'Chosen industries', value: 'industries' },
    ])
    expect(agentsFor.admin.condition({}, { mode: 'agentFeatures' })).toBe(true)
    expect(agentsFor.admin.condition({}, { mode: 'flow' })).toBe(false)
  })

  it('asks for industries, several allowed, only when Chosen industries is picked', () => {
    expect(industries).toMatchObject({ type: 'select', hasMany: true, required: true })
    expect(industries.admin.condition({}, { mode: 'agentFeatures', agentsFor: 'industries' })).toBe(true)
    expect(industries.admin.condition({}, { mode: 'agentFeatures', agentsFor: 'all' })).toBe(false)
    expect(industries.admin.condition({}, { mode: 'flow', agentsFor: 'industries' })).toBe(false)
  })
})

describe('which blocks show an agent', () => {
  const demo = (over: object) => ({ blockType: 'agenticFlowDemo', mode: 'agentFeatures', ...over })
  it('all agents shows every agent; chosen industries only agents in one of them', () => {
    expect(flowDemoShows(demo({ agentsFor: 'all' }), [])).toBe(true)
    expect(flowDemoShows(demo({}), ['education'])).toBe(true)
    expect(flowDemoShows(demo({ agentsFor: 'industries', industries: ['education'] }), ['education', 'healthcare'])).toBe(true)
    expect(flowDemoShows(demo({ agentsFor: 'industries', industries: ['education'] }), ['healthcare'])).toBe(false)
    expect(flowDemoShows(demo({ agentsFor: 'industries', industries: ['education'] }), [])).toBe(false)
  })
  it('a Flow mode block, a hidden block or another block shows no agent', () => {
    expect(flowDemoShows(demo({ mode: 'flow' }), ['education'])).toBe(false)
    expect(flowDemoShows(demo({ hidden: true }), ['education'])).toBe(false)
    expect(flowDemoShows({ blockType: 'content' } as any, ['education'])).toBe(false)
  })
})

describe('refreshing pages when an agent changes', () => {
  let payload: Payload
  const ids: string[] = []
  const sent: string[][] = []

  const pageWith = async (slug: string, block: object) => {
    const doc = await payload.create({
      collection: 'pages',
      context: { disableRevalidate: true },
      data: {
        title: `ZZ FDI ${slug}`,
        slug: `zz-fdi-${slug}`,
        hero: { type: 'none' },
        layout: [{ blockType: 'agenticFlowDemo', heading: 'Agents', ...block }],
        _status: 'published',
      } as any,
    })
    ids.push(String(doc.id))
  }

  const run = async (doc: object, previousDoc: object) => {
    sent.length = 0
    const req = await createLocalReq({ context: {} }, payload)
    await revalidateFlowDemoPages({ doc, previousDoc, req } as any)
    return sent.flat()
  }

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://site.test')
    vi.stubEnv('REVALIDATE_SECRET', 'test-secret')
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init: RequestInit) => {
        if (String(url) === 'http://site.test/api/revalidate') sent.push(JSON.parse(String(init.body)).paths)
        return new Response('{}', { status: 200 })
      }),
    )
    await pageWith('all', { mode: 'agentFeatures', agentsFor: 'all' })
    await pageWith('education', { mode: 'agentFeatures', agentsFor: 'industries', industries: ['education'] })
    await pageWith('healthcare', { mode: 'agentFeatures', agentsFor: 'industries', industries: ['healthcare'] })
    await pageWith('flow', {
      mode: 'flow',
      events: [
        {
          label: 'An event',
          handlers: 'agent',
          triggerTitle: 'A message arrives',
          triggerText: 'A student asks about fees.',
          routeText: 'The fees agent picks it up.',
          resolveTitle: 'Answered',
          resolveText: 'The balance is sent back.',
        },
      ],
    })
  })

  afterAll(async () => {
    for (const id of ids) await payload.delete({ collection: 'pages', id, context: { disableRevalidate: true } })
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('refreshes pages showing all agents and pages for an industry the agent is in', async () => {
    const paths = await run({ slug: 'zz-agent', _status: 'published', verticals: ['education'] }, { _status: 'published', verticals: [] })
    expect(paths).toEqual(expect.arrayContaining(['/zz-fdi-all', '/zz-fdi-education']))
    expect(paths).not.toContain('/zz-fdi-healthcare')
    expect(paths).not.toContain('/zz-fdi-flow')
  })

  it('also refreshes pages for an industry the agent has just left', async () => {
    const paths = await run({ slug: 'zz-agent', _status: 'published', verticals: ['education'] }, { _status: 'published', verticals: ['healthcare'] })
    expect(paths).toEqual(expect.arrayContaining(['/zz-fdi-all', '/zz-fdi-education', '/zz-fdi-healthcare']))
  })

  it('refreshes nothing for an agent that was not published before and is not now', async () => {
    expect(await run({ slug: 'zz-agent', _status: 'draft', verticals: ['education'] }, { _status: 'draft' })).toEqual([])
  })
})
