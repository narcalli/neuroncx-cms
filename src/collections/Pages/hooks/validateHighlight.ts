import type { CollectionBeforeValidateHook } from 'payload'
import { APIError } from 'payload'

type LayoutBlock = { blockType?: string; blockName?: string | null; background?: string | null }

const describe = (block: LayoutBlock, index: number) =>
  `#${index + 1} ${block.blockName || block.blockType || 'block'}`

/**
 * Highlight (navy) is a per-page emphasis, not page rhythm: exactly one block
 * may carry it. This is a hard stop rather than a warning, because a warning
 * in the admin is dismissed and the page still saves.
 */
export const validateHighlight: CollectionBeforeValidateHook = ({ data }) => {
  const layout = (data?.layout || []) as LayoutBlock[]
  const navy = layout
    .map((block, index) => ({ block, index }))
    .filter(({ block }) => block?.background === 'navy')

  if (navy.length > 1) {
    const named = navy.map(({ block, index }) => describe(block, index)).join(' and ')
    throw new APIError(
      `Only one block per page can use Highlight (navy). This page has ${navy.length}: ${named}. Set all but one back to another background.`,
      400,
    )
  }

  return data
}
