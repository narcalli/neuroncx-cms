import type { ArrayFieldValidation, Block, Condition, Field } from 'payload'
import { array } from 'payload/shared'

import { iconField } from '@/fields/icons'

import { heroCustomVisualFields } from '../HeroCustom/config'
import { productSuite2CardFields } from '../ProductSuite2/config'
import {
  anchorGuide,
  CUSTOM_VISUAL_LAYOUTS,
  type CustomVisualLayout,
  DEFAULT_CUSTOM_VISUAL_LAYOUT,
  spokeCount,
} from './layouts'

const hasHub: Condition = (_data, siblingData) =>
  (siblingData?.layout ?? DEFAULT_CUSTOM_VISUAL_LAYOUT) !== 'none'

const SEALED_BOX =
  "This renders in a sealed box: none of the page's card, button or type styles reach in, only the site's color and font variables. Use it only for the hub shape, connector lines and motion matching the anchor points listed under Layout above. Card content goes in the Cards field, not here."

/**
 * The Hero (custom CSS) visual fields, as they are: the same checks on save
 * (htmlProblems and cssProblems, HeroCustom/visualRules.ts), the same preview,
 * description, shape and widest size. Only the guidance on the HTML and CSS
 * boxes changes, to say what this block's visual is for.
 */
const visualFields: Field[] = heroCustomVisualFields.map((f) =>
  'name' in f && (f.name === 'visualHtml' || f.name === 'visualCss')
    ? ({ ...f, admin: { ...f.admin, description: SEALED_BOX } } as Field)
    : f,
)

/** In the admin an array's value may be its row count; on the server it is the rows. */
const rowCount = (value: unknown, sibling: unknown): number =>
  typeof value === 'number'
    ? value
    : Array.isArray(value)
      ? value.length
      : Array.isArray(sibling)
        ? sibling.length
        : 0

/**
 * A hub layout needs one card per spoke; None takes any number up to four.
 * A custom validate replaces Payload's own, so the standard array check
 * (fewest and most rows) runs first.
 */
export const validateCardCount: ArrayFieldValidation = (value, options) => {
  const base = array(value, options)
  if (base !== true) return base
  const siblingData = options.siblingData as { layout?: unknown; cards?: unknown }
  const layout = (siblingData?.layout ?? DEFAULT_CUSTOM_VISUAL_LAYOUT) as CustomVisualLayout
  const want = spokeCount(layout)
  const have = rowCount(value, siblingData?.cards)
  if (want === null || have === want) return true
  return `${CUSTOM_VISUAL_LAYOUTS[layout].label} needs exactly ${want} cards, one for each spoke. There ${have === 1 ? 'is' : 'are'} ${have}.`
}

/**
 * A diagram that repeats across pages: a hub, up to four cards around it and
 * the editor's own HTML and CSS for the hub shape, the connector lines and
 * the motion. The cards are the site's real cards (the Product Suite 2 card
 * fields, drawn with the shared card on the website), placed on the layout's
 * anchor points (layouts.ts); only the connector visual is free, drawn in a
 * sealed box like the Hero (custom CSS) visual.
 */
export const CustomVisual: Block = {
  slug: 'customVisual',
  interfaceName: 'CustomVisualBlock',
  labels: { singular: 'Custom Visual (HTML/CSS)', plural: 'Custom Visuals (HTML/CSS)' },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      label: 'Small label above the heading (optional)',
      maxLength: 60,
    },
    {
      name: 'heading',
      type: 'text',
      label: 'Heading (optional)',
      maxLength: 140,
    },
    {
      name: 'intro',
      type: 'textarea',
      label: 'Intro (optional)',
      maxLength: 300,
    },
    {
      name: 'layout',
      type: 'select',
      label: 'Layout',
      required: true,
      defaultValue: DEFAULT_CUSTOM_VISUAL_LAYOUT,
      options: (Object.keys(CUSTOM_VISUAL_LAYOUTS) as CustomVisualLayout[]).map((value) => ({
        label: CUSTOM_VISUAL_LAYOUTS[value].label,
        value,
      })),
      admin: { description: anchorGuide() },
    },
    {
      name: 'hub',
      type: 'group',
      label: 'Hub',
      admin: { condition: hasHub },
      fields: [
        iconField(),
        {
          type: 'row',
          fields: [
            { name: 'label', type: 'text', label: 'Label', maxLength: 40, admin: { width: '50%' } },
            {
              name: 'caption',
              type: 'text',
              label: 'Caption (one short line under the label)',
              maxLength: 60,
              admin: { width: '50%' },
            },
          ],
        },
      ],
    },
    {
      name: 'cards',
      type: 'array',
      label: 'Cards',
      minRows: 0,
      maxRows: 4,
      admin: {
        initCollapsed: true,
        description:
          'One card for each spoke of the layout, in the order the Layout guidance numbers them.',
      },
      validate: validateCardCount,
      fields: productSuite2CardFields(),
    },
    {
      type: 'collapsible',
      label: 'Visual (hub shape, connector lines and motion)',
      admin: { initCollapsed: false },
      fields: visualFields,
    },
  ],
}
