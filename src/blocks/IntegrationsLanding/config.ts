import type { Block } from 'payload'

/**
 * Integrations landing: the whole integrations landing page in one block,
 * built from an Integrations master record, the integration categories and
 * the live integration items. Nothing is typed into the block itself: edit the
 * master record, the categories or the items, and every page using this block
 * follows.
 *
 * Covers the page edge to edge with its own hero, so it gets the minimal
 * presentation options (hide and anchor), like the hero blocks.
 */
export const IntegrationsLanding: Block = {
  slug: 'integrationsLanding',
  interfaceName: 'IntegrationsLandingBlock',
  labels: { singular: 'Integrations landing', plural: 'Integrations landings' },
  fields: [
    {
      name: 'master',
      type: 'relationship',
      label: 'Master record',
      relationTo: 'integrationsMaster',
      admin: {
        description:
          'Leave empty to use the main record (the one with Is main on). The page shows its hero, the integrations by category, its sections, FAQ and closing. Set the page hero to None.',
      },
    },
  ],
}
