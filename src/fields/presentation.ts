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
              { label: 'Highlight (navy)', value: 'navy' },
            ],
            admin: {
              width: '50%',
              description:
                'Highlight (navy) marks the one section the page most wants read. Only one block per page may use it — a second one will stop the page saving. There is no crimson option: crimson is the single accent, and a full-bleed crimson section contradicts that.',
            },
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
      {
        name: 'htmlId',
        type: 'text',
        label: 'Anchor ID (advanced)',
        admin: {
          description:
            'Optional. Lets a link on this page jump straight to this block, for example a button linking to #how-it-works. Use lowercase words and dashes only, and no spaces or the # sign.',
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

/**
 * Just "hide this block" and the anchor ID, with no background, width or
 * spacing choices. For a full-bleed block that already controls its own
 * look end to end (for example a full-background hero), those options
 * would only let an editor break it.
 */
/**
 * Which side a block belongs on.
 *
 * A block gets the MINIMAL set if either test holds:
 *
 *  1. It paints its own opaque background edge to edge over the wrapper, so
 *     Highlight (navy) is a visual no-op. The editor sets it, nothing moves,
 *     and the page's single highlight has been spent. StatBand is this case.
 *
 *  2. It is already dark or saturated by its own design, so Highlight reduces
 *     its internal hierarchy instead of raising it. TrustPanel is this case:
 *     its navy steps to navy-tint and lands on the same tone as its cards.
 *
 * A light band built from --ncx-* tokens does not fail test 1. The highlight
 * remaps those surfaces, so the block still responds. Only a background the
 * highlight cannot reach — a hardcoded colour, a gradient, an image — counts.
 *
 * Everything else gets the full set from presentationFields above.
 */
export const minimalPresentationFields: Field[] = [
  {
    type: 'collapsible',
    label: 'Appearance',
    admin: { initCollapsed: true, description: 'Optional.' },
    fields: [
      {
        name: 'hidden',
        type: 'checkbox',
        label: 'Hide this block',
        defaultValue: false,
        admin: {
          description: 'Keeps the block and its content but removes it from the page.',
        },
      },
      {
        name: 'htmlId',
        type: 'text',
        label: 'Anchor ID (advanced)',
        admin: {
          description:
            'Optional. Lets a link on this page jump straight to this block, for example a button linking to #how-it-works. Use lowercase words and dashes only, and no spaces or the # sign.',
        },
      },
    ],
  },
]

export const withMinimalPresentation = (block: Block): Block => ({
  ...block,
  fields: [...(block.fields || []), ...minimalPresentationFields],
})
