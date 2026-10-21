import { describe, expect, it } from 'vitest'

import { checkPlainText, plainText } from '@/fields/validators/plainText'

// The parts of Payload's validate options the built-in checks read.
const options = (type: string, extra: Record<string, unknown> = {}) =>
  ({ type, req: { payload: { config: {} }, t: (key: string) => key }, ...extra }) as any

describe('plainText', () => {
  it('passes plain text', async () => {
    expect(checkPlainText('Patients book, pay and get updates in one chat.')).toBe(true)
    expect(await plainText('Book a demo, or see other features.', options('text'))).toBe(true)
    expect(await plainText('First line\nSecond line', options('textarea'))).toBe(true)
    // A hyphen inside a sentence is fine; only a dash starting a line is a list.
    expect(checkPlainText('A follow-up call, not a new lead - ever.')).toBe(true)
  })

  it.each(['*', '_', '#', '`', '[', ']'])('fails on %s and names it', (char) => {
    expect(checkPlainText(`Some text ${char} here`)).toBe(
      `Remove the ${char} character. This field is plain text.`,
    )
  })

  it('fails on a > at the start of a line, and allows it elsewhere', () => {
    expect(checkPlainText('> A quoted line')).toBe(
      'Remove the > at the start of the line. This field is plain text.',
    )
    expect(checkPlainText(['Intro', '  > quoted'].join('\n'))).toBe(
      'Remove the > at the start of the line. This field is plain text.',
    )
    expect(checkPlainText('Under 5 > over 2 hours')).toBe(true)
  })

  it('allows a hyphen at the start of a line, for short lists', () => {
    expect(checkPlainText(['What moves:', '- Bookings', '- Payments'].join('\n'))).toBe(true)
  })

  it('fails on an em dash', () => {
    expect(checkPlainText(`One record ${String.fromCharCode(0x2014)} every channel`)).toBe(
      'Remove the em dash. Use a comma, or split the sentence. This field is plain text.',
    )
  })

  it('passes empty values', async () => {
    for (const empty of ['', null, undefined, []]) expect(checkPlainText(empty)).toBe(true)
    expect(await plainText(undefined, options('text'))).toBe(true)
    expect(await plainText('', options('textarea'))).toBe(true)
  })

  it('checks every item in a list, and says which one', async () => {
    expect(checkPlainText(['Fine', 'Also **bold**'])).toBe(
      'Item 2: Remove the * character. This field is plain text.',
    )
    const rows = [
      { id: 'a', line: 'Live slots from the hospital system' },
      { id: 'b', line: 'Cancel # by reply' },
    ]
    expect(await plainText(rows, options('array'))).toBe(
      'Item 2: Remove the # character. This field is plain text.',
    )
  })

  it("keeps the field's own required and length checks", async () => {
    expect(await plainText(undefined, options('text', { required: true }))).toBe(
      'validation:required',
    )
    expect(await plainText('Too long', options('text', { maxLength: 3 }))).toBe(
      'validation:shorterThanMax',
    )
  })
})
