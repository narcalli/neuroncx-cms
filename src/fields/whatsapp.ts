import type { Field, Tab, Validate } from 'payload'
import { text as validateText } from 'payload/shared'

import { plainText } from './validators/plainText'

/**
 * WhatsApp group (fields_reference.md, section 6), for interactive session
 * messages. Hard caps are the WhatsApp Cloud API limits, so anything WhatsApp
 * would reject is rejected here first. Every text field is plain text except
 * waLink, which is an address.
 *
 * The list button and section title describe a whole list, not one entry,
 * so they live once per collection, not here.
 */

export type WhatsappTabOptions = {
  /** Fixed choices for a reply button's action. Without them, action is free text. */
  buttonActions?: { label: string; value: string }[]
  /** Adds waHeaderType (text or image) next to the header. */
  headerType?: boolean
  /** Adds waLinkLabel, the text on the link button, next to waLink. */
  linkLabel?: boolean
  /**
   * When set, waLink is filled by a hook on the collection and editors only
   * see it. The string is the field's admin description.
   */
  linkSetByHook?: string
}

// A path on the site, with an optional anchor, or a full URL.
const linkRule: Validate = (value, options) => {
  const builtIn = validateText(value, options as any)
  if (builtIn !== true) return builtIn
  if (value === undefined || value === null || value === '') return true
  return typeof value === 'string' && /^(https?:\/\/[^\s]+|\/[^\s]*)$/.test(value)
    ? true
    : 'Use a path such as /integrations/docpulse, or a full address starting with https://.'
}

export const whatsappTab = (opts: WhatsappTabOptions = {}): Tab => {
  const action: Field = opts.buttonActions
    ? {
        name: 'action',
        type: 'select',
        required: true,
        options: opts.buttonActions,
        admin: { description: 'What happens when the button is tapped.' },
      }
    : {
        name: 'action',
        type: 'text',
        required: true,
        maxLength: 256,
        validate: plainText,
        admin: {
          description:
            'The reply the assistant receives when the button is tapped, for example book-demo.',
        },
      }

  const fields: Field[] = [
    {
      name: 'waRowTitle',
      type: 'text',
      label: 'Row title (list menu)',
      maxLength: 24,
      validate: plainText,
    },
    {
      name: 'waRowDescription',
      type: 'text',
      label: 'Row description (list menu)',
      maxLength: 72,
      validate: plainText,
      admin: { description: 'Aim for 60 characters.' },
    },
    ...(opts.headerType
      ? [
          {
            name: 'waHeaderType',
            type: 'select',
            label: 'Header type',
            defaultValue: 'text',
            options: [
              { label: 'Text', value: 'text' },
              { label: 'Image', value: 'image' },
            ],
            admin: { description: 'List messages only allow a text header.' },
          } as Field,
        ]
      : []),
    {
      name: 'waHeader',
      type: 'text',
      label: 'Header',
      maxLength: 60,
      validate: plainText,
      admin: { description: 'Aim for 30 characters.' },
    },
    {
      name: 'waBody',
      type: 'textarea',
      label: 'Body',
      maxLength: 1024,
      validate: plainText,
      admin: { description: 'Aim for 300 characters.' },
    },
    {
      name: 'waKeyPoints',
      type: 'array',
      label: 'Key points',
      labels: { singular: 'Key point', plural: 'Key points' },
      minRows: 3,
      maxRows: 5,
      admin: { description: '3 to 5 short lines, sent inside the body.' },
      fields: [{ name: 'line', type: 'text', required: true, maxLength: 60, validate: plainText }],
    },
    {
      name: 'waFooter',
      type: 'text',
      label: 'Footer',
      maxLength: 60,
      validate: plainText,
      admin: { description: 'Aim for 30 characters.' },
    },
    {
      name: 'waButtons',
      type: 'array',
      label: 'Reply buttons',
      labels: { singular: 'Button', plural: 'Buttons' },
      maxRows: 3,
      admin: { description: 'Up to 3, which is the WhatsApp limit.' },
      fields: [
        { name: 'label', type: 'text', required: true, maxLength: 20, validate: plainText },
        action,
      ],
    },
    ...(opts.linkLabel
      ? [
          {
            name: 'waLinkLabel',
            type: 'text',
            label: 'Link button text',
            maxLength: 20,
            validate: plainText,
            admin: { description: 'The text on the link button, for example Read the guide.' },
          } as Field,
        ]
      : []),
    {
      name: 'waLink',
      type: 'text',
      label: 'Link (more information)',
      validate: linkRule,
      admin: opts.linkSetByHook
        ? { readOnly: true, description: opts.linkSetByHook }
        : {
            description:
              "Sent when the person wants more. Normally the entry's own page when Own page is on, otherwise its place on the parent page.",
          },
    },
  ]

  return {
    label: 'WhatsApp',
    description: 'Plain text only. These limits are the ones WhatsApp enforces.',
    fields,
  }
}
