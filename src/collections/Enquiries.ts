import type { CollectionAfterChangeHook, CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'

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

export const Enquiries: CollectionConfig = {
  slug: 'enquiries',
  labels: { singular: 'Enquiry', plural: 'Enquiries' },
  access: {
    // Anyone can submit the public form.
    create: () => true,
    // Only logged-in admins can see, edit or remove what was submitted.
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    defaultColumns: ['name', 'company', 'email', 'mobile', 'createdAt'],
    useAsTitle: 'name',
    description: 'Enquiries submitted from the website contact form.',
  },
  hooks: {
    afterChange: [notifyByEmail],
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
  ],
  timestamps: true,
}
