'use client'
import { useConfig, useDocumentInfo } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

type Status = {
  state: 'pass' | 'fail' | 'notScored'
  reason: string
  mode: 'warn' | 'enforce'
  overridden: boolean
}

const TITLE: Record<Status['state'], string> = {
  pass: 'Benchmark: passes',
  fail: 'Benchmark: below the gate',
  notScored: 'Benchmark: not scored',
}

const ACCENT: Record<Status['state'], string> = {
  pass: 'var(--theme-success-500)',
  fail: 'var(--theme-error-500)',
  notScored: 'var(--theme-elevation-400)',
}

/**
 * The sidebar indicator for the benchmark gate: where the entry's last saved
 * version stands (GET /api/<collection>/:id/benchmark-status). Refreshes on save.
 */
export const BenchmarkStatus: React.FC = () => {
  const { config } = useConfig()
  const api = `${config.serverURL || ''}${config.routes?.api || '/api'}`
  const { id, collectionSlug, lastUpdateTime } = useDocumentInfo()
  const [status, setStatus] = useState<Status | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!id || !collectionSlug) return
    let live = true
    fetch(`${api}/${collectionSlug}/${id}/benchmark-status`, { credentials: 'include' })
      .then((r) => (r.ok ? (r.json() as Promise<Status>) : Promise.reject(new Error(String(r.status)))))
      .then((s) => {
        if (!live) return
        setStatus(s)
        setFailed(false)
      })
      .catch(() => live && setFailed(true))
    return () => {
      live = false
    }
  }, [api, id, collectionSlug, lastUpdateTime])

  const box: React.CSSProperties = {
    marginBottom: 'var(--base)',
    padding: 'calc(var(--base) / 2)',
    border: '1px solid var(--theme-elevation-150)',
    borderLeft: `3px solid ${status ? ACCENT[status.state] : 'var(--theme-elevation-150)'}`,
    borderRadius: 'var(--style-radius-s)',
    fontSize: '13px',
    lineHeight: 1.45,
  }

  if (!id) return <div style={box}>Benchmark: shown once the entry is saved.</div>
  if (failed) return <div style={box}>Benchmark: could not be checked just now.</div>
  if (!status) return <div style={box}>Benchmark: checking the last saved version.</div>
  return (
    <div style={box}>
      <strong>{TITLE[status.state]}</strong>
      <div>{status.reason}</div>
      {status.overridden ? <div>A content owner override is recorded for this content.</div> : null}
      {status.mode === 'warn' ? (
        <div style={{ color: 'var(--theme-elevation-500)', marginTop: 4 }}>
          For the last saved version. The gate only warns for now: publishing is not blocked.
        </div>
      ) : null}
    </div>
  )
}
