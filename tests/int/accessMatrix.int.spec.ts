import 'dotenv/config'
import { createLocalReq, getPayload, refreshOperation, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import { KEY_SIGN_IN_MESSAGE } from '@/collections/Users/signIn'

/**
 * What each kind of caller may do in every collection, Payload's own and
 * plugins' included, checked against the table below. A collection added
 * later fails here until it is classified, which is the point: the access
 * gaps found on 11 Nov 2026 were in collections nobody had looked at.
 *
 * Each cell is create, read, update, delete: y allowed, n refused, w only
 * where a condition holds (published only, one's own record). A key acts as
 * its owner, so authorKey and adminKey differ from author and admin only
 * where a rule tells keys apart. "Open" marks a known gap, recorded in
 * docs/cms/roles-and-review.md: closing one means changing this table.
 */

type Cell = string
type Row = { nobody: Cell; author: Cell; authorKey: Cell; owner: Cell; admin: Cell; adminKey: Cell }

const EXPECTED: Record<string, Row> = {
  'pages': { nobody: 'nwnn', author: 'yyyy', authorKey: 'yyyy', owner: 'yyyy', admin: 'yyyy', adminKey: 'yyyy' },
  'posts': { nobody: 'nwnn', author: 'yyyy', authorKey: 'yyyy', owner: 'yyyy', admin: 'yyyy', adminKey: 'yyyy' },
  // Open: keys can upload and delete media, which is live at once.
  'media': { nobody: 'nynn', author: 'yyyy', authorKey: 'yyyy', owner: 'yyyy', admin: 'yyyy', adminKey: 'yyyy' },
  'categories': { nobody: 'nynn', author: 'yyyy', authorKey: 'yyyy', owner: 'yyyy', admin: 'yyyy', adminKey: 'yyyy' },
  'features': { nobody: 'nwnn', author: 'yyyy', authorKey: 'yyyy', owner: 'yyyy', admin: 'yyyy', adminKey: 'yyyy' },
  // Wave 1: only an admin signed in as themselves creates users; a key never does.
  'users': { nobody: 'nnnn', author: 'nywn', authorKey: 'nywn', owner: 'nywn', admin: 'yyyy', adminKey: 'nyyy' },
  // Open: any signed-in user or key reads every enquiry (names, emails, phones).
  'enquiries': { nobody: 'ynnn', author: 'yyyy', authorKey: 'yyyy', owner: 'yyyy', admin: 'yyyy', adminKey: 'yyyy' },
  'sectors': { nobody: 'nwnn', author: 'yyyy', authorKey: 'yyyy', owner: 'yyyy', admin: 'yyyy', adminKey: 'yyyy' },
  'industryTopics': { nobody: 'nwnn', author: 'yyyy', authorKey: 'yyyy', owner: 'yyyy', admin: 'yyyy', adminKey: 'yyyy' },
  'sharedContent': { nobody: 'nwnn', author: 'yyyy', authorKey: 'yyyy', owner: 'yyyy', admin: 'yyyy', adminKey: 'yyyy' },
  'customers': { nobody: 'nwnn', author: 'yyyy', authorKey: 'yyyy', owner: 'yyyy', admin: 'yyyy', adminKey: 'yyyy' },
  'integrationsMaster': { nobody: 'nwnn', author: 'yyyy', authorKey: 'yyyy', owner: 'yyyy', admin: 'yyyy', adminKey: 'yyyy' },
  'integrations': { nobody: 'nwnn', author: 'yyyy', authorKey: 'yyyy', owner: 'yyyy', admin: 'yyyy', adminKey: 'yyyy' },
  'integrationCategories': { nobody: 'nwnn', author: 'yyyy', authorKey: 'yyyy', owner: 'yyyy', admin: 'yyyy', adminKey: 'yyyy' },
  'connectionTypes': { nobody: 'nwnn', author: 'yyyy', authorKey: 'yyyy', owner: 'yyyy', admin: 'yyyy', adminKey: 'yyyy' },
  'products': { nobody: 'nynn', author: 'yyyy', authorKey: 'yyyy', owner: 'yyyy', admin: 'yyyy', adminKey: 'yyyy' },
  'lists': { nobody: 'nwnn', author: 'yyyy', authorKey: 'yyyy', owner: 'yyyy', admin: 'yyyy', adminKey: 'yyyy' },
  'crmFeatures': { nobody: 'nwnn', author: 'yyyy', authorKey: 'yyyy', owner: 'yyyy', admin: 'yyyy', adminKey: 'yyyy' },
  'microApps': { nobody: 'nwnn', author: 'yyyy', authorKey: 'yyyy', owner: 'yyyy', admin: 'yyyy', adminKey: 'yyyy' },
  'hubs': { nobody: 'nwnn', author: 'yyyy', authorKey: 'yyyy', owner: 'yyyy', admin: 'yyyy', adminKey: 'yyyy' },
  'ncxPostContents': { nobody: 'nnnn', author: 'nynn', authorKey: 'nynn', owner: 'nynn', admin: 'nynn', adminKey: 'nynn' },
  'rubrics': { nobody: 'nnnn', author: 'nynn', authorKey: 'nynn', owner: 'nynn', admin: 'yyyy', adminKey: 'yyyy' },
  // Open: anyone signed in can record a run with results of their choosing.
  'benchmarkRuns': { nobody: 'nnnn', author: 'yynn', authorKey: 'yynn', owner: 'yynn', admin: 'yyny', adminKey: 'yyny' },
  'contentEvents': { nobody: 'nnnn', author: 'nynn', authorKey: 'nynn', owner: 'nynn', admin: 'nynn', adminKey: 'nynn' },
  // Open: keys can create redirects, which go live at once (no drafts).
  'redirects': { nobody: 'nynn', author: 'yyyy', authorKey: 'yyyy', owner: 'yyyy', admin: 'yyyy', adminKey: 'yyyy' },
  // Open: anyone signed in can create MCP keys and link one to any user. MCP is find-only today.
  'payload-mcp-api-keys': { nobody: 'nnnn', author: 'yyyy', authorKey: 'yyyy', owner: 'yyyy', admin: 'yyyy', adminKey: 'yyyy' },
  'payload-kv': { nobody: 'nnnn', author: 'nnnn', authorKey: 'nnnn', owner: 'nnnn', admin: 'nnnn', adminKey: 'nnnn' },
  // Fixed 279da24: read only through the API (src/access/jobsCollection.ts).
  'payload-jobs': { nobody: 'nnnn', author: 'nynn', authorKey: 'nynn', owner: 'nynn', admin: 'nynn', adminKey: 'nynn' },
  // Open (low): media folders can be rearranged by anyone signed in.
  'payload-folders': { nobody: 'nnnn', author: 'yyyy', authorKey: 'yyyy', owner: 'yyyy', admin: 'yyyy', adminKey: 'yyyy' },
  // Open (low): anyone signed in can delete another person's edit lock.
  'payload-locked-documents': { nobody: 'nnnn', author: 'yyyy', authorKey: 'yyyy', owner: 'yyyy', admin: 'yyyy', adminKey: 'yyyy' },
  // Open (low): update is not limited to one's own preferences.
  'payload-preferences': { nobody: 'nnnn', author: 'ywyw', authorKey: 'ywyw', owner: 'ywyw', admin: 'ywyw', adminKey: 'ywyw' },
  // Open (low): the migrations log is editable; no migrations are run.
  'payload-migrations': { nobody: 'nnnn', author: 'yyyy', authorKey: 'yyyy', owner: 'yyyy', admin: 'yyyy', adminKey: 'yyyy' },
}

const base = { id: '000000000000000000000001', email: 'zz-matrix@example.test', collection: 'users' }
const ACTORS: Record<keyof Row, unknown> = {
  nobody: null,
  author: { ...base, role: 'author', _strategy: 'local-jwt' },
  authorKey: { ...base, role: 'author', _strategy: 'api-key' },
  owner: { ...base, role: 'contentOwner', _strategy: 'local-jwt' },
  admin: { ...base, role: 'admin', _strategy: 'local-jwt' },
  adminKey: { ...base, role: 'admin', _strategy: 'api-key' },
}
const OPS = ['create', 'read', 'update', 'delete'] as const
const code = (v: unknown) => (v === true ? 'y' : v ? 'w' : 'n')

describe('the access matrix', () => {
  let payload: Payload
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
  })

  it('classifies every collection in the config, and nothing that is gone', () => {
    const slugs = payload.config.collections.map((c) => c.slug)
    expect(slugs.filter((s) => !EXPECTED[s]), 'collections with no row: add them to EXPECTED').toEqual([])
    expect(Object.keys(EXPECTED).filter((s) => !(slugs as string[]).includes(s)), 'rows for collections that no longer exist').toEqual([])
  })

  it('gives each kind of caller exactly the access in the table', async () => {
    const actual: Record<string, Partial<Row>> = {}
    for (const c of payload.config.collections) {
      actual[c.slug] = {}
      for (const [who, user] of Object.entries(ACTORS) as [keyof Row, unknown][]) {
        const req = await createLocalReq({ user: user as never }, payload)
        let cell = ''
        for (const op of OPS) cell += code(await (c.access as Record<string, (a: unknown) => unknown>)[op]({ req, data: {} }))
        actual[c.slug][who] = cell
      }
    }
    expect(actual).toEqual(EXPECTED)
  })
})

describe('keys and sign-in', () => {
  let payload: Payload
  let author: Record<string, any>
  let admin: Record<string, any>
  const password = `zz-matrix-${Date.now()}`
  const as = (u: Record<string, any>, strategy: 'api-key' | 'local-jwt') => ({ ...u, collection: 'users' as const, _strategy: strategy })
  const sweep = async () => {
    const found = await payload.find({ collection: 'users' as const, where: { email: { like: 'zz-matrix-' } }, pagination: false, overrideAccess: true })
    for (const u of found.docs) await payload.delete({ collection: 'users', id: u.id, overrideAccess: true })
  }
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await sweep()
    author = await payload.create({ collection: 'users', data: { email: 'zz-matrix-author@example.test', password, role: 'author' } as never, overrideAccess: true })
    admin = await payload.create({ collection: 'users', data: { email: 'zz-matrix-admin@example.test', password, role: 'admin' } as never, overrideAccess: true })
  })
  afterAll(sweep)

  it('lets no key create a user, an admin key included, and no author either', async () => {
    const newUser = (email: string) => ({ email, password: 'zz-matrix-Password-1', role: 'admin' })
    for (const [i, user] of [as(author, 'api-key'), as(admin, 'api-key'), as(author, 'local-jwt')].entries()) {
      const email = `zz-matrix-new-${i}@example.test`
      await expect(payload.create({ collection: 'users', data: newUser(email) as never, user, overrideAccess: false })).rejects.toMatchObject({ name: 'Forbidden' })
    }
    const made = await payload.create({ collection: 'users', data: newUser('zz-matrix-by-admin@example.test') as never, user: as(admin, 'local-jwt'), overrideAccess: false })
    expect(made.id).toBeTruthy()
  })

  it("refuses a key's change to its owner's password, email or API key settings, and lets the person change them", async () => {
    for (const data of [{ password: 'zz-matrix-Changed-1' }, { email: 'zz-matrix-moved@example.test' }, { enableAPIKey: true }]) {
      await expect(payload.update({ collection: 'users', id: author.id, data: data as never, user: as(author, 'api-key'), overrideAccess: false })).rejects.toThrow(KEY_SIGN_IN_MESSAGE)
    }
    const named = await payload.update({ collection: 'users', id: author.id, data: { name: 'ZZ Matrix' } as never, user: as(author, 'api-key'), overrideAccess: false })
    expect(named.name).toBe('ZZ Matrix')
    const changed = await payload.update({ collection: 'users', id: author.id, data: { password: 'zz-matrix-Changed-2' } as never, user: as(author, 'local-jwt'), overrideAccess: false })
    expect(changed.id).toBe(author.id)
  })

  it('gives a key no session token through refresh', async () => {
    const req = await createLocalReq({ user: as(author, 'api-key') as never }, payload)
    ;(req as { url: string }).url = 'http://localhost/api/users/refresh-token'
    await expect(refreshOperation({ collection: payload.collections.users, req } as never)).rejects.toMatchObject({ name: 'Forbidden' })
  })
})
