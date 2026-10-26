import type { Field } from 'payload'
import { describe, expect, it } from 'vitest'

import { ComparisonTable, validateColumns, validateRows } from '@/blocks/ComparisonTable/config'
import { PAGE_LAYOUT_BLOCKS } from '@/blocks/pageLayoutBlocks'

/** Comparison table: fields, limits, guidance and the two table rules. */

const named = (fields: Field[], name: string): any => fields.find((f) => 'name' in f && f.name === name)
const flat = (fields: any[]): any[] => fields.flatMap((f) => (f.type === 'row' ? flat(f.fields) : [f]))
// What Payload hands a validator: the field's own settings, the block's data and a translator.
const t = (key: string, o?: { count?: number }) => `${key} ${o?.count ?? ''}`.trim()
const opts = (siblingData: object, field: object = { required: true, minRows: 2, maxRows: 10 }) =>
  ({ ...field, siblingData, req: { t } }) as never

describe('the block', () => {
  it('is comparisonTable, "Comparison table", in the Pages layout with the full Appearance set', () => {
    expect(ComparisonTable.slug).toBe('comparisonTable')
    expect(ComparisonTable.labels).toEqual({ singular: 'Comparison table', plural: 'Comparison tables' })
    const registered = PAGE_LAYOUT_BLOCKS.find((b) => b.slug === 'comparisonTable')!
    const appearance = registered.fields.at(-1) as any
    expect(appearance).toMatchObject({ type: 'collapsible', label: 'Appearance' })
    const names = JSON.stringify(appearance)
    for (const n of ['background', 'width', 'spacingTop', 'spacingBottom', 'align', 'hidden', 'htmlId']) expect(names, n).toContain(`"name":"${n}"`)
  })

  it('has its fields in order, with their limits', () => {
    expect(ComparisonTable.fields.map((f: any) => f.name)).toEqual(['eyebrow', 'heading', 'intro', 'columns', 'rows', 'footnote'])
    expect(named(ComparisonTable.fields, 'eyebrow')).toMatchObject({ type: 'text', maxLength: 60 })
    expect(named(ComparisonTable.fields, 'heading')).toMatchObject({ type: 'text', maxLength: 140, required: true })
    expect(named(ComparisonTable.fields, 'intro')).toMatchObject({ type: 'textarea', maxLength: 300 })
    expect(named(ComparisonTable.fields, 'footnote')).toMatchObject({ type: 'text', maxLength: 160 })
  })

  it('takes 2 to 4 columns, each a label up to 40 and a highlight', () => {
    const columns = named(ComparisonTable.fields, 'columns')
    expect(columns).toMatchObject({ type: 'array', minRows: 2, maxRows: 4, required: true })
    const inner = flat(columns.fields)
    expect(inner.map((f) => f.name)).toEqual(['label', 'highlight'])
    expect(inner[0]).toMatchObject({ type: 'text', maxLength: 40, required: true })
    expect(inner[1]).toMatchObject({ type: 'checkbox' })
  })

  it('takes 2 to 10 rows, each a label up to 60 and cells of up to 140, with the editor guidance', () => {
    const rows = named(ComparisonTable.fields, 'rows')
    expect(rows).toMatchObject({ type: 'array', minRows: 2, maxRows: 10, required: true })
    expect(rows.admin.description).toBe(
      'Describe what each system typically covers, in plain words. No ticks or crosses, and no claims about a named product.',
    )
    expect(named(rows.fields, 'label')).toMatchObject({ type: 'text', maxLength: 60, required: true })
    const cells = named(rows.fields, 'cells')
    expect(cells.type).toBe('array')
    expect(cells.fields[0]).toMatchObject({ type: 'text', maxLength: 140 })
  })
})

describe('the rules', () => {
  const cols = (...hl: boolean[]) => hl.map((highlight, i) => ({ label: `System ${i + 1}`, highlight }))
  const cells = (n: number) => Array.from({ length: n }, (_, i) => ({ text: `cell ${i + 1}` }))

  it('allows at most one highlighted column', () => {
    expect(validateColumns(cols(true, false, false), opts({}))).toBe(true)
    expect(validateColumns(cols(false, false), opts({}))).toBe(true)
    expect(validateColumns(cols(true, false, true), opts({}))).toBe(
      'Only one column can be highlighted. Columns 1 and 3 are highlighted: untick all but one.',
    )
  })

  it('needs one cell per column in every row, and names the row that is off', () => {
    const columns = cols(true, false, false)
    expect(validateRows([{ label: 'Price', cells: cells(3) }, { label: 'Setup', cells: cells(3) }], opts({ columns }))).toBe(true)
    expect(validateRows([{ label: 'Price', cells: cells(3) }, { label: 'Setup', cells: cells(2) }], opts({ columns }))).toBe(
      'Row 2 (Setup) has 2 cells, but the table has 3 columns. Give each row one cell per column, in column order.',
    )
    expect(validateRows([{ label: 'Price' }, { label: 'Setup', cells: cells(3) }], opts({ columns }))).toMatch(/^Row 1 \(Price\) has 0 cells/)
  })

  it('still applies the standard checks: required, fewest and most rows', () => {
    const columns = cols(true, false)
    const limits = { required: true, minRows: 2, maxRows: 4 }
    expect(validateColumns(cols(true), opts({}, limits))).toBe('validation:requiresAtLeast 2')
    expect(validateColumns(cols(true, false, false, false, false), opts({}, limits))).toBe('validation:requiresNoMoreThan 4')
    expect(validateColumns(undefined as never, opts({}, limits))).toBe('validation:requiresAtLeast 2')
    expect(validateRows([{ label: 'Price', cells: cells(2) }], opts({ columns }))).toBe('validation:requiresAtLeast 2')
    expect(validateRows(11 as never, opts({ columns }))).toBe('validation:requiresNoMoreThan 10')
  })

  it('reads the rows from the block when the admin passes only a count', () => {
    const columns = cols(false, true)
    expect(validateColumns(2 as never, opts({ columns: cols(true, true) }))).toMatch(/Columns 1 and 2/)
    const rows = [{ label: 'Price', cells: cells(1) }, { label: 'Setup', cells: cells(2) }]
    expect(validateRows(2 as never, opts({ columns, rows }))).toMatch(/^Row 1 \(Price\) has 1 cell,/)
    // Without the rows to look at, the check is left to the save on the server.
    expect(validateRows(2 as never, opts({ columns }))).toBe(true)
  })
})
