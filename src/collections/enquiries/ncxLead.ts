import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Creates a lead in the NCX dashboard for every new website enquiry.
 *
 * Posts to NCX's common carrier API (cron: routes/externalCarrierV2.js →
 * actions/createExternalLead.js), which creates the user and the transaction
 * for the institution, school, transaction type and channel set on the
 * ExternalApiMaster row named by the URL's examId.
 *
 * Env:
 *   NCX_LEAD_URL    full carrierv2 URL, e.g.
 *                   https://prodcron.askadmissionsone.in/external/carrierv2/neuroncx-website/34
 *   NCX_LEAD_TOKEN  that ExternalApiMaster row's PermanentToken
 * With either unset nothing is sent.
 *
 * Runs before the enquiry is saved so the outcome is stored on it (the NCX
 * lead group in the sidebar). Never throws: a lead that could not be created
 * must not fail the form for the visitor; the enquiry and the email still go
 * through and the status shows what went wrong.
 */

export type NcxLeadStatus = 'created' | 'duplicate' | 'failed' | 'skipped'

export type NcxLeadResult = {
  status: NcxLeadStatus
  transactionId?: string
  note?: string
}

export const ncxLeadConfigured = () =>
  Boolean(process.env.NCX_LEAD_URL && process.env.NCX_LEAD_TOKEN)

/**
 * Digits only, with the country code: "+91 98863 99991" → "919886399991".
 * A 10 digit number is taken as Indian. Returns null when nothing usable is left.
 */
export const normalisePhone = (raw: unknown): string | null => {
  const digits = String(raw ?? '')
    .replace(/^\s*00/, '')
    .replace(/\D/g, '')
  if (digits.length === 10) return `91${digits}`
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`
  if (digits.length >= 11 && digits.length <= 15) return digits
  return null
}

type Enquiry = {
  name?: string | null
  company?: string | null
  email?: string | null
  mobile?: string | null
  message?: string | null
  sourcePage?: string | null
}

/** The body NCX receives. phone is required; the other keys are optional. */
export const leadPayload = (e: Enquiry, phone: string) => {
  const lines = [
    e.company && `Company: ${e.company}`,
    e.message && `Wants to automate: ${e.message}`,
    e.sourcePage && `Submitted from: ${e.sourcePage}`,
  ].filter(Boolean)

  return {
    name: e.name || '',
    phone,
    email: e.email || '',
    company: e.company || '',
    message: lines.join('\n'),
    sourcePage: e.sourcePage || '',
  }
}

export const sendLead = async (e: Enquiry): Promise<NcxLeadResult> => {
  if (!ncxLeadConfigured()) return { status: 'skipped', note: 'NCX_LEAD_URL or NCX_LEAD_TOKEN is not set' }

  const phone = normalisePhone(e.mobile)
  if (!phone) {
    return {
      status: 'skipped',
      note: e.mobile ? `Mobile number "${e.mobile}" is not valid` : 'No mobile number given',
    }
  }

  try {
    const res = await fetch(process.env.NCX_LEAD_URL as string, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.NCX_LEAD_TOKEN}`,
      },
      body: JSON.stringify(leadPayload(e, phone)),
      signal: AbortSignal.timeout(10_000),
    })
    const json = (await res.json().catch(() => ({}))) as {
      error?: boolean
      message?: string
      result?: string
      transactionId?: string
    }

    if (res.status === 409) {
      return { status: 'duplicate', transactionId: json.transactionId, note: 'Same number sent in the last hour' }
    }
    if (!res.ok || json.error) {
      return {
        status: 'failed',
        note: `NCX answered ${res.status}: ${json.message || json.result || res.statusText}`,
      }
    }
    return { status: 'created', transactionId: json.transactionId, note: json.message || undefined }
  } catch (err) {
    return { status: 'failed', note: err instanceof Error ? err.message : String(err) }
  }
}

export const createNcxLead: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create') return data

  const result = await sendLead(data as Enquiry)
  const log = result.status === 'failed' ? req.payload.logger.error : req.payload.logger.info
  log.call(req.payload.logger, `Enquiry from ${data?.email}: NCX lead ${result.status}${result.note ? ` (${result.note})` : ''}`)

  return {
    ...data,
    ncxLead: {
      status: result.status,
      transactionId: result.transactionId || null,
      note: result.note || null,
      sentAt: new Date().toISOString(),
    },
  }
}
