import 'dotenv/config'
import type { MongooseAdapter } from '@payloadcms/db-mongodb'
import { getPayload, type Payload, type PayloadRequest, type SelectField } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import { adminInPerson } from '@/access/adminInPerson'
import { isApiKeyRequest } from '@/access/apiKeyRequest'
import { contentOwnerOrAdmin } from '@/access/contentOwnerOrAdmin'
import { hasRole, type Role } from '@/access/roles'
import { API_KEY_PUBLISH_MESSAGE, noPublishWithApiKey } from '@/fields/publishStatus'
import { roleField } from '@/fields/role'
import type { User } from '@/payload-types'

/**
 * Roles (src/fields/role.ts, src/access/) and the rule that API keys save
 * drafts but never publish (src/fields/publishStatus.ts). The last group uses
 * the local database with temporary records (zz-role-), deleted afterwards.
 */

type SignedIn = NonNullable<PayloadRequest['user']>

// A signed-in user as Payload hands it to access and validation: the users
// document plus how the request authenticated.
const signedIn = (role: Role | undefined, strategy = 'local-jwt', id = 'u1'): SignedIn =>
  ({ id, email: `${id}@example.test`, role, collection: 'users', _strategy: strategy }) as unknown as SignedIn
const reqFor = (user: SignedIn | null) => ({ user, t: (key: string) => key }) as unknown as PayloadRequest
type ValidateOptions = Parameters<typeof noPublishWithApiKey>[1]
const statusOptions = (user: SignedIn | null) =>
  ({ req: reqFor(user), options: ['draft', 'published'], hasMany: false }) as unknown as ValidateOptions

describe('the role field', () => {
  it('is a required select of Admin, Content owner and Author, defaulting to Author', () => {
    expect(roleField()).toMatchObject({
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'author',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Content owner', value: 'contentOwner' },
        { label: 'Author', value: 'author' },
      ],
    })
    expect(roleField().hasMany).toBeUndefined()
  })

  it('lets only an admin in person set or change it, never a key', () => {
    const { create, update } = roleField().access!
    for (const fn of [create!, update!]) {
      const may = (user: SignedIn | null) => fn({ req: reqFor(user) } as never)
      expect([may(signedIn('admin')), may(signedIn('admin', 'api-key')), may(signedIn('contentOwner')), may(null)]).toEqual([true, false, false, false])
    }
  })

  it('is on users, in the sidebar, with a description', async () => {
    const users = (await config).collections.find((c) => c.slug === 'users')!
    const role = users.fields.find((f) => 'name' in f && f.name === 'role') as SelectField
    expect(role.admin?.position).toBe('sidebar')
    expect(role.admin?.description).toBe('What this person can do in the admin. Only admins can change it.')
  })
})

describe('the access helpers', () => {
  const each: (Role | undefined)[] = ['admin', 'contentOwner', 'author', undefined]
  const check = (fn: (args: { req: PayloadRequest }) => unknown) => each.map((role) => fn({ req: reqFor(signedIn(role)) }))

  it('adminInPerson passes admins signed in as themselves only', () => {
    expect(check(adminInPerson as never)).toEqual([true, false, false, false])
    expect(adminInPerson({ req: reqFor(signedIn('admin', 'api-key')) } as never)).toBe(false)
    expect(adminInPerson({ req: reqFor(null) } as never)).toBe(false)
  })

  it('contentOwnerOrAdmin passes content owners and admins', () => {
    expect(check(contentOwnerOrAdmin)).toEqual([true, true, false, false])
    expect(contentOwnerOrAdmin({ req: reqFor(null) })).toBe(false)
  })

  it('gives a user with no role value no role at all', () => {
    expect(hasRole(signedIn(undefined), 'admin', 'contentOwner', 'author')).toBe(false)
  })

  it('gives an MCP key record, which has no role field, no role', () => {
    const key = { id: 'k1', collection: 'payload-mcp-api-keys' } as unknown as SignedIn
    expect(hasRole(key, 'admin', 'contentOwner', 'author')).toBe(false)
  })
})

describe('API-key requests', () => {
  it('are told apart by how they signed in, not by collection', () => {
    expect(isApiKeyRequest(reqFor(signedIn('admin', 'api-key')))).toBe(true)
    // The MCP endpoint signs in as the key's owner, a users document.
    expect(isApiKeyRequest(reqFor(signedIn('admin', 'mcp-api-key')))).toBe(true)
    expect(isApiKeyRequest(reqFor(signedIn('admin', 'local-jwt')))).toBe(false)
    expect(isApiKeyRequest(reqFor(null))).toBe(false)
  })

  it('cannot set _status to published; drafts, people and scheduled publishes can', async () => {
    const key = signedIn('admin', 'api-key')
    expect(await noPublishWithApiKey('published', statusOptions(key))).toBe(API_KEY_PUBLISH_MESSAGE)
    expect(await noPublishWithApiKey('published', statusOptions(signedIn('admin', 'mcp-api-key')))).toBe(
      API_KEY_PUBLISH_MESSAGE,
    )
    expect(await noPublishWithApiKey('draft', statusOptions(key))).toBe(true)
    expect(await noPublishWithApiKey('published', statusOptions(signedIn('author')))).toBe(true)
    expect(await noPublishWithApiKey('published', statusOptions(null))).toBe(true)
  })

  it("keeps Payload's own check of the value", async () => {
    expect(await noPublishWithApiKey('archived', statusOptions(signedIn('admin')))).toBe('validation:invalidSelection')
  })

  it('applies to every collection with drafts, keeping Draft and Published as the only options', async () => {
    const collections = (await config).collections
    const withDrafts = collections.filter((c) => c.versions && c.versions.drafts)
    expect(withDrafts.length).toBeGreaterThanOrEqual(14)
    for (const c of collections) {
      const status = c.fields.filter((f) => 'name' in f && f.name === '_status') as SelectField[]
      if (!(c.versions && c.versions.drafts)) {
        expect(status, c.slug).toEqual([])
        continue
      }
      expect(status, c.slug).toHaveLength(1)
      expect(status[0].validate, c.slug).toBe(noPublishWithApiKey)
      expect(status[0].defaultValue, c.slug).toBe('draft')
      expect(status[0].options.map((o) => (typeof o === 'string' ? o : o.value)), c.slug).toEqual(['draft', 'published'])
    }
  })
})

describe('with the local database', () => {
  let payload: Payload
  let admin: User
  let author: User
  const sectors: string[] = []
  const quiet = { context: { disableRevalidate: true }, depth: 0 } as const
  const password = `zz-role-${Date.now()}`
  const as = (user: User, strategy = 'local-jwt') => ({ ...user, collection: 'users' as const, _strategy: strategy })

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await payload.delete({ ...quiet, collection: 'users', where: { email: { like: 'zz-role-' } } })
    admin = await payload.create({ ...quiet, collection: 'users', data: { email: 'zz-role-admin@example.test', password, role: 'admin' } })
    author = await payload.create({ ...quiet, collection: 'users', data: { email: 'zz-role-author@example.test', password, role: 'author' } })
  })
  afterAll(async () => {
    for (const id of sectors) await payload.delete({ ...quiet, collection: 'sectors', id }).catch(() => undefined)
    await payload.delete({ ...quiet, collection: 'users', where: { email: { like: 'zz-role-' } } })
  })

  it('refuses a new user from an author: only an admin adds people (src/collections/Users/signIn.ts)', async () => {
    const attempt = payload.create({
      ...quiet,
      collection: 'users',
      data: { email: 'zz-role-new@example.test', password, role: 'admin' },
      user: as(author),
      overrideAccess: false,
    })
    await expect(attempt).rejects.toMatchObject({ name: 'Forbidden' })
  })

  it('keeps an author from changing their own role', async () => {
    const self = await payload.update({ ...quiet, collection: 'users', id: author.id, data: { role: 'admin' }, user: as(author), overrideAccess: false })
    expect(self.role).toBe('author')
  })

  it('lets an admin change a role', async () => {
    const changed = await payload.update({ ...quiet, collection: 'users', id: author.id, data: { role: 'contentOwner' }, user: as(admin), overrideAccess: false })
    expect(changed.role).toBe('contentOwner')
    await payload.update({ ...quiet, collection: 'users', id: author.id, data: { role: 'author' } })
  })

  it('lets anyone who is not an admin change only their own record', async () => {
    const own = await payload.update({ ...quiet, collection: 'users', id: author.id, data: { name: 'ZZ role author' }, user: as(author), overrideAccess: false })
    expect(own.name).toBe('ZZ role author')
    // Resetting an admin's password would let an author sign in as that admin.
    const other = payload.update({ ...quiet, collection: 'users', id: admin.id, data: { password: 'zz-role-taken' }, user: as(author), overrideAccess: false })
    await expect(other).rejects.toMatchObject({ status: 403 })
    const edited = await payload.update({ ...quiet, collection: 'users', id: author.id, data: { name: 'ZZ role by admin' }, user: as(admin), overrideAccess: false })
    expect(edited.name).toBe('ZZ role by admin')
  })

  it('lets only admins delete users, the user themselves included', async () => {
    const victim = await payload.create({ ...quiet, collection: 'users', data: { email: 'zz-role-delete@example.test', password, role: 'author' } })
    for (const by of [author, victim]) {
      const attempt = payload.delete({ ...quiet, collection: 'users', id: victim.id, user: as(by), overrideAccess: false })
      await expect(attempt, by.email).rejects.toMatchObject({ status: 403 })
    }
    await payload.delete({ ...quiet, collection: 'users', id: victim.id, user: as(admin), overrideAccess: false })
    expect((await payload.find({ ...quiet, collection: 'users', where: { id: { equals: victim.id } } })).docs).toEqual([])
  })

  it('finds users saved before roles existed, which the backfill relies on, and reads them as Author', async () => {
    const legacy = await payload.create({ ...quiet, collection: 'users', data: { email: 'zz-role-legacy@example.test', password, role: 'author' } })
    await (payload.db as MongooseAdapter).collections.users.updateOne({ _id: legacy.id }, { $unset: { role: 1 } })
    const missing = await payload.find({ ...quiet, collection: 'users', where: { role: { exists: false } }, pagination: false })
    expect(missing.docs.map((u) => u.id)).toContain(legacy.id)
    // Payload fills the default on read, so a signed-in legacy user is an Author.
    const read = await payload.findByID({ ...quiet, collection: 'users', id: legacy.id })
    expect(read.role).toBe('author')
    expect(hasRole(as(read), 'admin', 'contentOwner')).toBe(false)
  })

  it('refuses to publish from an API key or MCP key, even an admin\'s, but saves its drafts', async () => {
    const draft = await payload.create({
      ...quiet,
      collection: 'sectors',
      draft: true,
      data: { name: 'ZZ ROLE sector', slug: 'zz-role-sector', hasOwnPage: false, _status: 'draft' },
    })
    sectors.push(draft.id)
    for (const strategy of ['api-key', 'mcp-api-key']) {
      const publish = payload.update({
        ...quiet,
        collection: 'sectors',
        id: draft.id,
        data: { _status: 'published' },
        user: as(admin, strategy),
        overrideAccess: false,
      })
      await expect(publish, strategy).rejects.toMatchObject({
        data: { errors: expect.arrayContaining([expect.objectContaining({ path: '_status', message: API_KEY_PUBLISH_MESSAGE })]) },
      })
    }
    const saved = await payload.update({
      ...quiet,
      collection: 'sectors',
      id: draft.id,
      draft: true,
      data: { name: 'ZZ ROLE sector edited' },
      user: as(admin, 'api-key'),
      overrideAccess: false,
    })
    expect(saved).toMatchObject({ name: 'ZZ ROLE sector edited', _status: 'draft' })
  })
})
