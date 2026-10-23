import type { ArrayField, Field, GroupField, RadioField, SelectField } from 'payload'

import { select as validateSelect } from 'payload/shared'
import { describe, expect, expectTypeOf, it } from 'vitest'

import { buildHubs } from '@/collections/Hubs'
import { Integrations } from '@/collections/Integrations'
import { IntegrationCategories } from '@/collections/IntegrationTaxonomies'
import { Lists } from '@/collections/Lists'
import '@/collections/MicroApps'
import {
  CARD_DESIGN_DEFAULTS,
  CARD_DESIGN_NAMES,
  cardDesignFields,
  ITEM_CARD_DESIGNS,
  type CardDesignValue,
} from '@/fields/cardDesign'
import type { IntegrationsBlock } from '@/payload-types'

// Field config only; nothing is read or saved.
const group = (field: Field) => field as GroupField
const names = (field: Field) => group(field).fields.map((f) => ('name' in f ? f.name : f.type))
const child = (field: Field, name: string) =>
  group(field).fields.find((f) => 'name' in f && f.name === name) as Field
const design = (field: Field) => child(field, 'design') as SelectField
const offered = (field: Field) =>
  design(field).options.map((o) => (typeof o === 'string' ? o : o.value))

// Whether a field is shown in the admin for a block whose design is `value`
// (and, where given, whose "Let integrations and categories use their own design" switch is `on`).
const shownFor = (field: Field, name: string, value?: string, on?: boolean) => {
  const condition = child(field, name).admin?.condition
  return condition ? condition({}, { design: value, allowItemDesigns: on }, {} as never) : true
}

// Every condition's answer, for every design with the switch on, off and unset.
const conditions = (field: Field) =>
  group(field).fields.map((f) =>
    [...CARD_DESIGN_NAMES, undefined].flatMap((d) =>
      [true, false, undefined].map((on) => f.admin?.condition?.({}, { design: d, allowItemDesigns: on }, {} as never)),
    ),
  )

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

  it('builds the same fields with no argument as with allowItemDesigns off, and no switch', () => {
    const plain = cardDesignFields()
    const off = cardDesignFields({ allowItemDesigns: false })
    expect(names(plain)).toEqual(['design', 'columns', 'lastRow', 'groupByCategory', 'linkLabel', 'look'])
    expect(JSON.stringify(off)).toBe(JSON.stringify(plain))
    expect(conditions(off)).toEqual(conditions(plain))
    // Without the switch, the settings follow the block's own design only.
    for (const d of CARD_DESIGN_NAMES) {
      expect(shownFor(plain, 'look', d, true)).toBe(d === 'feature')
      expect(shownFor(plain, 'linkLabel', d, true)).toBe(d === 'feature' || d === 'story')
    }
  })

  it('adds the switch with allowItemDesigns, on by default, hidden for directory and pill', () => {
    const field = cardDesignFields({ allowItemDesigns: true })
    expect(names(field)).toEqual(['design', 'allowItemDesigns', 'columns', 'lastRow', 'groupByCategory', 'linkLabel', 'look'])
    const toggle = child(field, 'allowItemDesigns') as { defaultValue?: unknown; label?: unknown }
    expect(toggle.defaultValue).toBe(true)
    expect(toggle.label).toBe('Let integrations and categories use their own design')
    for (const d of CARD_DESIGN_NAMES) {
      expect(shownFor(field, 'allowItemDesigns', d)).toBe(d !== 'directory' && d !== 'pill')
    }
  })

  it('shows the look and link text while the switch is on', () => {
    const field = cardDesignFields({ allowItemDesigns: true })
    for (const d of CARD_DESIGN_NAMES) {
      const wholeList = d === 'directory' || d === 'pill'
      for (const name of ['look', 'linkLabel']) {
        // On (or not yet set, which reads as on): shown for every design but directory and pill.
        expect(shownFor(field, name, d, true), `${name} on ${d}`).toBe(!wholeList)
        expect(shownFor(field, name, d, undefined), `${name} unset ${d}`).toBe(!wholeList)
      }
      // Off: back to the block's own design.
      expect(shownFor(field, 'look', d, false)).toBe(d === 'feature')
      expect(shownFor(field, 'linkLabel', d, false)).toBe(d === 'feature' || d === 'story')
    }
  })

  it('takes its field defaults from CARD_DESIGN_DEFAULTS', () => {
    const field = cardDesignFields()
    expect(CARD_DESIGN_DEFAULTS).toEqual({
      design: 'grid',
      columns: null,
      lastRow: 'leave',
      groupByCategory: false,
      allowItemDesigns: true,
    })
    expect((child(field, 'columns') as SelectField).defaultValue).toBeUndefined()
    expect((child(field, 'lastRow') as SelectField).defaultValue).toBe(CARD_DESIGN_DEFAULTS.lastRow)
    expect((child(field, 'groupByCategory') as { defaultValue?: unknown }).defaultValue).toBe(false)
  })

  it("has no 'All integrations' card option, with or without the switch", () => {
    for (const field of [cardDesignFields(), cardDesignFields({ allowItemDesigns: true })]) {
      expect(names(field)).not.toContain('showAllLink')
    }
  })

  it('exports a value type that matches the generated block type', () => {
    expectTypeOf<IntegrationsBlock['cardDesign']>().toEqualTypeOf<CardDesignValue>()
  })
})

const findField = (fields: Field[], name: string): Field | undefined => {
  for (const f of fields) {
    if ('name' in f && f.name === name) return f
    if (f.type === 'tabs') {
      for (const t of f.tabs) {
        const hit = findField(t.fields, name)
        if (hit) return hit
      }
    }
  }
  return undefined
}

// The same field on an integration and on an integration category; only the
// first tile (empty) says what an empty value falls back to.
for (const [what, fields, clearLabel] of [
  ['an integration', Integrations.fields, 'Follow the category'],
  ['an integration category', IntegrationCategories.fields, 'Follow the section'],
] as const) {
  describe(`${what}'s own card design`, () => {
    const field = findField(fields as Field[], 'cardDesign') as SelectField
    // Payload's own check for a select field's value.
    const check = (value: unknown) =>
      validateSelect(value as never, { ...field, req: { t: (k: string) => k } } as never)

    it('offers the four item designs, optional and with no default', () => {
      expect(field.options).toEqual([
        { label: 'Grid', value: 'grid' },
        { label: 'Logo card', value: 'logoCard' },
        { label: 'Feature card', value: 'feature' },
        { label: 'Story card', value: 'story' },
      ])
      expect(field.options.map((o) => (typeof o === 'string' ? o : o.value))).toEqual([...ITEM_CARD_DESIGNS])
      expect(field.required).toBeFalsy()
      expect(field.defaultValue).toBeUndefined()
    })

    it(`uses the design pictures, with "${clearLabel}" for empty`, () => {
      const component = field.admin?.components?.Field as { path?: string; clientProps?: { clearLabel?: string } }
      expect(component.path).toBe('@/fields/CardDesignPicker/Component#CardDesignPickerField')
      expect(component.clientProps?.clearLabel).toBe(clearLabel)
    })

    it('accepts empty and the four item designs, and rejects anything else', () => {
      for (const ok of [undefined, null, ...ITEM_CARD_DESIGNS]) expect(check(ok), String(ok)).toBe(true)
      for (const bad of ['directory', 'pill', 'carousel']) expect(check(bad), bad).not.toBe(true)
    })
  })
}

describe('section designs, for hub grouping sections and groupings only', () => {
  const values = (field: SelectField) => field.options.map((o) => (typeof o === 'string' ? o : o.value))
  const SECTION = ['suite', 'suiteSteps', 'suite2', 'detailedSuite', 'bento']

  it('are not offered by card blocks', () => {
    for (const field of [cardDesignFields(), cardDesignFields({ allowItemDesigns: true })]) {
      for (const d of SECTION) expect(offered(field)).not.toContain(d)
    }
  })

  it('are offered by a grouping, after the four item designs, with the design pictures', () => {
    const field = findField(Lists.fields, 'cardDesign') as SelectField
    expect(values(field)).toEqual([...ITEM_CARD_DESIGNS, ...SECTION])
    expect(field.options.slice(-5)).toEqual([
      { label: 'Product suite: pills', value: 'suite' },
      { label: 'Product suite: steps', value: 'suiteSteps' },
      { label: 'Product suite 2', value: 'suite2' },
      { label: 'Detailed product suite', value: 'detailedSuite' },
      { label: 'Bento grid', value: 'bento' },
    ])
    expect((field.admin?.components?.Field as { path?: string }).path).toBe(
      '@/fields/CardDesignPicker/Component#CardDesignPickerField',
    )
  })

  describe("a hub's grouping section", () => {
    const rows = findField(buildHubs().fields, 'groupingSections') as ArrayField
    const row = (name: string) => rows.fields.find((f) => 'name' in f && f.name === name) as SelectField

    it('offers every block design, then the section designs, as pictures that can be cleared', () => {
      const field = row('cardDesign')
      expect(values(field)).toEqual([...CARD_DESIGN_NAMES, ...SECTION])
      expect(field.required).toBeFalsy()
      const component = field.admin?.components?.Field as { path?: string; clientProps?: { clearLabel?: string } }
      expect(component.path).toBe('@/fields/CardDesignPicker/Component#CardDesignPickerField')
      expect(component.clientProps?.clearLabel).toBe('Follow the grouping')
    })

    it('shows the bento sizes only for the bento grid, even by default', () => {
      const field = row('bentoPattern')
      expect(values(field)).toEqual(['even', 'featured', 'alternating'])
      expect(field.defaultValue).toBe('even')
      const shown = (cardDesign?: string) => field.admin?.condition?.({}, { cardDesign }, {} as never)
      expect(shown('bento')).toBe(true)
      for (const d of [undefined, 'grid', 'suite', 'detailedSuite']) expect(shown(d), String(d)).toBe(false)
    })
  })
})

describe('hero design', () => {
  const hubs = buildHubs()
  const field = findField(hubs.fields, 'heroDesign') as RadioField
  const picture = findField(hubs.fields, 'heroMedia') as Field & { admin?: { condition?: (d: unknown) => boolean } }

  it('is standard or conversation, standard by default', () => {
    expect(field.options.map((o) => (typeof o === 'string' ? o : o.value))).toEqual(['standard', 'conversation'])
    expect(field.defaultValue).toBe('standard')
  })

  it('hides the picture for the conversation design, which has none', () => {
    expect(picture.admin?.condition?.({ heroDesign: 'conversation' })).toBe(false)
    expect(picture.admin?.condition?.({ heroDesign: 'standard' })).toBe(true)
    expect(picture.admin?.condition?.({})).toBe(true)
  })
})
