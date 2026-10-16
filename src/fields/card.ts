import type { Field, Tab } from 'payload'

import { iconField } from './icons'

/**
 * Card group (fields_reference.md, section 2): what shows when an entry
 * appears on a grid, list or strip. Integrations keeps its upload as `logo`
 * and its summary at 120; the options keep each collection's stored names
 * and limits. `extra` fields follow the summary (glance, key points...).
 */
export const cardTab = (opts: {
  image?: { name: string; description: string }
  icon?: { description?: string }
  tagline: { description: string }
  summary: { description: string; maxLength: number; required?: boolean }
  extra?: Field[]
}): Tab => ({
  label: 'Card',
  fields: [
    ...(opts.image
      ? [
          {
            name: opts.image.name,
            type: 'upload',
            relationTo: 'media',
            admin: { description: opts.image.description },
          } as Field,
        ]
      : []),
    ...(opts.icon ? [iconField(undefined, { description: opts.icon.description })] : []),
    {
      name: 'tagline',
      type: 'text',
      maxLength: 60,
      admin: { description: opts.tagline.description },
    },
    {
      name: 'summary',
      type: 'text',
      ...(opts.summary.required ? { required: true } : {}),
      maxLength: opts.summary.maxLength,
      admin: { description: opts.summary.description },
    },
    ...(opts.extra || []),
  ] as Field[],
})
