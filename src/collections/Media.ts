import type {
  CollectionAfterOperationHook,
  CollectionBeforeOperationHook,
  CollectionConfig,
  ImageSize as UploadImageSize,
} from 'payload'

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

/** The named sizes every upload gets, except a GIF (see skipResizeForGifs). */
const IMAGE_SIZES: UploadImageSize[] = [
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
  // Screenshot sizes for Product in Action. Payload gives each size one
  // output format, so these are WebP. Only new uploads (and re-uploads)
  // get these sizes.
  {
    name: 'stack768',
    width: 768,
    formatOptions: webp,
  },
  {
    name: 'stack1200',
    width: 1200,
    formatOptions: webp,
  },
  {
    name: 'stack1600',
    width: 1600,
    formatOptions: webp,
  },
]

/**
 * GIFs must stay GIFs. Converting one to WebP (even an animated WebP) loses
 * the ability to tell it apart from a normal photo once it is saved — the
 * stored mimeType becomes image/webp either way, so the website can no
 * longer tell "this needs to render as a plain animated <img>" from "this
 * is a regular photo next/image can resize." Keeping the original file
 * sidesteps that, and it is also the simplest way to guarantee the
 * animation survives.
 *
 * A GIF also gets none of the named sizes below. Each size re-encodes every
 * frame: a 180-frame, 960 by 600 GIF took about 100 seconds for the 14
 * sizes, longer than the hosting allows a request to run, so the upload
 * failed. The website never uses a GIF's sizes anyway (pickMedia in the
 * website repo always shows the original), so a GIF is stored as it is.
 *
 * Payload has no per-file "skip resizing this one" option, so these two
 * hooks turn resizing, conversion and the sizes off for just the current
 * request when the upload is a GIF, then turn them back on once that
 * request's processing has run. Every other upload also turns them back on
 * first, so a GIF upload that failed part-way never leaves them off.
 * `collection` here is the same config object every request reads from, so
 * there is a brief window - only for the duration of processing that one
 * GIF - where a second upload landing at the exact same moment could also
 * be affected. Acceptable for a CMS with a handful of editors; would need a
 * different approach for a public, high-traffic upload endpoint.
 */
const uploadOf = (collection: { upload?: unknown }) =>
  collection.upload && typeof collection.upload === 'object' ? (collection.upload as Record<string, unknown>) : null

const processAsUsual = (upload: Record<string, unknown> | null) => {
  if (!upload) return
  upload.formatOptions = webp
  upload.resizeOptions = mainFileResize
  upload.imageSizes = IMAGE_SIZES
}

export const skipResizeForGifs: CollectionBeforeOperationHook = ({ collection, context, operation, req }) => {
  if (operation !== 'create' && operation !== 'update') return
  const upload = uploadOf(collection)
  if (req.file?.mimetype !== 'image/gif') {
    processAsUsual(upload)
    return
  }

  context.skippedGifResize = true
  if (upload) {
    upload.formatOptions = undefined
    upload.resizeOptions = undefined
    upload.imageSizes = []
  }
}

export const restoreResizeAfterGif: CollectionAfterOperationHook = ({ collection, req, result }) => {
  if (req.context?.skippedGifResize) {
    processAsUsual(uploadOf(collection))
    req.context.skippedGifResize = false
  }
  return result
}

/** The admin's small picture: the thumbnail size, or the original file for a GIF, which has no sizes. */
export const mediaAdminThumbnail = ({ doc }: { doc: Record<string, unknown> }): string | null => {
  const thumbnail = (doc.sizes as { thumbnail?: { url?: string | null } } | undefined)?.thumbnail?.url
  if (thumbnail) return thumbnail
  return doc.mimeType === 'image/gif' && typeof doc.url === 'string' ? doc.url : null
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
    adminThumbnail: mediaAdminThumbnail,
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
    imageSizes: IMAGE_SIZES,
  },
}
