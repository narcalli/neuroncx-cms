import 'dotenv/config'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import config from '@/payload.config'

/**
 * Saves whose hooks query inside the save's transaction. MongoDB refuses two
 * commands at once in one transaction, which on Atlas failed a save now and
 * then. Each test only saves: tests/helpers/transactionOverlaps.ts (from
 * vitest.setup.ts) fails it if any of those queries overlapped. Records are
 * temporary (ZZ TX, zz-tx-).
 */

const quiet = { overrideAccess: true, depth: 0, context: { disableRevalidate: true } } as const
const TAXONOMY = 'integrationCategories' as const

describe('hooks that query inside a save', () => {
  let payload: Payload
  let category: { id: string }
  const sweep = async () => {
    for (const collection of ['integrations', 'integrationsMaster', 'industryTopics', 'sectors', TAXONOMY] as const) {
      const found = await payload.find({ ...quiet, collection, where: { slug: { like: 'zz-tx-' } }, draft: true, pagination: false })
      for (const d of found.docs) await payload.delete({ ...quiet, collection, id: d.id }).catch(() => undefined)
    }
  }

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await sweep()
    category = (await payload.create({ ...quiet, collection: TAXONOMY, data: { name: 'ZZ TX category', slug: 'zz-tx-category' } })) as { id: string }
  })
  afterAll(async () => {
    vi.unstubAllEnvs()
    await sweep()
  })

  it('B: publishing an integration checks its slug against the master records', async () => {
    const saved = await payload.create({
      ...quiet,
      collection: 'integrations',
      data: { name: 'ZZ TX integration', slug: 'zz-tx-integration', status: 'live', category: category.id, _status: 'published' } as never,
    })
    expect(saved.id).toBeTruthy()
  })

  it('C: a master record marked main looks for another main record', async () => {
    // Refused when a real main record exists; either way the lookup ran.
    await payload
      .create({ ...quiet, collection: 'integrationsMaster', data: { name: 'ZZ TX master', slug: 'zz-tx-master', isMain: true } as never })
      .catch((err) => expect(err?.name).toBe('ValidationError'))
  })

  it('D: deleting a category first checks whether integrations or pages use it', async () => {
    const unused = await payload.create({ ...quiet, collection: TAXONOMY, data: { name: 'ZZ TX unused', slug: 'zz-tx-unused' } })
    await payload.delete({ ...quiet, collection: TAXONOMY, id: unused.id })
  })

  it('D: a category in use is refused with the number of integrations using it', async () => {
    await expect(payload.delete({ ...quiet, collection: TAXONOMY, id: category.id })).rejects.toThrow(/1 integration \(ZZ TX integration\)/)
  })

  it('E: publishing a topic looks up its industry and the sibling topics to refresh', async () => {
    // Revalidation on, but with no secret it stops before calling the website.
    vi.stubEnv('REVALIDATE_SECRET', '')
    const industry = await payload.create({ ...quiet, collection: 'sectors', data: { name: 'ZZ TX industry', slug: 'zz-tx-industry', summary: 'A test industry.' } as never, draft: true })
    const topic = await payload.create({
      overrideAccess: true,
      depth: 0,
      collection: 'industryTopics',
      data: { name: 'ZZ TX topic', slug: 'zz-tx-topic', summary: 'A test topic.', industry: industry.id, stageOrder: 99, hasOwnPage: false, _status: 'published' } as never,
    })
    expect(topic.id).toBeTruthy()
  })
})
