import type { Block } from 'payload'

import { motionFields } from '../../fields/motion'

/**
 * The bot swarm diagram: every live and pilot agent on a ring around the
 * shared customer record (docs/motion/bot-swarm-motion-demo.html, the swarm
 * section). The website reads the data (neuroncx-website
 * src/components/swarmDiagram/); this block holds only the heading, the
 * optional facts and the caption shown when motion is off.
 */
export const SwarmDiagram: Block = {
  slug: 'swarmDiagram',
  interfaceName: 'SwarmDiagramBlock',
  labels: { singular: 'Swarm Diagram', plural: 'Swarm Diagrams' },
  fields: [
    { name: 'eyebrow', type: 'text', label: 'Eyebrow', maxLength: 40 },
    { name: 'heading', type: 'text', label: 'Heading', required: true, maxLength: 70 },
    { name: 'intro', type: 'textarea', label: 'Intro', maxLength: 300 },
    {
      name: 'facts',
      type: 'array',
      label: 'Facts (optional)',
      labels: { singular: 'Fact', plural: 'Facts' },
      maxRows: 3,
      admin: {
        initCollapsed: true,
        description:
          'Up to 3 figures above the diagram. Leave a value empty to count it from the live and pilot agents: the first from how many there are, the second from how many families they fall into, the third is always 1, for the one shared customer record.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'value', type: 'text', label: 'Value (optional)', maxLength: 12 },
            { name: 'label', type: 'text', label: 'Label', required: true, maxLength: 40 },
          ],
        },
      ],
    },
    {
      name: 'caption',
      type: 'textarea',
      label: 'Caption',
      maxLength: 140,
      admin: { description: 'Shown under the diagram when motion is off, in place of the handover it would otherwise name.' },
    },
    motionFields({ autoplay: true, loop: true }),
  ],
}
