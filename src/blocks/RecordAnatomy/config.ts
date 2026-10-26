import type { Block } from 'payload'

import { iconField } from '@/fields/icons'

/**
 * Record anatomy: shows technical readers what a record holds and which
 * system fills each field. A grid of entities (Fees, Admissions, Contacts)
 * on the left; picking one shows its fields and their sources in a table on
 * the right, under a path such as "Student record › Fees".
 */
export const RecordAnatomy: Block = {
  slug: 'recordAnatomy',
  interfaceName: 'RecordAnatomyBlock',
  labels: { singular: 'Record anatomy', plural: 'Record anatomies' },
  fields: [
    { name: 'eyebrow', type: 'text', label: 'Eyebrow', maxLength: 60, admin: { description: 'Optional. The small line above the heading.' } },
    { name: 'heading', type: 'text', label: 'Heading', required: true, maxLength: 140 },
    { name: 'intro', type: 'textarea', label: 'Intro', maxLength: 300, admin: { description: 'Optional. One or two sentences under the heading.' } },
    {
      name: 'recordLabel',
      type: 'text',
      label: 'Record name',
      maxLength: 40,
      defaultValue: 'Customer record',
      admin: { description: 'Shown before the entity name in the panel, such as "Student record › Fees".' },
    },
    {
      type: 'row',
      fields: [
        { name: 'fieldColumnLabel', type: 'text', label: 'Field column heading', maxLength: 30, defaultValue: 'Field', admin: { width: '50%' } },
        { name: 'sourceColumnLabel', type: 'text', label: 'Source column heading', maxLength: 30, defaultValue: 'Filled by', admin: { width: '50%' } },
      ],
    },
    {
      name: 'entities',
      type: 'array',
      label: 'Entities',
      labels: { singular: 'Entity', plural: 'Entities' },
      required: true,
      minRows: 2,
      maxRows: 10,
      admin: {
        description: 'The parts of the record, such as Contacts, Admissions or Fees. The first one is shown when the page opens.',
      },
      fields: [
        { name: 'label', type: 'text', label: 'Entity name', required: true, maxLength: 40 },
        iconField(undefined, { description: 'Optional. Shown beside the entity name.' }),
        { name: 'description', type: 'text', label: 'Description', maxLength: 200, admin: { description: 'Optional. One line on what this part of the record is for.' } },
        {
          name: 'fields',
          type: 'array',
          label: 'Fields',
          labels: { singular: 'Field', plural: 'Fields' },
          required: true,
          minRows: 1,
          maxRows: 8,
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'name', type: 'text', label: 'Field name', required: true, maxLength: 60, admin: { width: '45%' } },
                {
                  name: 'source',
                  type: 'text',
                  label: 'Filled by',
                  required: true,
                  maxLength: 80,
                  admin: {
                    width: '55%',
                    description:
                      'The system or step that fills the field, such as Lead management system, ERP or Qualification form. Only sources that are live.',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
