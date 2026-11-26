import type { Block } from 'payload'
import { iconField } from '@/fields/icons'

export const ConversationHero: Block = {
  slug: 'conversationHero',
  interfaceName: 'ConversationHeroBlock',
  labels: { singular: 'Conversation Hero', plural: 'Conversation Heroes' },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      label: 'Small label above the headline',
      maxLength: 60,
      admin: { description: 'Optional. Short, e.g. "Omnichannel automation and reasoning".' },
    },
    {
      name: 'headline',
      type: 'text',
      required: true,
      label: 'Headline',
      maxLength: 120,
      admin: { description: 'Short and direct works best: around six to eight words.' },
    },
    {
      name: 'subhead',
      type: 'textarea',
      required: true,
      label: 'Subhead',
      maxLength: 300,
      admin: { description: 'One or two sentences explaining what the product does, in plain language.' },
    },
    {
      name: 'headingSize',
      type: 'number',
      label: 'Heading size (px)',
      defaultValue: 44,
      min: 24,
      max: 64,
      admin: {
        step: 1,
        description:
          "Sets the hero heading's font size in pixels. Keep it under about 48px for longer headlines so they don't wrap awkwardly.",
      },
    },
    { name: 'primaryButtonLabel', type: 'text', label: 'Primary button text', maxLength: 40 },
    { name: 'primaryButtonLink', type: 'text', label: 'Primary button address', maxLength: 300 },
    { name: 'secondaryButtonLabel', type: 'text', label: 'Secondary button text', maxLength: 40 },
    { name: 'secondaryButtonLink', type: 'text', label: 'Secondary button address', maxLength: 300 },
    {
      name: 'chips',
      type: 'array',
      label: 'Chips under the buttons',
      maxRows: 4,
      admin: {
        initCollapsed: true,
        description: 'Short capability labels, e.g. "WhatsApp · Voice · Web". Two or three works best.',
      },
      fields: [{ name: 'label', type: 'text', required: true, maxLength: 24 }],
    },
    {
      name: 'conversationLabel',
      type: 'text',
      label: 'Label above the conversation',
      maxLength: 60,
      admin: { description: 'For example "WhatsApp · Ayurvaid Hospitals · 11:42".' },
    },
    {
      name: 'conversation',
      type: 'textarea',
      label: 'The conversation',
      maxLength: 600,
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
        { name: 'label', type: 'text', required: true, maxLength: 40 },
        iconField('calendar'),
      ],
    },
    {
      name: 'stats',
      type: 'array',
      label: 'Stats strip',
      maxRows: 4,
      admin: {
        initCollapsed: true,
        description: 'Optional. These sit directly under the hero, so use real, defensible figures only.',
      },
      fields: [
        { name: 'value', type: 'text', required: true, maxLength: 20, admin: { description: 'e.g. 40%, 2.5x, 14+' } },
        { name: 'label', type: 'text', required: true, maxLength: 40, admin: { description: 'What the number means, in three or four words.' } },
      ],
    },
  ],
}
