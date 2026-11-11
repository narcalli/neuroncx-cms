/**
 * PAYLOAD INTERNALS: written against payload and @payloadcms/db-mongodb
 * 3.84.1. This wraps the database adapter's methods by name (the list below)
 * and reads the transaction from their args (req.transactionID). Neither is
 * public API. If an upgrade renames or reshapes them, the queue silently
 * stops covering those calls, and saves can fail now and then on Atlas
 * again. After a Payload upgrade, check the startup log for the warning
 * below and run the integration tests: they run with transactions on and
 * fail on any overlap (tests/helpers/transactionOverlaps.ts).
 */
import { AsyncLocalStorage } from 'async_hooks'
import type { DatabaseAdapterObj, PayloadRequest } from 'payload'

/*
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
 * A call that throws fails only its own caller; the next call still runs. A
 * call left waiting behind another for longer than waitMs fails with an
 * error instead of hanging, so the save is rolled back and reported.
 *
 * It does not cover one paginated find, which counts and finds at once inside
 * a single call: lookups made inside a save pass pagination: false.
 */

export const SERIALIZED = [
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

/** Set on each wrapped method, so a test can check every one above is queued. */
export const QUEUED = Symbol.for('neuroncx.serializeTransactionCalls')

/** Under MongoDB's own 60 second limit on a transaction. */
const WAIT_MS = 30_000

type Call = (args: { req?: Partial<PayloadRequest> } | undefined) => Promise<unknown>
type Logger = { warn: (msg: string) => void }

export const serializeTransactionCalls = (adapter: DatabaseAdapterObj, { waitMs = WAIT_MS }: { waitMs?: number } = {}): DatabaseAdapterObj => ({
  ...adapter,
  init: (args) => {
    const db = adapter.init(args) as unknown as Record<string, unknown>
    const logger = (args as { payload?: { logger?: Logger } }).payload?.logger
    const inside = new AsyncLocalStorage<string>()
    const tails = new Map<string, Promise<unknown>>()

    // Waits for the calls ahead in this transaction, but not forever.
    const after = (previous: Promise<unknown>, id: string, name: string) =>
      new Promise<void>((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error(`Database call ${name} waited over ${waitMs / 1000}s for an earlier call in transaction ${id}; the save was stopped rather than left hanging.`)),
          waitMs,
        )
        previous.then(() => {
          clearTimeout(timer)
          resolve()
        })
      })

    const missing: string[] = []
    for (const name of SERIALIZED) {
      const original = db[name]
      if (typeof original !== 'function') {
        missing.push(name)
        continue
      }
      const call = (original as Call).bind(db)
      const queued = async (callArgs: Parameters<Call>[0]) => {
        const pending = callArgs?.req?.transactionID
        const id = pending == null ? undefined : String(await pending)
        if (!id || inside.getStore() === id) return call(callArgs)
        const run = after(tails.get(id) ?? Promise.resolve(), id, name).then(() => inside.run(id, () => call(callArgs)))
        // The next call waits for this one to settle, whether it succeeds or not.
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
      Object.defineProperty(queued, QUEUED, { value: true })
      db[name] = queued
    }
    if (missing.length) {
      logger?.warn(`serializeTransactionCalls: the database adapter has no ${missing.join(', ')}; those calls are not queued. Check this file against the installed Payload version.`)
    }
    return db as unknown as ReturnType<DatabaseAdapterObj['init']>
  },
})
