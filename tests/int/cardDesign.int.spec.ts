import type { Field, GroupField, SelectField } from 'payload'

import { describe, expect, expectTypeOf, it } from 'vitest'

import {
  CARD_DESIGN_DEFAULTS,
  CARD_DESIGN_NAMES,
  cardDesignFields,
  type CardDesignValue,
} from '@/fields/cardDesign'
import type { IntegrationsBlock } from '@/payload-types'

// Field config only; nothing is read or saved.
const group = (field: Field) => field as GroupField
const child = (field: Field, name: string) =>
  group(field).fields.find((f) => 'name' in f && f.name === name) as Field
const design = (field: Field) => child(field, 'design') as SelectField
const offered = (field: Field) =>
  design(field).options.map((o) => (typeof o === 'string' ? o : o.value))

// Whether a field is shown in the admin when the block's design is `value`.
const shownFor = (field: Field, name: string, value?: string) => {
  const condition = child(field, name).admin?.condition
  return condition ? condition({}, { design: value }, {} as never) : true
}

describe('cardDesignFields', () => {
  it('offers all six designs when called with no argument, grid first and by default', () => {
    const field = cardDesignFields()
    expect('name' in field && field.name).toBe('cardDesign')
    expect(offered(field)).toEqual(['grid', 'logoCard', 'directory', 'feature', 'story', 'pill'])
    expect(offered(field)).toEqual(CARD_DESIGN_NAMES)
    expect(design(field).defaultValue).toBe('grid')
    expect(design(field).required).toBe(true)
  })

  it("offers only the listed designs, keeping the stored values and the picker's order", () => {
    const field = cardDesignFields({ designs: ['feature', 'grid'] })
    expect(offered(field)).toEqual(['grid', 'feature'])
    expect(design(field).options).toEqual([
      { label: 'Grid', value: 'grid' },
      { label: 'Feature card', value: 'feature' },
    ])
  })

  it('respects defaultDesign, also as the design an unset block counts as', () => {
    const field = cardDesignFields({ designs: ['grid', 'feature'], defaultDesign: 'feature' })
    expect(design(field).defaultValue).toBe('feature')
    // No design chosen yet: the feature card's own fields show, the grid's do not.
    expect(shownFor(field, 'linkLabel', undefined)).toBe(true)
    expect(shownFor(field, 'lastRow', undefined)).toBe(false)
  })

  it('refuses a default that is not offered, or an empty list', () => {
    expect(() => cardDesignFields({ designs: ['grid'], defaultDesign: 'pill' })).toThrow()
    expect(() => cardDesignFields({ designs: [] })).toThrow()
  })

  it('shows "Last row" only for the grid', () => {
    const field = cardDesignFields()
    for (const name of CARD_DESIGN_NAMES) {
      expect(shownFor(field, 'lastRow', name)).toBe(name === 'grid')
    }
    // A block with no design yet counts as grid.
    expect(shownFor(field, 'lastRow', undefined)).toBe(true)
  })

  it('takes its field defaults from CARD_DESIGN_DEFAULTS', () => {
    const field = cardDesignFields()
    expect(CARD_DESIGN_DEFAULTS).toEqual({
      design: 'grid',
      columns: null,
      lastRow: 'leave',
      groupByCategory: false,
      showAllLink: true,
    })
    expect((child(field, 'columns') as SelectField).defaultValue).toBeUndefined()
    expect((child(field, 'lastRow') as SelectField).defaultValue).toBe(CARD_DESIGN_DEFAULTS.lastRow)
    expect((child(field, 'groupByCategory') as { defaultValue?: unknown }).defaultValue).toBe(false)
    expect((child(field, 'showAllLink') as { defaultValue?: unknown }).defaultValue).toBe(true)
  })

  it('exports a value type that matches the generated block type', () => {
    expectTypeOf<IntegrationsBlock['cardDesign']>().toEqualTypeOf<CardDesignValue>()
  })
})
