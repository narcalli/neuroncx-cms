'use client'

import { useFormFields } from '@payloadcms/ui'
import React from 'react'

import { layoutWarnings } from './warnings'

/**
 * Above the layout: which layout the page follows, and any warnings, such
 * as a closing panel that is not the last row.
 */
export const LayoutNotes: React.FC = () => {
  const following = useFormFields(([fields]) => fields.usePageDefaults?.value) !== false
  const rows = useFormFields(([fields]) => fields.layout?.rows) as
    | { blockType?: string }[]
    | undefined
  const warnings = following ? [] : layoutWarnings((rows ?? []).map((r) => r.blockType))

  return (
    <div style={{ marginBottom: 'var(--base)' }}>
      {following ? (
        <p className="field-description">
          Following the page defaults. Turn off Use page defaults in the sidebar to change this
          page&apos;s sections.
        </p>
      ) : null}
      {warnings.map((w) => (
        <p
          key={w}
          role="status"
          style={{
            margin: '0 0 8px',
            padding: '8px 12px',
            borderRadius: 4,
            background: 'var(--theme-warning-100)',
            color: 'var(--theme-warning-800)',
          }}
        >
          {w}
        </p>
      ))}
    </div>
  )
}
