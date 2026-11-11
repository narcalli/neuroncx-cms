import 'dotenv/config'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import config from '@/payload.config'
import { contentHash } from '@/lifecycle/contentHash'
import { REVIEW_PUBLISH_MESSAGE, REVIEW_SLUGS } from '@/review/scope'
import { reviewQueue } from '@/review/queue'
import { compareWithLivePath } from '@/history/compareLink'

/**
 * The review workflow (src/review): authors cannot publish while it is on,
 * Ready for review emails content owners and admins, publishing clears it.
 * The workflow is switched on per save through req.context (the same cache
 * the Content standards setting is read into), so the shared setting is
 * never changed by a test. Temporary records: zz-rw-, ZZ RW.
 */

const sent = vi.hoisted(() => [] as { to: string[]; subject: string; text: string }[])
vi.mock('@/email/ses', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/email/ses')>()),
  sendSesEmail: vi.fn(async (email: { to: string[]; subject: string; text: string }) => {
    sent.push(email)
    return { sent: true }
  }),
}))

type Doc = Record<string, any>

describe('the review workflow', () => {
  let payload: Payload
  let admin: Doc
  let owner: Doc
  let author: Doc
  const password = `zz-rw-${Date.now()}`
  const as = (user: Doc) => ({ ...user, collection: 'users' as const, _strategy: 'local-jwt' })
  const on = { disableRevalidate: true, reviewWorkflowOn: true }
  const off = { disableRevalidate: true, reviewWorkflowOn: false }
  const sweep = async () => {
    const found = await payload.find({ collection: 'pages', where: { slug: { like: 'zz-rw-' } }, draft: true, pagination: false, depth: 0, overrideAccess: true })
    for (const d of found.docs) await payload.delete({ collection: 'pages', id: d.id, overrideAccess: true, context: off })
    const users = await payload.find({ collection: 'users', where: { email: { like: 'zz-rw-' } }, pagination: false, depth: 0, overrideAccess: true })
    for (const u of users.docs) await payload.delete({ collection: 'users', id: u.id, overrideAccess: true })
  }
  const newPage = (slug: string, by: Doc, context = on, status: 'draft' | 'published' = 'draft') =>
    payload.create({
      collection: 'pages',
      draft: status === 'draft',
      data: { title: `ZZ RW ${slug}`, slug: `zz-rw-${slug}`, hero: { type: 'none' }, layout: [{ blockType: 'content', columns: [] }], _status: status } as never,
      user: as(by),
      overrideAccess: false,
      depth: 0,
      context,
    }) as Promise<Doc>
  const save = (id: string, data: Doc, by: Doc, context = on, draft = true) =>
    payload.update({ collection: 'pages', id, data: data as never, draft, user: as(by), overrideAccess: false, depth: 0, context }) as Promise<Doc>

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await sweep()
    const user = (email: string, role: string, name: string) =>
      payload.create({ collection: 'users', data: { email, password, role, name } as never, overrideAccess: true }) as Promise<Doc>
    admin = await user('zz-rw-admin@example.test', 'admin', 'ZZ RW Admin')
    owner = await user('zz-rw-owner@example.test', 'contentOwner', 'ZZ RW Owner')
    author = await user('zz-rw-author@example.test', 'author', 'ZZ RW Author')
  })
  afterAll(sweep)
  beforeEach(() => {
    sent.length = 0
  })

  describe('publishing', () => {
    it('is open to authors while the workflow is off', async () => {
      const page = await newPage('off', author, off, 'published')
      expect(page._status).toBe('published')
    })

    it('is refused to an author while it is on, with the reason, and the draft still saves', async () => {
      const page = await newPage('author', author)
      await expect(save(page.id, { _status: 'published' }, author, on, false)).rejects.toMatchObject({
        data: { errors: [expect.objectContaining({ path: '_status', message: REVIEW_PUBLISH_MESSAGE })] },
      })
      const draft = await save(page.id, { title: 'ZZ RW author, edited' }, author)
      expect(draft.title).toBe('ZZ RW author, edited')
    })

    it('is open to content owners and admins while it is on', async () => {
      const page = await newPage('owner', author)
      expect((await save(page.id, { _status: 'published' }, owner, on, false))._status).toBe('published')
      expect((await save(page.id, { title: 'ZZ RW owner again', _status: 'published' }, admin, on, false))._status).toBe('published')
    })
  })

  describe('Ready for review', () => {
    it('records who asked and when, and emails every content owner and admin once', async () => {
      const page = await newPage('ready', author)
      const ready = await save(page.id, { readyForReview: true, reviewNote: 'New hero copy, check the CTA.' }, author)
      expect(ready.reviewRequestedBy).toBe(author.id)
      expect(ready.reviewRequestedAt).toBeTruthy()
      expect(sent).toHaveLength(1)
      expect(sent[0].to).toEqual(expect.arrayContaining(['zz-rw-admin@example.test', 'zz-rw-owner@example.test']))
      expect(sent[0].to).not.toContain('zz-rw-author@example.test')
      expect(sent[0].subject).toBe('Ready for review: ZZ RW ready (Page)')
      expect(sent[0].text).toContain('Marked by: ZZ RW Author, zz-rw-author@example.test')
      expect(sent[0].text).toContain('Note: New hero copy, check the CTA.')
      expect(sent[0].text).toContain('Benchmark: Not scored: the benchmark covers industries, topics and micro apps only.')
      expect(sent[0].text).toContain('Compare with live: Not published yet')
      // Saving again while ticked sends nothing more.
      await save(page.id, { title: 'ZZ RW ready, more edits' }, author)
      expect(sent).toHaveLength(1)
    })

    it('sends no email while the workflow is off', async () => {
      const page = await newPage('ready-off', author, off)
      await save(page.id, { readyForReview: true }, author, off)
      expect(sent).toHaveLength(0)
    })

    it('is cleared, with its note, when the entry is published', async () => {
      const page = await newPage('clears', author)
      await save(page.id, { readyForReview: true, reviewNote: 'Please check.' }, author)
      const published = await save(page.id, { _status: 'published' }, owner, on, false)
      expect(published).toMatchObject({ readyForReview: false, reviewNote: null, reviewRequestedBy: null, reviewRequestedAt: null })
    })

    it('does not change the content fingerprint, so a benchmark run or override still matches', () => {
      const doc = { title: 'A page', layout: [{ blockType: 'content', id: 'b1' }] }
      expect(contentHash({ ...doc, readyForReview: true, reviewNote: 'x', reviewRequestedBy: 'u', reviewRequestedAt: '2026-11-11' })).toBe(contentHash(doc))
    })

    it('links the email and the queue to the comparison of the draft against the live version', async () => {
      const page = await newPage('live', owner, on, 'published')
      expect(await compareWithLivePath(await reqFor(payload, admin), 'pages', page.id)).toBeNull()
      await save(page.id, { title: 'ZZ RW live, draft change', readyForReview: true }, author)
      const link = await compareWithLivePath(await reqFor(payload, admin), 'pages', page.id)
      expect(link).toMatch(new RegExp(`^/admin/collections/pages/${page.id}/versions/[0-9a-f]{24}\\?versionFrom=[0-9a-f]{24}$`))
      expect(sent.at(-1)?.text).toContain(`Compare with live: `)
      expect(sent.at(-1)?.text).toContain(link!)
    })
  })

  describe('the review queue', () => {
    it('lists entries marked ready, with who asked, the note and the compare link, and drops them once published', async () => {
      const page = await newPage('queue', owner, on, 'published')
      await save(page.id, { title: 'ZZ RW queue, edited', readyForReview: true, reviewNote: 'Queue note' }, author)
      const row = (await reviewQueue(await reqFor(payload, admin))).find((r) => r.key === `pages:${page.id}`)
      expect(row).toMatchObject({ title: 'ZZ RW queue, edited', label: 'Page', note: 'Queue note', by: 'ZZ RW Author', benchmark: 'Not covered by the benchmark.' })
      expect(row?.compare).toContain('?versionFrom=')
      await save(page.id, { _status: 'published' }, owner, on, false)
      expect((await reviewQueue(await reqFor(payload, admin))).some((r) => r.key === `pages:${page.id}`)).toBe(false)
    })
  })

  describe('the five collections', () => {
    it('have Ready for review, its note, and Last edited by as a default list column', async () => {
      const sanitized = await config
      for (const slug of REVIEW_SLUGS) {
        const c = sanitized.collections.find((x) => x.slug === slug)!
        const names = c.fields.flatMap((f) => ('name' in f ? [f.name] : []))
        expect(names, slug).toEqual(expect.arrayContaining(['readyForReview', 'reviewNote']))
        expect(c.admin.defaultColumns, slug).toContain('updatedBy')
        expect((c.admin.components?.edit as { PublishButton?: string } | undefined)?.PublishButton, slug).toBe('@/review/ReviewPublishButton#ReviewPublishButton')
      }
    })
  })
})

const reqFor = async (payload: Payload, user: Doc) => {
  const { createLocalReq } = await import('payload')
  return createLocalReq({ user: { ...user, collection: 'users', _strategy: 'local-jwt' } as never }, payload)
}
