import 'dotenv/config'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import config from '@/payload.config'

/**
 * The enquiry read log (src/collections/EnquiryReads.ts): who saw which
 * enquiry. Temporary records: zz-er-. No NCX lead or email is sent: both are
 * switched off for the run.
 */

type Doc = Record<string, any>

describe('the enquiry read log', () => {
  let payload: Payload
  let admin: Doc
  let author: Doc
  let enquiry: Doc
  const as = (u: Doc, strategy: 'api-key' | 'local-jwt' = 'local-jwt') => ({ ...u, collection: 'users' as const, _strategy: strategy })
  const readsOf = async (id: string) =>
    (await payload.find({ collection: 'enquiryReads' as never, where: { enquiry: { equals: id } }, sort: '-createdAt', pagination: false, depth: 0, overrideAccess: true })).docs as Doc[]
  const sweep = async () => {
    for (const e of (await payload.find({ collection: 'enquiries', where: { email: { like: 'zz-er-' } }, pagination: false, overrideAccess: true })).docs) {
      await payload.db.deleteMany({ collection: 'enquiryReads', where: { enquiry: { equals: e.id } } })
      await payload.delete({ collection: 'enquiries', id: e.id, overrideAccess: true })
    }
    for (const u of (await payload.find({ collection: 'users', where: { email: { like: 'zz-er-' } }, pagination: false, overrideAccess: true })).docs)
      await payload.delete({ collection: 'users', id: u.id, overrideAccess: true })
  }

  beforeAll(async () => {
    vi.stubEnv('NCX_LEAD_URL', '')
    vi.stubEnv('SES_TO_ADDRESS', '')
    payload = await getPayload({ config: await config })
    await sweep()
    const password = `zz-er-${Date.now()}`
    admin = await payload.create({ collection: 'users', data: { email: 'zz-er-admin@example.test', password, role: 'admin', name: 'ZZ ER Admin' } as never, overrideAccess: true })
    author = await payload.create({ collection: 'users', data: { email: 'zz-er-author@example.test', password, role: 'author' } as never, overrideAccess: true })
    enquiry = await payload.create({ collection: 'enquiries', data: { name: 'ZZ ER Lead', email: 'zz-er-lead@example.test', mobile: '98XXXXXX10' } as never, overrideAccess: true })
  })
  afterAll(async () => {
    await sweep()
    vi.unstubAllEnvs()
  })

  it('records an admin opening an enquiry: who, how, from where', async () => {
    await payload.findByID({ collection: 'enquiries', id: enquiry.id, user: as(admin) as never, overrideAccess: false, depth: 0 })
    const [last] = await readsOf(enquiry.id)
    expect(last).toMatchObject({ user: admin.id, how: 'opened', via: 'session' })
  })

  it('records each enquiry an admin sees in a list', async () => {
    const listed = await payload.find({ collection: 'enquiries', where: { email: { like: 'zz-er-' } }, user: as(admin) as never, overrideAccess: false, depth: 0 })
    expect(listed.docs.length).toBe(1)
    const [last] = await readsOf(enquiry.id)
    expect(last).toMatchObject({ user: admin.id, how: 'listed' })
  })

  it('records nothing for server code reading with no one signed in', async () => {
    const before = (await readsOf(enquiry.id)).length
    await payload.findByID({ collection: 'enquiries', id: enquiry.id, overrideAccess: true, depth: 0 })
    expect((await readsOf(enquiry.id)).length).toBe(before)
  })

  it('cannot be written, changed or removed through the API, an admin included, and is read only by an admin in person', async () => {
    const [entry] = await readsOf(enquiry.id)
    const user = as(admin) as never
    await expect(payload.create({ collection: 'enquiryReads' as never, data: { enquiry: enquiry.id, how: 'opened' } as never, user, overrideAccess: false })).rejects.toMatchObject({ name: 'Forbidden' })
    await expect(payload.update({ collection: 'enquiryReads' as never, id: entry.id, data: { how: 'listed' } as never, user, overrideAccess: false })).rejects.toMatchObject({ name: 'Forbidden' })
    await expect(payload.delete({ collection: 'enquiryReads' as never, id: entry.id, user, overrideAccess: false })).rejects.toMatchObject({ name: 'Forbidden' })
    expect((await payload.find({ collection: 'enquiryReads' as never, user, overrideAccess: false, pagination: false })).docs.length).toBeGreaterThan(0)
    for (const other of [as(admin, 'api-key'), as(author)]) {
      await expect(payload.find({ collection: 'enquiryReads' as never, user: other as never, overrideAccess: false })).rejects.toMatchObject({ name: 'Forbidden' })
    }
  })
})
