import { describe, expect, it } from 'vitest'

import { WhatsappLists } from '@/WhatsappLists/config'

// Calls the validators directly; nothing is saved.
const lists = WhatsappLists.fields[0] as any
const field = (name: string) => lists.fields.find((f: any) => f.name === name)
const opts = (f: any) =>
  ({ ...f, req: { payload: { config: {} }, t: (key: string) => key } }) as any

describe('WhatsApp lists global', () => {
  it('allows each collection once', async () => {
    const rows = [
      { collection: 'crmFeatures' },
      { collection: 'microApps' },
      { collection: 'omnichannelCx' },
    ]
    expect(await lists.validate(rows, opts(lists))).toBe(true)
    expect(await lists.validate([], opts(lists))).toBe(true)
  })

  it('refuses a collection listed twice, and names it', async () => {
    const rows = [
      { collection: 'microApps' },
      { collection: 'crmFeatures' },
      { collection: 'microApps' },
    ]
    expect(await lists.validate(rows, opts(lists))).toBe(
      'Micro-apps swarm appears more than once. Each collection needs one row only.',
    )
  })

  it('keeps the list button and section title plain and within WhatsApp limits', async () => {
    const button = field('waListButton')
    const title = field('waSectionTitle')
    expect([button.maxLength, title.maxLength]).toEqual([20, 24])
    expect(await button.validate('See features', opts(button))).toBe(true)
    expect(await button.validate('**See**', opts(button))).toBe(
      'Remove the * character. This field is plain text.',
    )
    expect(await title.validate('x'.repeat(25), opts(title))).toBe('validation:shorterThanMax')
  })
})
