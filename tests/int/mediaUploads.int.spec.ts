// @vitest-environment node
// Payload reads uploaded files' types with file-type, which misreads binary data in jsdom.
import 'dotenv/config'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import { imageTypeOf, isSvg, KEY_UPLOAD_MESSAGE, UNSAFE_SVG_MESSAGE } from '@/collections/media/uploadChecks'

/**
 * Media uploads (src/collections/media/uploadChecks.ts): a key uploads images
 * only and never replaces or deletes; no SVG with a script gets in, from
 * anyone. Temporary records: alt "zz-media".
 */

type Doc = Record<string, any>
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
const MP4 = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypmp42'), Buffer.from([0, 0, 0, 0]), Buffer.from('mp42isom')])
const SCRIPT_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><script>alert(document.domain)</script></svg>'
const PLAIN_SVG = '<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>'

describe('media uploads', () => {
  let payload: Payload
  let author: Doc
  const made: string[] = []
  const as = (u: Doc, strategy: 'api-key' | 'local-jwt' = 'local-jwt') => ({ ...u, collection: 'users' as const, _strategy: strategy })
  const upload = (data: Buffer, name: string, mimetype: string, user?: Doc) =>
    payload
      .create({
        collection: 'media',
        data: { alt: 'zz-media' } as never,
        file: { data, mimetype, name, size: data.length } as never,
        ...(user ? { user: user as never, overrideAccess: false } : { overrideAccess: true }),
        context: { disableRevalidate: true },
      })
      .then((doc) => {
        made.push(String(doc.id))
        return doc as Doc
      })
  const sweep = async () => {
    for (const m of (await payload.find({ collection: 'media', where: { alt: { equals: 'zz-media' } }, pagination: false, overrideAccess: true })).docs)
      await payload.delete({ collection: 'media', id: m.id, overrideAccess: true, context: { disableRevalidate: true } })
    for (const u of (await payload.find({ collection: 'users', where: { email: { like: 'zz-media-' } }, pagination: false, overrideAccess: true })).docs)
      await payload.delete({ collection: 'users', id: u.id, overrideAccess: true })
  }

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await sweep()
    author = await payload.create({ collection: 'users', data: { email: 'zz-media-author@example.test', password: `zz-media-${Date.now()}`, role: 'author' } as never, overrideAccess: true })
  })
  afterAll(sweep)

  it('lets a key upload an image, as promote-page.mjs does', async () => {
    const doc = await upload(PNG, 'zz-media-key.png', 'image/png', as(author, 'api-key'))
    expect(doc.id).toBeTruthy()
  })

  it('refuses anything else from a key, a video posing as an image included', async () => {
    await expect(upload(MP4, 'zz-media-key.mp4', 'video/mp4', as(author, 'api-key'))).rejects.toThrow(KEY_UPLOAD_MESSAGE)
    await expect(upload(MP4, 'zz-media-posing.png', 'image/png', as(author, 'api-key'))).rejects.toThrow(KEY_UPLOAD_MESSAGE)
  })

  it('lets no key replace or delete media, and a person still can', async () => {
    const doc = await upload(PNG, 'zz-media-person.png', 'image/png', as(author))
    const key = as(author, 'api-key') as never
    await expect(payload.update({ collection: 'media', id: doc.id, data: { alt: 'zz-media' } as never, user: key, overrideAccess: false })).rejects.toMatchObject({ name: 'Forbidden' })
    await expect(payload.delete({ collection: 'media', id: doc.id, user: key, overrideAccess: false })).rejects.toMatchObject({ name: 'Forbidden' })
    const changed = await payload.update({ collection: 'media', id: doc.id, data: { alt: 'zz-media' } as never, user: as(author) as never, overrideAccess: false, context: { disableRevalidate: true } })
    expect(changed.id).toBe(doc.id)
  })

  it('refuses an SVG with a script from anyone, with or without an XML declaration', async () => {
    for (const body of [SCRIPT_SVG, `<?xml version="1.0" encoding="UTF-8"?>\n${SCRIPT_SVG}`]) {
      await expect(upload(Buffer.from(body), 'zz-media-script.svg', 'image/svg+xml')).rejects.toMatchObject({
        data: { errors: [expect.objectContaining({ message: UNSAFE_SVG_MESSAGE })] },
      })
    }
  })

  it('takes a plain SVG with an XML declaration, from a person and from a key', async () => {
    expect((await upload(Buffer.from(PLAIN_SVG), 'zz-media-plain.svg', 'image/svg+xml', as(author))).id).toBeTruthy()
    expect((await upload(Buffer.from(PLAIN_SVG), 'zz-media-plain-key.svg', 'image/svg+xml', as(author, 'api-key'))).id).toBeTruthy()
  })
})

describe('reading a file for its type', () => {
  it('tells images from everything else by their opening bytes', () => {
    expect(imageTypeOf(PNG)).toBe('image/png')
    expect(imageTypeOf(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg')
    expect(imageTypeOf(Buffer.from('GIF89a....'))).toBe('image/gif')
    expect(imageTypeOf(Buffer.concat([Buffer.from('RIFF'), Buffer.from([0, 0, 0, 0]), Buffer.from('WEBPVP8 ')]))).toBe('image/webp')
    expect(imageTypeOf(Buffer.concat([Buffer.from([0, 0, 0, 0x1c]), Buffer.from('ftypavif')]))).toBe('image/avif')
    expect(imageTypeOf(MP4)).toBeNull()
    expect(imageTypeOf(Buffer.from('%PDF-1.7'))).toBeNull()
    expect(isSvg(Buffer.from(PLAIN_SVG))).toBe(true)
    expect(isSvg(Buffer.from('<html><svg></svg></html>'))).toBe(false)
  })
})
