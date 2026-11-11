import { AsyncLocalStorage } from 'async_hooks'
import type { DatabaseAdapterObj, PayloadRequest } from 'payload'

/**
 * Runs the database calls of one transaction one at a time.
 *
 * MongoDB refuses two operations at once in one transaction ("Given
 * transaction number ... does not match any in-progress transactions"), and
 * Payload starts them at once in several places: the field hooks and
 * validations of one document run in parallel (each relationship check is a
 * query), bulk update and delete handle every document in parallel, and some
 * of our hooks use Promise.all. On Atlas that fails a save now and then.
 *
 * Calls without a transaction run as before. A call made from inside another
 * call of the same transaction (upsert calls updateOne) runs straight away.
 *
 * It does not cover one paginated find, which counts and finds at once inside
 * a single call: lookups made inside a save pass pagination: false.
 * tests/helpers/transactionOverlaps.ts fails a test on any overlap.
 */

const SERIALIZED = [
  'count',
  'countGlobalVersions',
  'countVersions',
  'create',
  'createGlobal',
  'createGlobalVersion',
  'createVersion',
  'deleteMany',
  'deleteOne',
  'deleteVersions',
  'find',
  'findDistinct',
  'findGlobal',
  'findGlobalVersions',
  'findOne',
  'findVersions',
  'queryDrafts',
  'updateGlobal',
  'updateGlobalVersion',
  'updateJobs',
  'updateMany',
  'updateOne',
  'updateVersion',
  'upsert',
] as const

type Call = (args: { req?: Partial<PayloadRequest> } | undefined) => Promise<unknown>

export const serializeTransactionCalls = (adapter: DatabaseAdapterObj): DatabaseAdapterObj => ({
  ...adapter,
  init: (args) => {
    const db = adapter.init(args) as unknown as Record<string, unknown>
    const inside = new AsyncLocalStorage<string>()
    const tails = new Map<string, Promise<unknown>>()

    for (const name of SERIALIZED) {
      const original = db[name]
      if (typeof original !== 'function') continue
      const call = (original as Call).bind(db)
      db[name] = async (callArgs: Parameters<Call>[0]) => {
        const pending = callArgs?.req?.transactionID
        const id = pending == null ? undefined : String(await pending)
        if (!id || inside.getStore() === id) return call(callArgs)
        const previous = tails.get(id) ?? Promise.resolve()
        const run = previous.then(
          () => inside.run(id, () => call(callArgs)),
          () => inside.run(id, () => call(callArgs)),
        )
        const tail = run.then(
          () => undefined,
          () => undefined,
        )
        tails.set(id, tail)
        void tail.then(() => {
          if (tails.get(id) === tail) tails.delete(id)
        })
        return run
      }
    }
    return db as unknown as ReturnType<DatabaseAdapterObj['init']>
  },
})
