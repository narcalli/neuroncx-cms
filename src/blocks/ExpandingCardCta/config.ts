import type { Block } from 'payload'

import { motionFields } from '../../fields/motion'
import { validateLinkUrl } from '../AudienceTabs/config'

/**
 * Closing call to action as a navy card that starts small on the light page
 * and opens out to full bleed, revealing a centred heading (one or two
 * lines), a description and one button. Navy by design: it counts as the
 * page's one Highlight (navy) block (collections/Pages/hooks/validateHighlight.ts,
 * fields/layout.ts navyProblem).
 */
export const ExpandingCardCta: Block = {
  slug: 'expandingCardCta',
  interfaceName: 'ExpandingCardCtaBlock',
  labels: { singular: 'Expanding Card CTA', plural: 'Expanding Card CTAs' },
  fields: [
    {
      name: 'headingLine1',
      type: 'text',
      label: 'Heading (first line)',
      required: true,
      maxLength: 48,
      admin: {
        description: 'First line of the heading. It is revealed on its own line, so break the sentence where it reads well.',
      },
    },
    {
      name: 'headingLine2',
      type: 'text',
      label: 'Heading (second line)',
      maxLength: 48,
      admin: { description: 'Second line. Leave empty for a one line heading.' },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
      maxLength: 260,
      admin: { description: 'Optional. One short paragraph under the heading. Leave empty to go straight from the heading to the button.' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'ctaLabel',
          type: 'text',
          label: 'Button text',
          required: true,
          maxLength: 28,
          admin: { width: '50%', description: 'The words on the button, such as Book a demo.' },
        },
        {
          name: 'ctaUrl',
          type: 'text',
          label: 'Button address',
          required: true,
          validate: validateLinkUrl,
          admin: {
            width: '50%',
            description: 'A page on this site such as /contact, a section on this page such as #pricing, or an address starting https://.',
          },
        },
      ],
    },
    {
      name: 'startShape',
      type: 'select',
      label: 'Start shape',
      required: true,
      defaultValue: 'square',
      options: [
        { label: 'Square', value: 'square' },
        { label: 'Tall square', value: 'portrait' },
        { label: 'Wide card', value: 'wide' },
      ],
      admin: { description: 'The shape of the closed card before it opens out. Ignored when motion is off.' },
    },
    motionFields(),
  ],
}
