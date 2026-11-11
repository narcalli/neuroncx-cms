/**
 * The integration tests' database: a one-node replica set on this machine, so
 * Payload runs every save in a transaction, as it does on Atlas. The dev
 * database (DATABASE_URL in .env) has no replica set, so Payload switches
 * transactions off there, and tests run against it never exercised them.
 *
 *   node scripts/test-db.mjs ensure    start it if needed; copy the dev database in when empty
 *   node scripts/test-db.mjs refresh   start it if needed; copy the dev database in again
 *   node scripts/test-db.mjs stop      shut it down
 *
 * Runs a separate mongod (the installed one, or MONGOD_PATH) on port 27018
 * with its data in .mongo-test/ (ignored by git). The MongoDB service and the
 * dev database are only read from, never changed. Enquiries are copied with
 * placeholder details instead of the people's (scripts/blank-enquiries.mjs).
 */
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { MongoClient } from 'mongodb'

import { blankEnquiry, blankEnquiryRead } from './blank-enquiries.mjs'

export const TEST_DB_PORT = 27018
export const TEST_DB_URL = `mongodb://127.0.0.1:${TEST_DB_PORT}/neuroncx?replicaSet=rs0`

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dir = path.join(root, '.mongo-test')
const say = (s) => fs.writeSync(1, s + '\n')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const mongodPath = () => {
  if (process.env.MONGOD_PATH) return process.env.MONGOD_PATH
  const base = 'C:\\Program Files\\MongoDB\\Server'
  if (process.platform === 'win32' && fs.existsSync(base)) {
    const versions = fs.readdirSync(base).sort((a, b) => parseFloat(b) - parseFloat(a))
    for (const v of versions) {
      const exe = path.join(base, v, 'bin', 'mongod.exe')
      if (fs.existsSync(exe)) return exe
    }
  }
  return 'mongod'
}

// Straight to the node, before the replica set exists.
const direct = () => new MongoClient(`mongodb://127.0.0.1:${TEST_DB_PORT}/?directConnection=true`, { serverSelectionTimeoutMS: 1500 })

const running = async () => {
  const client = direct()
  try {
    await client.connect()
    await client.db('admin').command({ ping: 1 })
    return true
  } catch {
    return false
  } finally {
    await client.close().catch(() => undefined)
  }
}

const start = async () => {
  if (await running()) return
  fs.mkdirSync(path.join(dir, 'data'), { recursive: true })
  const child = spawn(
    mongodPath(),
    ['--replSet', 'rs0', '--port', String(TEST_DB_PORT), '--bind_ip', '127.0.0.1', '--dbpath', path.join(dir, 'data'), '--logpath', path.join(dir, 'mongod.log'), '--logappend'],
    { detached: true, stdio: 'ignore', windowsHide: true },
  )
  child.unref()
  for (let i = 0; i < 60 && !(await running()); i++) await sleep(500)
  if (!(await running())) throw new Error(`The test database did not start; see ${path.join(dir, 'mongod.log')}.`)
  say(`Test database started on port ${TEST_DB_PORT}.`)
}

const initiate = async () => {
  const client = direct()
  await client.connect()
  try {
    const admin = client.db('admin')
    try {
      await admin.command({ replSetGetStatus: 1 })
    } catch (err) {
      if (!/no replset config|NotYetInitialized/i.test(String(err?.codeName || err?.message))) throw err
      await admin.command({ replSetInitiate: { _id: 'rs0', members: [{ _id: 0, host: `127.0.0.1:${TEST_DB_PORT}` }] } })
    }
    for (let i = 0; i < 60; i++) {
      const hello = await admin.command({ hello: 1 })
      if (hello.isWritablePrimary) return
      await sleep(500)
    }
    throw new Error('The test database did not become primary.')
  } finally {
    await client.close()
  }
}

// The dev database from .env, which must be on this machine.
const sourceUrl = () => {
  const line = fs.readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/).find((l) => l.startsWith('DATABASE_URL='))
  const url = line?.slice('DATABASE_URL='.length).trim().replace(/^["']|["']$/g, '') || ''
  if (!/^mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(url)) throw new Error('DATABASE_URL in .env is not a database on this machine; nothing was copied.')
  return url
}

const copy = async ({ always }) => {
  const target = new MongoClient(TEST_DB_URL)
  await target.connect()
  try {
    const db = target.db('neuroncx')
    const existing = await db.listCollections({}, { nameOnly: true }).toArray()
    if (existing.length && !always) return
    await db.dropDatabase()
    const source = new MongoClient(sourceUrl())
    await source.connect()
    try {
      const from = source.db()
      let docs = 0
      const collections = await from.listCollections({ type: 'collection' }).toArray()
      for (const { name } of collections) {
        if (name.startsWith('system.')) continue
        const batch = []
        // Enquiries are copied without the people in them (scripts/blank-enquiries.mjs).
        let n = 0
        const scrub = name === 'enquiries' ? (doc) => blankEnquiry(doc, ++n) : name === 'enquiryreads' ? blankEnquiryRead : (doc) => doc
        for await (const doc of from.collection(name).find({}, { sort: { _id: 1 } })) {
          batch.push(scrub(doc))
          if (batch.length === 500) await db.collection(name).insertMany(batch.splice(0))
          docs++
        }
        if (batch.length) await db.collection(name).insertMany(batch)
        else await db.createCollection(name).catch(() => undefined)
        const indexes = (await from.collection(name).indexes()).filter((i) => i.name !== '_id_')
        if (indexes.length) {
          await db.collection(name).createIndexes(indexes.map(({ v: _v, ns: _ns, ...spec }) => ({ ...spec, key: spec.key })))
        }
      }
      say(`Copied ${collections.length} collections (${docs} documents) from the dev database into the test database.`)
    } finally {
      await source.close()
    }
  } finally {
    await target.close()
  }
}

const stop = async () => {
  if (!(await running())) return say('The test database is not running.')
  const client = direct()
  await client.connect()
  await client.db('admin').command({ shutdown: 1, force: true }).catch(() => undefined)
  await client.close().catch(() => undefined)
  say('Test database stopped.')
}

export const ensureTestDb = async ({ refresh = false } = {}) => {
  await start()
  await initiate()
  await copy({ always: refresh })
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(root, 'scripts', 'test-db.mjs')) {
  const command = process.argv[2] || 'ensure'
  const run = command === 'stop' ? stop() : ensureTestDb({ refresh: command === 'refresh' })
  run.then(
    () => process.exit(0),
    (err) => {
      fs.writeSync(2, `${err?.message || err}\n`)
      process.exit(1)
    },
  )
}
