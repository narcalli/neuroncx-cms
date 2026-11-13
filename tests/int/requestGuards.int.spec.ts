import 'dotenv/config'
import { createLocalReq, getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import { UNPUBLISH_ONLY_MESSAGE } from '@/access/unpublishOnly'
import { API_KEY_UNPUBLISH_MESSAGE } from '@/plugins/apiKeysDraftOnly'
import { AUTHOR_SCHEDULE_MESSAGE, CANCEL_SCHEDULE_MESSAGE, KEY_SCHEDULE_MESSAGE, schedulePublish } from '@/review/schedulePublish'
import { REVIEW_DELETE_MESSAGE } from '@/review/unpublish'

/**
 * Requests that went round the publish rules (audit, 12 Nov 2026), each sent
 * the way the real route sends it: an unpublish request carrying other
 * changes (src/access/unpublishOnly.ts), a key unpublishing
 * (src/plugins/apiKeysDraftOnly.ts), an author deleting a live entry
 * (src/review/unpublish.ts) and the Schedule publish server function
 * (src/review/schedulePublish.ts). Temporary records: zz-rg-.
 */

type Doc = Record<string, any>

describe('requests that went round the publish rules', () => {
  let payload: Payload
  let admin: Doc
  let owner: Doc
  let author: Doc
  let other: Doc
  const password = `zz-rg-${Date.now()}`
  const as = (user: Doc, strategy: 'local-jwt' | 'api-key' = 'local-jwt') => ({ ...user, collection: 'users' as const, _strategy: strategy })
  const on = { disableRevalidate: true, reviewWorkflowOn: true }
  const off = { disableRevalidate: true, reviewWorkflowOn: false }
  const statusOf = async (id: string) => ((await payload.db.findOne({ collection: 'pages', where: { id: { equals: id } } })) as Doc)._status
  const page = (slug: string, status: 'draft' | 'published') =>
    payload.create({
      collection: 'pages',
      draft: status === 'draft',
      data: { title: `ZZ RG ${slug}`, slug: `zz-rg-${slug}`, hero: { type: 'none' }, layout: [{ blockType: 'content', columns: [] }], _status: status } as never,
      overrideAccess: true,
      depth: 0,
      context: off,
    }) as Promise<Doc>
  const scheduledFor = async (id: string) =>
    (
      await payload.find({ collection: 'payload-jobs', where: { taskSlug: { equals: 'schedulePublish' } }, pagination: false, depth: 0, overrideAccess: true })
    ).docs.filter((j) => String((j as Doc).input?.doc?.value) === String(id)) as Doc[]
  const sweep = async () => {
    const found = await payload.find({ collection: 'pages', where: { slug: { like: 'zz-rg-' } }, draft: true, pagination: false, depth: 0, overrideAccess: true })
    for (const d of found.docs) {
      for (const job of await scheduledFor(String(d.id))) await payload.delete({ collection: 'payload-jobs', id: job.id, overrideAccess: true })
      await payload.delete({ collection: 'pages', id: d.id, overrideAccess: true, context: off })
    }
    const users = await payload.find({ collection: 'users', where: { email: { like: 'zz-rg-' } }, pagination: false, depth: 0, overrideAccess: true })
    for (const u of users.docs) await payload.delete({ collection: 'users', id: u.id, overrideAccess: true })
  }

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await sweep()
    const user = (email: string, role: string) => payload.create({ collection: 'users', data: { email, password, role } as never, overrideAccess: true }) as Promise<Doc>
    admin = await user('zz-rg-admin@example.test', 'admin')
    owner = await user('zz-rg-owner@example.test', 'contentOwner')
    author = await user('zz-rg-author@example.test', 'author')
    other = await user('zz-rg-other@example.test', 'author')
  })
  afterAll(sweep)

  describe('an unpublish request', () => {
    it('cannot publish or carry other changes, from an author or any key, workflow on or off', async () => {
      const draft = await page('unpub-draft', 'draft')
      for (const user of [as(author), as(author, 'api-key'), as(admin, 'api-key')]) {
        for (const data of [{ _status: 'published' }, { _status: 'published', title: 'ZZ RG taken live' }, { _status: 'draft', title: 'ZZ RG changed' }]) {
          for (const context of [on, off]) {
            const sent = payload.update({ collection: 'pages', id: draft.id, data: data as never, user: user as never, overrideAccess: false, context, unpublishAllLocales: true } as never)
            await expect(sent).rejects.toThrow(UNPUBLISH_ONLY_MESSAGE)
          }
        }
      }
      expect(await statusOf(draft.id)).toBe('draft')
    })

    it("still unpublishes as Payload's own Unpublish button sends it", async () => {
      const live = await page('unpub-live', 'published')
      await payload.update({ collection: 'pages', id: live.id, data: { _status: 'draft' } as never, user: as(admin) as never, overrideAccess: false, context: on, unpublishAllLocales: true } as never)
      expect(await statusOf(live.id)).toBe('draft')
    })

    it('carries nothing else on a global either', async () => {
      const sent = payload.updateGlobal({ slug: 'header', data: { _status: 'draft', navItems: [] } as never, user: as(owner) as never, overrideAccess: false, unpublishAllLocales: true } as never)
      await expect(sent).rejects.toThrow(UNPUBLISH_ONLY_MESSAGE)
    })
  })

  describe('an API key', () => {
    it('cannot unpublish a live entry, and can still save a draft of it', async () => {
      const live = await page('key-unpub', 'published')
      for (const user of [as(author, 'api-key'), as(admin, 'api-key')]) {
        const sent = payload.update({ collection: 'pages', id: live.id, data: { _status: 'draft' } as never, user: user as never, overrideAccess: false, context: off })
        await expect(sent).rejects.toThrow(API_KEY_UNPUBLISH_MESSAGE)
      }
      expect(await statusOf(live.id)).toBe('published')
      const saved = await payload.update({ collection: 'pages', id: live.id, draft: true, data: { title: 'ZZ RG key draft' } as never, user: as(author, 'api-key') as never, overrideAccess: false, context: off })
      expect(saved.title).toBe('ZZ RG key draft')
      expect(await statusOf(live.id)).toBe('published')
    })
  })

  describe('deleting', () => {
    it('refuses an author deleting a live entry while the workflow is on, one or from a list', async () => {
      const live = await page('del-live', 'published')
      await expect(payload.delete({ collection: 'pages', id: live.id, user: as(author) as never, overrideAccess: false, context: on })).rejects.toThrow(REVIEW_DELETE_MESSAGE)
      await expect(
        payload.delete({ collection: 'pages', where: { slug: { like: 'zz-rg-del-' } }, user: as(author) as never, overrideAccess: false, context: on }),
      ).rejects.toThrow(REVIEW_DELETE_MESSAGE)
      expect(await statusOf(live.id)).toBe('published')
    })

    it('lets an author delete a draft that was never live, and an owner delete a live entry', async () => {
      const draft = await page('del-draft', 'draft')
      await payload.delete({ collection: 'pages', id: draft.id, user: as(author) as never, overrideAccess: false, context: on })
      const live = await page('del-owner', 'published')
      await payload.delete({ collection: 'pages', id: live.id, user: as(owner) as never, overrideAccess: false, context: on })
      expect(await payload.db.findOne({ collection: 'pages', where: { id: { in: [draft.id, live.id] } } })).toBeNull()
    })
  })

  describe('the Schedule publish server function', () => {
    const later = () => new Date(Date.now() + 7 * 24 * 3600 * 1000)
    const call = async (user: Doc, context: Doc, args: Doc) =>
      schedulePublish({ req: await createLocalReq({ user: user as never, context }, payload), type: 'publish', date: later(), ...args } as never)

    it('refuses any key, and an author while the workflow is on', async () => {
      const entry = await page('sched-refused', 'draft')
      const doc = { relationTo: 'pages', value: entry.id }
      expect(await call(as(admin, 'api-key'), off, { doc })).toEqual({ error: KEY_SCHEDULE_MESSAGE })
      expect(await call(as(author, 'api-key'), off, { doc })).toEqual({ error: KEY_SCHEDULE_MESSAGE })
      expect(await call(as(author), on, { doc })).toEqual({ error: AUTHOR_SCHEDULE_MESSAGE })
      expect(await scheduledFor(entry.id)).toEqual([])
    })

    it("schedules for an owner, and for an author while the workflow is off; only the scheduler or an owner cancels", async () => {
      const entry = await page('sched-allowed', 'draft')
      const doc = { relationTo: 'pages', value: entry.id }
      expect(await call(as(owner), on, { doc })).not.toHaveProperty('error')
      expect(await call(as(author), off, { doc })).not.toHaveProperty('error')
      const jobs = await scheduledFor(entry.id)
      expect(jobs).toHaveLength(2)
      const authors = jobs.find((j) => String(j.input?.user) === String(author.id))!
      expect(await call(as(other), off, { doc, deleteID: authors.id })).toEqual({ error: CANCEL_SCHEDULE_MESSAGE })
      expect((await scheduledFor(entry.id)).map((j) => String(j.id))).toContain(String(authors.id))
    })
  })
})
