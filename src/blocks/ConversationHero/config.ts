import type { Block } from 'payload'

export const ConversationHero: Block = {
  slug: 'conversationHero',
  interfaceName: 'ConversationHeroBlock',
  labels: { singular: 'Conversation Hero', plural: 'Conversation Heroes' },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      label: 'Small label above the headline',
      admin: { description: 'Optional. Short, e.g. "Omnichannel automation and reasoning".' },
    },
    {
      name: 'headline',
      type: 'text',
      required: true,
      label: 'Headline',
      admin: { description: 'Short and direct works best — around six to eight words.' },
    },
    {
      name: 'subhead',
      type: 'textarea',
      required: true,
      label: 'Subhead',
      admin: { description: 'One or two sentences explaining what the product does, in plain language.' },
    },
    { name: 'primaryButtonLabel', type: 'text', label: 'Primary button text' },
    { name: 'primaryButtonLink', type: 'text', label: 'Primary button address' },
    { name: 'secondaryButtonLabel', type: 'text', label: 'Secondary button text' },
    { name: 'secondaryButtonLink', type: 'text', label: 'Secondary button address' },
    {
      name: 'chips',
      type: 'array',
      label: 'Chips under the buttons',
      maxRows: 4,
      admin: {
        initCollapsed: true,
        description: 'Short capability labels, e.g. "WhatsApp · Voice · Web". Two or three works best.',
      },
      fields: [{ name: 'label', type: 'text', required: true }],
    },
    {
      name: 'conversationLabel',
      type: 'text',
      label: 'Label above the conversation',
      admin: { description: 'For example "WhatsApp · Ayurvaid Hospitals · 11:42".' },
    },
    {
      name: 'conversation',
      type: 'textarea',
      label: 'The conversation',
      admin: {
        description:
          'One message per line. Start a line with "them:" for the customer, "us:" for the agent, and "tag:" for a system note at the end.',
      },
    },
    {
      name: 'workflowSteps',
      type: 'array',
      label: 'Workflow steps under the conversation',
      maxRows: 5,
      admin: {
        initCollapsed: true,
        description: 'Optional. What fires behind the scenes, e.g. Booked, Paid, Reminder sent.',
      },
      fields: [
        { name: 'label', type: 'text', required: true },
        {
          name: 'icon',
          type: 'select',
          label: 'Icon',
          defaultValue: 'calendar',
          options: [
            { label: 'Calendar — booking, scheduling', value: 'calendar' },
            { label: 'Card — payment, transaction', value: 'card' },
            { label: 'Document — record, report, fulfilment', value: 'document' },
            { label: 'Message — follow-up, notification', value: 'message' },
            { label: 'Check — confirmation', value: 'check' },
          ],
        },
      ],
    },
    {
      name: 'stats',
      type: 'array',
      label: 'Stats strip',
      maxRows: 4,
      admin: {
        initCollapsed: true,
        description: 'Optional. Real, defensible figures only — these sit directly under the hero.',
      },
      fields: [
        { name: 'value', type: 'text', required: true, admin: { description: 'e.g. 40%, 2.5x, 14+' } },
        { name: 'label', type: 'text', required: true, admin: { description: 'What the number means, in three or four words.' } },
      ],
    },
  ],
}
