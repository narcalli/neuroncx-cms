import 'dotenv/config'
import { getPayload, type DatabaseAdapterObj } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import config from '@/payload.config'
import { QUEUED, SERIALIZED, serializeTransactionCalls } from '@/db/serializeTransactionCalls'

/**
 * The queue for one transaction's database calls (src/db/serializeTransactionCalls.ts):
 * one at a time inside a transaction, never stalled by a failed or stuck call.
 */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// A stand-in adapter whose calls take a while and record how many ran at once.
const fakeAdapter = (behaviour: Record<string, (args: any) => Promise<unknown>> = {}) => {
  const state = { running: 0, most: 0, order: [] as string[] }
  const slow = (label: string) => async (args: any) => {
    state.running++
    state.most = Math.max(state.most, state.running)
    state.order.push(`${label}:${args?.tag ?? ''}`)
    try {
      if (behaviour[label]) return await behaviour[label](args)
      await sleep(20)
      return label
    } finally {
      state.running--
    }
  }
  const db: Record<string, unknown> = Object.fromEntries(SERIALIZED.map((n) => [n, slow(n)]))
  // As in the real adapter: upsert calls updateOne with the same args.
  db.upsert = async function (this: any, args: any) {
    return this.updateOne(args)
  }
  const adapter = { name: 'fake', defaultIDType: 'text', init: () => db } as unknown as DatabaseAdapterObj
  return { adapter, state }
}

const tx = (id: string | Promise<string>) => ({ req: { transactionID: id } })

describe('the queue for one transaction', () => {
  it('runs the calls of one transaction one at a time', async () => {
    const { adapter, state } = fakeAdapter()
    const db = serializeTransactionCalls(adapter).init({} as never) as any
    await Promise.all([db.find(tx('t1')), db.count(tx('t1')), db.findOne(tx('t1'))])
    expect(state.most).toBe(1)
  })

  it('leaves calls outside a transaction, and other transactions, to run at once', async () => {
    const { adapter, state } = fakeAdapter()
    const db = serializeTransactionCalls(adapter).init({} as never) as any
    await Promise.all([db.find({}), db.find({})])
    expect(state.most).toBe(2)
    state.most = 0
    await Promise.all([db.find(tx('a')), db.find(tx('b'))])
    expect(state.most).toBe(2)
  })

  it('reads a transaction id that is still a promise', async () => {
    const { adapter, state } = fakeAdapter()
    const db = serializeTransactionCalls(adapter).init({} as never) as any
    const id = Promise.resolve('t1')
    await Promise.all([db.find(tx(id)), db.count(tx(id))])
    expect(state.most).toBe(1)
  })

  it('runs a call made from inside another call straight away (upsert calls updateOne)', async () => {
    const { adapter } = fakeAdapter()
    const db = serializeTransactionCalls(adapter, { waitMs: 200 }).init({} as never) as any
    await expect(db.upsert(tx('t1'))).resolves.toBe('updateOne')
  })

  it('fails only the call that throws; the next call in the transaction still runs', async () => {
    const { adapter } = fakeAdapter({ create: async () => Promise.reject(new Error('duplicate key')) })
    const db = serializeTransactionCalls(adapter).init({} as never) as any
    const [created, found] = await Promise.allSettled([db.create(tx('t1')), db.find(tx('t1'))])
    expect(created).toMatchObject({ status: 'rejected', reason: { message: 'duplicate key' } })
    expect(found).toMatchObject({ status: 'fulfilled', value: 'find' })
  })

  it('stops a call stuck behind one that never finishes, instead of hanging the save', async () => {
    const { adapter } = fakeAdapter({ find: () => new Promise(() => undefined) })
    const db = serializeTransactionCalls(adapter, { waitMs: 100 }).init({} as never) as any
    void db.find(tx('t1'))
    const started = Date.now()
    await expect(db.count(tx('t1'))).rejects.toThrow(/count waited over 0.1s for an earlier call in transaction t1/)
    expect(Date.now() - started).toBeLessThan(1000)
    // Nothing piles up behind it either: by now the save has failed and
    // Payload aborts the transaction, and a later call runs at once.
    await expect(db.findOne(tx('t1'))).resolves.toBe('findOne')
  })

  it('warns at startup when the adapter no longer has a method it expects', () => {
    const warn = vi.fn()
    const db: Record<string, unknown> = Object.fromEntries(SERIALIZED.filter((n) => n !== 'queryDrafts').map((n) => [n, async () => n]))
    serializeTransactionCalls({ name: 'fake', defaultIDType: 'text', init: () => db } as unknown as DatabaseAdapterObj).init({ payload: { logger: { warn } } } as never)
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/has no queryDrafts/))
  })
})

describe('the real database adapter', () => {
  it(`still has every method the queue wraps, all of them queued (written against Payload 3.84.1)`, async () => {
    const payload = await getPayload({ config: await config })
    const db = payload.db as unknown as Record<string, unknown>
    const notQueued = SERIALIZED.filter((n) => typeof db[n] !== 'function' || !(db[n] as unknown as Record<symbol, unknown>)[QUEUED])
    expect(notQueued).toEqual([])
  })
})
