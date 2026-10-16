import { hubFields } from '../fields/hub'
import { familyAutoRowDescription } from './MicroApps/hooks'
import { taxonomy } from './taxonomy'

/**
 * Agent families: the groups the bot swarm agents (micro-apps) belong to,
 * such as Book and get paid. Built like integration categories, with
 * taxonomy(), plus a pain line and a summary for the hub sections. Spec:
 * docs/cms/collections/micro_apps_swarm.md, section 3.
 */
export const AgentFamilies = taxonomy({
  slug: 'agentFamilies',
  singular: 'Agent family',
  plural: 'Agent families',
  group: 'Bot swarm',
  description:
    "Groups for the bot swarm agents. Used in each agent's Family field, as the sections of the bot swarm hub and in WhatsApp menus.",
  usedBy: [
    { collection: 'microApps', field: 'family', one: 'agent', many: 'agents', show: 'name' },
  ],
  noun: 'family',
  capped: true,
  drafts: true,
  publicRead: 'published',
  slugExample: 'book-and-get-paid',
  hooks: { beforeChange: [familyAutoRowDescription] },
  fields: hubFields({
    hubHeading: 'The section heading on the bot swarm hub, for example "Book and get paid".',
    hubIntro: 'One line shown under the family heading on the hub.',
    afterIntro: [
      {
        name: 'painLine',
        type: 'text',
        label: 'Pain line',
        maxLength: 120,
        admin: {
          description:
            "The problem the family solves, in the team's words, for example: Your team spends the day confirming slots and chasing payments.",
        },
      },
      {
        name: 'summary',
        type: 'text',
        maxLength: 200,
        admin: {
          description:
            'How the agents in the family work together, for example: One agent books the appointment, the next sends the payment link and stays with it until it is settled.',
        },
      },
    ],
    icon: 'Shown with the family heading on the hub.',
    waRowTitle: 'The family as a row in the WhatsApp menu.',
    waRowDescriptionAuto:
      "Lists the names of this family's live and pilot agents that are published, in order, cut to 70 characters on a whole name. It updates when an agent is published, changed, unpublished or deleted. Publishing an agent can therefore save this family as a new published version, so publish or discard any open draft of the family first.",
    waRowDescription:
      'Aim for 60 characters. Written for you while the automatic switch above is on.',
  }),
})
