import type { ArrayFieldValidation, Block } from 'payload'
import { array } from 'payload/shared'

import { withPresentationExceptNavy } from '@/fields/presentation'

type Highlightable = { highlighted?: boolean | null }
type Row = { capability?: string | null; cells?: unknown[] | null }

/**
 * An array field's rows. On the server a validator gets the rows themselves;
 * in the admin it may get only how many there are, so the rows are read from
 * the block's data instead. Mirrors ComparisonTable's rowsOf.
 */
const rowsOf = <T>(value: unknown, sibling: unknown): T[] | null =>
  Array.isArray(value) ? (value as T[]) : Array.isArray(sibling) ? (sibling as T[]) : null

/** At most one row may have `highlighted` set. Shared by the cards array and the table's columns array. */
const atMostOneHighlighted =
  (siblingKey: string, message: string): ArrayFieldValidation =>
  (value, options) => {
    const base = array(value, options)
    if (base !== true) return base
    const { siblingData } = options
    const rows = rowsOf<Highlightable>(value, (siblingData as Record<string, unknown>)?.[siblingKey])
    if (!rows) return true
    const lit = rows.filter((r) => r?.highlighted).length
    return lit > 1 ? message : true
  }

/** At most one card is the NeuronCx card. */
export const validateCards = atMostOneHighlighted('cards', 'Only one card can be highlighted.')

/** At most one table column is the NeuronCx column. */
export const validateTableColumns = atMostOneHighlighted('columns', 'Only one column can be highlighted.')

/** Each row has exactly one cell per table column. */
export const validateTableRows: ArrayFieldValidation = (value, options) => {
  const base = array(value, options)
  if (base !== true) return base
  const { siblingData } = options
  const data = siblingData as { columns?: unknown; rows?: unknown } | undefined
  const rows = rowsOf<Row>(value, data?.rows)
  const columns = Array.isArray(data?.columns) ? data.columns.length : null
  if (!rows || columns === null) return true
  for (const row of rows) {
    const cells = Array.isArray(row?.cells) ? row.cells.length : 0
    if (cells !== columns) return `Each row needs one cell per column (${columns}).`
  }
  return true
}

/** Shared by a cell's own rating and a column's default rating. */
const RATING_OPTIONS = [
  { label: 'Strong', value: 'strong' },
  { label: 'Partial', value: 'partial' },
  { label: 'Missing', value: 'missing' },
  { label: 'Roadmap', value: 'roadmap' },
  { label: 'None (no colour)', value: 'none' },
]

/**
 * Legacy stack vs NeuronCx: a row of cards (one of them, usually NeuronCx,
 * highlighted in navy), then an optional full comparison table that opens
 * and closes under them.
 *
 * Highlight (navy) is already spent by the highlighted card, so this block
 * does not offer it as a background — see withPresentationExceptNavy.
 */
export const StackComparison: Block = {
  slug: 'stackComparison',
  interfaceName: 'StackComparisonBlock',
  labels: { singular: 'Stack Comparison', plural: 'Stack Comparisons' },
  fields: [
    { name: 'eyebrow', type: 'text', label: 'Eyebrow', maxLength: 40 },
    { name: 'heading', type: 'text', label: 'Heading', required: true, maxLength: 90 },
    { name: 'intro', type: 'textarea', label: 'Intro', maxLength: 300 },
    {
      name: 'cards',
      type: 'array',
      label: 'Cards',
      labels: { singular: 'Card', plural: 'Cards' },
      minRows: 2,
      maxRows: 4,
      validate: validateCards,
      admin: {
        initCollapsed: true,
        description: 'One card per system being compared. Highlight one at most — usually NeuronCx.',
      },
      fields: [
        { name: 'title', type: 'text', label: 'Title', required: true, maxLength: 40 },
        { name: 'tagline', type: 'text', label: 'Tagline', maxLength: 110 },
        {
          name: 'audienceLabel',
          type: 'text',
          label: 'Audience pill',
          maxLength: 40,
          admin: { description: 'Shown as a pill on the card, e.g. "Used by: sales team".' },
        },
        {
          name: 'highlighted',
          type: 'checkbox',
          label: 'This is the NeuronCx card',
          defaultValue: false,
          admin: { description: 'Shows the card in navy with white text. At most one card can be highlighted.' },
        },
        {
          name: 'badge',
          type: 'text',
          label: 'Badge',
          maxLength: 20,
          admin: { description: 'Small label on the card corner, e.g. "Recommended".', condition: (_, siblingData) => Boolean(siblingData?.highlighted) },
        },
        {
          name: 'cta',
          type: 'group',
          label: 'Button',
          admin: { hideGutter: true, condition: (_, siblingData) => Boolean(siblingData?.highlighted) },
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'label', type: 'text', label: 'Button text', maxLength: 30, admin: { width: '50%' } },
                { name: 'url', type: 'text', label: 'Button address', maxLength: 300, admin: { width: '50%' } },
              ],
            },
          ],
        },
        {
          name: 'groups',
          type: 'array',
          label: 'Capability groups',
          labels: { singular: 'Group', plural: 'Groups' },
          minRows: 1,
          maxRows: 2,
          admin: {
            initCollapsed: true,
            description: 'The card\'s own capability list, split into up to two groups (for example "Includes" and "Does not include").',
          },
          fields: [
            { name: 'heading', type: 'text', label: 'Group heading', maxLength: 50 },
            {
              name: 'tone',
              type: 'select',
              label: 'Tone',
              defaultValue: 'included',
              options: [
                { label: 'Included (tick)', value: 'included' },
                { label: 'Missing (cross)', value: 'missing' },
                { label: 'Plus (sparkle)', value: 'plus' },
              ],
              admin: { description: 'The icon shown beside every item in this group.' },
            },
            {
              name: 'items',
              type: 'array',
              label: 'Items',
              labels: { singular: 'Item', plural: 'Items' },
              minRows: 1,
              maxRows: 10,
              fields: [{ name: 'text', type: 'text', label: 'Item', required: true, maxLength: 120 }],
            },
          ],
        },
      ],
    },
    {
      name: 'table',
      type: 'group',
      label: 'Full comparison table',
      admin: {
        description: 'An optional table under the cards that opens and closes. Leave it off to show just the cards.',
      },
      fields: [
        { name: 'enabled', type: 'checkbox', label: 'Show the table', defaultValue: true },
        {
          name: 'startOpen',
          type: 'checkbox',
          label: 'Open by default',
          defaultValue: false,
          admin: { condition: (_, siblingData) => Boolean(siblingData?.enabled) },
        },
        {
          type: 'row',
          admin: { condition: (_, siblingData) => Boolean(siblingData?.enabled) },
          fields: [
            { name: 'openLabel', type: 'text', label: 'Text when closed', defaultValue: 'Compare all capabilities', maxLength: 40, admin: { width: '50%' } },
            { name: 'closeLabel', type: 'text', label: 'Text when open', defaultValue: 'Hide full comparison', maxLength: 40, admin: { width: '50%' } },
          ],
        },
        {
          name: 'cellStyle',
          type: 'select',
          label: 'Cell style',
          defaultValue: 'tint',
          options: [
            { label: 'Tint (coloured background)', value: 'tint' },
            { label: 'Dot (small coloured dot)', value: 'dot' },
            { label: 'Compact (text only)', value: 'compact' },
          ],
          admin: { condition: (_, siblingData) => Boolean(siblingData?.enabled) },
        },
        {
          name: 'showLegend',
          type: 'checkbox',
          label: 'Show the rating legend',
          defaultValue: true,
          admin: { condition: (_, siblingData) => Boolean(siblingData?.enabled) },
        },
        {
          name: 'columns',
          type: 'array',
          label: 'Columns',
          labels: { singular: 'Column', plural: 'Columns' },
          minRows: 2,
          maxRows: 5,
          validate: validateTableColumns,
          admin: {
            condition: (_, siblingData) => Boolean(siblingData?.enabled),
            description: 'The systems across the top of the table, left to right. Highlight one at most, usually NeuronCx.',
          },
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'label', type: 'text', label: 'Column label', required: true, maxLength: 30, admin: { width: '60%' } },
                { name: 'highlighted', type: 'checkbox', label: 'Highlight', defaultValue: false, admin: { width: '40%', style: { alignSelf: 'flex-end' } } },
              ],
            },
            {
              name: 'defaultRating',
              type: 'select',
              label: 'Default rating for this column',
              defaultValue: 'none',
              options: RATING_OPTIONS,
              admin: {
                description: "Used by any cell in this column left on Inherit, below.",
              },
            },
          ],
        },
        {
          name: 'rows',
          type: 'array',
          label: 'Rows',
          labels: { singular: 'Row', plural: 'Rows' },
          maxRows: 15,
          validate: validateTableRows,
          admin: {
            condition: (_, siblingData) => Boolean(siblingData?.enabled),
            description: 'One row per capability. Give each row exactly one cell per column above, in the same order.',
          },
          fields: [
            { name: 'capability', type: 'text', label: 'Capability', required: true, maxLength: 50 },
            {
              name: 'cells',
              type: 'array',
              label: 'Cells',
              labels: { singular: 'Cell', plural: 'Cells' },
              maxRows: 5,
              admin: { description: 'One cell per column, in the same order as the columns above.' },
              fields: [
                { name: 'text', type: 'text', label: 'Cell text', maxLength: 80 },
                {
                  name: 'rating',
                  type: 'select',
                  label: 'Rating',
                  defaultValue: 'inherit',
                  options: [{ label: 'Inherit (use the column default)', value: 'inherit' }, ...RATING_OPTIONS],
                  admin: { description: "Rating sets the cell colour. Inherit uses the column's default." },
                },
              ],
            },
          ],
        },
        {
          name: 'footnote',
          type: 'text',
          label: 'Footnote',
          maxLength: 200,
          admin: { condition: (_, siblingData) => Boolean(siblingData?.enabled) },
        },
      ],
    },
  ],
}

/**
 * The highlighted card is already navy, so a second navy section right
 * beside it would fight it for attention — this block does not offer
 * Highlight (navy) as a background choice.
 */
export const StackComparisonWithAppearance = withPresentationExceptNavy(
  StackComparison,
  'Highlight (navy) is not available on Stack Comparison: the highlighted card is already navy.',
)
