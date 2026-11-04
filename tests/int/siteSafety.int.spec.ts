import { afterEach, describe, expect, it, vi } from 'vitest'

import { Enquiries, fromWebsite } from '@/collections/Enquiries'
import { SiteSettings, validateProfileUrl } from '@/SiteSettings/config'

/**
 * The contact form's door into the CMS (ENQUIRY_SECRET) and the company
 * details the website turns into schema.org Organization data.
 */

const headers = (secret?: string) => new Headers(secret === undefined ? {} : { 'x-enquiry-secret': secret })
const create = Enquiries.access!.create as (args: { req: any }) => boolean

afterEach(() => vi.unstubAllEnvs())

describe('enquiries from the website', () => {
  it('are accepted from anyone while no secret is set', () => {
    vi.stubEnv('ENQUIRY_SECRET', '')
    expect(fromWebsite(headers())).toBe(true)
    expect(create({ req: { user: null, headers: headers() } })).toBe(true)
  })

  it('need the matching secret once it is set', () => {
    vi.stubEnv('ENQUIRY_SECRET', 'the-shared-secret')
    expect(fromWebsite(headers('the-shared-secret'))).toBe(true)
    expect(fromWebsite(headers())).toBe(false)
    expect(fromWebsite(headers('the-shared-secreT'))).toBe(false)
    expect(fromWebsite(headers('short'))).toBe(false)
    expect(create({ req: { user: null, headers: headers('wrong') } })).toBe(false)
  })

  it('can still be added by a signed-in user without the secret', () => {
    vi.stubEnv('ENQUIRY_SECRET', 'the-shared-secret')
    expect(create({ req: { user: { id: 'u1', collection: 'users' }, headers: headers() } })).toBe(true)
  })
})

describe('Site Settings organisation details', () => {
  it('has the legal name, logo and social profiles', () => {
    const group = SiteSettings.fields.find((f) => 'name' in f && f.name === 'organisation') as any
    expect(group?.type).toBe('group')
    expect(group.fields.map((f: any) => f.name)).toEqual(['legalName', 'logo', 'profiles'])
  })

  it('takes only full https profile links', () => {
    expect(validateProfileUrl('https://www.linkedin.com/company/neuroncx')).toBe(true)
    expect(validateProfileUrl('http://example.com')).toMatch(/https:\/\//)
    expect(validateProfileUrl('linkedin.com/company/neuroncx')).toMatch(/https:\/\//)
    expect(validateProfileUrl('')).toBe('Enter the profile link.')
  })
})
