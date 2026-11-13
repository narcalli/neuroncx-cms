import fs from 'fs'
import type { CollectionBeforeOperationHook, PayloadRequest } from 'payload'
import { ValidationError } from 'payload'

import { isApiKeyRequest } from '../../access/apiKeyRequest'
import { publicError } from '@/utilities/publicError'

/**
 * Checks on what is uploaded to Media, read from the file itself, not the
 * type the uploader declares (Payload stores the declared type).
 *
 * 1. An API key uploads images only: PNG, JPEG, GIF, WebP, AVIF or SVG. A key
 *    is how promote-page.mjs brings images to live; anything else (video, or
 *    a file posing as an image) has no business coming from a key.
 * 2. Every SVG, from anyone, is checked for scripts. Payload's own check
 *    (payload 3.84.1, uploads/checkFileRestrictions) is skipped for an SVG
 *    that starts with an XML declaration: such a file with a script was
 *    accepted, and opened from the CMS's own address it runs there, where an
 *    admin's sign-in cookie is sent. The patterns are Payload's own.
 * 3. Nothing is fetched from a web address. Given a url and no file, Payload
 *    downloads the file itself after these checks have run, and stores the
 *    type the remote server claims; "image/svg+xml; charset=utf-8" got past
 *    the S3 adapter's script block, which only matches the exact type. A
 *    change of focal point re-reads the entry's own file, which still works.
 * 4. The stored type is exact: an SVG is stored as image/svg+xml, nothing
 *    added, so the S3 adapter serves it with scripts blocked.
 */

const head = (bytes: Buffer, n: number) => bytes.subarray(0, n)
const ascii = (bytes: Buffer, from: number, to: number) => bytes.subarray(from, to).toString('latin1')

/** The binary image type a file's opening bytes show, or null. */
const binaryImageTypeOf = (bytes: Buffer): string | null => {
  if (head(bytes, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png'
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (/^GIF8[79]a/.test(ascii(bytes, 0, 6))) return 'image/gif'
  if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WEBP') return 'image/webp'
  if (ascii(bytes, 4, 8) === 'ftyp' && /^avi[fs]$/.test(ascii(bytes, 8, 12))) return 'image/avif'
  return null
}

/** The image type a file's opening bytes show, or null. */
export const imageTypeOf = (bytes: Buffer): string | null => binaryImageTypeOf(bytes) ?? (isSvg(bytes) ? 'image/svg+xml' : null)

// Any number of XML declarations, processing instructions, comments or
// doctypes, then the root element, with or without a namespace prefix.
const SVG_DOCUMENT = /^(?:<\?[\s\S]*?\?>\s*|<!--[\s\S]*?-->\s*|<!DOCTYPE[^>]*>\s*)*<(?:[\w.-]+:)?svg[\s>/]/i
const SVG_ELEMENT = /<(?:[\w.-]+:)?svg[\s>/]/i

const textOf = (bytes: Buffer): string => bytes.toString('utf8').replace(/^\uFEFF/, '')

/** Text that is an SVG document. */
export const isSvg = (bytes: Buffer): boolean => SVG_DOCUMENT.test(textOf(bytes).trimStart())

/** Anything that is not a binary image and holds an svg element: checked for scripts too, in case a browser draws it. */
const mightBeSvg = (bytes: Buffer): boolean => !binaryImageTypeOf(bytes) && SVG_ELEMENT.test(textOf(bytes))

// The patterns Payload's validateSvg uses.
const DANGEROUS_SVG = [
  /<script[\s>]/i,
  /<\/script>/i,
  /\son\w+\s*=/i,
  /javascript:/i,
  /data:text\/html/i,
  /<foreignObject[\s>]/i,
  /<iframe[\s>]/i,
  /<object[\s>]/i,
  /<embed[\s>]/i,
  /data:image\/svg\+xml;base64,[\w+/]*PHNjcmlwdA/i,
  /xlink:href\s*=\s*["']javascript:/i,
  /@import/i,
  /<!ENTITY/i,
  /<!DOCTYPE[^>]*\[/i,
  /<!\[CDATA\[[\s\S]*<script/i,
]

export const isSafeSvg = (bytes: Buffer): boolean => {
  const text = bytes.toString('utf8')
  return !DANGEROUS_SVG.some((pattern) => pattern.test(text))
}

export const KEY_UPLOAD_MESSAGE = 'An API key can upload images only: PNG, JPEG, GIF, WebP, AVIF or SVG.'
export const UNSAFE_SVG_MESSAGE = 'SVG file contains potentially harmful content.'
export const NO_URL_UPLOAD_MESSAGE = 'Upload the file itself: media is not fetched from a web address.'

type UploadedFile = { data?: Buffer; tempFilePath?: string; mimetype?: string }
type UploadArgs = { data?: { url?: unknown }; duplicateFromID?: unknown; id?: string | number }

const bytesOf = (file: UploadedFile): Buffer | null => {
  if (file.data?.length) return file.data
  if (file.tempFilePath) return fs.readFileSync(file.tempFilePath)
  return null
}

/**
 * A create or update with no file but a url makes Payload download that url.
 * Allowed only for an update that keeps the entry's own url (a new focal
 * point re-reads its own file) and for duplicating an entry.
 */
const refuseFetchFromUrl = async (req: PayloadRequest, operation: string, args: UploadArgs) => {
  const url = args.data?.url
  if (typeof url !== 'string' || !url || args.duplicateFromID) return
  if (operation === 'update' && args.id != null) {
    // As Payload reads it: the url is worked out on read, and the admin's edit form sends it back.
    const stored = (await req.payload
      .findByID({ collection: 'media', id: args.id, depth: 0, overrideAccess: true, req })
      .catch(() => null)) as { url?: string } | null
    if (stored?.url === url) return
  }
  throw publicError(NO_URL_UPLOAD_MESSAGE, 400)
}

/** beforeOperation on Media: runs before Payload reads, fetches or resizes the file. */
export const checkUpload: CollectionBeforeOperationHook = async ({ args, operation, req }) => {
  if (operation !== 'create' && operation !== 'update') return args
  if (!req.file) {
    await refuseFetchFromUrl(req, operation, args as UploadArgs)
    return args
  }
  const file = req.file as UploadedFile
  const bytes = bytesOf(file)
  if (!bytes) return args
  if (isApiKeyRequest(req) && !imageTypeOf(bytes)) throw publicError(KEY_UPLOAD_MESSAGE, 403)
  const svg = isSvg(bytes)
  if ((svg || mightBeSvg(bytes)) && !isSafeSvg(bytes)) {
    throw new ValidationError({ collection: 'media', errors: [{ path: 'file', message: UNSAFE_SVG_MESSAGE }] })
  }
  // Stored as given, so make it exact: no parameters, and an SVG as image/svg+xml.
  if (svg) file.mimetype = 'image/svg+xml'
  else if (typeof file.mimetype === 'string') file.mimetype = file.mimetype.split(';')[0].trim()
  return args
}
