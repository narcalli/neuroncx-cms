import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { buildHubs } from '../../src/collections/Hubs'
import { Lists } from '../../src/collections/Lists'
import { MicroApps } from '../../src/collections/MicroApps'

/**
 * Preview button and live preview on Bot swarm agents, hubs and Lists: each
 * opens the website's /next/preview with the secret and the right page.
 */

const target = (url: string | null | undefined) => {
  if (!url) return null
  const u = new URL(url)
  return { route: `${u.origin}${u.pathname}`, path: u.searchParams.get('path'), secret: u.searchParams.get('previewSecret') }
}

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://site.test')
  vi.stubEnv('PREVIEW_SECRET', 'preview-secret')
})
afterEach(() => vi.unstubAllEnvs())

describe('agents', () => {
  const preview = MicroApps.admin!.preview!
  const live = (MicroApps.admin!.livePreview as any).url

  it("open the agent's own page when it has one", async () => {
    const doc = { slug: 'payment-services', hasOwnPage: true }
    expect(target(await preview(doc, {} as any))).toEqual({
      route: 'http://site.test/next/preview',
      path: '/bot-swarm/payment-services',
      secret: 'preview-secret',
    })
    expect(target(live({ data: doc }))?.path).toBe('/bot-swarm/payment-services')
  })

  it('open the hub page, where the card is, without one', async () => {
    expect(target(await preview({ slug: 'qualify', hasOwnPage: false }, {} as any))?.path).toBe('/bot-swarm')
  })
})

describe('hubs and groupings', () => {
  it('a hub opens its hub page at the collection route', async () => {
    const hubs = buildHubs()
    expect(target(await hubs.admin!.preview!({ forCollection: 'microApps' }, {} as any))?.path).toBe(
      '/bot-swarm',
    )
    expect(await hubs.admin!.preview!({ forCollection: 'nothing' }, {} as any)).toBeNull()
  })

  it('an agent family opens the bot swarm hub page; a list type with no collection has no preview', async () => {
    expect(target(await Lists.admin!.preview!({ type: 'agentFamily' }, {} as any))?.path).toBe('/bot-swarm')
    expect(await Lists.admin!.preview!({ type: 'crmArea' }, {} as any)).toBeNull()
    expect(target((Lists.admin!.livePreview as any).url({ data: { type: 'agentFamily' } }))?.path).toBe(
      '/bot-swarm',
    )
  })
})
