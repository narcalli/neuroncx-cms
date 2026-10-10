import type { Block } from 'payload'

const cta = (name: string, label: string) => ({
  name,
  type: 'group' as const,
  label,
  fields: [
    { name: 'label', type: 'text' as const, label: 'Button text' },
    {
      name: 'href',
      type: 'text' as const,
      label: 'Button address',
      admin: { description: 'A full address, a page path such as /contact, or #section-id for a section on this page.' },
    },
  ],
})

export const HeroStack: Block = {
  slug: 'heroStack',
  interfaceName: 'HeroStackBlock',
  labels: { singular: 'Hero Stack', plural: 'Hero Stacks' },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      label: 'Small label above the heading',
      admin: { description: 'Optional. For example "Acquire · Engage · Retain".' },
    },
    {
      name: 'heading',
      type: 'text',
      required: true,
      label: 'Heading',
    },
    {
      name: 'intro',
      type: 'textarea',
      label: 'Intro',
      admin: { description: 'Optional. One or two sentences under the heading. Hidden on phones to keep the hero short.' },
    },
    cta('primaryCta', 'Primary button'),
    cta('secondaryCta', 'Secondary button'),
    {
      name: 'products',
      type: 'array',
      label: 'Products',
      minRows: 2,
      maxRows: 6,
      required: true,
      admin: {
        initCollapsed: true,
        description:
          'Each product is one screenshot card in the stack. The first one sits on top; scrolling deals them away in this order.',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          label: 'Tab label (one or two words)',
          maxLength: 24,
        },
        {
          name: 'caption',
          type: 'text',
          label: 'Caption (one line, shown under the tabs)',
          maxLength: 110,
        },
        {
          name: 'screenshot',
          type: 'upload',
          relationTo: 'media',
          required: true,
          label: 'Screenshot',
          admin: {
            description:
              'Shown in a 16:10 card. Upload at 1600 x 1000 (16:10) so nothing is trimmed. A taller image is trimmed at the bottom, a wider one at the right.',
          },
        },
      ],
    },
    {
      name: 'showFrame',
      type: 'checkbox',
      label: 'Browser frame (a thin bar with three dots above each screenshot)',
      defaultValue: true,
    },
  ],
}
