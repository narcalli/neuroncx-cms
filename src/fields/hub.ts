import type { Field, Tab, Validate } from 'payload'

import { iconField } from './icons'
import { link } from './link'
import { plainText } from './validators/plainText'

/**
 * Building blocks for hubs: the grouping collections a hub page is split
 * into (integration categories, agent families), and the master records
 * that hold a hub page's copy and the wording shared by its entry pages
 * (integrationsMaster, microAppsMaster).
 */

/**
 * Hub fields for a grouping collection (integration categories, agent
 * families): the section heading and intro on the hub page, an icon, and how
 * the group appears as a row in a WhatsApp list menu. `afterIntro` fields go
 * between the intro and the icon. Wording is the collection's own.
 */
export const hubFields = (opts: {
  hubHeading: string
  hubIntro: string
  icon: string
  waRowTitle: string
  waRowDescriptionAuto: string
  waRowDescription: string
  afterIntro?: Field[]
}): Field[] => [
  {
    name: 'hubHeading',
    type: 'text',
    label: 'Hub heading',
    maxLength: 60,
    admin: { description: opts.hubHeading },
  },
  {
    name: 'description',
    type: 'textarea',
    label: 'Hub intro',
    maxLength: 140,
    admin: { description: opts.hubIntro },
  },
  ...(opts.afterIntro || []),
  iconField(undefined, { description: opts.icon }),
  {
    name: 'waRowTitle',
    type: 'text',
    label: 'WhatsApp row title',
    maxLength: 24,
    validate: plainText,
    admin: { description: opts.waRowTitle },
  },
  {
    name: 'waRowDescriptionAuto',
    type: 'checkbox',
    label: 'Fill the WhatsApp row description automatically',
    defaultValue: false,
    admin: { description: opts.waRowDescriptionAuto },
  },
  {
    name: 'waRowDescription',
    type: 'text',
    label: 'WhatsApp row description',
    maxLength: 70,
    validate: plainText,
    admin: { description: opts.waRowDescription },
  },
]

/* ------------------------------------------------------------------ */
/* Master records                                                      */
/* ------------------------------------------------------------------ */

/** A link that appears, and is required, only once the sibling label or heading has text. */
export const linkShownWith = (sibling: string) =>
  link({
    appearances: false,
    disableLabel: true,
    overrides: {
      admin: { condition: (_: unknown, siblingData: any) => Boolean(siblingData?.[sibling]) },
    },
  })

/** An optional heading for a section. Left empty, the page shows the fallback. */
export const sectionHeading = (name: string, title: string, fallback: string, maxLength = 70): Field => ({
  name,
  type: 'text',
  label: title,
  maxLength,
  validate: plainText,
  admin: { placeholder: fallback, description: `Leave empty to show: ${fallback}` },
})

/** A heading label for entry pages, 70 characters, checked by `rule` (which placeholders it allows). */
export const pageLabel = (name: string, title: string, example: string, rule: Validate): Field => ({
  name,
  type: 'text',
  label: title,
  maxLength: 70,
  validate: rule,
  admin: { description: `For example: ${example}` },
})

/** Name, slug and Is main, for the sidebar of a master record. */
export const masterRecordFields = (opts: {
  name: string
  slug: { validate: Validate; description: string }
  isMain: string
}): Field[] => [
  {
    name: 'name',
    type: 'text',
    required: true,
    maxLength: 60,
    admin: { position: 'sidebar', description: opts.name },
  },
  {
    name: 'slug',
    type: 'text',
    required: true,
    unique: true,
    index: true,
    maxLength: 60,
    validate: opts.slug.validate,
    admin: { position: 'sidebar', description: opts.slug.description },
  },
  {
    name: 'isMain',
    type: 'checkbox',
    label: 'Is main',
    defaultValue: false,
    admin: { position: 'sidebar', description: opts.isMain },
  },
]

/** The Closing tab: the closing panel's heading and text, and the closing button. */
export const closingTab = (opts: { headingDescription: string }): Tab => ({
  label: 'Closing',
  fields: [
    {
      name: 'closing',
      type: 'group',
      label: false,
      fields: [
        {
          name: 'heading',
          type: 'text',
          maxLength: 70,
          admin: { description: opts.headingDescription },
        },
        {
          name: 'subheading',
          type: 'textarea',
          maxLength: 200,
          admin: { description: 'One or two sentences under the heading.' },
        },
      ],
    },
    {
      name: 'cta',
      type: 'group',
      label: 'Call to action',
      admin: { description: 'The closing button. Type a label to choose where it goes.' },
      fields: [{ name: 'label', type: 'text', maxLength: 30 }, linkShownWith('label')],
    },
  ],
})

/**
 * The WhatsApp tab of a master record: the messages around the hub's list
 * menu. Plain text, within the WhatsApp limits.
 */
export const masterWhatsappTab = (opts: {
  intro: string
  listButton: string
  fallback: string
}): Tab => ({
  label: 'WhatsApp',
  description: 'Plain text only. These limits are the ones WhatsApp enforces.',
  fields: [
    {
      name: 'waIntro',
      type: 'textarea',
      label: 'Intro message',
      maxLength: 1024,
      validate: plainText,
      admin: { description: opts.intro },
    },
    {
      name: 'waListButton',
      type: 'text',
      label: 'List button',
      maxLength: 20,
      validate: plainText,
      admin: { description: opts.listButton },
    },
    {
      name: 'waSectionTitle',
      type: 'text',
      label: 'Section title',
      maxLength: 24,
      validate: plainText,
      admin: { description: 'The heading above the rows in the list.' },
    },
    {
      name: 'waFallback',
      type: 'textarea',
      label: 'Fallback message',
      maxLength: 300,
      validate: plainText,
      admin: { description: opts.fallback },
    },
  ],
})
