/**
 * Client for the NCX dashboard backend's /cms-sync routes
 * (dashboard-backend: allroutes/cmsSyncRoutes.js).
 *
 * Env:
 *   NCX_SYNC_URL   backend base URL, e.g. https://proddash.askadmissionsone.in
 *   NCX_SYNC_KEY   shared secret, same value as CMS_SYNC_KEY on the backend
 */

export type UpsertResult = {
  pcmId: number
  action: 'created' | 'updated'
  /** The create workflow had not written the vector yet; send again later. */
  retry?: boolean
}

export const ncxConfigured = () => Boolean(process.env.NCX_SYNC_URL && process.env.NCX_SYNC_KEY)

const post = async <T>(path: string, body: Record<string, unknown>): Promise<T> => {
  const base = (process.env.NCX_SYNC_URL || '').replace(/\/+$/, '')
  const res = await fetch(`${base}/cms-sync/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-cms-sync-key': process.env.NCX_SYNC_KEY || '',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  })
  const json = (await res.json().catch(() => ({}))) as any
  if (!res.ok || json?.error) {
    throw new Error(`NCX ${path} failed (${res.status}): ${json?.message || res.statusText}`)
  }
  return json as T
}

export const upsertPostContent = (input: {
  pcmId?: number | null
  title: string
  text: string
  url?: string
}) => post<UpsertResult>('upsert', { ...input, pcmId: input.pcmId || undefined })

export const archivePostContent = (pcmId: number) =>
  post<{ action: 'archived' | 'missing' }>('archive', { pcmId })
