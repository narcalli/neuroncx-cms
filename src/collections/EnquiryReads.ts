import type { CollectionAfterOperationHook, CollectionConfig, PayloadRequest } from 'payload'

import { adminInPerson } from '../access/adminInPerson'
import { isApiKeyRequest } from '../access/apiKeyRequest'

/**
 * Who saw which enquiry, from 11 Nov 2026: every read by a signed-in person or
 * key. Opening one enquiry is an entry naming it; a list (the admin list, a
 * REST or GraphQL list) is one entry with how many enquiries it returned. Enquiries hold personal data for healthcare clients' leads, and
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
    defaultColumns: ['createdAt', 'user', 'how', 'enquiry', 'count', 'via'],
    useAsTitle: 'how',
    description: 'Who saw which enquiry, and when. Kept by the system; it cannot be edited.',
  },
  timestamps: true,
  fields: [
    {
      name: 'enquiry',
      type: 'relationship',
      relationTo: 'enquiries',
      index: true,
      admin: { readOnly: true, description: 'The enquiry opened. Empty for a list.' },
    },
    {
      name: 'count',
      type: 'number',
      admin: { readOnly: true, description: 'How many enquiries were returned: 1 for an enquiry opened, the number listed for a list.' },
    },
    { name: 'user', type: 'relationship', relationTo: 'users', index: true, admin: { readOnly: true } },
    {
      name: 'how',
      type: 'select',
      required: true,
      options: [
        { label: 'Listed', value: 'listed' },
        { label: 'Opened', value: 'opened' },
      ],
      admin: { readOnly: true, description: 'Listed: a list of enquiries. Opened: one enquiry, looked at on its own.' },
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

/** afterOperation on Enquiries, for reads by a person or a key: one entry per enquiry opened, one per list. */
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
  const data = operation === 'find' ? { ...common, count: docs.length } : { ...common, enquiry: docs[0].id, count: 1 }
  try {
    await req.payload.create({ collection: ENQUIRY_READS as never, data: data as never, overrideAccess: true, depth: 0, req })
  } catch (err) {
    req.payload.logger.error(`Enquiry read not logged (${docs.length} enquiries, user ${user.id}): ${String(err)}`)
  }
  return result
}
