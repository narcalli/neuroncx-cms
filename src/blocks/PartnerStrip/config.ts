import type { Block } from 'payload'

export const PartnerStrip: Block = {
  slug: 'partnerStrip',
  interfaceName: 'PartnerStripBlock',
  labels: { singular: 'Partner Strip', plural: 'Partner Strips' },
  fields: [
    {
      name: 'intro',
      type: 'text',
      label: 'Opening line',
      admin: { description: 'For example: Powering conversational commerce across industries.' },
    },
    {
      name: 'partners',
      type: 'array',
      label: 'Platforms',
      maxRows: 8,
      admin: {
        description:
          'Systems you connect to, such as DocPulse, LeadSquared and WhatsApp Business API, set as text rather than logos. This is not the client logo wall.',
      },
      fields: [{ name: 'name', type: 'text', required: true }],
    },
    {
      name: 'badges',
      type: 'array',
      label: 'Standards badges',
      maxRows: 4,
      admin: {
        initCollapsed: true,
        description: 'Only claim a standard you actually meet. Hospital IT teams read these closely.',
      },
      fields: [
        { name: 'name', type: 'text', required: true, admin: { description: 'e.g. ABDM' } },
        { name: 'suffix', type: 'text', defaultValue: 'ready', admin: { description: 'e.g. ready' } },
      ],
    },
  ],
}
