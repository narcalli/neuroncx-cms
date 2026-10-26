import type { ArrayFieldValidation, Block } from 'payload'
import { array } from 'payload/shared'

type Column = { label?: string | null; highlight?: boolean | null }
type Row = { label?: string | null; cells?: unknown[] | null }

/**
 * An array field's rows. On the server a validator gets the rows themselves;
 * in the admin it may get only how many there are, so the rows are read from
 * the block's data instead.
 */
const rowsOf = <T>(value: unknown, sibling: unknown): T[] | null =>
  Array.isArray(value) ? (value as T[]) : Array.isArray(sibling) ? (sibling as T[]) : null

/**
 * A custom validate replaces Payload's own, so each rule below runs the
 * standard array check first (required, fewest and most rows).
 */

/** At most one column highlighted. */
export const validateColumns: ArrayFieldValidation = (value, options) => {
  const base = array(value, options)
  if (base !== true) return base
  const { siblingData } = options
  const columns = rowsOf<Column>(value, (siblingData as { columns?: unknown })?.columns)
  if (!columns) return true
  const lit = columns.map((c, i) => (c?.highlight ? i + 1 : 0)).filter(Boolean)
  if (lit.length > 1) {
    return `Only one column can be highlighted. Columns ${lit.join(' and ')} are highlighted: untick all but one.`
  }
  return true
}

/** Each row has exactly one cell per column. The message names the row. */
export const validateRows: ArrayFieldValidation = (value, options) => {
  const base = array(value, options)
  if (base !== true) return base
  const { siblingData } = options
  const data = siblingData as { columns?: unknown; rows?: unknown } | undefined
  const rows = rowsOf<Row>(value, data?.rows)
  const columns = Array.isArray(data?.columns) ? data.columns.length : null
  if (!rows || columns === null) return true
  for (const [i, row] of rows.entries()) {
    const cells = Array.isArray(row?.cells) ? row.cells.length : 0
    if (cells !== columns) {
      const name = row?.label?.trim() ? ` (${row.label.trim()})` : ''
      return `Row ${i + 1}${name} has ${cells} ${cells === 1 ? 'cell' : 'cells'}, but the table has ${columns} columns. Give each row one cell per column, in column order.`
    }
  }
  return true
}

/**
 * Comparison table: NeuronCx beside other types of system, on one page. A
 * real table: column labels across the top (one column can be highlighted,
 * usually NeuronCx), a row label down the side, and plain-word cells. On
 * phones the table scrolls sideways with the row labels pinned on the left.
 */
export const ComparisonTable: Block = {
  slug: 'comparisonTable',
  interfaceName: 'ComparisonTableBlock',
  labels: { singular: 'Comparison table', plural: 'Comparison tables' },
  fields: [
    { name: 'eyebrow', type: 'text', label: 'Eyebrow', maxLength: 60, admin: { description: 'Optional. The small line above the heading.' } },
    { name: 'heading', type: 'text', label: 'Heading', required: true, maxLength: 140 },
    { name: 'intro', type: 'textarea', label: 'Intro', maxLength: 300, admin: { description: 'Optional. One or two sentences under the heading.' } },
    {
      name: 'columns',
      type: 'array',
      label: 'Columns',
      labels: { singular: 'Column', plural: 'Columns' },
      required: true,
      minRows: 2,
      maxRows: 4,
      validate: validateColumns,
      admin: {
        description: 'The systems being compared, left to right. Highlight one column at most, usually NeuronCx.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', type: 'text', label: 'Column label', required: true, maxLength: 40, admin: { width: '70%' } },
            { name: 'highlight', type: 'checkbox', label: 'Highlight this column', defaultValue: false, admin: { width: '30%', style: { alignSelf: 'flex-end' } } },
          ],
        },
      ],
    },
    {
      name: 'rows',
      type: 'array',
      label: 'Rows',
      labels: { singular: 'Row', plural: 'Rows' },
      required: true,
      minRows: 2,
      maxRows: 10,
      validate: validateRows,
      admin: {
        description: 'Describe what each system typically covers, in plain words. No ticks or crosses, and no claims about a named product.',
      },
      fields: [
        { name: 'label', type: 'text', label: 'Row label', required: true, maxLength: 60 },
        {
          name: 'cells',
          type: 'array',
          label: 'Cells',
          labels: { singular: 'Cell', plural: 'Cells' },
          maxRows: 4,
          admin: { description: 'One cell per column, in the same order as the columns.' },
          fields: [{ name: 'text', type: 'text', label: 'Cell', maxLength: 140 }],
        },
      ],
    },
    { name: 'footnote', type: 'text', label: 'Footnote', maxLength: 160, admin: { description: 'Optional. A short note under the table.' } },
  ],
}
