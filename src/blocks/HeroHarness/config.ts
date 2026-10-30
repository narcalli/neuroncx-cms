import type { ArrayField, Block, Field, TextField } from 'payload'

import { motionFields } from '@/fields/motion'
import { optionalCta } from '@/fields/optionalCta'

import { chipsFit, CUSTOMER_360_CHIPS, loopFits, ONTOLOGY_CHIPS } from './fit'

/**
 * Hero (harness loop): the home page hero from the approved design
 * (neuroncx-website docs/reference/harness-hero-demo.html). The title (the
 * page's H1) and description sit above everything, in one of three text
 * layouts. Below them, cards on the left act as tabs for a drawing of the
 * harness on the right: selecting a card lights up its parts, and dots run
 * the loop from a customer event to Customer 360 and back.
 *
 * Pages only for now: not offered as the hero of a content entry's own page,
 * since the entry page does not draw it yet. To offer it, add 'heroHarness'
 * to LAYOUT_HERO_BLOCKS in src/content/sections/siteBlocks.ts and to the
 * website's entry page list at the same time.
 */

const HEADLINE_DEFAULT = 'An agentic rethink of CRM,\nmarketing automation and omnichannel CX.'

const INTRO_DEFAULT =
  'NeuronCx is a captive AI harness that goes beyond SaaS silos, built for customer acquisition, engagement and retention. It is grounded in your enterprise ontology, so agents act on your own locations, services and rules, and hand over to your team when a person is needed. Your data layer and custom workflows run in your own cloud and change at your own pace.'

const SCREEN_READER_DEFAULT =
  'A diagram of the NeuronCx harness: customer events flow into orchestrated agents that work from your ontology, policies and guardrails, act or hand over to your team, write to Customer 360, and learn from each outcome. The agents run in your own cloud (BYOC).'

/** What each Motion switch does in this block, in place of the shared wording. */
const MOTION_HELP: Record<string, string> = {
  motion: 'How much this hero moves. Reduced keeps the card highlights but stops the dots. Off shows a still drawing.',
  autoplay: 'Moves through the cards on its own, one after another. It pauses while a visitor points at or tabs into the hero, and stops once they click a card.',
  loop: 'Keeps the dots running around the drawing while it is on screen. Off runs the loop once.',
  speed: 'How fast the dots travel around the drawing.',
}

/** The shared Motion panel (autoplay, loop and speed), with help written for this block. */
const motionPanel = (): Field => {
  const panel = motionFields({ autoplay: true, loop: true, speed: true }) as Extract<Field, { type: 'collapsible' }>
  return {
    ...panel,
    fields: panel.fields.map((f) =>
      'name' in f && MOTION_HELP[f.name] ? ({ ...f, admin: { ...f.admin, description: MOTION_HELP[f.name] } } as Field) : f,
    ),
  }
}

/** What each button field does, added to the shared link fields. */
const BUTTON_HELP: Record<string, string> = {
  type: 'Link to a page or post on this site, or type any address.',
  newTab: 'Opens the link in a new browser tab.',
  reference: 'The page or post the button opens.',
  url: 'The address the button opens, such as /contact.',
  label: 'The words on the button. Empty hides the button.',
}

const withHelp = (fields: Field[], help: Record<string, string>): Field[] =>
  fields.map((f) => {
    if (f.type === 'row') return { ...f, fields: withHelp(f.fields, help) }
    return 'name' in f && help[f.name] ? ({ ...f, admin: { ...f.admin, description: help[f.name] } } as Field) : f
  })

/** Up to two buttons under the intro, with the same link fields as the Hero (custom CSS) buttons. */
const buttons: ArrayField = {
  name: 'buttons',
  type: 'array',
  label: 'Buttons',
  labels: { singular: 'Button', plural: 'Buttons' },
  maxRows: 2,
  admin: {
    initCollapsed: true,
    description: 'Optional, up to 2, shown under the intro. The first is the main red button, the second a plain one. Empty shows no buttons.',
  },
  fields: withHelp(optionalCta('button', 'Button').fields, BUTTON_HELP),
}

/** The parts of the drawing a card can light up. The website names them in the caption. */
export const HARNESS_PARTS = [
  { label: 'Customer event', value: 'trigger' },
  { label: 'BYOC box (your own cloud)', value: 'boundary' },
  { label: 'Enterprise ontology', value: 'ontology' },
  { label: 'Policy framework', value: 'policy' },
  { label: 'Guardrails', value: 'guardrails' },
  { label: 'Orchestration', value: 'orchestration' },
  { label: 'Agent actions', value: 'actions' },
  { label: 'Team steps in', value: 'handover' },
  { label: 'Customer 360', value: 'customer360' },
  { label: 'Learning loop', value: 'loop' },
] as const

type Part = (typeof HARNESS_PARTS)[number]['value']

const card = (title: string, highlights: Part[], body: string) => ({ title, highlights, body })

export const CARD_DEFAULTS = [
  card(
    'Grounded in your enterprise ontology',
    ['ontology'],
    'Agents read your locations, services, prices and rules from one shared model of your business, so every action matches how you actually work.',
  ),
  card(
    'Orchestrated agents that act on their own',
    ['orchestration', 'actions'],
    'Orchestration routes each customer event to the right agent, which qualifies, books, collects payment, follows up or runs a campaign.',
  ),
  card(
    'Guardrails and a policy framework you set',
    ['guardrails', 'policy', 'handover'],
    'Every action passes your guardrails and policies first. Cases outside them go to your team with the full context.',
  ),
  card(
    'One Customer 360 record',
    ['customer360'],
    'Each step writes back to one customer record, so profile, history and the next step stay current for every agent and team member.',
  ),
  card(
    'Your own cloud, beyond SaaS',
    ['boundary'],
    'The data layer, agents and custom workflows run inside your own cloud account instead of a shared SaaS tenant.',
  ),
  card(
    'Improves at your own pace',
    ['loop'],
    'Outcomes feed back into your ontology and policies, so the harness gets better each cycle, on a schedule your team controls.',
  ),
]

const cards: ArrayField = {
  name: 'cards',
  type: 'array',
  label: 'Cards',
  labels: { singular: 'Card', plural: 'Cards' },
  minRows: 3,
  maxRows: 6,
  required: true,
  defaultValue: CARD_DEFAULTS,
  admin: {
    initCollapsed: true,
    description:
      '3 to 6 cards beside the drawing. Each one works like a tab: selecting it lights up its parts of the drawing and shows its explanation under the drawing.',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Title',
      required: true,
      maxLength: 60,
      admin: { description: 'The only text on the card. 60 characters keeps it to two lines.' },
    },
    {
      name: 'body',
      type: 'textarea',
      label: 'Explanation',
      maxLength: 160,
      admin: { description: 'Shown under the drawing while this card is selected. 160 characters keeps the caption to two lines.' },
    },
    {
      name: 'highlights',
      type: 'select',
      label: 'Lights up',
      hasMany: true,
      required: true,
      options: [...HARNESS_PARTS],
      admin: {
        description:
          'The parts of the drawing this card lights up in red; the rest fade. The BYOC box lights the dashed box and keeps everything inside it at full strength.',
      },
    },
  ],
}

/** A text label in the drawing. */
const label = (name: string, title: string, defaultValue: string, maxLength: number, description: string): TextField => ({
  name,
  type: 'text',
  label: title,
  required: true,
  maxLength,
  defaultValue,
  admin: { description },
})

/** A list of short labels in the drawing, one per row. */
const labelList = (
  name: string,
  title: string,
  defaults: string[],
  rows: { min?: number; max: number },
  maxLength: number,
  description: string,
  fits?: (labels: string[]) => true | string,
): ArrayField => ({
  name,
  type: 'array',
  label: title,
  labels: { singular: 'Label', plural: 'Labels' },
  ...(rows.min ? { minRows: rows.min, required: true } : {}),
  maxRows: rows.max,
  defaultValue: defaults.map((l) => ({ label: l })),
  admin: { description },
  ...(fits
    ? {
        validate: (value: unknown) => {
          const labels = (Array.isArray(value) ? value : [])
            .map((r: { label?: unknown }) => String(r?.label ?? '').trim())
            .filter(Boolean)
          return fits(labels)
        },
      }
    : {}),
  fields: [
    {
      name: 'label',
      type: 'text',
      label: 'Label',
      required: true,
      maxLength,
      admin: { description: `Up to ${maxLength} characters, so it fits its place in the drawing.` },
    },
  ],
})

const drawingFields: Field[] = [
  {
    type: 'collapsible',
    label: 'Customer event',
    admin: { description: 'The card on the left of the drawing (at the top on phones), outside the dashed box.' },
    fields: [
      label('triggerLabel', 'Heading', 'Customer event', 15, 'The small heading on the event card. 15 characters keeps it inside the card.'),
      labelList(
        'triggerEvents',
        'Events',
        ['New enquiry', 'Payment due', 'Follow-up due'],
        { min: 1, max: 4 },
        14,
        'The events the card shows, one at a time as the loop runs. 1 to 4; 14 characters each keeps them inside the card.',
      ),
    ],
  },
  {
    type: 'collapsible',
    label: 'Inside the dashed box',
    admin: { description: "Everything that runs in the customer's own cloud." },
    fields: [
      label(
        'boundaryLabel',
        'Box label',
        'BYOC',
        24,
        'The small label in the top corner of the dashed box. 24 characters keeps it clear of the boxes below it.',
      ),
      label(
        'ontologyLabel',
        'Ontology heading',
        'Enterprise ontology',
        20,
        'The heading of the ontology box. 20 characters keeps it on one line in the narrow phone drawing.',
      ),
      labelList(
        'ontologyItems',
        'Ontology chips',
        ['Locations', 'Services', 'Rules and terms'],
        { max: 3 },
        18,
        'Up to 3 small chips in the ontology box. They wrap onto two rows at most; the box has no room for a third.',
        (labels) =>
          chipsFit(labels, ONTOLOGY_CHIPS.landscape) && chipsFit(labels, ONTOLOGY_CHIPS.portrait)
            ? true
            : 'These chips need more than two rows in the ontology box on phones. Shorten one or remove one.',
      ),
      label('policyLabel', 'Policy heading', 'Policy framework', 18, 'The heading of the policy box. 18 characters keeps it on one line in both layouts.'),
      label('policySub', 'Policy line', 'Set by your team', 20, 'The small line under the policy heading. 20 characters keeps it inside the box.'),
      label(
        'orchestrationLabel',
        'Orchestration heading',
        'Orchestration',
        16,
        'The large text in the navy box at the centre. 16 characters keeps it inside the box.',
      ),
      label(
        'orchestrationSubLabel',
        'Orchestration line',
        'Agents',
        18,
        'The small capitals under the orchestration heading. 18 characters keeps it inside the box.',
      ),
      label(
        'guardrailsLabel',
        'Guardrails label',
        'Guardrails',
        12,
        'The small label above the gate every action passes. 12 characters keeps it clear of the lines beside it.',
      ),
      labelList(
        'actions',
        'Agent actions',
        ['Qualify', 'Book and pay', 'Follow up', 'Campaigns'],
        { min: 2, max: 5 },
        16,
        'What the agents do, one box each, after the guardrails. 2 to 5; 16 characters each keeps them inside their boxes.',
      ),
      label('handoverLabel', 'Hand-over box', 'Team steps in', 16, 'The box for cases your team takes over. 16 characters keeps it inside the box.'),
    ],
  },
  {
    type: 'collapsible',
    label: 'Below the box',
    admin: { description: 'The customer record and the learning loop, outside the dashed box.' },
    fields: [
      label(
        'customer360Label',
        'Customer 360 heading',
        'Customer 360',
        16,
        'The heading of the record box. 16 characters keeps it clear of the chips beside it.',
      ),
      labelList(
        'customer360Fields',
        'Customer 360 chips',
        ['Profile', 'History', 'Next step', 'Care gaps'],
        { max: 4 },
        12,
        'Up to 4 chips in the record box, on one row. Together they must fit the narrow phone drawing.',
        (labels) =>
          chipsFit(labels, CUSTOMER_360_CHIPS.landscape) && chipsFit(labels, CUSTOMER_360_CHIPS.portrait)
            ? true
            : 'These chips do not fit on one row in the record box on phones. Shorten one or remove one.',
      ),
      {
        ...label(
          'loopLabel',
          'Loop label',
          'Learns from every outcome',
          34,
          'The label on the loop back into the box. On wide screens it splits into two lines beside the drawing, so each half must stay short.',
        ),
        validate: (value: unknown) =>
          typeof value !== 'string' || !value.trim()
            ? 'Type a loop label.'
            : loopFits(value)
              ? true
              : 'Each half of this label is too long for its two lines beside the drawing. Use shorter words.',
      },
    ],
  },
  {
    type: 'collapsible',
    label: 'Names in the caption',
    admin: {
      description:
        'The caption under the drawing names the parts the selected card lights up. Most parts use their label above; these two have none of their own.',
    },
    fields: [
      label(
        'actionsName',
        'Name for the actions',
        'Agent actions',
        24,
        'How the caption names the action boxes when a card lights them. 24 characters keeps the tag on one line.',
      ),
      label(
        'loopName',
        'Name for the loop',
        'Learning loop',
        24,
        'How the caption names the loop back into the box when a card lights it. 24 characters keeps the tag on one line.',
      ),
    ],
  },
]

export const HeroHarness: Block = {
  slug: 'heroHarness',
  interfaceName: 'HeroHarnessBlock',
  labels: { singular: 'Hero (harness loop)', plural: 'Heroes (harness loop)' },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Text',
          fields: [
            {
              name: 'textLayout',
              type: 'select',
              label: 'Text layout',
              required: true,
              defaultValue: 'stack',
              options: [
                { label: 'Stacked: title, then the intro', value: 'stack' },
                { label: 'Grid: the intro lines up with the drawing', value: 'grid' },
                { label: 'Stacked, with a small label above the title', value: 'stackWithLabel' },
              ],
              admin: {
                description:
                  'How the title and intro sit above the cards and drawing. All three are left aligned. Stacked is the approved home page layout; grid starts the intro where the drawing starts.',
              },
            },
            {
              name: 'eyebrow',
              type: 'text',
              label: 'Small label above the title',
              maxLength: 40,
              defaultValue: 'Agentic CRM and CX platform',
              admin: {
                condition: (_, siblingData) => siblingData?.textLayout === 'stackWithLabel',
                description: 'The short line above the title, with a red dot. Shown only with the "Stacked, with a small label" layout.',
              },
            },
            {
              name: 'headline',
              type: 'textarea',
              label: 'Title',
              required: true,
              maxLength: 100,
              defaultValue: HEADLINE_DEFAULT,
              admin: {
                rows: 2,
                description:
                  "The page's main heading (the H1), so use this hero once per page. Press Enter where the line should break on laptops and desktops; phones ignore the break and wrap on their own.",
              },
            },
            {
              name: 'intro',
              type: 'textarea',
              label: 'Intro',
              required: true,
              maxLength: 420,
              defaultValue: INTRO_DEFAULT,
              admin: {
                rows: 5,
                description: 'One paragraph under the title. Line breaks are joined into one paragraph on the page.',
              },
            },
            buttons,
          ],
        },
        {
          label: 'Cards',
          fields: [
            {
              name: 'cardsPosition',
              type: 'select',
              label: 'Cards position',
              required: true,
              defaultValue: 'left',
              options: [
                { label: 'Left of the drawing', value: 'left' },
                { label: 'Above the drawing', value: 'above' },
              ],
              admin: {
                description:
                  'Where the cards sit on laptops and desktops. On phones they always sit below the drawing, in a row that scrolls sideways.',
              },
            },
            cards,
          ],
        },
        {
          label: 'Drawing',
          description: 'Every word in the drawing. The parts and lines stay as they are; only the words change.',
          fields: drawingFields,
        },
        {
          label: 'Style',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'headingSize',
                  type: 'number',
                  label: 'Title size (px)',
                  required: true,
                  defaultValue: 44,
                  min: 32,
                  max: 56,
                  admin: {
                    step: 1,
                    width: '50%',
                    description: 'The title size on large screens. It shrinks with the screen, down to 28px on phones.',
                  },
                },
                {
                  name: 'spacing',
                  type: 'select',
                  label: 'Spacing',
                  required: true,
                  defaultValue: 'roomy',
                  options: [
                    { label: 'Roomy', value: 'roomy' },
                    { label: 'Compact', value: 'compact' },
                  ],
                  admin: {
                    width: '50%',
                    description: 'The space above the title, between the title and intro, and above the cards and drawing. Compact brings more of the drawing above the fold.',
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'introWidth',
                  type: 'number',
                  label: 'Intro width (px)',
                  required: true,
                  defaultValue: 720,
                  min: 560,
                  max: 900,
                  admin: {
                    step: 10,
                    width: '50%',
                    condition: (_, siblingData) => siblingData?.textLayout !== 'grid',
                    description: 'The widest the intro gets in the two stacked layouts. In the grid layout it stops at 760px.',
                  },
                },
                {
                  name: 'background',
                  type: 'select',
                  label: 'Background',
                  required: true,
                  defaultValue: 'cloud',
                  options: [
                    { label: 'Pale grey', value: 'cloud' },
                    { label: 'White', value: 'white' },
                  ],
                  admin: { width: '50%', description: 'The colour behind the whole hero.' },
                },
              ],
            },
          ],
        },
        {
          label: 'Behaviour',
          fields: [
            motionPanel(),
            {
              name: 'autoplaySeconds',
              type: 'number',
              label: 'Seconds per card',
              required: true,
              defaultValue: 6,
              min: 4,
              max: 12,
              admin: {
                step: 1,
                description: 'How long each card stays selected while the hero moves through them on its own.',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'showStatus',
                  type: 'checkbox',
                  label: 'Show the live status line',
                  defaultValue: true,
                  admin: { width: '50%', description: 'The short line on the drawing that names each step as the dots move.' },
                },
                {
                  name: 'showCaption',
                  type: 'checkbox',
                  label: 'Show the caption',
                  defaultValue: true,
                  admin: { width: '50%', description: "The selected card's explanation and the names of the lit parts, under the drawing." },
                },
              ],
            },
            {
              name: 'screenReaderDescription',
              type: 'text',
              label: 'Drawing description for screen readers',
              maxLength: 400,
              defaultValue: SCREEN_READER_DEFAULT,
              admin: {
                description: 'Read out in place of the drawing by screen readers. Say what the drawing shows in a sentence or two.',
              },
            },
          ],
        },
      ],
    },
  ],
}
