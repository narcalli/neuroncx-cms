import { createRequire } from 'module'
import type mongooseType from 'mongoose'

// Node's own copy of mongoose, the one Payload's adapter connects with. The
// tests run in jsdom, so a plain import here can resolve to another build.
const mongoose = createRequire(import.meta.url)('mongoose') as typeof mongooseType

/**
 * Fails a test when two database commands run at once in one transaction.
 * MongoDB refuses that ("Given transaction number ... does not match any
 * in-progress transactions"), but only now and then, so a test that merely
 * saves would pass most of the time. This watches every command the driver
 * sends and records an overlap whenever a command starts while another in
 * the same transaction (session and transaction number) has not finished.
 *
 * Needs transactions on, which needs a replica set: the tests' database is
 * one (scripts/test-db.mjs). Installed from vitest.setup.ts.
 */

type Command = { requestId: number; name: string; collection: string; from: string }

const inFlight = new Map<string, Map<number, Command>>()
const keyOf = new Map<number, string>()
const overlaps: string[] = []

// The first frame in this project's own code, so a report says where the
// command came from, not just which driver call sent it.
const callerOf = (stack = ''): string => {
  const frame = stack
    .split('\n')
    .map((l) => l.trim())
    .find((l) => /[\\/](src|scripts|tests)[\\/]/.test(l) && !/node_modules|transactionOverlaps/.test(l))
  return frame ? frame.replace(/^at\s+/, '') : 'Payload or the adapter'
}

const describe = (c: Command) => `${c.name} on ${c.collection} (from ${c.from})`

type StartedEvent = { requestId: number; commandName: string; command: Record<string, unknown> }
type EndedEvent = { requestId: number }

const started = (e: StartedEvent) => {
  const cmd = e.command
  const lsid = (cmd.lsid as { id?: { toString?: (enc: string) => string } } | undefined)?.id
  if (cmd.txnNumber == null || !lsid) return
  const key = `${lsid.toString?.('hex') ?? String(lsid)}:${String(cmd.txnNumber)}`
  const now: Command = {
    requestId: e.requestId,
    name: e.commandName,
    collection: typeof cmd[e.commandName] === 'string' ? (cmd[e.commandName] as string) : '-',
    from: callerOf(new Error().stack),
  }
  const running = inFlight.get(key) ?? new Map<number, Command>()
  for (const other of running.values()) overlaps.push(`${describe(other)} was still running when ${describe(now)} started`)
  running.set(e.requestId, now)
  inFlight.set(key, running)
  keyOf.set(e.requestId, key)
}

const ended = (e: EndedEvent) => {
  const key = keyOf.get(e.requestId)
  if (!key) return
  keyOf.delete(e.requestId)
  const running = inFlight.get(key)
  running?.delete(e.requestId)
  if (running && !running.size) inFlight.delete(key)
}

const watch = (client: ReturnType<mongooseType.Connection['getClient']>) => {
  client.on('commandStarted', started as never)
  client.on('commandSucceeded', ended as never)
  client.on('commandFailed', ended as never)
}

let installed = false

/** Turns on command monitoring for the connection Payload makes, and watches it. */
export const watchTransactionOverlaps = () => {
  if (installed) return
  installed = true
  // The adapter makes its connection with createConnection() and opens it
  // with openUri(url, options): monitoring has to be asked for at the open.
  const create = mongoose.createConnection.bind(mongoose) as (...args: unknown[]) => mongooseType.Connection
  mongoose.createConnection = ((...args: unknown[]) => {
    const conn = create(...args)
    const openUri = conn.openUri.bind(conn) as (uri: string, options?: mongooseType.ConnectOptions) => Promise<mongooseType.Connection>
    conn.openUri = (async (uri: string, options?: mongooseType.ConnectOptions) => {
      const ready = await openUri(uri, { ...options, monitorCommands: true })
      watch(ready.getClient())
      return ready
    }) as typeof conn.openUri
    return conn
  }) as typeof mongoose.createConnection
}

/** The overlaps seen since the last call, which it clears. */
export const takeTransactionOverlaps = (): string[] => overlaps.splice(0)
