import type { Block, Condition, Field, SelectField } from 'payload'

const isFlow: Condition = (_data, siblingData) => siblingData?.mode !== 'agentFeatures'
const isAgentFeatures: Condition = (_data, siblingData) => siblingData?.mode === 'agentFeatures'

/** Warns while a text ends with a pasted field label (pastedLabel.ts). */
const WARN = '@/fields/PastedLabelWarning/Component#PastedLabelWarning'

/**
 * The colour presets. Named, never free colours; the website maps each to a
 * brand colour (AgenticFlowDemo/design.ts in neuroncx-website).
 */
const ACCENT_OPTIONS = [
  { label: 'Crimson', value: 'crimson' },
  { label: 'Navy', value: 'navy' },
  { label: 'Teal', value: 'teal' },
  { label: 'Grey', value: 'grey' },
]

const accent = (name: string, label: string, defaultValue: string): SelectField => ({
  name,
  type: 'select',
  label,
  defaultValue,
  required: true,
  options: ACCENT_OPTIONS,
  admin: { width: '33%' },
})

const shortLabel = (name: string, label: string, defaultValue?: string): Field => ({
  name,
  type: 'text',
  label,
  maxLength: 20,
  ...(defaultValue ? { defaultValue } : {}),
  admin: { width: defaultValue ? '50%' : '33%' },
})

/** Flow mode: an optional link under the resolve card, to a page, an agent or a URL. */
const eventLink: Field = {
  name: 'link',
  type: 'group',
  label: 'Link under the resolve card (optional)',
  admin: { description: 'Shown only when it has both a text and somewhere to go.' },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'label', type: 'text', label: 'Link text', maxLength: 30, admin: { width: '50%' } },
        {
          name: 'type',
          type: 'radio',
          label: 'Goes to',
          defaultValue: 'reference',
          options: [
            { label: 'A page or an agent', value: 'reference' },
            { label: 'A URL', value: 'custom' },
          ],
          admin: { width: '50%', layout: 'horizontal' },
        },
      ],
    },
    {
      name: 'reference',
      type: 'relationship',
      label: 'Page or agent',
      relationTo: ['pages', 'microApps'],
      admin: {
        condition: (_, siblingData) => siblingData?.type !== 'custom',
        description: 'An agent links only once it has its own page.',
      },
    },
    { name: 'url', type: 'text', label: 'URL', admin: { condition: (_, siblingData) => siblingData?.type === 'custom' } },
    { name: 'newTab', type: 'checkbox', label: 'Open in a new tab' },
  ],
}

/**
 * The Design tab. Every option starts as the block looked before it existed,
 * so no page changes until an editor changes something. Where the starting
 * look differs by mode (the card eyebrows, the line), the field starts empty
 * and empty means "as this mode looks by default".
 */
const designTab: Field = {
  type: 'tabs',
  tabs: [
    {
      label: 'Design',
      description: 'How the block looks. Every option starts as the block looks today.',
      fields: [
        {
          type: 'collapsible',
          label: 'Labels',
          admin: { initCollapsed: true },
          fields: [
            {
              name: 'promptLabel',
              type: 'text',
              label: 'Line above the buttons',
              maxLength: 80,
              defaultValue: 'Pick an event and watch it travel through.',
              admin: { condition: isFlow, description: 'Empty hides it.' },
            },
            {
              name: 'stageLabels',
              type: 'group',
              label: 'Card eyebrows',
              admin: {
                description:
                  'Empty uses Trigger, Route and Resolve, or in Agent features mode What it does, Features and Saves to your systems.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [shortLabel('trigger', 'First card'), shortLabel('route', 'Second card'), shortLabel('resolve', 'Third card')],
                },
              ],
            },
            {
              name: 'handlerLabels',
              type: 'group',
              label: 'Handler tags',
              fields: [
                {
                  type: 'row',
                  fields: [shortLabel('agent', 'Virtual agent tag', 'Virtual agent'), shortLabel('human', 'Human team tag', 'Human team')],
                },
              ],
            },
            {
              name: 'showFootnote',
              type: 'checkbox',
              label: 'Show the note under the demo',
              defaultValue: true,
              admin: { condition: isFlow },
            },
          ],
        },
        {
          type: 'collapsible',
          label: 'Cards',
          admin: { initCollapsed: true },
          fields: [
            {
              name: 'accents',
              type: 'group',
              label: 'Card colours',
              admin: { description: "Each card's border, eyebrow and shadow." },
              fields: [
                {
                  type: 'row',
                  fields: [accent('card1', 'First card', 'crimson'), accent('card2', 'Second card', 'crimson'), accent('card3', 'Third card', 'teal')],
                },
              ],
            },
            { name: 'cardShadow', type: 'checkbox', label: 'Coloured shadow under the cards', defaultValue: true },
            { name: 'equalHeights', type: 'checkbox', label: 'Cards the same height', defaultValue: true },
          ],
        },
        {
          type: 'collapsible',
          label: 'Line',
          admin: { initCollapsed: true },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'lineStyle',
                  type: 'select',
                  label: 'Line between the cards',
                  options: [
                    { label: 'Animated', value: 'animated' },
                    { label: 'Still', value: 'static' },
                    { label: 'None', value: 'none' },
                  ],
                  admin: { width: '50%', description: 'Empty: animated in Flow mode, still in Agent features mode.' },
                },
                {
                  name: 'lineColor',
                  type: 'select',
                  label: 'Line colour',
                  options: [
                    { label: 'Grey', value: 'grey' },
                    { label: 'Crimson', value: 'crimson' },
                    { label: 'Navy', value: 'navy' },
                  ],
                  admin: { width: '50%', description: 'Empty: grey in Flow mode, crimson in Agent features mode.' },
                },
              ],
            },
          ],
        },
        {
          type: 'collapsible',
          label: 'Buttons',
          admin: { initCollapsed: true },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'selectedStyle',
                  type: 'select',
                  label: 'Selected button',
                  required: true,
                  defaultValue: 'solidCrimson',
                  options: [
                    { label: 'Solid crimson', value: 'solidCrimson' },
                    { label: 'Solid navy', value: 'solidNavy' },
                    { label: 'Outline', value: 'outline' },
                  ],
                  admin: { width: '50%' },
                },
                {
                  name: 'buttonSize',
                  type: 'select',
                  label: 'Button size',
                  required: true,
                  defaultValue: 'regular',
                  options: [
                    { label: 'Regular', value: 'regular' },
                    { label: 'Compact', value: 'compact' },
                  ],
                  admin: { width: '50%' },
                },
              ],
            },
          ],
        },
        {
          type: 'collapsible',
          label: 'Panel',
          admin: { initCollapsed: true },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'panelBackground',
                  type: 'select',
                  label: 'Panel background',
                  required: true,
                  defaultValue: 'cloud',
                  options: [
                    { label: 'Pale grey', value: 'cloud' },
                    { label: 'White', value: 'white' },
                    { label: 'None', value: 'none' },
                  ],
                  admin: { width: '50%' },
                },
                { name: 'panelBorder', type: 'checkbox', label: 'Border around the panel', defaultValue: true, admin: { width: '50%' } },
              ],
            },
          ],
        },
        {
          type: 'collapsible',
          label: 'Behaviour (Flow mode)',
          admin: { initCollapsed: true, condition: isFlow },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'autoplay',
                  type: 'select',
                  label: 'Play the events by themselves',
                  required: true,
                  defaultValue: 'off',
                  options: [
                    { label: 'Off', value: 'off' },
                    { label: 'Every 6 seconds', value: '6' },
                    { label: 'Every 8 seconds', value: '8' },
                    { label: 'Every 10 seconds', value: '10' },
                  ],
                  admin: {
                    width: '50%',
                    description: 'Stops for good once a visitor clicks a button. Never runs for visitors who ask for reduced motion.',
                  },
                },
                {
                  name: 'startEvent',
                  type: 'number',
                  label: 'Event shown first',
                  required: true,
                  defaultValue: 1,
                  min: 1,
                  max: 4,
                  admin: { width: '50%', step: 1, description: '1 is the first event. A number past the last event shows the first.' },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

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
        { name: 'routeText', type: 'text', label: 'Route text', required: true, maxLength: 180, admin: { components: { Description: WARN } } },
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
        { name: 'resolveText', type: 'text', label: 'Resolve text', required: true, maxLength: 180, admin: { components: { Description: WARN } } },
        eventLink,
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
    designTab,
  ],
}
