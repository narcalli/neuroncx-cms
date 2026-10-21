'use client'
import { useFormFields } from '@payloadcms/ui'
import React from 'react'

/**
 * SEO check (sidebar, read only, never blocks saving). Shows whether the
 * primary keyword appears in the page heading, the SEO title, the SEO
 * description and, on items, the summary, with live character counts
 * against each limit. Matching ignores case.
 */

type Mode = 'item' | 'master'

type Row = { label: string; path: string; max: number }

const ROWS: Record<Mode, Row[]> = {
  item: [
    { label: 'Hero heading (H1)', path: 'heroHeading', max: 70 },
    { label: 'SEO title', path: 'meta.title', max: 60 },
    { label: 'SEO description', path: 'meta.description', max: 155 },
    { label: 'Summary', path: 'summary', max: 120 },
  ],
  master: [
    { label: 'H1', path: 'h1', max: 70 },
    { label: 'SEO title', path: 'meta.title', max: 60 },
    { label: 'SEO description', path: 'meta.description', max: 155 },
  ],
}

const text = (v: unknown) => (typeof v === 'string' ? v : '')

const box: React.CSSProperties = {
  border: '1px solid var(--theme-elevation-150)',
  borderRadius: 4,
  padding: '12px 14px',
  marginBottom: 'var(--base)',
  fontSize: 13,
  lineHeight: 1.45,
}
const dot = (color: string): React.CSSProperties => ({
  display: 'inline-block',
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: color,
  marginRight: 6,
})
const GOOD = 'var(--theme-success-500)'
const BAD = 'var(--theme-error-500)'
const NEUTRAL = 'var(--theme-elevation-400)'

export const SeoCheck: React.FC<{ mode?: Mode }> = ({ mode = 'item' }) => {
  const rows = ROWS[mode]
  const keyword = useFormFields(([fields]) => text(fields.primaryKeyword?.value)).trim()
  const values = useFormFields(([fields]) =>
    rows.map((r) => text(fields[r.path]?.value)).join('\u0000'),
  ).split('\u0000')
  const needle = keyword.toLowerCase()

  return (
    <div style={box}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>SEO check</div>
      <div style={{ color: 'var(--theme-elevation-600)', marginBottom: 10 }}>
        {keyword ? (
          <>
            Primary keyword: <strong>{keyword}</strong>
          </>
        ) : (
          'Add a primary keyword in the SEO tab to see where it appears.'
        )}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {rows.map((r, i) => {
            const value = values[i] || ''
            const has = Boolean(needle) && value.toLowerCase().includes(needle)
            const over = value.length > r.max
            return (
              <tr key={r.path} style={{ borderTop: '1px solid var(--theme-elevation-100)' }}>
                <td style={{ padding: '6px 0' }}>
                  <span style={dot(!needle || !value ? NEUTRAL : has ? GOOD : BAD)} />
                  {r.label}
                  <div
                    style={{ color: 'var(--theme-elevation-500)', fontSize: 12, paddingLeft: 14 }}
                  >
                    {!value
                      ? 'Empty'
                      : !needle
                        ? 'No keyword to check'
                        : has
                          ? 'Keyword found'
                          : 'Keyword missing'}
                  </div>
                </td>
                <td
                  style={{
                    padding: '6px 0',
                    textAlign: 'right',
                    whiteSpace: 'nowrap',
                    color: over ? BAD : 'var(--theme-elevation-600)',
                    fontWeight: over ? 600 : 400,
                  }}
                >
                  {value.length} / {r.max}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div style={{ color: 'var(--theme-elevation-500)', fontSize: 12, marginTop: 8 }}>
        A guide only. It never stops a save.
      </div>
    </div>
  )
}
