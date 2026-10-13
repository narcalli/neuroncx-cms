import type { ArrayField, CheckboxField, CollectionSlug, Field, Tab, Validate } from 'payload'
import { text as validateText } from 'payload/shared'

import { link } from './link'

/**
 * Own page group (fields_reference.md, section 4). Every entry starts as a
 * card; hasOwnPage promotes it to a page of its own without a schema change.
 *
 *   const page = ownPage('crmFeatures')
 *   page.sidebar  the hasOwnPage switch, for the sidebar
 *   page.tab      the Page tab, shown only while hasOwnPage is on
 *
 * While the tab is hidden its fields are not validated, so an entry without
 * a page can always be published.
 */

const heroHeadingRule: Validate = (value, options) => {
  const builtIn = validateText(value, options as any)
  if (builtIn !== true) return builtIn
  const data = options.data as { hasOwnPage?: boolean; _status?: string } | undefined
  const empty = typeof value !== 'string' || !value.trim()
  if (data?.hasOwnPage && data?._status === 'published' && empty) {
    return 'Add a hero heading before publishing with Own page on.'
  }
  return true
}

// A list of short items: a title and one line each.
const titleAndLine = (
  name: string,
  labels: { singular: string; plural: string },
  rows: { minRows?: number; maxRows: number },
  description: string,
): ArrayField => ({
  name,
  type: 'array',
  labels,
  ...rows,
  admin: { description, initCollapsed: true },
  fields: [
    { name: 'title', type: 'text', required: true, maxLength: 50 },
    { name: 'line', type: 'text', required: true, maxLength: 140 },
  ],
})

export const ownPage = (collection: CollectionSlug): { sidebar: CheckboxField; tab: Tab } => {
  const sidebar: CheckboxField = {
    name: 'hasOwnPage',
    type: 'checkbox',
    label: 'Own page',
    defaultValue: false,
    admin: {
      position: 'sidebar',
      description:
        'Gives this entry a page of its own and adds it to the sitemap. The Page tab appears while this is on.',
    },
  }

  const fields: Field[] = [
    {
      name: 'heroHeading',
      type: 'text',
      maxLength: 70,
      validate: heroHeadingRule,
      admin: { description: 'The page heading. Needed to publish with Own page on.' },
    },
    { name: 'heroSubheading', type: 'textarea', maxLength: 200 },
    titleAndLine(
      'benefits',
      { singular: 'Benefit', plural: 'Benefits' },
      { minRows: 3, maxRows: 6 },
      '3 to 6 outcomes, each with a short line.',
    ),
    titleAndLine(
      'howItWorks',
      { singular: 'Step', plural: 'Steps' },
      { minRows: 3, maxRows: 5 },
      '3 to 5 steps, in order.',
    ),
    titleAndLine(
      'useCases',
      { singular: 'Use case', plural: 'Use cases' },
      { maxRows: 4 },
      'Up to 4, one per vertical where possible.',
    ),
    {
      name: 'cta',
      type: 'group',
      label: 'Call to action',
      admin: { description: 'The closing button. Type a label to choose where it goes.' },
      fields: [
        { name: 'label', type: 'text', maxLength: 30 },
        // Shown, and required, only once there is a label.
        link({
          appearances: false,
          disableLabel: true,
          overrides: {
            admin: { condition: (_: unknown, siblingData: any) => Boolean(siblingData?.label) },
          },
        }),
      ],
    },
    {
      name: 'related',
      type: 'relationship',
      relationTo: collection,
      hasMany: true,
      maxRows: 3,
      filterOptions: ({ id }) => (id ? { id: { not_equals: id } } : true),
      admin: {
        description: 'Up to 3. Leave empty to show other entries from this collection, by order.',
      },
    },
  ]

  const tab: Tab = {
    label: 'Page',
    admin: { condition: (data) => Boolean(data?.hasOwnPage) },
    fields,
  }

  return { sidebar, tab }
}
