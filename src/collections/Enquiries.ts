import { timingSafeEqual } from 'crypto'
import type { CollectionAfterChangeHook, CollectionConfig } from 'payload'

import { adminInPerson } from '../access/adminInPerson'
import { createNcxLead } from './enquiries/ncxLead'
import { logEnquiryReads } from './EnquiryReads'

const escapeHtml = (v: unknown): string =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/**
 * Emails the team when a new enquiry arrives.
 *
 * Never throws: the enquiry is already saved by the time this runs, and a
 * failed notification must not turn into a failed form submission for the
 * visitor. Failures are logged for the server operator instead.
 */
const notifyByEmail: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create') return doc

  const to = process.env.SES_TO_ADDRESS
  const from = process.env.SES_FROM_ADDRESS
  const region = process.env.SES_REGION || process.env.S3_REGION || 'ap-south-1'
  const accessKeyId = process.env.SES_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID
  const secretAccessKey = process.env.SES_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY

  if (!to || !from || !accessKeyId || !secretAccessKey) {
    req.payload.logger.warn(
      'Enquiry saved but no email sent: SES_TO_ADDRESS, SES_FROM_ADDRESS or AWS credentials are missing.',
    )
    return doc
  }

  try {
    const { SESv2Client, SendEmailCommand } = await import('@aws-sdk/client-sesv2')

    const client = new SESv2Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    })

    const rows: [string, unknown][] = [
      ['Name', doc.name],
      ['Company', doc.company],
      ['Email', doc.email],
      ['Mobile', doc.mobile],
      ['Message', doc.message],
      ['Submitted from', doc.sourcePage],
    ]

    const html = `
      <p style="font-family:system-ui,sans-serif;font-size:15px">New enquiry from the NeuronCx website.</p>
      <table style="font-family:system-ui,sans-serif;font-size:15px;border-collapse:collapse">
        ${rows
          .filter(([, v]) => v)
          .map(
            ([k, v]) =>
              `<tr><td style="padding:4px 14px 4px 0;color:#4A5573">${k}</td><td style="padding:4px 0">${escapeHtml(v)}</td></tr>`,
          )
          .join('')}
      </table>
    `

    const text = rows
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${String(v ?? '')}`)
      .join('\n')

    await client.send(
      new SendEmailCommand({
        FromEmailAddress: from,
        Destination: { ToAddresses: to.split(',').map((a) => a.trim()) },
        ReplyToAddresses: doc.email ? [String(doc.email)] : undefined,
        Content: {
          Simple: {
            Subject: { Data: `New enquiry — ${doc.name || 'website'}` },
            Body: {
              Html: { Data: html },
              Text: { Data: text },
            },
          },
        },
      }),
    )

    req.payload.logger.info(`Enquiry notification sent for ${doc.email}`)
  } catch (err) {
    req.payload.logger.error(
      `Enquiry saved but the notification email failed: ${err instanceof Error ? err.message : String(err)}`,
    )
  }

  return doc
}

/**
 * Whether an enquiry came through the website. The website's enquiry route
 * sends ENQUIRY_SECRET (the same value on both sides) in this header, so a
 * bot posting straight to /api/enquiries cannot skip the website's checks.
 * With no secret set here, every request counts, as before.
 */
export const fromWebsite = (headers: Headers): boolean => {
  const secret = process.env.ENQUIRY_SECRET
  if (!secret) return true
  const given = Buffer.from(headers.get('x-enquiry-secret') ?? '')
  const expected = Buffer.from(secret)
  return given.length === expected.length && timingSafeEqual(given, expected)
}

export const Enquiries: CollectionConfig = {
  slug: 'enquiries',
  labels: { singular: 'Enquiry', plural: 'Enquiries' },
  // Personal data (names, emails, phone numbers): an admin signed in as
  // themselves, never a key. Until 11 Nov 2026 anyone signed in, keys
  // included, could read, change and delete every enquiry, and create them
  // (each one also creates an NCX lead and sends an email).
  access: {
    // The website's contact form (neuroncx-website src/app/(frontend)/api/enquiry),
    // or an admin. Open to anyone until ENQUIRY_SECRET is set.
    create: (args) => fromWebsite(args.req.headers) || adminInPerson(args),
    read: adminInPerson,
    update: adminInPerson,
    delete: adminInPerson,
  },
  admin: {
    defaultColumns: ['name', 'company', 'email', 'mobile', 'createdAt'],
    useAsTitle: 'name',
    description: 'Enquiries submitted from the website contact form.',
  },
  hooks: {
    // Creates the lead in the NCX dashboard (IID 4) and stores the outcome.
    beforeChange: [createNcxLead],
    afterChange: [notifyByEmail],
    // Who saw which enquiry (src/collections/EnquiryReads.ts).
    afterOperation: [logEnquiryReads],
  },
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Name' },
    { name: 'company', type: 'text', label: 'Company name' },
    { name: 'email', type: 'email', required: true, label: 'Business email' },
    { name: 'mobile', type: 'text', label: 'Mobile number' },
    { name: 'message', type: 'textarea', label: 'Message' },
    {
      name: 'sourcePage',
      type: 'text',
      label: 'Submitted from',
      admin: { readOnly: true, description: 'The page the form was submitted from.' },
    },
    {
      name: 'handled',
      type: 'checkbox',
      label: 'Followed up',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'ncxLead',
      type: 'group',
      label: 'NCX lead',
      admin: {
        position: 'sidebar',
        description: 'Set when the enquiry arrives. A lead needs a mobile number.',
      },
      fields: [
        {
          name: 'status',
          type: 'select',
          options: [
            { label: 'Created in NCX', value: 'created' },
            { label: 'Duplicate (sent in the last hour)', value: 'duplicate' },
            { label: 'Failed', value: 'failed' },
            { label: 'Not sent', value: 'skipped' },
          ],
          admin: { readOnly: true },
        },
        { name: 'transactionId', type: 'text', label: 'NCX reference', admin: { readOnly: true } },
        { name: 'note', type: 'text', admin: { readOnly: true } },
        { name: 'sentAt', type: 'date', label: 'Sent at', admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
      ],
    },
  ],
  timestamps: true,
}
