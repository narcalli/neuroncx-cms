import 'dotenv/config'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'

/**
 * Payload's jobs collection (src/access/jobsCollection.ts). Before the fix,
 * an API key could create a scheduled-publish job with no user, which ran
 * with full access and published a draft. Temporary records: zz-jobs-.
 */

type Doc = Record<string, any>
const quiet = { overrideAccess: true, depth: 0, context: { disableRevalidate: true } } as const

describe('the jobs collection through the API', () => {
  let payload: Payload
  let page: Doc
  let admin: Doc
  let author: Doc
  const queued: string[] = []
  const as = (user: Doc, strategy: 'api-key' | 'local-jwt') => ({ ...user, collection: 'users' as const, _strategy: strategy })
  const scheduleJob = () => ({
    taskSlug: 'schedulePublish',
    input: { type: 'publish', doc: { relationTo: 'pages', value: page.id } },
    waitUntil: new Date(Date.now() - 1000).toISOString(),
  })
  const sweep = async () => {
    for (const d of (await payload.find({ ...quiet, collection: 'pages', where: { slug: { like: 'zz-jobs-' } }, draft: true, pagination: false })).docs)
      await payload.delete({ ...quiet, collection: 'pages', id: d.id })
    for (const u of (await payload.find({ ...quiet, collection: 'users', where: { email: { like: 'zz-jobs-' } }, pagination: false })).docs)
      await payload.delete({ ...quiet, collection: 'users', id: u.id })
  }

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await sweep()
    page = await payload.create({
      ...quiet,
      collection: 'pages',
      draft: true,
      data: { title: 'ZZ jobs page', slug: 'zz-jobs-page', hero: { type: 'none' }, layout: [{ blockType: 'content', columns: [] }], _status: 'draft' } as never,
    })
    const password = `zz-jobs-${Date.now()}`
    admin = await payload.create({ ...quiet, collection: 'users', data: { email: 'zz-jobs-admin@example.test', password, role: 'admin' } as never })
    author = await payload.create({ ...quiet, collection: 'users', data: { email: 'zz-jobs-author@example.test', password, role: 'author' } as never })
  })
  afterAll(async () => {
    for (const id of queued) await payload.delete({ ...quiet, collection: 'payload-jobs', id }).catch(() => undefined)
    await sweep()
  })

  it('refuses a scheduled-publish job from an API key, and the draft stays a draft', async () => {
    const attempt = payload.create({ collection: 'payload-jobs', data: scheduleJob() as never, user: as(author, 'api-key'), overrideAccess: false })
    await expect(attempt).rejects.toMatchObject({ name: 'Forbidden' })
    await payload.jobs.run({ where: { 'input.doc.value': { equals: page.id } } } as never)
    expect((await payload.findByID({ ...quiet, collection: 'pages', id: page.id }))._status).toBe('draft')
  })

  it('refuses creating a job through the API to anyone, an admin signed in included', async () => {
    const attempt = payload.create({ collection: 'payload-jobs', data: scheduleJob() as never, user: as(admin, 'local-jwt'), overrideAccess: false })
    await expect(attempt).rejects.toMatchObject({ name: 'Forbidden' })
  })

  it("still lets Payload's own job system queue jobs, and refuses changing or deleting them through the API", async () => {
    const job = (await payload.jobs.queue({ task: 'schedulePublish', input: { type: 'publish', doc: { relationTo: 'pages', value: page.id } } as never, waitUntil: new Date(Date.now() + 86_400_000) })) as Doc
    queued.push(String(job.id))
    const user = as(admin, 'local-jwt')
    await expect(payload.update({ collection: 'payload-jobs', id: job.id, data: { waitUntil: new Date().toISOString() } as never, user, overrideAccess: false })).rejects.toMatchObject({ name: 'Forbidden' })
    await expect(payload.delete({ collection: 'payload-jobs', id: job.id, user, overrideAccess: false })).rejects.toMatchObject({ name: 'Forbidden' })
  })

  it('lets someone signed in read jobs, as the schedule drawer does, and nobody else', async () => {
    const signedIn = await payload.find({ collection: 'payload-jobs', where: { taskSlug: { equals: 'schedulePublish' } }, user: as(author, 'local-jwt'), overrideAccess: false, pagination: false })
    expect(signedIn.docs.length).toBeGreaterThan(0)
    await expect(payload.find({ collection: 'payload-jobs', overrideAccess: false })).rejects.toMatchObject({ name: 'Forbidden' })
  })
})
