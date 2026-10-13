import type { Tab } from 'payload'

import { iconField } from './icons'

/**
 * Card group (fields_reference.md, section 2): what shows when the entry
 * appears on a grid, a list or a strip. Hard caps are maxLength; the working
 * limit is in the description.
 */
export const cardTab = (): Tab => ({
  label: 'Card',
  fields: [
    {
      name: 'tagline',
      type: 'text',
      maxLength: 60,
      admin: { description: 'A short line under the name. Aim for 45 characters.' },
    },
    {
      name: 'summary',
      type: 'text',
      required: true,
      maxLength: 140,
      admin: { description: 'One line on what it does. Aim for 120 characters.' },
    },
    iconField(undefined, { description: 'From the shared icon library.' }),
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Optional. Logos go here for integrations.' },
    },
  ],
})
