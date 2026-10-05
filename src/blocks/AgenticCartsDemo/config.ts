import type { Block } from 'payload'

/**
 * "One transaction, many carts": a toggle between a leads-and-opportunities
 * model and the NeuronCx model, plus a list of carts that visitors can add to.
 */
export const AgenticCartsDemo: Block = {
  slug: 'agenticCartsDemo',
  interfaceName: 'AgenticCartsDemoBlock',
  labels: { singular: 'Carts Demo', plural: 'Carts Demos' },
  fields: [
    { name: 'heading', type: 'text', label: 'Heading', required: true, maxLength: 140 },
    { name: 'intro', type: 'textarea', label: 'Intro', maxLength: 800 },
    {
      type: 'row',
      fields: [
        { name: 'modelALabel', type: 'text', label: 'Left toggle label', defaultValue: 'Leads-and-opportunities model', admin: { width: '50%' } },
        { name: 'modelBLabel', type: 'text', label: 'Right toggle label', defaultValue: 'NeuronCx', admin: { width: '50%' } },
      ],
    },
    {
      name: 'carts',
      type: 'array',
      label: 'Starting carts',
      minRows: 1,
      maxRows: 6,
      admin: { initCollapsed: true, description: 'The carts shown on load, in order. Visitors can add more up to six.' },
      fields: [
        { name: 'name', type: 'text', label: 'Cart name', required: true, maxLength: 60 },
        { name: 'historyCount', type: 'number', label: 'Earlier carts in history', min: 0, max: 10, defaultValue: 0 },
      ],
    },
    {
      name: 'addLabel',
      type: 'text',
      label: 'Add button label',
      defaultValue: 'Open a new cart',
      maxLength: 40,
    },
    {
      name: 'noteB',
      type: 'text',
      label: 'Note (NeuronCx mode)',
      maxLength: 160,
      defaultValue: 'The cart carries the lifecycle and the transaction carries the relationship.',
    },
    {
      name: 'noteA',
      type: 'text',
      label: 'Note (other model)',
      maxLength: 160,
      defaultValue: 'Each new opportunity starts a fresh row and arrives as a stranger.',
    },
  ],
}
