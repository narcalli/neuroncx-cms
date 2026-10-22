import type { Block } from 'payload'

import { cardDesignFields } from '../../fields/cardDesign'
import { integrationSourceFields, showWhenManual } from '../../fields/integrationSource'

/**
 * A grid of integrations. The "Show" switch picks entries from the
 * Integrations collection or falls back to the old list typed into the
 * block itself; see fields/integrationSource.ts.
 *
 * The fields sit in three tabs. The tabs have no name, so they only arrange
 * the edit screen: every field is stored at the top of the block, as before.
 */
export const Integrations: Block = {
  slug: 'integrations',
  interfaceName: 'IntegrationsBlock',
  labels: { singular: 'Integrations', plural: 'Integrations' },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            { name: 'label', type: 'text', label: 'Small label above the heading' },
            { name: 'heading', type: 'text', label: 'Heading' },
            { name: 'intro', type: 'textarea', label: 'Intro line' },
            {
              name: 'footnote',
              type: 'text',
              label: 'Footnote',
              admin: { description: 'For example: anything else connects over the NeuronCx REST API and webhooks.' },
            },
          ],
        },
        {
          label: 'Integrations',
          fields: [
            ...integrationSourceFields({ min: 1, max: 24 }),
            {
              name: 'items',
              type: 'array',
              label: 'Manual list (being retired)',
              minRows: 1,
              maxRows: 24,
              admin: { initCollapsed: true, condition: showWhenManual },
              fields: [
                { name: 'name', type: 'text', required: true, label: 'Name' },
                {
                  name: 'summary',
                  type: 'text',
                  label: 'One line',
                  admin: { description: 'What flows between the two systems, in plain words.' },
                },
                {
                  name: 'logo',
                  type: 'upload',
                  relationTo: 'media',
                  label: 'Logo (optional)',
                  admin: { description: 'Transparent PNG or SVG. Leave empty to show the name only.' },
                },
              ],
            },
          ],
        },
        {
          label: 'Card design',
          // All six designs; integrations may bring their own (the switch is on by default).
          fields: [cardDesignFields({ allowItemDesigns: true })],
        },
      ],
    },
  ],
}
