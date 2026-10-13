import {
  BoldFeature,
  FixedToolbarFeature,
  HeadingFeature,
  ItalicFeature,
  lexicalEditor,
  OrderedListFeature,
  ParagraphFeature,
  UnorderedListFeature,
} from '@payloadcms/richtext-lexical'

import { siteLinkFeature } from './defaultLexical'

/**
 * The editor for customer story text: H3 headings, bulleted and numbered
 * lists, bold, italic and links (same link settings as the rest of the site).
 * The fixed toolbar shows those options, so editors do not need shortcuts.
 * Everything else keeps the site default editor (defaultLexical.ts).
 */
export const storyLexical = lexicalEditor({
  features: [
    ParagraphFeature(),
    HeadingFeature({ enabledHeadingSizes: ['h3'] }),
    UnorderedListFeature(),
    OrderedListFeature(),
    BoldFeature(),
    ItalicFeature(),
    siteLinkFeature,
    FixedToolbarFeature(),
  ],
})
