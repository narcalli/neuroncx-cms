// Promotes content from the local CMS to the live CMS over its REST API:
// one page by slug, or the records of one or more collections.
//
// Usage (from neuroncx-cms):
//   node scripts/promote-page.mjs <slug>                          dry run for one page
//   node scripts/promote-page.mjs <slug> --write                  creates or updates it on live as a draft
//   node scripts/promote-page.mjs <slug> --write --publish
//
//   node scripts/promote-page.mjs --collection lists,microApps,hubs [<slug> ...] [--write] [--publish]
//     Every record of each collection, or only the slugs given. Several
//     collections run in dependency order: Lists entries, then microApps,
//     then hubs. --collection can also be repeated.
//
// Dry run lists every record with its status and whether it is new, changed
// or unchanged on live, and every reason a record would be refused. --write
// saves drafts on live (a published live record keeps its published version
// and gets a new draft); --write --publish publishes. Each record's own status
// (live, pilot, planned) is copied as it is locally.
//
// Records are matched between local and live by slug (Lists entries by slug
// and type, media by filename), never by id. Every relationship is remapped
// to the live record with the same slug; a record whose relationship target
// does not exist on live yet is refused, and the target is named. Media a
// record uses is uploaded when live does not have it. Nothing is ever
// deleted on live.
//
// Reads PROMOTE_URL and PROMOTE_API_KEY (or PROMOTE_EMAIL and PROMOTE_PASSWORD)
// from .env.promote (git-ignored), or from the file in PROMOTE_ENV. Local is
// LOCAL_URL (default http://localhost:3001). Pages are read from local as a
// visitor, published only. Collections are read with LOCAL_API_KEY (or
// LOCAL_EMAIL and LOCAL_PASSWORD) from the same file, latest drafts included,
// so Planned entries can be promoted too.

import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

/* ------------------------------------------------------------------ */
/* Collections: order and relationships                                */
/* ------------------------------------------------------------------ */

/** Collections promote in this order, so a record's targets exist before it. */
export const DEPENDENCY_ORDER = ['lists', 'microApps', 'hubs']

export const orderCollections = (list) => {
  const rank = (c) => {
    const at = DEPENDENCY_ORDER.indexOf(c)
    return at === -1 ? DEPENDENCY_ORDER.length : at
  }
  return [...new Set(list)].sort((a, b) => rank(a) - rank(b))
}

/**
 * Plain (single-collection) relationships, by path from the record. "*" is
 * any array row. blockType limits a rule to one layout block. Polymorphic
 * relationships ({ relationTo, value }) and uploads need no rule: they carry
 * their collection, or are recognised as media. Any other linked record the
 * walk meets is refused, so a local id can never reach live.
 */
export const RELATIONS = {
  lists: [],
  microApps: [
    { path: 'family', to: 'lists' },
    { path: 'passesTo.*', to: 'microApps' },
    { path: 'related.*', to: 'microApps' },
    { path: 'integrations.*', to: 'integrations' },
    { path: 'customers.*', to: 'customers' },
    { path: 'crmFeatures.*', to: 'crmFeatures' },
  ],
  hubs: [
    { path: 'groupingSections.*.group', to: 'lists' },
    { path: 'layout.*.selectedDocs.*', to: 'integrations', blockType: 'hubWorksWithSection' },
    { path: 'layout.*.selectedDocs.*', to: 'posts', blockType: 'hubArticlesSection' },
    { path: 'layout.*.categories.*', to: 'categories', blockType: 'hubArticlesSection' },
  ],
}

export const ruleFor = (collection, pathParts, blockType) => {
  const p = pathParts.map((s) => (typeof s === 'number' ? '*' : s)).join('.')
  return (RELATIONS[collection] || []).find((r) => r.path === p && (!r.blockType || r.blockType === blockType))
}

/** How a record is found on live: by slug, Lists entries by slug and type, media by filename. */
export const matchOf = (collection, doc) =>
  collection === 'lists'
    ? { slug: doc?.slug, type: doc?.type }
    : collection === 'media'
      ? { filename: doc?.filename }
      : { slug: doc?.slug }

const SKIP_KEYS = new Set(['id', 'createdAt', 'updatedAt', '_status'])
const isMedia = (o) => typeof o?.filename === 'string' && typeof o?.mimeType === 'string'
const isPoly = (o) => o && typeof o === 'object' && typeof o.relationTo === 'string' && 'value' in o
const isDoc = (o) => o && typeof o === 'object' && 'id' in o && 'createdAt' in o && 'updatedAt' in o
const looksLikeId = (s) => typeof s === 'string' && /^[a-f0-9]{24}$/.test(s)

/** Equal, for "changed": null, missing and empty lists are the same; ids and timestamps are ignored. */
export const canonical = (v) => {
  if (Array.isArray(v)) return v.length ? v.map(canonical) : undefined
  if (v && typeof v === 'object') {
    const out = {}
    for (const k of Object.keys(v).sort()) {
      if (SKIP_KEYS.has(k)) continue
      const c = canonical(v[k])
      if (c !== undefined) out[k] = c
    }
    return Object.keys(out).length ? out : undefined
  }
  return v === null || v === '' ? undefined : v
}

export const changedKeys = (body, live) => {
  const keys = new Set([...Object.keys(body || {}), ...Object.keys(live || {})].filter((k) => !SKIP_KEYS.has(k)))
  return [...keys].filter((k) => k in body && JSON.stringify(canonical(body[k])) !== JSON.stringify(canonical(live?.[k])))
}

/* ------------------------------------------------------------------ */
/* Settings and requests                                               */
/* ------------------------------------------------------------------ */

const log = (...m) => console.log(...m)

const readEnv = () => {
  const envFile = path.resolve(process.env.PROMOTE_ENV || '.env.promote')
  if (!fs.existsSync(envFile)) {
    console.error(`Missing ${path.basename(envFile)}. Add PROMOTE_URL and PROMOTE_API_KEY.`)
    process.exit(1)
  }
  // Read without a dotenv dependency.
  return Object.fromEntries(
    fs
      .readFileSync(envFile, 'utf8')
      .split(/\r?\n/)
      .filter((l) => l.trim() && !l.trim().startsWith('#') && l.includes('='))
      .map((l) => {
        const i = l.indexOf('=')
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
      }),
  )
}

/** Payload's validation errors as "field: message" lines, or the raw text. */
export const describeError = (text) => {
  try {
    const fields = JSON.parse(text).errors?.flatMap((e) =>
      (e.data?.errors ?? []).map((f) => `${f.label || f.path}: ${f.message}`),
    )
    if (fields?.length) return fields.join('; ')
  } catch {
    // Not JSON: fall through to the raw text.
  }
  return text.slice(0, 300)
}

async function json(res, what) {
  const text = await res.text()
  if (!res.ok) throw new Error(`${what} failed: ${res.status} ${describeError(text)}`)
  return JSON.parse(text)
}

async function login(base, email, password, what) {
  if (!email || !password) return null
  const data = await json(
    await fetch(`${base}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }),
    `${what} login`,
  )
  if (!data.token) throw new Error(`${what} login returned no token.`)
  return { Authorization: `JWT ${data.token}` }
}

/* ------------------------------------------------------------------ */
/* Promoter                                                            */
/* ------------------------------------------------------------------ */

export const createPromoter = ({ LIVE, LOCAL, liveHeaders, localHeaders = {}, WRITE }) => {
  const mediaCache = new Map()

  /** Finds or uploads a media file on live, matched by filename. */
  async function liveMediaId(localMedia) {
    const filename = localMedia.filename
    if (mediaCache.has(filename)) return mediaCache.get(filename)
    const found = await json(
      await fetch(`${LIVE}/api/media?where[filename][equals]=${encodeURIComponent(filename)}&limit=1`, {
        headers: liveHeaders,
      }),
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
    const fileRes = await fetch(new URL(localMedia.url, LOCAL), { headers: localHeaders })
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

  /** Turns a local page into a live-ready body (pages: media and page links). */
  async function toLivePageBody(node, key) {
    if (Array.isArray(node)) return Promise.all(node.map((n) => toLivePageBody(n)))
    if (node && typeof node === 'object') {
      if (isMedia(node)) return liveMediaId(node)
      if (key === 'page' && typeof node.slug === 'string') {
        const found = await json(
          await fetch(`${LIVE}/api/pages?where[slug][equals]=${encodeURIComponent(node.slug)}&limit=1&draft=true`, {
            headers: liveHeaders,
          }),
          'live page lookup',
        )
        if (!found.docs?.[0]) throw new Error(`Linked page "${node.slug}" does not exist on live yet. Promote it first.`)
        return found.docs[0].id
      }
      const out = {}
      for (const [k, v] of Object.entries(node)) {
        if (SKIP_KEYS.has(k)) continue
        out[k] = await toLivePageBody(v, k)
      }
      return out
    }
    return node
  }

  const liveCache = new Map()
  /** The live record matching a local one (latest draft included), or null. */
  async function findLive(collection, match) {
    const key = `${collection}:${JSON.stringify(match)}`
    if (liveCache.has(key)) return liveCache.get(key)
    const params = new URLSearchParams({ limit: '1', depth: '0', draft: 'true' })
    for (const [k, v] of Object.entries(match)) params.append(`where[${k}][equals]`, String(v))
    const res = await fetch(`${LIVE}/api/${collection}?${params}`, { headers: liveHeaders })
    if (res.status === 404) throw new Error(`Live has no ${collection} collection. Deploy the CMS change first.`)
    const doc = (await json(res, `live ${collection} lookup`)).docs?.[0] ?? null
    liveCache.set(key, doc)
    return doc
  }
  const remember = (collection, match, doc) => liveCache.set(`${collection}:${JSON.stringify(match)}`, doc)

  async function readLocalById(collection, id) {
    const res = await fetch(`${LOCAL}/api/${collection}/${id}?depth=0&draft=true`, { headers: localHeaders })
    return res.ok ? res.json() : null
  }

  /** Every local record of a collection (latest drafts), or only these slugs. */
  async function readLocal(collection, slugs) {
    const params = new URLSearchParams({ depth: '1', limit: '500', draft: 'true', sort: 'createdAt' })
    if (slugs?.length) params.append('where[slug][in]', slugs.join(','))
    return (await json(await fetch(`${LOCAL}/api/${collection}?${params}`, { headers: localHeaders }), `local ${collection} read`)).docs
  }

  /**
   * One record as a live body. plan: the records this run will create, by
   * collection and slug. Returns { body, problems, deferred }: a reference to
   * a record this run creates later in the same collection is deferred (left
   * out now, filled in by a second pass), never sent as a local id.
   */
  async function toLiveRecord(collection, local, plan) {
    const problems = []
    let deferred = false

    const resolve = async (to, value, at) => {
      const doc = value && typeof value === 'object' ? value : looksLikeId(value) ? await readLocalById(to, value) : null
      if (!doc) {
        problems.push(`${at}: the linked ${to} record could not be read locally`)
        return undefined
      }
      if (to === 'media' || isMedia(doc)) return liveMediaId(doc)
      const match = matchOf(to, doc)
      const label = `${to} "${match.slug ?? doc.name ?? doc.id}"`
      if (!match.slug) {
        problems.push(`${at}: ${to} "${doc.name ?? doc.id}" has no slug, so it cannot be matched on live`)
        return undefined
      }
      const live = await findLive(to, match)
      if (live) return live.id
      if (plan.has(`${to}:${JSON.stringify(match)}`)) {
        if (!WRITE) return `(new in this run: ${label})`
        deferred = true
        return DEFER
      }
      problems.push(`${at}: ${label} does not exist on live yet`)
      return undefined
    }

    const walk = async (node, at, blockType) => {
      if (Array.isArray(node)) {
        const items = []
        for (let i = 0; i < node.length; i++) {
          const v = await walk(node[i], [...at, i], blockType)
          if (v !== DEFER && v !== undefined) items.push(v)
        }
        return items
      }
      const rule = ruleFor(collection, at, blockType)
      const where = at.join('.')
      if (node && typeof node === 'object') {
        if (isMedia(node)) return liveMediaId(node)
        if (isPoly(node)) {
          const value = await resolve(node.relationTo, node.value, where)
          return value === undefined || value === DEFER ? value : { relationTo: node.relationTo, value }
        }
        if (rule) return resolve(rule.to, node, where)
        if (isDoc(node)) {
          problems.push(`${where}: a linked record with no promote rule (add one to RELATIONS)`)
          return undefined
        }
        const out = {}
        const bt = typeof node.blockType === 'string' ? node.blockType : blockType
        for (const [k, v] of Object.entries(node)) {
          if (SKIP_KEYS.has(k)) continue
          const w = await walk(v, [...at, k], bt)
          if (w === DEFER) continue
          out[k] = w
        }
        return out
      }
      if (rule && looksLikeId(node)) return resolve(rule.to, node, where)
      if (looksLikeId(node)) problems.push(`${where}: looks like a record id with no promote rule`)
      return node
    }

    // The record itself, key by key: it has an id and timestamps, but it is
    // not a linked record.
    const body = {}
    for (const [k, v] of Object.entries(local)) {
      if (SKIP_KEYS.has(k)) continue
      const w = await walk(v, [k], undefined)
      if (w !== DEFER && w !== undefined) body[k] = w
    }
    return { body, problems, deferred }
  }

  async function save(collection, liveDoc, body, publish) {
    // A draft save goes in as a new draft version (draft=true), so a published
    // live record keeps its published version.
    const url = liveDoc ? `${LIVE}/api/${collection}/${liveDoc.id}` : `${LIVE}/api/${collection}`
    const res = await fetch(publish ? url : `${url}?draft=true`, {
      method: liveDoc ? 'PATCH' : 'POST',
      headers: { ...liveHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, _status: publish ? 'published' : 'draft' }),
    })
    return (await json(res, `live ${collection} save`)).doc
  }

  return { liveMediaId, toLivePageBody, findLive, remember, readLocal, toLiveRecord, save }
}

const DEFER = Symbol('deferred')

/* ------------------------------------------------------------------ */
/* Runs                                                                */
/* ------------------------------------------------------------------ */

async function promotePage(p, { LIVE, liveHeaders, LOCAL, slug, WRITE, PUBLISH }) {
  const res = await fetch(`${LOCAL}/api/pages?where[slug][equals]=${encodeURIComponent(slug)}&depth=2&limit=1`)
  const local = (await json(res, 'local page read')).docs?.[0]
  if (!local) throw new Error(`No local page with slug "${slug}"`)
  const body = await p.toLivePageBody({
    title: local.title,
    slug: local.slug,
    hero: local.hero,
    layout: local.layout,
    meta: local.meta,
  })
  const target = await p.findLive('pages', { slug })
  log(`Live page: ${target ? `exists (id ${target.id}), will update` : 'not found, will create'}`)
  log(`Blocks: ${body.layout?.length ?? 0}`)
  if (!WRITE) {
    log('Dry run complete. Re-run with --write to apply.')
    return
  }
  const saved = await p.save('pages', target, body, PUBLISH)
  log(`Saved. Live page id: ${saved?.id}, status: ${PUBLISH ? 'published' : 'draft'}`)
}

async function promoteCollections(p, { collections, slugs, WRITE, PUBLISH }) {
  const ordered = orderCollections(collections)
  log(`Collections, in order: ${ordered.join(', ')}`)

  // Read every local record first, so the plan knows what this run creates.
  const locals = new Map()
  const plan = new Set()
  for (const c of ordered) {
    const docs = await p.readLocal(c, slugs)
    locals.set(c, docs)
    for (const d of docs) {
      const match = matchOf(c, d)
      if (!(await p.findLive(c, match))) plan.add(`${c}:${JSON.stringify(match)}`)
    }
  }

  const counts = { new: 0, changed: 0, unchanged: 0, refused: 0, saved: 0, failed: 0 }
  for (const c of ordered) {
    log(`\n${c}: ${locals.get(c).length} record(s)`)
    const second = []
    for (const local of locals.get(c)) {
      const match = matchOf(c, local)
      const name = `${match.slug ?? local.id}${match.type ? ` (${match.type})` : ''}`
      const status = `status ${local.status ?? '-'}, local ${local._status ?? 'no drafts'}`
      if (!match.slug) {
        log(`  [refused]   ${local.name ?? local.id}: no slug, so it cannot be matched on live`)
        counts.refused++
        continue
      }
      const { body, problems, deferred } = await p.toLiveRecord(c, local, plan)
      const live = await p.findLive(c, match)
      if (problems.length) {
        log(`  [refused]   ${name}  ${status}`)
        for (const why of problems) log(`                ${why}`)
        counts.refused++
        plan.delete(`${c}:${JSON.stringify(match)}`)
        continue
      }
      const changed = live ? changedKeys(body, live) : []
      const state = !live ? 'new' : changed.length ? 'changed' : 'unchanged'
      counts[state]++
      log(`  [${state}]${' '.repeat(10 - state.length)}${name}  ${status}${changed.length ? `  fields: ${changed.join(', ')}` : ''}${deferred ? '  (links to records created later in this run: filled in a second pass)' : ''}`)
      if (!WRITE || (state === 'unchanged' && !PUBLISH)) continue
      try {
        const saved = await p.save(c, live, body, PUBLISH)
        p.remember(c, match, saved)
        counts.saved++
        if (deferred) second.push(local)
      } catch (e) {
        log(`                save failed: ${e.message}`)
        counts.failed++
        plan.delete(`${c}:${JSON.stringify(match)}`)
      }
    }
    // Second pass: references to records this run created after the referrer.
    for (const local of second) {
      const match = matchOf(c, local)
      const { body, problems } = await p.toLiveRecord(c, local, plan)
      if (problems.length) {
        log(`  [second pass refused] ${match.slug}: ${problems.join('; ')}`)
        counts.refused++
        continue
      }
      try {
        await p.save(c, await p.findLive(c, match), body, PUBLISH)
        log(`  [second pass] ${match.slug}: links filled in`)
      } catch (e) {
        log(`  [second pass failed] ${match.slug}: ${e.message}`)
        counts.failed++
      }
    }
  }

  log(
    `\n${counts.new} new, ${counts.changed} changed, ${counts.unchanged} unchanged, ${counts.refused} refused.` +
      (WRITE ? ` Saved ${counts.saved} as ${PUBLISH ? 'published' : 'drafts'}, ${counts.failed} failed.` : ' Dry run: nothing written. Re-run with --write to save drafts.'),
  )
  if (counts.refused || counts.failed) process.exitCode = 1
}

async function main() {
  const args = process.argv.slice(2)
  const WRITE = args.includes('--write')
  const PUBLISH = WRITE && args.includes('--publish')
  const collections = []
  const rest = []
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--collection') collections.push(...(args[++i] || '').split(',').filter(Boolean))
    else if (!args[i].startsWith('--')) rest.push(args[i])
  }
  if (!collections.length && !rest[0]) {
    console.error(
      'Usage: node scripts/promote-page.mjs <slug> [--write] [--publish]\n' +
        '       node scripts/promote-page.mjs --collection <slug>[,<slug>] [<record slug> ...] [--write] [--publish]',
    )
    process.exit(1)
  }

  const env = readEnv()
  // Accepts the site root or the admin address, with or without a trailing slash.
  const LIVE = (env.PROMOTE_URL || '').replace(/\/admin\/?$/, '').replace(/\/$/, '')
  const LOCAL = (process.env.LOCAL_URL || 'http://localhost:3001').replace(/\/$/, '')
  if (!LIVE) throw new Error('PROMOTE_URL is empty.')

  // The REST API key is preferred. Email and password login is the fallback.
  const liveHeaders = env.PROMOTE_API_KEY
    ? { Authorization: `users API-Key ${env.PROMOTE_API_KEY}` }
    : await login(LIVE, env.PROMOTE_EMAIL, env.PROMOTE_PASSWORD, 'live')
  if (!liveHeaders) throw new Error('Set PROMOTE_API_KEY, or PROMOTE_EMAIL and PROMOTE_PASSWORD.')

  let localHeaders = {}
  if (collections.length) {
    localHeaders = env.LOCAL_API_KEY
      ? { Authorization: `users API-Key ${env.LOCAL_API_KEY}` }
      : await login(LOCAL, env.LOCAL_EMAIL, env.LOCAL_PASSWORD, 'local')
    if (!localHeaders) {
      throw new Error('Collections need LOCAL_API_KEY, or LOCAL_EMAIL and LOCAL_PASSWORD, to read drafts and Planned entries locally.')
    }
  }

  log(`Promoting ${collections.length ? `collections ${collections.join(', ')}` : `page "${rest[0]}"`} from ${LOCAL} to ${LIVE}`)
  log(WRITE ? (PUBLISH ? 'Mode: WRITE and PUBLISH' : 'Mode: WRITE (drafts)') : 'Mode: DRY RUN (no changes)')

  const p = createPromoter({ LIVE, LOCAL, liveHeaders, localHeaders, WRITE })
  if (collections.length) await promoteCollections(p, { collections, slugs: rest, WRITE, PUBLISH })
  else await promotePage(p, { LIVE, liveHeaders, LOCAL, slug: rest[0], WRITE, PUBLISH })
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((e) => {
    console.error(`Promote failed: ${e.message}`)
    process.exit(1)
  })
}
