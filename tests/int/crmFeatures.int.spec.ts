import type { Where } from 'payload'
import { describe, expect, it } from 'vitest'

import { CrmFeatures } from '@/collections/CrmFeatures'

// Calls the collection's read access directly; nothing is read or saved.
const read = (user: unknown) => (CrmFeatures.access!.read as any)({ req: { user } })

// Enough of Payload's query rules (and, equals, in) to apply a filter to
// sample entries and see which ones a visitor would get.
const matches = (doc: Record<string, unknown>, where: Where): boolean =>
  Object.entries(where).every(([key, rule]) => {
    if (key === 'and') return (rule as Where[]).every((w) => matches(doc, w))
    if (key === 'or') return (rule as Where[]).some((w) => matches(doc, w))
    const r = rule as { equals?: unknown; in?: unknown[] }
    if ('equals' in r) return doc[key] === r.equals
    if ('in' in r) return (r.in || []).includes(doc[key])
    return false
  })

const entries = [
  { name: 'Live, published', _status: 'published', status: 'live' },
  { name: 'Pilot, published', _status: 'published', status: 'pilot' },
  { name: 'Planned, published', _status: 'published', status: 'planned' },
  { name: 'Live, draft', _status: 'draft', status: 'live' },
  { name: 'Planned, draft', _status: 'draft', status: 'planned' },
]

describe('crmFeatures read access', () => {
  it('gives a logged-out request a filter that leaves out planned and draft entries', () => {
    const where = read(null)
    expect(where).toEqual({
      and: [{ _status: { equals: 'published' } }, { status: { in: ['live', 'pilot'] } }],
    })
    const visible = entries.filter((e) => matches(e, where)).map((e) => e.name)
    expect(visible).toEqual(['Live, published', 'Pilot, published'])
  })

  it('gives a logged-in request everything', () => {
    expect(read({ id: 'editor', email: 'editor@example.com' })).toBe(true)
  })
})
