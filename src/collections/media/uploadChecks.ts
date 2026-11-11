import fs from 'fs'
import type { CollectionBeforeOperationHook } from 'payload'
import { APIError, ValidationError } from 'payload'

import { isApiKeyRequest } from '../../access/apiKeyRequest'

/**
 * Two checks on what is uploaded to Media, read from the file itself, not the
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
 */

const head = (bytes: Buffer, n: number) => bytes.subarray(0, n)
const ascii = (bytes: Buffer, from: number, to: number) => bytes.subarray(from, to).toString('latin1')

/** The image type a file's opening bytes show, or null. */
export const imageTypeOf = (bytes: Buffer): string | null => {
  if (head(bytes, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png'
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (/^GIF8[79]a/.test(ascii(bytes, 0, 6))) return 'image/gif'
  if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WEBP') return 'image/webp'
  if (ascii(bytes, 4, 8) === 'ftyp' && /^avi[fs]$/.test(ascii(bytes, 8, 12))) return 'image/avif'
  if (isSvg(bytes)) return 'image/svg+xml'
  return null
}

/** Text that is an SVG document: optional BOM, XML declaration, comments or doctype, then <svg. */
export const isSvg = (bytes: Buffer): boolean => {
  const text = bytes.subarray(0, 4096).toString('utf8').replace(/^﻿/, '').trimStart()
  return /^(<\?xml[^>]*\?>\s*)?(<!--[\s\S]*?-->\s*|<!DOCTYPE[^>]*>\s*)*<svg[\s>]/i.test(text)
}

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

type UploadedFile = { data?: Buffer; tempFilePath?: string }

const bytesOf = (file: UploadedFile): Buffer | null => {
  if (file.data?.length) return file.data
  if (file.tempFilePath) return fs.readFileSync(file.tempFilePath)
  return null
}

/** beforeOperation on Media: runs before Payload reads or resizes the file. */
export const checkUpload: CollectionBeforeOperationHook = ({ args, operation, req }) => {
  if ((operation !== 'create' && operation !== 'update') || !req.file) return args
  const bytes = bytesOf(req.file as UploadedFile)
  if (!bytes) return args
  if (isApiKeyRequest(req) && !imageTypeOf(bytes)) throw new APIError(KEY_UPLOAD_MESSAGE, 403, null, true)
  if (isSvg(bytes) && !isSafeSvg(bytes)) {
    throw new ValidationError({ collection: 'media', errors: [{ path: 'file', message: UNSAFE_SVG_MESSAGE }] })
  }
  return args
}
