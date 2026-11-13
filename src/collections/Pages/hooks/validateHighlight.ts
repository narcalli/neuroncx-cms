import type { CollectionBeforeValidateHook } from 'payload'
import { publicError } from '@/utilities/publicError'

type LayoutBlock = { blockType?: string; blockName?: string | null; background?: string | null }

/**
 * Blocks that are navy whatever their Appearance says: they paint their own
 * navy ground and offer no Background choice, so they always spend the
 * page's one highlight.
 */
export const NAVY_BY_DESIGN: readonly string[] = ['expandingCardCta']

const byDesign = (block: LayoutBlock) => NAVY_BY_DESIGN.includes(String(block?.blockType))

const describe = (block: LayoutBlock, index: number) =>
  `#${index + 1} ${block.blockName || block.blockType || 'block'}${byDesign(block) ? ' (navy by design)' : ''}`

/**
 * Highlight (navy) is a per-page emphasis, not page rhythm: exactly one block
 * may carry it, counting the blocks that are navy by design. This is a hard
 * stop rather than a warning, because a warning in the admin is dismissed and
 * the page still saves.
 */
export const validateHighlight: CollectionBeforeValidateHook = ({ data }) => {
  const layout = (data?.layout || []) as LayoutBlock[]
  const navy = layout
    .map((block, index) => ({ block, index }))
    .filter(({ block }) => block?.background === 'navy' || byDesign(block))

  if (navy.length > 1) {
    const named = navy.map(({ block, index }) => describe(block, index)).join(' and ')
    const fixed = navy.some(({ block }) => byDesign(block))
    throw publicError(
      `Only one block per page can use Highlight (navy). This page has ${navy.length}: ${named}. ${
        fixed
          ? 'A block that is navy by design always counts, so set the others back to another background, or remove the extra navy block.'
          : 'Set all but one back to another background.'
      }`,
      400,
    )
  }

  return data
}
