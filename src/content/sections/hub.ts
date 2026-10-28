import type { Field, FilterOptions, RelationshipField } from 'payload'

import { countedText } from '../../fields/counted'
import { motionFields } from '../../fields/motion'
import { optionalCta } from '../../fields/optionalCta'
import { iconField } from '../../fields/icons'
import { contentSlugs } from '../registry'
import { defineSection } from './defineSection'

/**
 * Sections for a hub page's own layout (foundation.md section 6.1). They
 * hold their own copy, unlike entry sections, which read the entry. Never
 * offered in an entry's layout. {name} in a heading is the hub's name.
 */

/** Entries of the hub's own collection: only the one in forCollection is offered. */
const onlyHubCollection: FilterOptions = ({ relationTo, data }) => relationTo === data?.forCollection

export const hubEntries = (
  name: string,
  label: string,
  opts: { description?: string; one?: boolean; admin?: RelationshipField['admin'] } = {},
): RelationshipField => {
  const admin = { description: opts.description, ...opts.admin } as RelationshipField['admin']
  const relationTo = contentSlugs()
  // Payload's polymorphic relationship types do not narrow on hasMany; the shape is valid.
  return { name, label, type: 'relationship', relationTo, hasMany: !opts.one, filterOptions: onlyHubCollection, admin } as RelationshipField
}

/**
 * The optional lines around a hub section's heading: a small eyebrow above
 * it and an intro under it. A function, so every section gets its own copy.
 */
const headCopy = (): Field[] => [
  countedText({ name: 'eyebrow', label: 'Eyebrow (optional)', maxLength: 60, description: 'The small line above the heading.' }),
  countedText({ name: 'intro', label: 'Intro (optional)', textarea: true, maxLength: 200, description: 'One or two sentences under the heading.' }),
]

const withWidth = <T extends { admin?: object }>(field: T, width: string): T => ({
  ...field,
  admin: { ...field.admin, width },
})

const step = (name: string, label: string): Field => ({
  name,
  type: 'group',
  label,
  fields: [
    {
      type: 'row',
      fields: [
        withWidth(countedText({ name: 'title', label: 'Title', maxLength: 30 }), '30%'),
        withWidth(countedText({ name: 'line', label: 'Line', maxLength: 140 }), '70%'),
      ],
    },
  ],
})

export const hubIntroSection = defineSection({
  key: 'hubIntro',
  label: 'Intro',
  reads: [],
  requiredWhenOn: [],
  headingDefault: 'What {name} is',
  fields: [countedText({ name: 'line', label: 'Line', textarea: true, maxLength: 300 })],
})

export const hubStepsSection = defineSection({
  key: 'hubSteps',
  label: 'Five steps',
  reads: [],
  requiredWhenOn: [],
  headingDefault: 'How it works',
  fields: [
    ...headCopy(),
    step('hears', 'Hears'),
    step('checks', 'Checks'),
    step('acts', 'Acts'),
    step('handsOver', 'Hands over'),
    step('records', 'Records'),
    optionalCta('cta', 'Button under the steps (optional)'),
    motionFields({ autoplay: true, speed: true }),
  ],
})

export const hubLayersSection = defineSection({
  key: 'hubLayers',
  label: 'Layers',
  reads: [],
  requiredWhenOn: [],
  headingDefault: 'What sits underneath',
  fields: () => [
    ...headCopy(),
    {
      name: 'display',
      type: 'select',
      label: 'Display',
      defaultValue: 'list',
      options: [
        { label: 'List (today\'s look)', value: 'list' },
        { label: '3D stack', value: 'stack' },
      ],
      admin: { description: 'A 3D stack of slabs beside the row cards, instead of the plain list.' },
    },
    {
      name: 'layers',
      type: 'array',
      labels: { singular: 'Layer', plural: 'Layers' },
      maxRows: 4,
      fields: [
        countedText({ name: 'title', label: 'Title', maxLength: 60, required: true }),
        countedText({ name: 'line', label: 'Line', textarea: true, maxLength: 240 }),
        {
          name: 'link',
          type: 'relationship',
          label: 'Links to (optional)',
          relationTo: [...contentSlugs(), 'pages'],
          admin: { description: 'An entry in any content collection, or a page.' },
        },
      ],
    },
    motionFields({ autoplay: true, speed: true }),
  ],
})

export const hubWorksWithSection = defineSection({
  key: 'hubWorksWith',
  label: 'Works with',
  reads: [],
  requiredWhenOn: [],
  headingDefault: 'Works with',
  fields: [
    ...headCopy(),
    {
      name: 'populateBy',
      type: 'select',
      label: 'Show',
      defaultValue: 'fromEntries',
      options: [
        { label: "Integrations linked from this hub's live entries", value: 'fromEntries' },
        { label: 'Hand-picked integrations', value: 'selection' },
      ],
    },
    {
      name: 'selectedDocs',
      type: 'relationship',
      label: 'Integrations',
      relationTo: 'integrations',
      hasMany: true,
      admin: {
        condition: (_, siblingData) => siblingData?.populateBy === 'selection',
        sortOptions: 'order',
      },
    },
  ],
})

export const hubIndustriesSection = defineSection({
  key: 'hubIndustries',
  label: 'By industry',
  reads: [],
  requiredWhenOn: [],
  headingDefault: 'By industry',
  fields: () => [
    ...headCopy(),
    {
      name: 'industries',
      type: 'array',
      labels: { singular: 'Industry', plural: 'Industries' },
      maxRows: 6,
      fields: [
        countedText({ name: 'vertical', label: 'Vertical (tab label)', maxLength: 40, required: true }),
        countedText({ name: 'eyebrow', label: 'Eyebrow (optional)', maxLength: 60 }),
        countedText({ name: 'heading', label: 'Heading', maxLength: 70 }),
        countedText({ name: 'problem', label: 'Problem', textarea: true, maxLength: 200 }),
        hubEntries('entries', 'Entries', { description: 'The entries that solve it, in order.' }),
        countedText({ name: 'outcome', label: 'Outcome', maxLength: 140 }),
      ],
    },
  ],
})

export const hubTrustSection = defineSection({
  key: 'hubTrust',
  label: 'Trust',
  reads: [],
  requiredWhenOn: [],
  headingDefault: 'What you stay in control of',
  fields: [
    ...headCopy(),
    {
      name: 'cards',
      type: 'array',
      labels: { singular: 'Card', plural: 'Cards' },
      minRows: 3,
      maxRows: 4,
      admin: { description: '3 to 4 cards.' },
      fields: [
        countedText({ name: 'title', label: 'Title', maxLength: 40, required: true }),
        countedText({ name: 'line', label: 'Line', textarea: true, maxLength: 160 }),
        iconField(undefined, { description: 'From the shared icon library.' }),
      ],
    },
    motionFields(),
  ],
})

export const hubArticlesSection = defineSection({
  key: 'hubArticles',
  label: 'Articles',
  reads: [],
  requiredWhenOn: [],
  headingDefault: 'Read the latest',
  fields: [
    ...headCopy(),
    {
      name: 'populateBy',
      type: 'select',
      label: 'Show',
      defaultValue: 'category',
      options: [
        { label: 'Latest posts, by category', value: 'category' },
        { label: 'Hand-picked posts', value: 'selection' },
      ],
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: {
        condition: (_, siblingData) => siblingData?.populateBy !== 'selection',
        description: 'Leave empty for the latest posts from every category.',
      },
    },
    {
      name: 'selectedDocs',
      type: 'relationship',
      label: 'Posts',
      relationTo: 'posts',
      hasMany: true,
      admin: { condition: (_, siblingData) => siblingData?.populateBy === 'selection' },
    },
    {
      name: 'limit',
      type: 'number',
      defaultValue: 3,
      min: 1,
      max: 6,
      admin: { condition: (_, siblingData) => siblingData?.populateBy !== 'selection' },
    },
  ],
})

/**
 * Where the hub's grouping sections go (the Grouping sections tab). A hub
 * without it shows them right after the hero, as before it existed.
 */
export const hubGroupingsSection = defineSection({
  key: 'hubGroupings',
  label: 'Grouping sections',
  reads: [],
  requiredWhenOn: [],
  headingDefault: '',
  placement: true,
})

export const HUB_SECTION_KEYS = [
  'hubGroupings',
  'hubIntro',
  'hubSteps',
  'hubLayers',
  'hubWorksWith',
  'hubIndustries',
  'hubTrust',
  'hubArticles',
] as const
