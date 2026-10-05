import type { GroupField } from 'payload'

/**
 * A button that is allowed to be entirely empty. The shared `link()` field
 * builder always requires a target once its "type" defaults to Internal
 * link, so a group built from it can never really be left blank — exactly
 * the opposite of what an optional hero button needs. This is the same
 * shape (type, reference, url, label, newTab), just with nothing required.
 *
 * Used by any hero block with an optional primary/secondary button.
 */
export const optionalCta = (name: string, label: string): GroupField => ({
  name,
  type: 'group',
  label,
  admin: { hideGutter: true, description: 'Optional. Leave the label empty to hide this button.' },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'type',
          type: 'radio',
          defaultValue: 'custom',
          options: [
            { label: 'Internal link', value: 'reference' },
            { label: 'Custom URL', value: 'custom' },
          ],
          admin: { layout: 'horizontal', width: '50%' },
        },
        {
          name: 'newTab',
          type: 'checkbox',
          label: 'Open in new tab',
          admin: { width: '50%', style: { alignSelf: 'flex-end' } },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'reference',
          type: 'relationship',
          relationTo: ['pages', 'posts'],
          label: 'Document to link to',
          admin: { width: '50%', condition: (_, siblingData) => siblingData?.type === 'reference' },
        },
        {
          name: 'url',
          type: 'text',
          label: 'Custom URL',
          admin: { width: '50%', condition: (_, siblingData) => siblingData?.type !== 'reference' },
        },
        { name: 'label', type: 'text', label: 'Button text', admin: { width: '50%' } },
      ],
    },
  ],
})
