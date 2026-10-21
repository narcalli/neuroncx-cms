import { describe, expect, it } from 'vitest'

import { cutLine } from '@/collections/integrations/admin/cutLine'

describe('cutLine (Fill from status flow)', () => {
  it('leaves a line that fits as it is', () => {
    expect(cutLine('No-show: A follow-up message offers a new slot', 60)).toBe(
      'No-show: A follow-up message offers a new slot',
    )
  })

  it('never ends on a small word', () => {
    // Cut on a word this would end "... confirmation with the".
    const out = cutLine(
      'Booked: The patient gets a WhatsApp confirmation with the doctor and time',
      60,
    )
    expect(out).toBe('Booked: The patient gets a WhatsApp confirmation')
    expect(out.length).toBeLessThanOrEqual(60)
  })

  it('trims every trailing small word from the list', () => {
    const out = cutLine(
      'Rescheduled: the new time goes to the patient and to the front desk team',
      60,
    )
    expect(out).toBe('Rescheduled: the new time goes to the patient')
    expect(out.length).toBeLessThanOrEqual(60)
    expect(/\b(a|an|the|and|or|to|of|for|with|in|on|at|by|from)$/i.test(out)).toBe(false)
  })

  it('prefers a comma or a full stop before the limit', () => {
    expect(
      cutLine(
        'Cancelled: the slot is freed for others, then the patient is told and offered a new time',
        60,
      ),
    ).toBe('Cancelled: the slot is freed for others')
    expect(
      cutLine(
        'Completed: a thank-you message is sent. A feedback request follows the next morning',
        60,
      ),
    ).toBe('Completed: a thank-you message is sent.')
  })

  it('ignores a break too early to keep a useful line', () => {
    // The comma after "Booked" is too early, so it cuts on a word instead.
    expect(
      cutLine('Booked, then the patient gets a WhatsApp confirmation with the doctor and time', 60),
    ).toBe('Booked, then the patient gets a WhatsApp confirmation')
  })
})
