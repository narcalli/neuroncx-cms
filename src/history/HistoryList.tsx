'use client'

import { Button, ConfirmationModal, Pill, toast, useModal } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

import type { HistoryEntry, HistoryKind, HistoryPage } from './build'
import type { RollbackCheck } from './check'

const MODAL = 'history-rollback'

const when = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})
const at = (iso: string | null) => (iso ? when.format(new Date(iso)) : '')

const KIND: Record<HistoryKind, string> = {
  published: 'Published',
  draft: 'Saved draft',
  session: 'Editing session',
  rollback: 'Rolled back',
  unpublished: 'Unpublished',
}

const title = (e: HistoryEntry): string => {
  if (e.kind === 'rollback') return e.rolledBackFromAt ? `Rolled back to ${at(e.rolledBackFromAt)}` : KIND.rollback
  if (e.kind !== 'published' && e.wasPublished) return KIND.published
  return KIND[e.kind]
}

type Props = HistoryPage & {
  adminRoute: string
  apiURL: string
  collection: string
  docID: string
}

type Pending = { entry: HistoryEntry; check: RollbackCheck | null }

/** The History tab's list, and its rollback confirmation (client side). */
export const HistoryList: React.FC<Props> = ({ entries, page, hasMore, compareWithLive, adminRoute, apiURL, collection, docID }) => {
  const router = useRouter()
  const { openModal } = useModal()
  const [pending, setPending] = useState<Pending | null>(null)
  const [checking, setChecking] = useState<string | null>(null)
  const editURL = `${adminRoute}/collections/${collection}/${docID}`

  const askRollback = async (entry: HistoryEntry) => {
    setChecking(entry.key)
    let check: RollbackCheck | null = null
    try {
      const res = await fetch(`${apiURL}/${collection}/${docID}/rollback-check?version=${entry.versionId}`, {
        credentials: 'include',
      })
      if (res.ok) check = (await res.json()) as RollbackCheck
    } catch {
      // The warnings are a courtesy; the rollback itself still checks everything.
    }
    setChecking(null)
    setPending({ entry, check })
    openModal(MODAL)
  }

  const rollBack = async () => {
    if (!pending?.entry.versionId) return
    const res = await fetch(`${apiURL}/${collection}/versions/${pending.entry.versionId}?draft=true`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
    if (res.ok) {
      toast.success('Rolled back to a draft. Publish the draft to make it live.')
      router.push(editURL)
      router.refresh()
      return
    }
    const json = await res.json().catch(() => null)
    toast.error(json?.errors?.[0]?.message || 'The rollback did not go through.')
  }

  return (
    <div style={{ paddingBlock: 'calc(var(--base) * 1.5)', maxWidth: 880 }}>
      {!entries.length ? <p>No history yet.</p> : null}
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12 }}>
        {entries.map((e) => (
          <li
            key={e.key}
            style={{
              border: '1px solid var(--theme-elevation-150)',
              borderRadius: 'var(--style-radius-m)',
              padding: '12px 16px',
              background: e.live ? 'var(--theme-elevation-50)' : 'transparent',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              <strong>{title(e)}</strong>
              {e.live ? <Pill pillStyle="success">Live</Pill> : null}
              {e.currentDraft ? <Pill pillStyle="warning">Current draft</Pill> : null}
              <span style={{ color: 'var(--theme-elevation-600)' }} suppressHydrationWarning>
                {e.by} · {e.startedAt ? `${at(e.startedAt)} to ${at(e.at)}` : at(e.at)}
              </span>
            </div>
            {e.changes.length ? (
              <ul style={{ margin: '8px 0 0', paddingLeft: 18, color: 'var(--theme-elevation-800)' }}>
                {e.changes.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            ) : null}
            {e.versionId ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                <Button buttonStyle="secondary" size="small" margin={false} el="link" url={`${editURL}/versions/${e.versionId}`}>
                  Compare
                </Button>
                {e.currentDraft && compareWithLive ? (
                  <Button buttonStyle="secondary" size="small" margin={false} el="link" url={compareWithLive}>
                    Compare with live
                  </Button>
                ) : null}
                {e.previewUrl ? (
                  <Button buttonStyle="secondary" size="small" margin={false} el="anchor" url={e.previewUrl} newTab>
                    Preview
                  </Button>
                ) : null}
                {!e.currentDraft ? (
                  <Button
                    buttonStyle="primary"
                    size="small"
                    margin={false}
                    disabled={checking === e.key}
                    onClick={() => askRollback(e)}
                  >
                    {checking === e.key ? 'Checking…' : 'Roll back to this'}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </li>
        ))}
      </ol>
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        {page > 1 ? (
          <Button buttonStyle="secondary" size="small" margin={false} el="link" url={`?page=${page - 1}`}>
            Newer
          </Button>
        ) : null}
        {hasMore ? (
          <Button buttonStyle="secondary" size="small" margin={false} el="link" url={`?page=${page + 1}`}>
            Older
          </Button>
        ) : null}
      </div>
      <p style={{ marginTop: 16, color: 'var(--theme-elevation-500)', fontSize: 13 }}>
        Versions saved before History was added show the editor as Not recorded.
      </p>
      <ConfirmationModal
        modalSlug={MODAL}
        heading="Roll back to this version?"
        confirmLabel="Roll back"
        confirmingLabel="Rolling back…"
        onConfirm={rollBack}
        onCancel={() => setPending(null)}
        body={pending ? <RollbackBody pending={pending} /> : null}
      />
    </div>
  )
}

const RollbackBody: React.FC<{ pending: Pending }> = ({ pending: { entry, check } }) => (
  <div style={{ display: 'grid', gap: 8 }}>
    <p style={{ margin: 0 }}>
      The draft becomes the version from {at(entry.at)}. The live version does not change until the draft is
      published. The current draft stays in History.
    </p>
    {check?.slug ? (
      <p style={{ margin: 0 }}>
        This version&apos;s address is &quot;{check.slug.to || 'empty'}&quot;, and the current one is &quot;
        {check.slug.from || 'empty'}&quot;. Publishing the draft changes the address.
      </p>
    ) : null}
    {check?.parentChanged ? (
      <p style={{ margin: 0 }}>This version sits under a different parent page. Publishing the draft moves the page.</p>
    ) : null}
    {check?.missing?.length ? (
      <div>
        <p style={{ margin: 0 }}>Some links in this version point to items that no longer exist:</p>
        <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
          {check.missing.map((m) => (
            <li key={`${m.label}|${m.collection}`}>
              {m.label || 'A field'}: {m.count} {m.count === 1 ? 'item' : 'items'} from {m.collection}
            </li>
          ))}
        </ul>
        <p style={{ margin: '4px 0 0' }}>Those links come back empty in the draft.</p>
      </div>
    ) : null}
  </div>
)
