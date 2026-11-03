import type { Block } from 'payload'

import { heroCustomVisualFields } from '../HeroCustom/config'

/**
 * A section drawn entirely by the editor's own HTML and CSS, under an
 * optional eyebrow, heading and intro. The visual fields are the Hero (custom
 * CSS) ones, as they are: the same checks on save (htmlProblems and
 * cssProblems, HeroCustom/visualRules.ts), the same preview, description,
 * shape and widest size, and the same sealed box on the website.
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
      type: 'collapsible',
      label: 'Visual',
      admin: { initCollapsed: false },
      fields: heroCustomVisualFields,
    },
  ],
}
