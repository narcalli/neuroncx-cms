import type { ArrayField, Field, RelationshipField, SelectField } from 'payload'

import { countedText } from './counted'

/**
 * A sample chat for a hero (fields_reference.md section 4), shared by hubs
 * and the Own page group: up to 8 messages, each from the customer, the
 * business or a team member, with an optional label naming the entry (the
 * agent) that sends a business reply, plus a caption.
 *
 *   chatExampleFields({ agent, captionDescription })
 *
 * `agent` is the label relationship: entries of the same collection on an
 * entry page, entries of the hub's collection on a hub. It is stored under
 * `entry`, shown only for business messages.
 */

export const CHAT_SENDERS = ['customer', 'business', 'team'] as const

export type ChatSender = (typeof CHAT_SENDERS)[number]

const sender: SelectField = {
  name: 'sender',
  type: 'select',
  required: true,
  defaultValue: 'customer',
  options: [
    { label: 'Customer', value: 'customer' },
    { label: 'Business (the agent)', value: 'business' },
    { label: 'Team member', value: 'team' },
  ],
  admin: { width: '30%' },
}

export const chatExampleFields = ({
  agent,
  captionDescription,
}: {
  agent: RelationshipField
  captionDescription: string
}): [ArrayField, Field] => [
  {
    name: 'heroChat',
    type: 'array',
    label: 'Chat',
    labels: { singular: 'Message', plural: 'Messages' },
    maxRows: 8,
    admin: {
      initCollapsed: true,
      description: 'Up to 8 messages, in order. Demo details only, no real customer names or figures.',
    },
    fields: [
      {
        type: 'row',
        fields: [
          sender,
          {
            ...agent,
            name: 'entry',
            hasMany: false,
            admin: {
              ...agent.admin,
              width: '70%',
              condition: (_: unknown, siblingData: { sender?: string } | undefined) => siblingData?.sender === 'business',
            },
          } as RelationshipField,
        ],
      },
      countedText({ name: 'text', label: 'Message', textarea: true, required: true, maxLength: 300 }),
    ],
  },
  countedText({ name: 'heroChatCaption', label: 'Chat caption (optional)', maxLength: 80, description: captionDescription }),
]
