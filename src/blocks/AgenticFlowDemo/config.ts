import type { Block, Condition } from 'payload'

const isFlow: Condition = (_data, siblingData) => siblingData?.mode !== 'agentFeatures'
const isAgentFeatures: Condition = (_data, siblingData) => siblingData?.mode === 'agentFeatures'

/**
 * An interactive trigger -> route -> resolve walkthrough. Editors define a
 * handful of events; the page lets a visitor pick one and watch it travel
 * through the three stages.
 *
 * In Agent features mode it explains the bot swarm agents instead: a visitor
 * picks a family, then an agent, and sees what it does, its features and
 * what it saves. Nothing about the agents is typed here; the website reads
 * them from the agents themselves (microApps).
 *
 * It also had up to three static step cards below the demo; the field was
 * removed on 24 Oct 2026. A page saved before then keeps its cards in the
 * database, unused, until it is next saved.
 */
export const AgenticFlowDemo: Block = {
  slug: 'agenticFlowDemo',
  interfaceName: 'AgenticFlowDemoBlock',
  labels: { singular: 'Agentic Flow Demo', plural: 'Agentic Flow Demos' },
  fields: [
    { name: 'heading', type: 'text', label: 'Heading', required: true, maxLength: 140 },
    { name: 'intro', type: 'textarea', label: 'Intro', maxLength: 600 },
    {
      name: 'mode',
      type: 'select',
      label: 'Mode',
      required: true,
      defaultValue: 'flow',
      options: [
        { label: 'Flow', value: 'flow' },
        { label: 'Agent features', value: 'agentFeatures' },
      ],
      admin: {
        description:
          'Flow walks an event through trigger, route and resolve. Agent features shows what each bot swarm agent does, read from the agents.',
      },
    },
    {
      // Only in Agent features mode. Hidden fields are not validated, so the
      // Events list may stay empty there.
      name: 'families',
      type: 'relationship',
      label: 'Families (optional)',
      relationTo: 'lists',
      hasMany: true,
      filterOptions: { type: { equals: 'agentFamily' } },
      admin: {
        condition: isAgentFeatures,
        sortOptions: 'order',
        description: 'The families to offer, in this order. Leave empty for every family, by their order.',
      },
    },
    {
      name: 'pickFamilyLabel',
      type: 'text',
      label: 'Family buttons label',
      maxLength: 40,
      defaultValue: 'Pick a family',
      admin: { condition: isAgentFeatures },
    },
    {
      name: 'pickAgentLabel',
      type: 'text',
      label: 'Agent buttons label',
      maxLength: 40,
      defaultValue: 'Agents',
      admin: { condition: isAgentFeatures },
    },
    {
      name: 'events',
      type: 'array',
      label: 'Events',
      minRows: 1,
      maxRows: 4,
      admin: {
        condition: isFlow,
        initCollapsed: true,
        description: 'Each event is one button a visitor can pick. The first one is shown on load.',
      },
      fields: [
        { name: 'label', type: 'text', label: 'Button label', required: true, maxLength: 40 },
        { name: 'triggerTitle', type: 'text', label: 'Trigger title', required: true, maxLength: 60 },
        { name: 'triggerText', type: 'text', label: 'Trigger text', required: true, maxLength: 140 },
        { name: 'routeText', type: 'text', label: 'Route text', required: true, maxLength: 180 },
        {
          name: 'handlers',
          type: 'select',
          label: 'Who handles it',
          hasMany: true,
          options: [
            { label: 'Virtual agent', value: 'agent' },
            { label: 'Human team', value: 'human' },
          ],
          defaultValue: ['agent'],
        },
        { name: 'resolveTitle', type: 'text', label: 'Resolve title', required: true, maxLength: 60 },
        { name: 'resolveText', type: 'text', label: 'Resolve text', required: true, maxLength: 180 },
      ],
    },
    {
      name: 'footnote',
      type: 'text',
      label: 'Note under the demo',
      maxLength: 120,
      defaultValue: 'Illustrative run, not live data.',
      admin: { condition: isFlow },
    },
  ],
}
