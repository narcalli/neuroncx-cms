import type { Block } from 'payload'

import { contentCollections } from '../registry'
import { allSections, buildSectionBlock } from './defineSection'
import './hub'
import './shared'
import { SITE_BLOCKS } from './siteBlocks'

/**
 * Every block a layout field can reference, for the config's top-level
 * `blocks` (payload.config.ts). Layout fields list them by slug in
 * blockReferences, so each is defined once however many collections use it.
 *
 * Call it after the collections are imported: their sections and their
 * default headings are registered as their files load.
 */
export const contentBlocks = (): Block[] => [
  ...allSections().map((def) =>
    buildSectionBlock(
      def,
      contentCollections()
        .filter((c) => c.headings[def.key])
        .map((c) => ({ label: c.label.plural, heading: c.headings[def.key] })),
    ),
  ),
  ...SITE_BLOCKS,
]
