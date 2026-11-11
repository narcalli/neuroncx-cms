import type { CollectionAfterOperationHook, CollectionConfig, PayloadRequest } from 'payload'

import { adminInPerson } from '../access/adminInPerson'
import { isApiKeyRequest } from '../access/apiKeyRequest'

/**
 * Who saw which enquiry, from 11 Nov 2026: every enquiry a signed-in person or
 * key reads, listed (the admin list, a REST or GraphQL list) or opened (one
 * enquiry). Enquiries hold personal data for healthcare clients' leads, and
 * before this nothing recorded reads, so "who has seen these" could not be
 * answered. Written by the server; nobody can create, change or delete an
 * entry through the API. Read by an admin in person.
 */
export const ENQUIRY_READS = 'enquiryReads'

export const EnquiryReads: CollectionConfig = {
  slug: ENQUIRY_READS,
  labels: { singular: 'Enquiry read', plural: 'Enquiry reads' },
  access: {
    read: adminInPerson,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  admin: {
    group: 'System',
    defaultColumns: ['createdAt', 'user', 'how', 'enquiry', 'via'],
    useAsTitle: 'how',
    description: 'Who saw which enquiry, and when. Kept by the system; it cannot be edited.',
  },
  timestamps: true,
  fields: [
    { name: 'enquiry', type: 'relationship', relationTo: 'enquiries', required: true, index: true, admin: { readOnly: true } },
    { name: 'user', type: 'relationship', relationTo: 'users', index: true, admin: { readOnly: true } },
    {
      name: 'how',
      type: 'select',
      required: true,
      options: [
        { label: 'Listed', value: 'listed' },
        { label: 'Opened', value: 'opened' },
      ],
      admin: { readOnly: true, description: 'Listed: shown among others. Opened: looked at on its own.' },
    },
    {
      name: 'via',
      type: 'select',
      options: [
        { label: 'Signed in', value: 'session' },
        { label: 'API key', value: 'apiKey' },
      ],
      admin: { readOnly: true },
    },
    { name: 'ip', type: 'text', label: 'IP address', admin: { readOnly: true } },
    { name: 'userAgent', type: 'text', label: 'Browser or client', admin: { readOnly: true } },
  ],
}

const ipOf = (req: PayloadRequest): string | null => {
  const forwarded = req.headers?.get?.('x-forwarded-for')
  return (forwarded?.split(',')[0] || req.headers?.get?.('x-real-ip') || '').trim() || null
}

type Read = { id: string | number }

/** afterOperation on Enquiries: one entry per enquiry read, for reads by a person or a key. */
export const logEnquiryReads: CollectionAfterOperationHook = async ({ operation, req, result }) => {
  if (operation !== 'find' && operation !== 'findByID') return result
  const user = req.user as { id?: string | number; collection?: string } | null
  if (!user?.id || user.collection !== 'users') return result
  const docs: Read[] = operation === 'find' ? ((result as { docs?: Read[] })?.docs ?? []) : result ? [result as Read] : []
  if (!docs.length) return result
  const common = {
    user: user.id,
    how: operation === 'find' ? 'listed' : 'opened',
    via: isApiKeyRequest(req) ? 'apiKey' : 'session',
    ip: ipOf(req),
    userAgent: req.headers?.get?.('user-agent')?.slice(0, 300) ?? null,
  }
  try {
    for (const doc of docs) {
      await req.payload.create({ collection: ENQUIRY_READS as never, data: { ...common, enquiry: doc.id } as never, overrideAccess: true, depth: 0, req })
    }
  } catch (err) {
    req.payload.logger.error(`Enquiry read not logged (${docs.length} enquiries, user ${user.id}): ${String(err)}`)
  }
  return result
}
