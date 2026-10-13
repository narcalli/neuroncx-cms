import type { SelectField } from 'payload'

/**
 * Live, Pilot or Planned, for collections whose entries appear on the website,
 * WhatsApp and the knowledge base. Pair it with publicLiveOrPilot read access
 * (src/access/publicLiveOrPilot.ts) so Planned entries never reach visitors.
 *
 * A function, so every collection gets its own copy of the field.
 */
export const statusField = (): SelectField => ({
  name: 'status',
  type: 'select',
  required: true,
  defaultValue: 'planned',
  options: [
    { label: 'Live', value: 'live' },
    { label: 'Pilot', value: 'pilot' },
    { label: 'Planned', value: 'planned' },
  ],
  admin: {
    position: 'sidebar',
    description:
      'Only Live and Pilot entries appear on the website, WhatsApp and the knowledge base.',
  },
})
