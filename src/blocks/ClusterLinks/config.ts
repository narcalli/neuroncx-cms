import type { Block, Where } from 'payload'

import { cardDesignFields } from '../../fields/cardDesign'

/**
 * Cluster links: on a pillar page, a card for every published page under it
 * (its cluster pages), grouped by stage and in stage order. Extra pages that
 * belong to the cluster but keep their own address can be added, each with
 * its own stage. The block is not drawn when there is nothing to list.
 */
export const ClusterLinks: Block = {
  slug: 'clusterLinks',
  interfaceName: 'ClusterLinksBlock',
  labels: { singular: 'Cluster links', plural: 'Cluster links' },
  fields: [
    { name: 'eyebrow', type: 'text', label: 'Eyebrow', maxLength: 60, admin: { description: 'Optional. The small line above the heading.' } },
    { name: 'heading', type: 'text', label: 'Heading', maxLength: 140 },
    { name: 'intro', type: 'textarea', label: 'Intro', maxLength: 300, admin: { description: 'Optional. One or two sentences under the heading.' } },
    {
      name: 'extraPages',
      type: 'array',
      label: 'Extra pages',
      labels: { singular: 'Extra page', plural: 'Extra pages' },
      admin: {
        description:
          'Optional. Pages that belong to this cluster but keep their own address. The pages under this page are listed without being added here.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'page',
              type: 'relationship',
              label: 'Page',
              relationTo: 'pages',
              required: true,
              // Not this page, and not a page under it: those are listed already.
              filterOptions: ({ id }): Where | true =>
                id ? { and: [{ id: { not_equals: id } }, { parent: { not_equals: id } }] } : true,
              admin: { width: '50%' },
            },
            {
              name: 'stage',
              type: 'text',
              label: 'Stage',
              maxLength: 30,
              admin: { width: '30%', description: 'Such as Qualification.' },
            },
            {
              name: 'stageOrder',
              type: 'number',
              label: 'Stage order',
              min: 0,
              admin: { width: '20%', step: 1 },
            },
          ],
        },
      ],
    },
    // Feature cards by default: a stage often has one or two pages, which the
    // grid design would leave in a mostly empty row.
    cardDesignFields({ defaultDesign: 'feature' }),
  ],
}
