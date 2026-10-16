import type { CollectionSlug, Field, Tab, Validate } from 'payload'

import { link } from './link'
import { ownPageOn, requiredForOwnPage } from './validators/ownPage'

/**
 * Own page group (fields_reference.md, section 4): the sidebar switch and the
 * Page tab. Each collection sets its own route and wording; the switch's rule
 * can be the collection's own (`validate`).
 */

export const hasOwnPageField = (opts: { description: string; validate?: Validate }): Field => ({
  name: 'hasOwnPage',
  type: 'checkbox',
  label: 'Own page',
  defaultValue: false,
  ...(opts.validate ? { validate: opts.validate } : {}),
  admin: { position: 'sidebar', description: opts.description },
})

/** One optional section heading, 70 characters. */
export const headingOverride = (name: string, label: string): Field => ({
  name,
  type: 'text',
  label,
  maxLength: 70,
})

/**
 * The Page tab, shown while Own page is on. Fields in order: hero heading and
 * subheading, `afterHero` (for example benefits), the call to action, the
 * closing panel switch when given, related entries, section headings when
 * given, then `extra`.
 */
export const ownPageTab = (opts: {
  heroHeading: { description: string }
  heroSubheading: { description: string }
  afterHero?: Field[]
  cta: { description: string }
  showClosing?: { description: string }
  related: { relationTo: CollectionSlug; description: string }
  headingOverrides?: { description: string; keys: [string, string][] }
  extra?: Field[]
}): Tab => ({
  label: 'Page',
  admin: { condition: (data: Record<string, unknown>) => ownPageOn(data) },
  fields: [
    {
      name: 'heroHeading',
      type: 'text',
      label: 'Hero heading',
      maxLength: 70,
      validate: requiredForOwnPage('a hero heading'),
      admin: { description: opts.heroHeading.description },
    },
    {
      name: 'heroSubheading',
      type: 'textarea',
      label: 'Hero subheading',
      maxLength: 200,
      admin: { description: opts.heroSubheading.description },
    },
    ...(opts.afterHero || []),
    {
      name: 'cta',
      type: 'group',
      label: 'Call to action',
      admin: { description: opts.cta.description },
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
    ...(opts.showClosing
      ? [
          {
            name: 'showClosing',
            type: 'checkbox',
            label: 'Show closing panel',
            defaultValue: true,
            admin: { description: opts.showClosing.description },
          } as Field,
        ]
      : []),
    {
      name: 'related',
      type: 'relationship',
      relationTo: opts.related.relationTo,
      hasMany: true,
      maxRows: 3,
      filterOptions: ({ id }) => (id ? { id: { not_equals: id } } : true),
      admin: { description: opts.related.description },
    },
    ...(opts.headingOverrides
      ? [
          {
            name: 'headingOverrides',
            type: 'group',
            label: 'Section headings',
            admin: { description: opts.headingOverrides.description },
            fields: opts.headingOverrides.keys.map(([name, label]) => headingOverride(name, label)),
          } as Field,
        ]
      : []),
    ...(opts.extra || []),
  ] as Field[],
})
