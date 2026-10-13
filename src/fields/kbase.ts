import type { ArrayField, Tab } from 'payload'

import { plainText } from './validators/plainText'

/**
 * Knowledge base group (fields_reference.md, section 7): what the virtual
 * agents index and answer from. Indexed in order of weight: kbAnswer,
 * kbFacts, faqs, description.
 */

// A list of plain lines, one row each.
const lines = (
  name: string,
  item: string,
  labels: { singular: string; plural: string },
  maxLength: number,
  description: string,
): ArrayField => ({
  name,
  type: 'array',
  label: labels.plural,
  labels,
  admin: { description },
  fields: [{ name: item, type: 'text', required: true, maxLength, validate: plainText }],
})

export const kbaseTab = (): Tab => ({
  label: 'Knowledge base',
  fields: [
    {
      name: 'includeInKbase',
      type: 'checkbox',
      label: 'Include in knowledge base',
      defaultValue: true,
      admin: { description: 'Only published entries with this on are sent to the knowledge base.' },
    },
    {
      name: 'kbAnswer',
      type: 'textarea',
      label: 'Answer',
      maxLength: 600,
      validate: plainText,
      admin: {
        description: 'A complete answer to "What is this?", written for the virtual agents.',
      },
    },
    lines(
      'kbFacts',
      'fact',
      { singular: 'Fact', plural: 'Facts' },
      160,
      'Short, checkable facts. One fact per line.',
    ),
    lines(
      'kbQuestions',
      'question',
      { singular: 'Question', plural: 'Questions' },
      120,
      'How a customer might ask about it.',
    ),
    lines(
      'kbSynonyms',
      'synonym',
      { singular: 'Synonym', plural: 'Synonyms' },
      40,
      'Other names people use for it.',
    ),
    {
      name: 'kbLastReviewed',
      type: 'date',
      label: 'Last reviewed',
      admin: {
        date: { pickerAppearance: 'dayOnly' },
        description: 'So answers that have gone stale can be found and fixed.',
      },
    },
  ],
})
