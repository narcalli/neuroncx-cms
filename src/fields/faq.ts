import type { Tab } from 'payload'

import { plainText } from './validators/plainText'

/**
 * FAQ group (fields_reference.md, section 5). Feeds the page's FAQ section
 * and FAQPage structured data, and the knowledge base. Answers are plain
 * text so the bot can use them as they are.
 */
export const faqTab = (): Tab => ({
  label: 'FAQ',
  fields: [
    {
      name: 'faqs',
      type: 'array',
      label: 'FAQs',
      labels: { singular: 'FAQ', plural: 'FAQs' },
      maxRows: 6,
      admin: { description: 'Up to 6. Questions phrased the way a buyer would ask them.' },
      fields: [
        { name: 'question', type: 'text', required: true, maxLength: 120 },
        {
          name: 'answer',
          type: 'textarea',
          required: true,
          maxLength: 600,
          validate: plainText,
          admin: { description: 'Plain text, no formatting.' },
        },
      ],
    },
  ],
})
