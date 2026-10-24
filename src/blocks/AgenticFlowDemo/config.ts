import type { Block } from 'payload'

/**
 * An interactive trigger -> route -> resolve walkthrough. Editors define a
 * handful of events; the page lets a visitor pick one and watch it travel
 * through the three stages.
 *
 * It also had up to three static step cards below the demo; the field was
 * removed on 24 Oct 2026. A page saved before then keeps its cards in the
 * database, unused, until it is next saved.
 */
export const AgenticFlowDemo: Block = {
  slug: 'agenticFlowDemo',
  interfaceName: 'AgenticFlowDemoBlock',
  labels: { singular: 'Agentic Flow Demo', plural: 'Agentic Flow Demos' },
  fields: [
    { name: 'heading', type: 'text', label: 'Heading', required: true, maxLength: 140 },
    { name: 'intro', type: 'textarea', label: 'Intro', maxLength: 600 },
    {
      name: 'events',
      type: 'array',
      label: 'Events',
      minRows: 1,
      maxRows: 4,
      admin: {
        initCollapsed: true,
        description: 'Each event is one button a visitor can pick. The first one is shown on load.',
      },
      fields: [
        { name: 'label', type: 'text', label: 'Button label', required: true, maxLength: 40 },
        { name: 'triggerTitle', type: 'text', label: 'Trigger title', required: true, maxLength: 60 },
        { name: 'triggerText', type: 'text', label: 'Trigger text', required: true, maxLength: 140 },
        { name: 'routeText', type: 'text', label: 'Route text', required: true, maxLength: 180 },
        {
          name: 'handlers',
          type: 'select',
          label: 'Who handles it',
          hasMany: true,
          options: [
            { label: 'Virtual agent', value: 'agent' },
            { label: 'Human team', value: 'human' },
          ],
          defaultValue: ['agent'],
        },
        { name: 'resolveTitle', type: 'text', label: 'Resolve title', required: true, maxLength: 60 },
        { name: 'resolveText', type: 'text', label: 'Resolve text', required: true, maxLength: 180 },
      ],
    },
    {
      name: 'footnote',
      type: 'text',
      label: 'Note under the demo',
      maxLength: 120,
      defaultValue: 'Illustrative run, not live data.',
    },
  ],
}
