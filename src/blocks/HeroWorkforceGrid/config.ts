import type { Block } from 'payload'

import { link } from '@/fields/link'
import { iconField } from '@/fields/icons'

/**
 * A hero with copy on the left and a grid of small "agent" cards on the
 * right, each column scrolling slowly up or down on its own infinite loop —
 * a "team at work" feel rather than a static screenshot.
 */
export const HeroWorkforceGrid: Block = {
  slug: 'heroWorkforceGrid',
  interfaceName: 'HeroWorkforceGridBlock',
  labels: { singular: 'Hero — Workforce Grid', plural: 'Heroes — Workforce Grid' },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      label: 'Small label above the headline',
      admin: { description: 'Optional. Short, e.g. "The workforce".' },
    },
    {
      name: 'headline',
      type: 'text',
      required: true,
      label: 'Headline',
      admin: {
        description:
          'This becomes the page’s main heading (the H1), so use it only once per page — set the page hero above to "None" when this block is on the page.',
      },
    },
    {
      name: 'subhead',
      type: 'textarea',
      label: 'Subhead',
      admin: { description: 'One or two sentences under the headline. Optional.' },
    },
    link({
      appearances: false,
      overrides: {
        name: 'cta',
        label: 'Button',
      },
    }),
    {
      type: 'row',
      fields: [
        {
          name: 'speed',
          type: 'select',
          label: 'Scroll speed',
          defaultValue: 'medium',
          options: [
            { label: 'Slow', value: 'slow' },
            { label: 'Medium', value: 'medium' },
            { label: 'Fast', value: 'fast' },
          ],
          admin: { width: '33%', description: 'Applies to every column.' },
        },
        {
          name: 'columns',
          type: 'select',
          label: 'Columns (desktop)',
          defaultValue: '3',
          options: [
            { label: '2', value: '2' },
            { label: '3', value: '3' },
            { label: '4', value: '4' },
          ],
          admin: { width: '33%' },
        },
      ],
    },
    {
      name: 'cards',
      type: 'array',
      label: 'Agent cards',
      minRows: 6,
      admin: {
        initCollapsed: true,
        description:
          'Distributed evenly across columns in the order you add them. Add at least 2 per column so the loop doesn’t feel short — 9 to 12 cards works well.',
      },
      fields: [
        iconField('bot'),
        {
          name: 'label',
          type: 'text',
          label: 'Small label on the card',
          defaultValue: 'AI agent',
          admin: { description: 'Short, e.g. "AI agent".' },
        },
        { name: 'title', type: 'text', required: true, label: 'Title' },
        {
          name: 'description',
          type: 'textarea',
          label: 'Description',
          admin: { description: 'One or two short lines.' },
        },
      ],
    },
  ],
}
