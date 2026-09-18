import type { Block, Field } from 'payload'

/**
 * Presentation options available on every block.
 *
 * These are appended to each block automatically (see withPresentation below)
 * and applied by RenderBlocks when it wraps the block — so no block component
 * needs to know about them.
 */
export const presentationFields: Field[] = [
  {
    type: 'collapsible',
    label: 'Appearance',
    admin: { initCollapsed: true, description: 'Optional. Leave as-is for the default look.' },
    fields: [
      {
        type: 'row',
        fields: [
          {
            name: 'background',
            type: 'select',
            label: 'Background',
            defaultValue: 'default',
            options: [
              { label: 'Default (as designed)', value: 'default' },
              { label: 'White', value: 'white' },
              { label: 'Pale grey', value: 'cloud' },
              { label: 'Navy', value: 'navy' },
              { label: 'Crimson', value: 'crimson' },
            ],
            admin: { width: '50%' },
          },
          {
            name: 'width',
            type: 'select',
            label: 'Content width',
            defaultValue: 'default',
            options: [
              { label: 'Default', value: 'default' },
              { label: 'Narrow — long text', value: 'narrow' },
              { label: 'Wide', value: 'wide' },
              { label: 'Full bleed', value: 'full' },
            ],
            admin: { width: '50%' },
          },
        ],
      },
      {
        type: 'row',
        fields: [
          {
            name: 'spacingTop',
            type: 'select',
            label: 'Space above',
            defaultValue: 'default',
            options: [
              { label: 'Default', value: 'default' },
              { label: 'None', value: 'none' },
              { label: 'Small', value: 'sm' },
              { label: 'Large', value: 'lg' },
            ],
            admin: { width: '50%' },
          },
          {
            name: 'spacingBottom',
            type: 'select',
            label: 'Space below',
            defaultValue: 'default',
            options: [
              { label: 'Default', value: 'default' },
              { label: 'None', value: 'none' },
              { label: 'Small', value: 'sm' },
              { label: 'Large', value: 'lg' },
            ],
            admin: { width: '50%' },
          },
        ],
      },
      {
        name: 'align',
        type: 'select',
        label: 'Text alignment',
        defaultValue: 'default',
        options: [
          { label: 'Default (as designed)', value: 'default' },
          { label: 'Left', value: 'left' },
          { label: 'Centre', value: 'center' },
        ],
      },
      {
        name: 'hidden',
        type: 'checkbox',
        label: 'Hide this block',
        defaultValue: false,
        admin: {
          description: 'Keeps the block and its content but removes it from the page.',
        },
      },
    ],
  },
]

/**
 * Appends the presentation fields to a block config.
 * Use it where the blocks array is declared, so every block gets them at once:
 *
 *   blocks: [StatHero, LogoWall, ...].map(withPresentation)
 */
export const withPresentation = (block: Block): Block => ({
  ...block,
  fields: [...(block.fields || []), ...presentationFields],
})
