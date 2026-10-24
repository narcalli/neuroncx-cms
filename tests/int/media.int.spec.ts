import { describe, expect, it } from 'vitest'

import { Media, mediaAdminThumbnail, restoreResizeAfterGif, skipResizeForGifs } from '@/collections/Media'

/**
 * Uploads: a GIF is stored as it is, without conversion, resizing or the
 * named sizes (each size re-encodes every frame, which timed out on a long
 * GIF); every other image keeps all three.
 */

const sizeNames = (Media.upload as any).imageSizes.map((s: { name: string }) => s.name)

// A copy of the collection's upload settings, as the hooks receive it.
const collection = () => ({ upload: { ...(Media.upload as object) } }) as any
const before = (col: any, mimetype: string, context: Record<string, unknown> = {}) =>
  skipResizeForGifs({ collection: col, context, operation: 'create', req: { file: { mimetype } } } as any)
const after = (col: any, context: Record<string, unknown>) =>
  restoreResizeAfterGif({ collection: col, req: { context }, result: {} } as any)

describe('GIF uploads', () => {
  it('skip conversion, resizing and the named sizes for a GIF', () => {
    const col = collection()
    const context: Record<string, unknown> = {}
    before(col, 'image/gif', context)
    expect(col.upload.formatOptions).toBeUndefined()
    expect(col.upload.resizeOptions).toBeUndefined()
    expect(col.upload.imageSizes).toEqual([])
    expect(context.skippedGifResize).toBe(true)
  })

  it('turn them back on after the GIF', () => {
    const col = collection()
    const context: Record<string, unknown> = {}
    before(col, 'image/gif', context)
    after(col, context)
    expect(col.upload.formatOptions).toMatchObject({ format: 'webp' })
    expect(col.upload.resizeOptions).toMatchObject({ width: 1600 })
    expect(col.upload.imageSizes.map((s: { name: string }) => s.name)).toEqual(sizeNames)
  })

  it('turn them back on before any other upload, even after a GIF upload that failed part-way', () => {
    const col = collection()
    before(col, 'image/gif') // no after hook: the GIF upload failed
    before(col, 'image/png')
    expect(col.upload.formatOptions).toMatchObject({ format: 'webp' })
    expect(col.upload.imageSizes.map((s: { name: string }) => s.name)).toEqual(sizeNames)
  })

  it('give every other image all the named sizes', () => {
    expect(sizeNames).toEqual(expect.arrayContaining(['thumbnail', 'og', 'card', 'hero']))
    expect(sizeNames.length).toBeGreaterThan(10)
  })
})

describe('admin thumbnail', () => {
  it('is the thumbnail size, or the original for a GIF, which has none', () => {
    expect(mediaAdminThumbnail({ doc: { mimeType: 'image/png', url: '/a.png', sizes: { thumbnail: { url: '/a-300.webp' } } } })).toBe('/a-300.webp')
    expect(mediaAdminThumbnail({ doc: { mimeType: 'image/gif', url: '/b.gif', sizes: { thumbnail: { url: null } } } })).toBe('/b.gif')
    expect(mediaAdminThumbnail({ doc: { mimeType: 'video/mp4', url: '/c.mp4' } })).toBeNull()
  })
})
