import type { Field } from 'payload'

/**
 * One setup step and who provides it. Shared by a connection type's default
 * checklist and an integration's own setup checklist, so a default can be
 * copied straight across.
 */
export const PROVIDED_BY = [
  { label: 'You', value: 'you' },
  { label: 'NeuronCx', value: 'neuroncx' },
  { label: 'Partner', value: 'partner' },
]

export const checklistFields = (): Field[] => [
  {
    name: 'item',
    type: 'text',
    required: true,
    maxLength: 80,
    admin: { description: 'One step, for example: Share the API key for your clinic.' },
  },
  {
    name: 'providedBy',
    type: 'select',
    label: 'Provided by',
    required: true,
    options: PROVIDED_BY,
  },
]
