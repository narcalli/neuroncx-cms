// Copies the production database down to local, and backs production up.
//
// Usage (from neuroncx-cms):
//   npm run db:backup   dump production to db-backups/prod-<time>/. Reads production only.
//   npm run db:pull     back up local, dump production, then make local an exact copy of it.
//
// Production comes from PROD_DATABASE_URL in .env.prod-db (git-ignored). Give it a
// read-only Atlas user, so nothing here can write to production even by mistake.
// Local comes from DATABASE_URL in .env. The pull only ever writes to a database on
// this machine, and refuses to run otherwise.
//
// There is deliberately no push. Content goes from production to local, never back.

import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { MongoClient } from 'mongodb'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BACKUPS = path.join(ROOT, 'db-backups')
const mode = process.argv[2]

const log = (...m) => console.log(...m)
function fail(message) {
  console.error(`\n${message}`)
  process.exit(1)
}

if (!['pull', 'backup'].includes(mode)) fail('Usage: node scripts/db-sync.mjs <pull|backup>')

// Same reader as promote-page.mjs, so there is no dotenv dependency. The two env
// vars point at other files, which is only useful for testing the script.
function readEnv(file) {
  if (!fs.existsSync(file)) return null
  return Object.fromEntries(
    fs
      .readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .filter((l) => l.trim() && !l.trim().startsWith('#') && l.includes('='))
      .map((l) => {
        const i = l.indexOf('=')
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^(['"])(.*)\1$/, '$2')]
      }),
  )
}
const prodEnvFile = process.env.DB_SYNC_PROD_ENV || path.join(ROOT, '.env.prod-db')
const localEnvFile = process.env.DB_SYNC_LOCAL_ENV || path.join(ROOT, '.env')

// Hosts and database name from a connection string, leaving the credentials out.
function parseUri(uri, label) {
  const m = /^mongodb(?:\+srv)?:\/\/(?:[^@/]*@)?([^/?]+)\/?([^?]*)/.exec(uri || '')
  if (!m) fail(`${label} is not a mongodb:// or mongodb+srv:// connection string.`)
  if (!m[2]) fail(`${label} has no database name. Add it after the host: ...mongodb.net/<database>?...`)
  return { hosts: m[1].toLowerCase(), db: decodeURIComponent(m[2]) }
}
const isLocal = (hosts) =>
  hosts.split(',').every((h) => /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(h))

// Anything printed from the tools goes through this, so the password never reaches the screen.
function redactor(uri) {
  const secrets = [uri]
  const pass = /^mongodb(?:\+srv)?:\/\/[^:@/]+:([^@/]+)@/.exec(uri)?.[1]
  if (pass) secrets.push(pass, decodeURIComponent(pass))
  return (text) => secrets.reduce((t, s) => t.split(s).join('<hidden>'), text)
}

// The Database Tools installer does not add itself to PATH.
function tool(name) {
  const exe = process.platform === 'win32' ? `${name}.exe` : name
  for (const dir of [process.env.MONGO_TOOLS_DIR, 'C:\\Program Files\\MongoDB\\Tools\\100\\bin']) {
    if (dir && fs.existsSync(path.join(dir, exe))) return path.join(dir, exe)
  }
  return name
}

function run(name, args, redact) {
  return new Promise((resolve) => {
    let out = ''
    const child = spawn(tool(name), args, { windowsHide: true })
    child.stdout.on('data', (d) => (out += d))
    child.stderr.on('data', (d) => (out += d))
    child.on('error', (e) => resolve({ code: 1, out: `${name} could not start: ${e.message}` }))
    child.on('close', (code) => resolve({ code, out: redact(out) }))
  })
}

// Dumps one database and returns { collection: documentCount } as mongodump reported it.
async function dump(uri, db, dir) {
  const redact = redactor(uri)
  const { code, out } = await run('mongodump', ['--uri', uri, `--out=${dir}`], redact)
  if (code !== 0) fail(`mongodump failed:\n${out.trim().split('\n').slice(-12).join('\n')}`)
  const counts = {}
  // Tools 100.19 wraps the namespace in backticks; older versions do not.
  for (const m of out.matchAll(/done dumping `?([^\s.`]+)\.([^\s`]+)`? \((\d+) documents?\)/g)) {
    if (m[1] === db) counts[m[2]] = Number(m[3])
  }
  return counts
}

function stamp() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}

function table(rows) {
  const w = Math.max(10, ...rows.map((r) => r[0].length))
  for (const r of rows) log(`  ${r[0].padEnd(w)}  ${r.slice(1).map((c) => String(c).padStart(10)).join('  ')}`)
}

async function main() {
  const prodEnv = readEnv(prodEnvFile)
  if (!prodEnv) fail(`Missing ${path.basename(prodEnvFile)}. Create it with one line: PROD_DATABASE_URL=<Atlas connection string>`)
  const prodUri = prodEnv.PROD_DATABASE_URL
  if (!prodUri) fail(`PROD_DATABASE_URL is empty in ${path.basename(prodEnvFile)}.`)
  const prod = parseUri(prodUri, 'PROD_DATABASE_URL')
  if (isLocal(prod.hosts)) log('Note: PROD_DATABASE_URL points at this machine, not Atlas.')

  const when = stamp()
  const prodDir = path.join(BACKUPS, `prod-${when}`)

  if (mode === 'backup') {
    log(`Backing up production (${prod.hosts}, database ${prod.db}). Read only.`)
    const counts = await dump(prodUri, prod.db, prodDir)
    if (!Object.keys(counts).length) fail(`Production database "${prod.db}" came back empty. Check the database name in PROD_DATABASE_URL.`)
    table(Object.entries(counts).sort().map(([c, n]) => [c, n]))
    log(`\nSaved to ${path.relative(ROOT, prodDir)}`)
    return
  }

  const localUri = readEnv(localEnvFile)?.DATABASE_URL
  if (!localUri) fail(`DATABASE_URL is missing from ${path.basename(localEnvFile)}.`)
  const local = parseUri(localUri, 'DATABASE_URL')
  if (!isLocal(local.hosts)) fail(`Refusing to pull: DATABASE_URL points at ${local.hosts}, not this machine. The pull only writes to a local database.`)
  if (prod.hosts === local.hosts && prod.db === local.db) fail('Refusing to pull: PROD_DATABASE_URL and DATABASE_URL are the same database.')

  // 1. Keep what local has now, so nothing done locally is lost by the pull.
  const localDir = path.join(BACKUPS, `local-${when}`)
  log(`1/3 Backing up local (${local.db})`)
  const before = await dump(localUri, local.db, localDir)
  const saved = Object.keys(before).length
  log(`    ${saved} collection${saved === 1 ? '' : 's'} saved to ${path.relative(ROOT, localDir)}`)

  // 2. Production, read only. An empty dump almost always means a wrong database
  //    name, and restoring it would leave local empty, so it stops here.
  log(`2/3 Dumping production (${prod.hosts}, database ${prod.db}). Read only.`)
  const counts = await dump(prodUri, prod.db, prodDir)
  if (!Object.keys(counts).length) fail(`Production database "${prod.db}" came back empty, so local was left untouched. Check the database name in PROD_DATABASE_URL.`)

  // 3. Empty local first, so collections that only exist locally do not survive.
  log(`3/3 Replacing local with production`)
  const client = new MongoClient(localUri)
  try {
    await client.connect()
    await client.db(local.db).dropDatabase()
    const serverUri = localUri.replace(/^(mongodb:\/\/[^/?]+)\/[^?]*/, '$1/')
    const restored = await run(
      'mongorestore',
      ['--uri', serverUri, `--nsInclude=${prod.db}.*`, `--nsFrom=${prod.db}.*`, `--nsTo=${local.db}.*`, `--dir=${prodDir}`],
      redactor(localUri),
    )
    if (restored.code !== 0) {
      fail(`mongorestore failed. Local may be incomplete; the old local is in ${path.relative(ROOT, localDir)}.\n${restored.out.trim().split('\n').slice(-12).join('\n')}`)
    }

    const db = client.db(local.db)
    const rows = []
    let mismatches = 0
    for (const c of Object.keys(counts).sort()) {
      const n = await db.collection(c).countDocuments()
      if (n !== counts[c]) mismatches++
      rows.push([c, counts[c], n, n === counts[c] ? 'ok' : 'MISMATCH'])
    }
    log('')
    table([['collection', 'production', 'local', ''], ...rows])
    if (mismatches) fail(`${mismatches} collection(s) did not copy exactly. The old local is in ${path.relative(ROOT, localDir)}.`)
    log(`\nLocal is now a copy of production as of ${when.replace('_', ' ')}.`)
    log(`Old local: ${path.relative(ROOT, localDir)}    Production dump: ${path.relative(ROOT, prodDir)}`)
  } finally {
    await client.close()
  }
}

// The driver only ever connects to local; the production string goes to mongodump alone.
main().catch((e) => fail(`db:${mode} failed: ${e.message}`))
