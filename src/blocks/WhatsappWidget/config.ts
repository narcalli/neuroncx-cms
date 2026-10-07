import type { Block } from 'payload'

/**
 * A page-level block rather than site chrome, so it can be switched on for
 * the pages where a chat enquiry makes sense without a deploy.
 */
export const WhatsappWidget: Block = {
  slug: 'whatsappWidget',
  interfaceName: 'WhatsappWidgetBlock',
  labels: { singular: 'WhatsApp widget', plural: 'WhatsApp widgets' },
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      label: 'Show the widget on this page',
      defaultValue: false,
    },
    {
      name: 'phone',
      type: 'text',
      label: 'WhatsApp number',
      admin: {
        description:
          'In E.164 form, e.g. +919876543210. Used to build the chat link; the number itself is not shown on the page.',
        condition: (_, siblingData) => Boolean(siblingData?.enabled),
      },
      validate: (value: string | null | undefined, { siblingData }: any) => {
        if (!siblingData?.enabled) return true
        if (!value) return 'A WhatsApp number is required when the widget is on.'
        return /^\+[1-9]\d{7,14}$/.test(value.trim())
          ? true
          : 'Use E.164 form: a plus sign, country code, then the number, e.g. +919876543210.'
      },
    },
    {
      name: 'label',
      type: 'text',
      label: 'Button text',
      defaultValue: 'Chat with us',
      admin: { condition: (_, siblingData) => Boolean(siblingData?.enabled) },
    },
    {
      name: 'prefill',
      type: 'text',
      label: 'Prefilled message',
      defaultValue: 'Hi NeuronCx, I would like to know more.',
      admin: {
        description: 'What the visitor sends. The page reference is appended to it.',
        condition: (_, siblingData) => Boolean(siblingData?.enabled),
      },
    },
    {
      name: 'includeRef',
      type: 'checkbox',
      label: 'Add the page reference to the message',
      defaultValue: true,
      admin: {
        description: 'Appends [ref: page-slug] so the enquiry arrives already routed.',
        condition: (_, siblingData) => Boolean(siblingData?.enabled),
      },
    },
    {
      name: 'hoursNote',
      type: 'text',
      label: 'Hours note (optional)',
      admin: {
        description: 'For example "Mon–Sat, 9am–7pm IST". Not shown yet; reserved for a panel.',
        condition: (_, siblingData) => Boolean(siblingData?.enabled),
      },
    },
  ],
}
