import 'dotenv/config'
import { createLocalReq, getPayload, refreshOperation, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import config from '@/payload.config'
import { KEY_SIGN_IN_MESSAGE } from '@/collections/Users/signIn'

/**
 * What each kind of caller may do in every collection and global, Payload's
 * own and plugins' included, checked against the table below. A collection added
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
  // Wave 3: no key deletes anything in a collection this config defines (src/plugins/apiKeysDraftOnly.ts).
  'pages': { nobody: 'nwnn', author: 'yyyy', authorKey: 'yyyn', owner: 'yyyy', admin: 'yyyy', adminKey: 'yyyn' },
  'posts': { nobody: 'nwnn', author: 'yyyy', authorKey: 'yyyn', owner: 'yyyy', admin: 'yyyy', adminKey: 'yyyn' },
  // Fixed: a key uploads images only (checked by content) and never replaces or deletes; reading stays open.
  'media': { nobody: 'nynn', author: 'yyyy', authorKey: 'yynn', owner: 'yyyy', admin: 'yyyy', adminKey: 'yynn' },
  'categories': { nobody: 'nynn', author: 'yyyy', authorKey: 'yyyn', owner: 'yyyy', admin: 'yyyy', adminKey: 'yyyn' },
  'features': { nobody: 'nwnn', author: 'yyyy', authorKey: 'yyyn', owner: 'yyyy', admin: 'yyyy', adminKey: 'yyyn' },
  // Wave 1: only an admin signed in as themselves creates users; a key never does.
  // Fixed 13 Nov: a user record holds its API key, so anyone but an admin in person reads and changes only their own.
  'users': { nobody: 'nnnn', author: 'nwwn', authorKey: 'nwwn', owner: 'nwwn', admin: 'yyyy', adminKey: 'nwwn' },
  // Fixed (wave 2): personal data, an admin in person only; created by the website form (with its secret) or such an admin.
  'enquiries': { nobody: 'nnnn', author: 'nnnn', authorKey: 'nnnn', owner: 'nnnn', admin: 'yyyy', adminKey: 'nnnn' },
  'sectors': { nobody: 'nwnn', author: 'yyyy', authorKey: 'yyyn', owner: 'yyyy', admin: 'yyyy', adminKey: 'yyyn' },
  'industryTopics': { nobody: 'nwnn', author: 'yyyy', authorKey: 'yyyn', owner: 'yyyy', admin: 'yyyy', adminKey: 'yyyn' },
  'sharedContent': { nobody: 'nwnn', author: 'yyyy', authorKey: 'yyyn', owner: 'yyyy', admin: 'yyyy', adminKey: 'yyyn' },
  'customers': { nobody: 'nwnn', author: 'yyyy', authorKey: 'yyyn', owner: 'yyyy', admin: 'yyyy', adminKey: 'yyyn' },
  'integrationsMaster': { nobody: 'nwnn', author: 'yyyy', authorKey: 'yyyn', owner: 'yyyy', admin: 'yyyy', adminKey: 'yyyn' },
  'integrations': { nobody: 'nwnn', author: 'yyyy', authorKey: 'yyyn', owner: 'yyyy', admin: 'yyyy', adminKey: 'yyyn' },
  'integrationCategories': { nobody: 'nwnn', author: 'yyyy', authorKey: 'yyyn', owner: 'yyyy', admin: 'yyyy', adminKey: 'yyyn' },
  'connectionTypes': { nobody: 'nwnn', author: 'yyyy', authorKey: 'yyyn', owner: 'yyyy', admin: 'yyyy', adminKey: 'yyyn' },
  'products': { nobody: 'nynn', author: 'yyyy', authorKey: 'yyyn', owner: 'yyyy', admin: 'yyyy', adminKey: 'yyyn' },
  'lists': { nobody: 'nwnn', author: 'yyyy', authorKey: 'yyyn', owner: 'yyyy', admin: 'yyyy', adminKey: 'yyyn' },
  'crmFeatures': { nobody: 'nwnn', author: 'yyyy', authorKey: 'yyyn', owner: 'yyyy', admin: 'yyyy', adminKey: 'yyyn' },
  'microApps': { nobody: 'nwnn', author: 'yyyy', authorKey: 'yyyn', owner: 'yyyy', admin: 'yyyy', adminKey: 'yyyn' },
  'hubs': { nobody: 'nwnn', author: 'yyyy', authorKey: 'yyyn', owner: 'yyyy', admin: 'yyyy', adminKey: 'yyyn' },
  'ncxPostContents': { nobody: 'nnnn', author: 'nynn', authorKey: 'nynn', owner: 'nynn', admin: 'nynn', adminKey: 'nynn' },
  // Wave 2: the enquiry read log; written by the server only, read by an admin in person.
  'enquiryReads': { nobody: 'nnnn', author: 'nnnn', authorKey: 'nnnn', owner: 'nnnn', admin: 'nynn', adminKey: 'nnnn' },
  // Fixed 13 Nov: the rubric decides what passes the gate, so an admin in person, never a key.
  'rubrics': { nobody: 'nnnn', author: 'nynn', authorKey: 'nynn', owner: 'nynn', admin: 'yyyy', adminKey: 'nynn' },
  // Fixed (wave 3): never through the API, an admin included: the scorer writes runs on the server.
  'benchmarkRuns': { nobody: 'nnnn', author: 'nynn', authorKey: 'nynn', owner: 'nynn', admin: 'nyny', adminKey: 'nynn' },
  'contentEvents': { nobody: 'nnnn', author: 'nynn', authorKey: 'nynn', owner: 'nynn', admin: 'nynn', adminKey: 'nynn' },
  // Fixed (wave 2): live at once (no drafts), so a content owner or admin in person, never an author or a key.
  'redirects': { nobody: 'nynn', author: 'nynn', authorKey: 'nynn', owner: 'yyyy', admin: 'yyyy', adminKey: 'nynn' },
  // Fixed (wave 3): MCP keys run as the user they link to, so an admin in person only, never a key.
  'payload-mcp-api-keys': { nobody: 'nnnn', author: 'nnnn', authorKey: 'nnnn', owner: 'nnnn', admin: 'yyyy', adminKey: 'nnnn' },
  'payload-kv': { nobody: 'nnnn', author: 'nnnn', authorKey: 'nnnn', owner: 'nnnn', admin: 'nnnn', adminKey: 'nnnn' },
  // Fixed 279da24: read only through the API (src/access/jobsCollection.ts).
  'payload-jobs': { nobody: 'nnnn', author: 'nynn', authorKey: 'nynn', owner: 'nynn', admin: 'nynn', adminKey: 'nynn' },
  // Fixed (wave 3): people only, never a key (src/access/internalCollections.ts).
  'payload-folders': { nobody: 'nnnn', author: 'yyyy', authorKey: 'nnnn', owner: 'yyyy', admin: 'yyyy', adminKey: 'nnnn' },
  // Fixed (wave 3): people only, never a key; taking over a lock stays possible for people.
  'payload-locked-documents': { nobody: 'nnnn', author: 'yyyy', authorKey: 'nnnn', owner: 'yyyy', admin: 'yyyy', adminKey: 'nnnn' },
  // Fixed (wave 3): one's own preferences only, changing included; never a key.
  'payload-preferences': { nobody: 'nnnn', author: 'ywww', authorKey: 'nnnn', owner: 'ywww', admin: 'ywww', adminKey: 'nnnn' },
  // Fixed (wave 3): nobody through the API; GraphQL could reach it. Payload's migration runner is unaffected.
  'payload-migrations': { nobody: 'nnnn', author: 'nnnn', authorKey: 'nnnn', owner: 'nnnn', admin: 'nnnn', adminKey: 'nnnn' },
}

/** Globals: read, update. */
const EXPECTED_GLOBALS: Record<string, Row> = {
  // Fixed (wave 3): live at once (no drafts), so a content owner or admin in person, never a key.
  'header': { nobody: 'yn', author: 'yn', authorKey: 'yn', owner: 'yy', admin: 'yy', adminKey: 'yn' },
  'footer': { nobody: 'yn', author: 'yn', authorKey: 'yn', owner: 'yy', admin: 'yy', adminKey: 'yn' },
  'siteSettings': { nobody: 'yn', author: 'yn', authorKey: 'yn', owner: 'yy', admin: 'yy', adminKey: 'yn' },
  'whatsappLists': { nobody: 'yn', author: 'yn', authorKey: 'yn', owner: 'yy', admin: 'yy', adminKey: 'yn' },
  // Fixed (wave 3): it holds the review switch and the gates, so an admin in person only, never a key.
  'contentStandards': { nobody: 'nn', author: 'yn', authorKey: 'yn', owner: 'yn', admin: 'yy', adminKey: 'yn' },
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
    // Enquiries from nobody depend on the website's shared secret being set, as it is live.
    vi.stubEnv('ENQUIRY_SECRET', 'zz-matrix-secret')
    payload = await getPayload({ config: await config })
  })
  afterAll(() => vi.unstubAllEnvs())

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

  it('gives each kind of caller exactly the access in the table for every global', async () => {
    const slugs = payload.config.globals.map((g) => g.slug)
    expect(slugs.filter((s) => !EXPECTED_GLOBALS[s]), 'globals with no row: add them to EXPECTED_GLOBALS').toEqual([])
    const actual: Record<string, Partial<Row>> = {}
    for (const g of payload.config.globals) {
      actual[g.slug] = {}
      for (const [who, user] of Object.entries(ACTORS) as [keyof Row, unknown][]) {
        const req = await createLocalReq({ user: user as never }, payload)
        let cell = ''
        for (const op of ['read', 'update'] as const) cell += code(await (g.access as Record<string, (a: unknown) => unknown>)[op]({ req, data: {} }))
        actual[g.slug][who] = cell
      }
    }
    expect(actual).toEqual(EXPECTED_GLOBALS)
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

  it('lets no key switch off the review workflow, an admin key included; the admin in person can', async () => {
    const standards = await payload.findGlobal({ slug: 'contentStandards', depth: 0, overrideAccess: true })
    const was = Boolean((standards as { reviewRequired?: boolean }).reviewRequired)
    const change = (user: Record<string, any>) =>
      payload.updateGlobal({ slug: 'contentStandards', data: { reviewRequired: was } as never, depth: 0, user: user as never, overrideAccess: false })
    await expect(change(as(admin, 'api-key'))).rejects.toMatchObject({ name: 'Forbidden' })
    await expect(change(as(author, 'local-jwt'))).rejects.toMatchObject({ name: 'Forbidden' })
    // Saved as it was, so other tests running alongside see no change.
    await expect(change(as(admin, 'local-jwt'))).resolves.toBeTruthy()
  })

  it('lets only an admin in person make an MCP key, so nobody can mint one that runs as an admin', async () => {
    const key = (user: Record<string, any>) =>
      payload.create({ collection: 'payload-mcp-api-keys', data: { user: admin.id, label: 'zz-matrix MCP key' } as never, user: user as never, overrideAccess: false })
    for (const user of [as(author, 'local-jwt'), as(author, 'api-key'), as(admin, 'api-key')]) {
      await expect(key(user)).rejects.toMatchObject({ name: 'Forbidden' })
    }
    const made = await key(as(admin, 'local-jwt'))
    await payload.delete({ collection: 'payload-mcp-api-keys', id: made.id, overrideAccess: true })
  })

  it("lets nobody but an admin in person read other users, so nobody reads another user's API key", async () => {
    const keyed = await payload.update({ collection: 'users', id: admin.id, data: { enableAPIKey: true, apiKey: `zz-matrix-key-${Date.now()}` } as never, overrideAccess: true })
    expect(keyed.id).toBe(admin.id)
    const listFor = async (user: Record<string, any>) =>
      (await payload.find({ collection: 'users', user: user as never, overrideAccess: false, pagination: false, depth: 0 })).docs.map((u) => String(u.id))
    expect(await listFor(as(author, 'local-jwt'))).toEqual([String(author.id)])
    expect(await listFor(as(author, 'api-key'))).toEqual([String(author.id)])
    expect(await listFor(as(admin, 'api-key'))).toEqual([String(admin.id)])
    expect((await listFor(as(admin, 'local-jwt'))).length).toBeGreaterThan(1)
    await expect(payload.findByID({ collection: 'users', id: admin.id, user: as(author, 'local-jwt') as never, overrideAccess: false })).rejects.toMatchObject({ status: 404 })
  })

  it("lets no admin key change another user, their role included, or unlock an account", async () => {
    await expect(
      payload.update({ collection: 'users', id: author.id, data: { role: 'admin' } as never, user: as(admin, 'api-key') as never, overrideAccess: false }),
    ).rejects.toMatchObject({ name: 'Forbidden' })
    expect((await payload.findByID({ collection: 'users', id: author.id, overrideAccess: true })).role).toBe('author')
    // Its own record: the role is dropped, not changed.
    const own = await payload.update({ collection: 'users', id: admin.id, data: { role: 'author', name: 'ZZ Matrix Admin' } as never, user: as(admin, 'api-key') as never, overrideAccess: false })
    expect(own).toMatchObject({ role: 'admin', name: 'ZZ Matrix Admin' })
    const unlock = payload.collections.users.config.access.unlock
    for (const [user, may] of [[as(author, 'local-jwt'), false], [as(admin, 'api-key'), false], [as(admin, 'local-jwt'), true]] as const) {
      expect(Boolean(await unlock({ req: await createLocalReq({ user: user as never }, payload) } as never))).toBe(may)
    }
  })

  it('takes an MCP key only at the MCP endpoint: it is no REST or GraphQL key; a user key still is', async () => {
    const mcpSecret = `zz-matrix-mcp-${Date.now()}`
    const mcp = await payload.create({ collection: 'payload-mcp-api-keys', data: { user: admin.id, label: 'zz-matrix MCP key', enableAPIKey: true, apiKey: mcpSecret } as never, overrideAccess: true })
    try {
      const signIn = (header: string) => payload.auth({ headers: new Headers({ Authorization: header }) })
      expect((await signIn(`payload-mcp-api-keys API-Key ${mcpSecret}`)).user).toBeNull()
      const userSecret = `zz-matrix-user-${Date.now()}`
      await payload.update({ collection: 'users', id: author.id, data: { enableAPIKey: true, apiKey: userSecret } as never, overrideAccess: true })
      expect((await signIn(`users API-Key ${userSecret}`)).user?.id).toBe(author.id)
    } finally {
      await payload.delete({ collection: 'payload-mcp-api-keys', id: mcp.id, overrideAccess: true })
    }
  })

  it('gives a key no session token through refresh', async () => {
    const req = await createLocalReq({ user: as(author, 'api-key') as never }, payload)
    ;(req as { url: string }).url = 'http://localhost/api/users/refresh-token'
    await expect(refreshOperation({ collection: payload.collections.users, req } as never)).rejects.toMatchObject({ name: 'Forbidden' })
  })
})
