import type { Tab, Validate } from 'payload'
import { text as validateText } from 'payload/shared'

import { plainText } from './validators/plainText'

/**
 * WhatsApp group (fields_reference.md, section 6), for interactive session
 * messages. Hard caps are the WhatsApp Cloud API limits, so anything WhatsApp
 * would reject is rejected here first. Every text field is plain text except
 * waLink, which is an address.
 *
 * The list button and section title describe a whole list, not one entry,
 * so they belong in the whatsappLists global, not here.
 */

// A path on the site, with an optional anchor, or a full URL.
const linkRule: Validate = (value, options) => {
  const builtIn = validateText(value, options as any)
  if (builtIn !== true) return builtIn
  if (value === undefined || value === null || value === '') return true
  return typeof value === 'string' && /^(https?:\/\/[^\s]+|\/[^\s]*)$/.test(value)
    ? true
    : 'Use a path such as /crm/customer-360, or a full address starting with https://.'
}

export const whatsappTab = (): Tab => ({
  label: 'WhatsApp',
  description: 'Plain text only. These limits are the ones WhatsApp enforces.',
  fields: [
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
        {
          name: 'action',
          type: 'text',
          required: true,
          maxLength: 256,
          validate: plainText,
          admin: {
            description:
              'The reply the assistant receives when the button is tapped, for example book-demo.',
          },
        },
      ],
    },
    {
      name: 'waLink',
      type: 'text',
      label: 'Link (more information)',
      validate: linkRule,
      admin: {
        description:
          "Sent when the person wants more. Normally the entry's own page when Own page is on, otherwise its place on the parent page.",
      },
    },
  ],
})
