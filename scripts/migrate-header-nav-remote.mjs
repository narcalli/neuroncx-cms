// The same Header nav migration as migrate-header-nav.ts, but run against a
// deployed CMS over its REST API instead of the local database.
//
// Usage (from neuroncx-cms):
//   node scripts/migrate-header-nav-remote.mjs            dry run, prints the plan
//   node scripts/migrate-header-nav-remote.mjs --write    applies it
//
// Reads PROMOTE_URL and PROMOTE_API_KEY from .env.promote (git-ignored).
// Refuses to write until the target is running the new schema, so it cannot
// quietly strip fields the deployed build does not know about yet.

import fs from 'node:fs'
import path from 'node:path'

const WRITE = process.argv.includes('--write')
const ITEM_CAP = 12

const envFile = path.resolve('.env.promote')
if (!fs.existsSync(envFile)) {
  console.error('Missing .env.promote. Add PROMOTE_URL and PROMOTE_API_KEY.')
  process.exit(1)
}
const env = Object.fromEntries(
  fs
    .readFileSync(envFile, 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.trim() && !l.trim().startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    }),
)
const BASE = (env.PROMOTE_URL || '').replace(/\/admin\/?$/, '').replace(/\/$/, '')
const KEY = env.PROMOTE_API_KEY
if (!BASE || !KEY) {
  console.error('PROMOTE_URL or PROMOTE_API_KEY is empty in .env.promote.')
  process.exit(1)
}
const auth = { Authorization: `users API-Key ${KEY}`, 'Content-Type': 'application/json' }

const usable = (l) => Boolean(l?.label && l?.href)
const external = (href) => /^https?:\/\//.test(String(href || ''))

const schemaIsNew = async () => {
  const res = await fetch(`${BASE}/api/graphql`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ query: '{ __type(name: "Header") { fields { name } } }' }),
  })
  if (!res.ok) return false
  const body = await res.json()
  const fields = (body?.data?.__type?.fields || []).map((f) => f.name)
  return fields.includes('announcement')
}

const run = async () => {
  console.log(`Target: ${BASE}`)
  const ready = await schemaIsNew()
  console.log(`New schema deployed: ${ready ? 'yes' : 'no'}`)
  if (WRITE && !ready) {
    console.error('Refusing to write: the deployed build still has the old Header schema.')
    process.exit(2)
  }

  const res = await fetch(`${BASE}/api/globals/header?depth=0`, { headers: auth })
  if (!res.ok) {
    console.error(`Could not read the header global: ${res.status}`)
    process.exit(1)
  }
  const header = await res.json()
  const dropped = []

  const next = (header.navItems || []).map((item, i) => {
    const rowLabel = `row ${i + 1} "${item.label}"`
    const columns = item.columns || []
    const built = []

    columns.forEach((col) => {
      let headingPending = true
      ;(col.links || []).filter(usable).forEach((l) => {
        built.push({
          label: l.label,
          href: l.href,
          badge: null,
          groupHeading: headingPending ? col.heading || null : null,
          newTab: external(l.href),
        })
        headingPending = false
      })
    })

    if (!built.length) {
      console.log(`  ${rowLabel}: link -> ${item.href || '(no address)'}`)
      return { label: item.label, type: 'link', href: item.href, columns: item.columns, id: item.id }
    }

    const kept = built.slice(0, ITEM_CAP)
    built.slice(ITEM_CAP).forEach((l) =>
      dropped.push(`${rowLabel}: "${l.label}" (${l.href}) did not fit the ${ITEM_CAP}-link cap`),
    )

    console.log(`  ${rowLabel}: dropdown -> ${kept.length} link(s)`)
    kept.forEach((l) =>
      console.log(`      ${l.groupHeading ? `[${l.groupHeading}] ` : '           '}${l.label} -> ${l.href}`),
    )

    return {
      label: item.label,
      type: 'dropdown',
      href: item.href,
      items: kept,
      columns: item.columns,
      id: item.id,
    }
  })

  if (dropped.length) {
    console.log('\nDid not fit, add these by hand if you want them:')
    dropped.forEach((d) => console.log(`  - ${d}`))
  }

  if (!WRITE) {
    console.log('\nDry run. Re-run with --write to apply.')
    return
  }

  const put = await fetch(`${BASE}/api/globals/header`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ navItems: next }),
  })
  const text = await put.text()
  if (!put.ok) {
    console.error(`Write failed: ${put.status} ${text.slice(0, 400)}`)
    process.exit(1)
  }

  // Read back, so "written" means the server kept what we sent.
  const after = await (await fetch(`${BASE}/api/globals/header?depth=0`, { headers: auth })).json()
  console.log('\nAfter the write:')
  ;(after.navItems || []).forEach((i) =>
    console.log(`  - ${i.label} | ${i.type} | ${(i.items || []).length} link(s)`),
  )
}

run().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
