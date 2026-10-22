import type { ArrayField, Field, SelectField } from 'payload'

import { describe, expect, it } from 'vitest'

import { IntegrationsMaster } from '@/collections/IntegrationsMaster'
import { integrationSourceFields } from '@/fields/integrationSource'

// Field config only; nothing is read or saved.
const findField = (fields: Field[], name: string): Field | undefined => {
  for (const f of fields) {
    if ('name' in f && f.name === name) return f
    if (f.type === 'tabs') {
      for (const t of f.tabs) {
        const hit = findField(t.fields, name)
        if (hit) return hit
      }
    } else if ('fields' in f && Array.isArray(f.fields) && !('name' in f && f.name)) {
      const hit = findField(f.fields, name)
      if (hit) return hit
    }
  }
  return undefined
}

const showOf = (fields: Field[]) => fields.find((f) => 'name' in f && f.name === 'populateBy') as SelectField
const values = (f: SelectField) => f.options.map((o) => (typeof o === 'string' ? o : o.value))

describe('integrationSourceFields', () => {
  it('offers all four sources, manual by default, when given no options', () => {
    const show = showOf(integrationSourceFields({ min: 4, max: 40 }))
    expect(values(show)).toEqual(['all', 'filter', 'selection', 'manual'])
    expect(show.defaultValue).toBe('manual')
  })

  it('offers only the listed sources, with the given default', () => {
    const show = showOf(
      integrationSourceFields({ min: 4, max: 40 }, { modes: ['all', 'filter', 'selection'], defaultMode: 'all' }),
    )
    expect(values(show)).toEqual(['all', 'filter', 'selection'])
    expect(show.defaultValue).toBe('all')
  })
})

describe('Integrations master', () => {
  it('keeps existing records as they are: left hero, no logo strip', () => {
    expect((findField(IntegrationsMaster.fields, 'heroLayout') as SelectField).defaultValue).toBe('left')
    expect((findField(IntegrationsMaster.fields, 'logoStripOn') as { defaultValue?: unknown }).defaultValue).toBe(false)
  })

  it('allows one section per category', async () => {
    const sections = findField(IntegrationsMaster.fields, 'integrationSections') as ArrayField
    const validate = sections.validate as (value: unknown, options: unknown) => true | string
    expect(validate([{ category: 'a' }, { category: 'b' }], {})).toBe(true)
    expect(validate([{ category: 'a' }, { category: { id: 'a' } }], {})).toBe(
      'Each category can have only one section.',
    )
    expect(validate(undefined, {})).toBe(true)
  })
})
