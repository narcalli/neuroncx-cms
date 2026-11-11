/**
 * Sends an email through Amazon SES, with the same settings the enquiry
 * notification uses (src/collections/Enquiries.ts): SES_FROM_ADDRESS, and
 * SES_REGION and SES_ACCESS_KEY_ID / SES_SECRET_ACCESS_KEY, falling back to
 * the S3 ones. Never throws: says whether it was sent, skipped (not set up)
 * or failed, and why.
 */
export type SendResult = { sent: true } | { sent: false; reason: string }

export const sendSesEmail = async ({
  to,
  subject,
  html,
  text,
}: {
  to: string[]
  subject: string
  html: string
  text: string
}): Promise<SendResult> => {
  const from = process.env.SES_FROM_ADDRESS
  const region = process.env.SES_REGION || process.env.S3_REGION || 'ap-south-1'
  const accessKeyId = process.env.SES_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID
  const secretAccessKey = process.env.SES_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY
  if (!to.length) return { sent: false, reason: 'no recipients' }
  if (!from || !accessKeyId || !secretAccessKey) {
    return { sent: false, reason: 'SES_FROM_ADDRESS or AWS credentials are missing' }
  }
  try {
    const { SESv2Client, SendEmailCommand } = await import('@aws-sdk/client-sesv2')
    const client = new SESv2Client({ region, credentials: { accessKeyId, secretAccessKey } })
    await client.send(
      new SendEmailCommand({
        FromEmailAddress: from,
        Destination: { ToAddresses: to },
        Content: { Simple: { Subject: { Data: subject }, Body: { Html: { Data: html }, Text: { Data: text } } } },
      }),
    )
    return { sent: true }
  } catch (err) {
    return { sent: false, reason: err instanceof Error ? err.message : String(err) }
  }
}

export const escapeHtml = (v: unknown): string =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
