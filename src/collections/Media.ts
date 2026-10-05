import type { CollectionBeforeOperationHook, CollectionAfterOperationHook, CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const webp = { format: 'webp', options: { quality: 80 } } as const
const mainFileResize = { width: 1600, withoutEnlargement: true } as const

/**
 * GIFs must stay GIFs. Converting one to WebP (even an animated WebP) loses
 * the ability to tell it apart from a normal photo once it is saved — the
 * stored mimeType becomes image/webp either way, so the website can no
 * longer tell "this needs to render as a plain animated <img>" from "this
 * is a regular photo next/image can resize." Keeping the original file
 * sidesteps that, and it is also the simplest way to guarantee the
 * animation survives.
 *
 * Payload has no per-file "skip resizing this one" option, so these two
 * hooks turn resizing off for just the current request when the upload is
 * a GIF, then turn it back on once that request's processing has run.
 * `collection` here is the same config object every request reads from, so
 * there is a brief window - only for the duration of processing that one
 * GIF - where a second upload landing at the exact same moment could also
 * be affected. Acceptable for a CMS with a handful of editors; would need a
 * different approach for a public, high-traffic upload endpoint.
 *
 * Only the main file is affected. The named sizes below (thumbnail, card,
 * hero, ...) are generated separately by Payload and already keep an
 * animated file's frames on their own — they are simply never picked for a
 * GIF on the website side (see pickMedia in the website repo), so it does
 * not matter that they still get created.
 */
const skipResizeForGifs: CollectionBeforeOperationHook = ({ collection, context, operation, req }) => {
  if (operation !== 'create' && operation !== 'update') return
  if (req.file?.mimetype !== 'image/gif') return

  context.skippedGifResize = true
  if (collection.upload && typeof collection.upload === 'object') {
    collection.upload.formatOptions = undefined
    collection.upload.resizeOptions = undefined
  }
}

const restoreResizeAfterGif: CollectionAfterOperationHook = ({ collection, req, result }) => {
  if (req.context?.skippedGifResize && collection.upload && typeof collection.upload === 'object') {
    collection.upload.formatOptions = webp
    collection.upload.resizeOptions = mainFileResize
    req.context.skippedGifResize = false
  }
  return result
}

export const Media: CollectionConfig = {
  slug: 'media',
  folders: true,
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  hooks: {
    beforeOperation: [skipResizeForGifs],
    afterOperation: [restoreResizeAfterGif],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      //required: true,
    },
    {
      name: 'caption',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
    },
  ],
  upload: {
    // Upload to the public/media directory in Next.js making them publicly accessible even outside of Payload
    staticDir: path.resolve(dirname, '../../public/media'),
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    // Images and video only. SVG is allowed for logos and diagrams. GIF is
    // allowed for animated illustrations - see skipResizeForGifs above for
    // why it is treated differently from the other image types.
    mimeTypes: [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/avif',
      'image/gif',
      'image/svg+xml',
      'video/*',
    ],
    // Every upload (other than a GIF) is saved as WebP, and the original is
    // never wider than 1600px. Small images are not made bigger.
    formatOptions: webp,
    resizeOptions: mainFileResize,
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
      },
      {
        name: 'square',
        width: 500,
        height: 500,
      },
      {
        name: 'small',
        width: 600,
      },
      {
        name: 'medium',
        width: 900,
      },
      {
        name: 'large',
        width: 1400,
      },
      {
        name: 'xlarge',
        width: 1920,
      },
      {
        name: 'og',
        width: 1200,
        height: 630,
        crop: 'center',
      },
      // Sizes for the Product Suite cards, also saved as WebP.
      {
        name: 'card',
        width: 800,
        formatOptions: webp,
      },
      {
        name: 'wide',
        width: 1000,
        formatOptions: webp,
      },
      {
        name: 'tall',
        width: 800,
        height: 1100,
        formatOptions: webp,
      },
      // For full-bleed hero backgrounds, which fill the whole viewport width.
      // Width-only, same as card/wide, so tall and wide source photos both
      // scale sensibly.
      {
        name: 'hero',
        width: 2560,
        formatOptions: webp,
      },
    ],
  },
}
