import type { Block } from 'payload'

export const LogoWall: Block = {
  slug: 'logoWall',
  interfaceName: 'LogoWallBlock',
  labels: {
    singular: 'Logo Wall',
    plural: 'Logo Walls',
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      label: 'Small label above the heading',
      admin: {
        description: 'Short and plain, e.g. "Trusted by". Leave empty to hide.',
      },
    },
    {
      name: 'heading',
      type: 'text',
      label: 'Heading',
    },
    {
      name: 'intro',
      type: 'textarea',
      label: 'Intro line',
      admin: {
        description: 'One or two sentences. Leave empty to hide.',
      },
    },
    {
      name: 'display',
      type: 'radio',
      label: 'How to show clients',
      defaultValue: 'wordmarks',
      options: [
        { label: 'Client names as text', value: 'wordmarks' },
        { label: 'Client logos', value: 'logos' },
      ],
      admin: {
        layout: 'horizontal',
        description:
          'Logos are more convincing, but every file needs a transparent background. Switch to logos once you have proper assets for all of them.',
      },
    },
    {
      name: 'logos',
      type: 'array',
      label: 'Clients',
      minRows: 1,
      maxRows: 12,
      admin: {
        description:
          'The name is always used. A logo file is only needed when the display mode above is set to logos.',
        initCollapsed: true,
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          label: 'Client name',
          admin: {
            description:
              'Shown as text in wordmark mode, and used as the image alt text in logo mode. Keep it short — long names crowd the row.',
          },
        },
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'media',
          label: 'Logo file',
          admin: {
            description: 'Transparent PNG or SVG. Only used in logo mode.',
          },
        },
        {
          name: 'scale',
          type: 'number',
          label: 'Size adjustment (%)',
          defaultValue: 100,
          min: 50,
          max: 200,
          admin: {
            description:
              'Logo mode only. Leave at 100 unless a logo looks too big or small next to the others. Round crests usually need 130–150.',
          },
        },
      ],
    },
  ],
}
