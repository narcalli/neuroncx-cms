// Promotes one page from the local CMS to the live CMS over its REST API.
//
// Usage (from neuroncx-cms):
//   node scripts/promote-page.mjs <slug>            dry run: shows what would change
//   node scripts/promote-page.mjs <slug> --write    creates or updates the live page as a draft
//   node scripts/promote-page.mjs <slug> --write --publish
//
// Reads PROMOTE_URL and PROMOTE_API_KEY from .env.promote (git-ignored).
// Local pages are read from LOCAL_URL (default http://localhost:3001), published only.

import fs from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const slug = args.find((a) => !a.startsWith('--'))
const WRITE = args.includes('--write')
const PUBLISH = args.includes('--publish')

if (!slug) {
  console.error('Usage: node scripts/promote-page.mjs <slug> [--write] [--publish]')
  process.exit(1)
}

// Read .env.promote without a dotenv dependency.
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
const LIVE = (env.PROMOTE_URL || '').replace(/\/$/, '')
const KEY = env.PROMOTE_API_KEY
const LOCAL = (process.env.LOCAL_URL || 'http://localhost:3001').replace(/\/$/, '')
if (!LIVE) {
  console.error('PROMOTE_URL is empty in .env.promote.')
  process.exit(1)
}

// Set in main(): a JWT from email and password login, or the API key as a fallback.
let liveHeaders = {}
const log = (...m) => console.log(...m)

async function liveLogin() {
  const email = env.PROMOTE_EMAIL
  const password = env.PROMOTE_PASSWORD
  if (!email || !password) return null
  const res = await fetch(`${LIVE}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await json(res, 'live login')
  if (!data.token) throw new Error('Live login returned no token. Check PROMOTE_EMAIL and PROMOTE_PASSWORD.')
  return { Authorization: `JWT ${data.token}` }
}

async function json(res, what) {
  const text = await res.text()
  if (!res.ok) throw new Error(`${what} failed: ${res.status} ${text.slice(0, 300)}`)
  return JSON.parse(text)
}

// 1. Read the local page (published only, populated two levels so media and page links resolve).
async function readLocalPage() {
  const res = await fetch(
    `${LOCAL}/api/pages?where[slug][equals]=${encodeURIComponent(slug)}&depth=2&limit=1`,
  )
  const data = await json(res, 'local page read')
  const doc = data.docs?.[0]
  if (!doc) throw new Error(`No local page with slug "${slug}"`)
  return doc
}

// 2. Find or upload a media file on the live CMS, matched by filename.
const mediaCache = new Map()
async function liveMediaId(localMedia) {
  const filename = localMedia.filename
  if (mediaCache.has(filename)) return mediaCache.get(filename)

  const found = await json(
    await fetch(
      `${LIVE}/api/media?where[filename][equals]=${encodeURIComponent(filename)}&limit=1`,
      { headers: liveHeaders },
    ),
    'live media lookup',
  )
  if (found.docs?.[0]) {
    mediaCache.set(filename, found.docs[0].id)
    return found.docs[0].id
  }

  if (!WRITE) {
    log(`  [dry run] would upload media: ${filename}`)
    mediaCache.set(filename, `dry-run:${filename}`)
    return mediaCache.get(filename)
  }

  const fileRes = await fetch(`${LOCAL}${localMedia.url}`)
  if (!fileRes.ok) throw new Error(`Could not download local media ${filename}: ${fileRes.status}`)
  const form = new FormData()
  form.append('file', new Blob([await fileRes.arrayBuffer()], { type: localMedia.mimeType }), filename)
  form.append('_payload', JSON.stringify({ alt: localMedia.alt || filename }))
  const created = await json(
    await fetch(`${LIVE}/api/media`, { method: 'POST', headers: liveHeaders, body: form }),
    'live media upload',
  )
  log(`  uploaded media: ${filename}`)
  mediaCache.set(filename, created.doc.id)
  return created.doc.id
}

// 3. Turn a local page into a live-ready body:
//    - strip ids and timestamps so the live CMS assigns its own
//    - replace media objects with live media IDs
//    - replace internal page links with live page IDs (matched by slug)
async function toLiveBody(node, key) {
  if (Array.isArray(node)) return Promise.all(node.map((n) => toLiveBody(n)))
  if (node && typeof node === 'object') {
    if (typeof node.filename === 'string' && typeof node.mimeType === 'string') {
      return liveMediaId(node)
    }
    if (key === 'page' && typeof node.slug === 'string') {
      const found = await json(
        await fetch(
          `${LIVE}/api/pages?where[slug][equals]=${encodeURIComponent(node.slug)}&limit=1&draft=true`,
          { headers: liveHeaders },
        ),
        'live page lookup',
      )
      if (!found.docs?.[0]) throw new Error(`Linked page "${node.slug}" does not exist on live yet. Promote it first.`)
      return found.docs[0].id
    }
    const out = {}
    for (const [k, v] of Object.entries(node)) {
      if (['id', 'createdAt', 'updatedAt', '_status'].includes(k)) continue
      out[k] = await toLiveBody(v, k)
    }
    return out
  }
  return node
}

async function main() {
  const loginHeaders = await liveLogin()
  if (loginHeaders) {
    liveHeaders = loginHeaders
  } else if (KEY) {
    liveHeaders = { Authorization: `users API-Key ${KEY}` }
  } else {
    throw new Error('Set PROMOTE_EMAIL and PROMOTE_PASSWORD, or PROMOTE_API_KEY, in .env.promote.')
  }
  log(`Promoting "${slug}" from ${LOCAL} to ${LIVE}`)
  log(WRITE ? (PUBLISH ? 'Mode: WRITE and PUBLISH' : 'Mode: WRITE (draft)') : 'Mode: DRY RUN (no changes)')

  const local = await readLocalPage()
  const body = await toLiveBody({
    title: local.title,
    slug: local.slug,
    hero: local.hero,
    layout: local.layout,
    meta: local.meta,
  })
  body._status = PUBLISH ? 'published' : 'draft'

  const existing = await json(
    await fetch(`${LIVE}/api/pages?where[slug][equals]=${encodeURIComponent(slug)}&limit=1&draft=true`, {
      headers: liveHeaders,
    }),
    'live page lookup',
  )
  const target = existing.docs?.[0]
  log(`Live page: ${target ? `exists (id ${target.id}), will update` : 'not found, will create'}`)
  log(`Blocks: ${body.layout?.length ?? 0}`)

  if (!WRITE) {
    log('Dry run complete. Re-run with --write to apply.')
    return
  }

  const res = await fetch(
    target ? `${LIVE}/api/pages/${target.id}` : `${LIVE}/api/pages`,
    {
      method: target ? 'PATCH' : 'POST',
      headers: { ...liveHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )
  const saved = await json(res, 'live page save')
  log(`Saved. Live page id: ${saved.doc?.id}, status: ${body._status}`)
}

main().catch((e) => {
  console.error(`Promote failed: ${e.message}`)
  process.exit(1)
})
