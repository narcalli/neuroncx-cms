import { afterEach, describe, expect, it, vi } from 'vitest'

import { leadPayload, normalisePhone, sendLead } from '@/collections/enquiries/ncxLead'

const enquiry = {
  name: 'Asha Rao',
  company: 'Acme Clinics',
  email: 'asha@acme.in',
  mobile: '+91 98863 99991',
  message: 'Appointment reminders on WhatsApp',
  sourcePage: '/contact',
}

const withEnv = () => {
  vi.stubEnv('NCX_LEAD_URL', 'https://ncx.test/external/carrierv2/neuroncx-website/34')
  vi.stubEnv('NCX_LEAD_TOKEN', 'test-token')
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('normalisePhone', () => {
  it('keeps the country code as digits', () => {
    expect(normalisePhone('+91 98863 99991')).toBe('919886399991')
    expect(normalisePhone('0044 20 7946 0958')).toBe('442079460958')
  })
  it('takes a 10 digit number as Indian', () => {
    expect(normalisePhone('98863-99991')).toBe('919886399991')
    expect(normalisePhone('098863 99991')).toBe('919886399991')
  })
  it('rejects empty or short numbers', () => {
    expect(normalisePhone('')).toBeNull()
    expect(normalisePhone(undefined)).toBeNull()
    expect(normalisePhone('12345')).toBeNull()
  })
})

describe('leadPayload', () => {
  it('puts company, message and page into the comment', () => {
    const body = leadPayload(enquiry, '919886399991')
    expect(body.phone).toBe('919886399991')
    expect(body.message).toBe(
      'Company: Acme Clinics\nWants to automate: Appointment reminders on WhatsApp\nSubmitted from: /contact',
    )
  })
})

describe('sendLead', () => {
  it('does nothing when not configured', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect((await sendLead(enquiry)).status).toBe('skipped')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('skips an enquiry without a mobile number', async () => {
    withEnv()
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const r = await sendLead({ ...enquiry, mobile: '' })
    expect(r).toMatchObject({ status: 'skipped', note: 'No mobile number given' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('posts with the bearer token and reports the reference', async () => {
    withEnv()
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: false, transactionId: 'abc-1', message: 'ok' }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const r = await sendLead(enquiry)
    expect(r).toMatchObject({ status: 'created', transactionId: 'abc-1' })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://ncx.test/external/carrierv2/neuroncx-website/34')
    expect(init.headers.Authorization).toBe('Bearer test-token')
    expect(JSON.parse(init.body).phone).toBe('919886399991')
  })

  it('reports a duplicate and a failure without throwing', async () => {
    withEnv()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: true, transactionId: 'abc-1' }), { status: 409 })),
    )
    expect((await sendLead(enquiry)).status).toBe('duplicate')

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: true, result: 'auth failed' }), { status: 401 })),
    )
    expect(await sendLead(enquiry)).toMatchObject({ status: 'failed', note: 'NCX answered 401: auth failed' })

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')))
    expect(await sendLead(enquiry)).toMatchObject({ status: 'failed', note: 'timeout' })
  })
})
