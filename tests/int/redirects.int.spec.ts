import 'dotenv/config'
import { getPayload, type Payload, type PayloadRequest } from 'payload'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import config from '@/payload.config'
import { PATH_OR_HTTPS_MESSAGE, validateRedirectDestination } from '@/redirects/destination'

/**
 * Redirects go live as soon as they are saved, so a content owner or admin
 * makes them, in person, and a custom one can only send visitors to this
 * site or a host listed in Content standards. Temporary records: /zz-rd-.
 */

type Doc = Record<string, any>

describe('making redirects', () => {
  let payload: Payload
  const users: Record<string, Doc> = {}
  const password = `zz-rd-${Date.now()}`
  const as = (u: Doc, strategy: 'api-key' | 'local-jwt' = 'local-jwt') => ({ ...u, collection: 'users' as const, _strategy: strategy })
  const sweep = async () => {
    for (const r of (await payload.find({ collection: 'redirects', where: { from: { like: '/zz-rd-' } }, pagination: false, overrideAccess: true })).docs)
      await payload.delete({ collection: 'redirects', id: r.id, overrideAccess: true, context: { disableRevalidate: true } })
    for (const u of (await payload.find({ collection: 'users', where: { email: { like: 'zz-rd-' } }, pagination: false, overrideAccess: true })).docs)
      await payload.delete({ collection: 'users', id: u.id, overrideAccess: true })
  }
  const redirect = (from: string, url: string, user: Doc, extra: Doc = {}) =>
    payload.create({
      collection: 'redirects',
      data: { from, to: { type: 'custom', url }, ...extra } as never,
      user: user as never,
      overrideAccess: false,
      context: { disableRevalidate: true },
    }) as Promise<Doc>

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await sweep()
    for (const role of ['author', 'contentOwner', 'admin'])
      users[role] = await payload.create({ collection: 'users', data: { email: `zz-rd-${role}@example.test`, password, role } as never, overrideAccess: true })
  })
  afterAll(sweep)

  it('is refused to an author and to any key, an admin key included', async () => {
    for (const [i, user] of [as(users.author), as(users.author, 'api-key'), as(users.admin, 'api-key')].entries()) {
      await expect(redirect(`/zz-rd-refused-${i}`, '/contact', user)).rejects.toMatchObject({ name: 'Forbidden' })
    }
  })

  it('is open to a content owner or admin in person, and is permanent unless marked temporary', async () => {
    const permanent = await redirect('/zz-rd-owner', '/contact', as(users.contentOwner))
    expect(permanent.type).toBe('308')
    const temporary = await redirect('/zz-rd-admin', '/contact', as(users.admin), { type: '307' })
    expect(temporary.type).toBe('307')
  })

  it('refuses a custom address on another website that is not listed', async () => {
    await expect(redirect('/zz-rd-away', 'https://example.org/page', as(users.admin))).rejects.toMatchObject({
      data: { errors: [expect.objectContaining({ path: 'to.url', message: expect.stringMatching(/example\.org is not a listed redirect destination/) })] },
    })
  })
})

describe('where a custom redirect may send visitors', () => {
  // The site's own address, as set on the live CMS.
  beforeEach(() => vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://neuroncx.in'))
  afterEach(() => vi.unstubAllEnvs())
  const req = (hosts: string[] = []) =>
    ({ payload: { findGlobal: async () => ({ redirectHosts: hosts.map((host) => ({ host })) }) } }) as unknown as PayloadRequest
  const check = (url: unknown, hosts: string[] = [], type = 'custom') =>
    validateRedirectDestination(url as string, { req: req(hosts), siblingData: { type } } as never)

  it('takes a path on this site, and the site itself', async () => {
    expect(await check('/contact')).toBe(true)
    expect(await check('/higher-education/fees?x=1')).toBe(true)
    expect(await check('https://neuroncx.in/contact')).toBe(true)
    expect(await check('https://www.neuroncx.in/contact')).toBe(true)
  })

  it('takes another website only when its host is listed in Content standards', async () => {
    expect(await check('https://docs.example.com/a', ['docs.example.com'])).toBe(true)
    expect(await check('https://docs.example.com/a')).toMatch(/docs\.example\.com is not a listed redirect destination/)
  })

  it('refuses a protocol-relative address, plain http and anything that is not an address', async () => {
    expect(await check('//evil.example/x')).toBe(PATH_OR_HTTPS_MESSAGE)
    expect(await check('http://neuroncx.in/contact')).toBe(PATH_OR_HTTPS_MESSAGE)
    expect(await check('javascript:alert(1)')).toBe(PATH_OR_HTTPS_MESSAGE)
    expect(await check('')).toBe('Add the address to send visitors to.')
  })

  it('leaves a redirect to an entry (a reference) alone', async () => {
    expect(await check(undefined, [], 'reference')).toBe(true)
  })
})
