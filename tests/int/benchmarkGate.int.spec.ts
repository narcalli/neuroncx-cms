import 'dotenv/config'
import type { PayloadRequest } from 'payload'
import { describe, expect, it } from 'vitest'

import config from '@/payload.config'
import { GATE_MODE, noteBenchmarkGate } from '@/lifecycle/benchmarkGate'
import { contentHash } from '@/lifecycle/contentHash'

/**
 * The publish gate, warning-only (src/lifecycle/benchmarkGate.ts), the content
 * hash it matches runs by. The tests against the local database are in
 * tests/helpers/benchmarkGateDb.ts, run from tests/int/benchmark.int.spec.ts.
 */

describe('the content hash', () => {
  const doc = {
    id: 'a1',
    name: 'Payment services',
    _status: 'draft',
    updatedAt: '2026-11-11T00:00:00.000Z',
    updatedBy: 'u1',
    keyPoints: [{ id: 'r1', line: 'Sends the link' }],
    family: { id: 'f1', name: 'Book and get paid', createdAt: '2026-10-01', updatedAt: '2026-10-02' },
    customers: [{ relationTo: 'customers', value: { id: 'c1', name: 'A group', updatedAt: 'x' } }],
    meta: { title: 'Payment services | NeuronCx', description: null },
    hasOwnPage: false,
    gateOverride: true,
    gateOverrideReason: 'Launch week',
  }

  it('is the same for a saved version and the save about to happen', () => {
    const saving = {
      name: 'Payment services',
      _status: 'published',
      keyPoints: [{ id: 'r9', line: 'Sends the link' }],
      family: 'f1',
      customers: [{ relationTo: 'customers', value: 'c1' }],
      meta: { title: 'Payment services | NeuronCx' },
    }
    expect(contentHash(saving)).toBe(contentHash(doc))
  })

  it('ignores ids, timestamps, draft state, who saved, empty fields and the override', () => {
    expect(contentHash({ ...doc, gateOverride: false, gateOverrideReason: '', updatedBy: 'u2', meta: { title: 'Payment services | NeuronCx', description: '' } })).toBe(
      contentHash(doc),
    )
  })

  it('changes when anything a reader or the bot sees changes', () => {
    expect(contentHash({ ...doc, keyPoints: [{ id: 'r1', line: 'Sends the payment link' }] })).not.toBe(contentHash(doc))
    expect(contentHash({ ...doc, family: 'f2' })).not.toBe(contentHash(doc))
    expect(contentHash({ ...doc, keyPoints: [...doc.keyPoints, { id: 'r2', line: 'Confirms payment' }] })).not.toBe(contentHash(doc))
  })
})

describe('the gate, warning-only', () => {
  it('only warns for now', () => {
    expect(GATE_MODE).toBe('warn')
  })

  it('records a failed check as not scored instead of stopping the publish', async () => {
    const req = {
      user: { id: 'u1', collection: 'users' },
      context: {},
      payload: {
        find: async () => {
          throw new Error('database unavailable')
        },
        logger: { warn: () => undefined },
      },
    } as unknown as PayloadRequest
    await expect(noteBenchmarkGate('sectors', { name: 'X' }, 'id1', req)).resolves.toBeUndefined()
    expect(req.context.benchmarkGate).toMatchObject({
      'sectors:id1': { state: 'notScored', reason: 'Not scored: the benchmark check failed (database unavailable).' },
    })
  })

  it('leaves saves with nobody signed in alone, such as scheduled publishes', async () => {
    const req = { user: null, context: {}, payload: {} } as unknown as PayloadRequest
    await noteBenchmarkGate('microApps', { name: 'X' }, 'id1', req)
    expect(req.context.benchmarkGate).toBeUndefined()
  })

  it('ignores collections it does not cover', async () => {
    const req = { user: { id: 'u1', collection: 'users' }, context: {}, payload: {} } as unknown as PayloadRequest
    await noteBenchmarkGate('pages', { title: 'X' }, 'id1', req)
    expect(req.context.benchmarkGate).toBeUndefined()
  })

  it('is on the three factory collections, with the sidebar indicator, the override and the status endpoint', async () => {
    const sanitized = await config
    for (const slug of ['sectors', 'industryTopics', 'microApps']) {
      const c = sanitized.collections.find((x) => x.slug === slug)!
      const names = c.fields.flatMap((f) => ('name' in f ? [f.name] : []))
      expect(names, slug).toEqual(expect.arrayContaining(['benchmarkStatus', 'gateOverride', 'gateOverrideReason', 'gateOverrideHash']))
      expect(c.endpoints && c.endpoints.map((e) => e.path), slug).toContain('/:id/benchmark-status')
    }
  })
})
