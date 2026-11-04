'use client'
import { useFormFields } from '@payloadcms/ui'
import React from 'react'

import { searchWarnings } from './searchCheck'

/**
 * Search check (sidebar, read only, never blocks saving or publishing): the
 * warnings from searchWarnings for the SEO tab's current values.
 */

const box: React.CSSProperties = {
  border: '1px solid var(--theme-elevation-150)',
  borderRadius: 4,
  padding: '12px 14px',
  marginBottom: 'var(--base)',
  fontSize: 13,
  lineHeight: 1.45,
}

export const SearchCheck: React.FC = () => {
  const title = useFormFields(([fields]) => fields['meta.title']?.value)
  const description = useFormFields(([fields]) => fields['meta.description']?.value)
  const noIndex = useFormFields(([fields]) => fields['meta.noIndex']?.value)
  const warnings = searchWarnings({ title, description, noIndex })

  return (
    <div style={box}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Search check</div>
      {warnings.length ? (
        <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--theme-warning-700)' }}>
          {warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : (
        <div style={{ color: 'var(--theme-success-600)' }}>SEO title and description are set.</div>
      )}
      <div style={{ color: 'var(--theme-elevation-500)', fontSize: 12, marginTop: 8 }}>
        Set in the SEO tab. A guide only. It never stops a save.
      </div>
    </div>
  )
}
