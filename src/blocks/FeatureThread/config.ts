import type { Block } from 'payload'

export const FeatureThread: Block = {
  slug: 'featureThread',
  interfaceName: 'FeatureThreadBlock',
  labels: { singular: 'Feature Thread', plural: 'Feature Threads' },
  fields: [
    {
      name: 'heading',
      type: 'text',
      label: 'Heading',
      admin: { description: 'Optional. Leave empty to show the features with no heading.' },
    },
    {
      name: 'categories',
      type: 'select',
      hasMany: true,
      label: 'Categories to show',
      options: [
        { label: 'Omnichannel CX', value: 'omnichannel-cx' },
        { label: 'Knowledge base', value: 'knowledge-base' },
        { label: 'User intelligence', value: 'user-intelligence' },
        { label: 'Integrations', value: 'integrations' },
      ],
      admin: {
        description: 'Leave empty to show all four. Pick one when this sits on a product page.',
      },
    },
    {
      name: 'limitPerCategory',
      type: 'number',
      label: 'How many per category',
      defaultValue: 1,
      min: 1,
      max: 8,
      admin: {
        description:
          'Only published features are shown, in the order set on each feature. One per category suits the home page; three or four suits a product page.',
      },
    },
    {
      name: 'hideCategoryLinks',
      type: 'checkbox',
      label: 'Hide the "More on ..." links',
      defaultValue: false,
      admin: {
        description:
          'Tick this when the block is on the category page it would link to — otherwise every entry links back to the page the visitor is already reading.',
      },
    },
  ],
}
