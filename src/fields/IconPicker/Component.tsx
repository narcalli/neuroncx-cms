'use client'

import type { SelectFieldClientProps } from 'payload'

import React, { useMemo, useState } from 'react'
import { FieldLabel, FieldDescription, FieldError, useField } from '@payloadcms/ui'

import { iconOptions } from '../icons'
import { IconGlyph } from './icons'

/**
 * Replaces the plain text dropdown with a grid you can actually see —
 * every option shows its real icon, not just a name. Used everywhere an
 * icon is picked, since it is wired in once from iconField() rather than
 * per block.
 */
type Props = SelectFieldClientProps & { allowClear?: boolean }

export const IconPickerField: React.FC<Props> = ({ field, path, readOnly, allowClear }) => {
  const { value, setValue, showError } = useField<string>({ path })
  const [query, setQuery] = useState('')

  const options = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return iconOptions
    return iconOptions.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q))
  }, [query])

  return (
    <div className="field-type" style={{ marginBottom: 'var(--base)' }}>
      <FieldLabel label={field.label} path={path} required={field.required} />

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`Search ${iconOptions.length} icons…`}
        disabled={readOnly}
        style={{
          width: '100%',
          marginBottom: 10,
          padding: '8px 10px',
          borderRadius: 4,
          border: '1px solid var(--theme-elevation-150)',
          background: 'var(--theme-input-bg)',
          color: 'var(--theme-text)',
          fontSize: 13,
        }}
      />

      <div
        role="listbox"
        aria-label={typeof field.label === 'string' ? field.label : 'Icon'}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))',
          gap: 8,
          maxHeight: 300,
          overflowY: 'auto',
          padding: 10,
          border: '1px solid var(--theme-elevation-100)',
          borderRadius: 4,
          background: 'var(--theme-elevation-50)',
        }}
      >
        {allowClear ? (
          <button
            type="button"
            role="option"
            aria-selected={!value}
            title="No icon"
            disabled={readOnly}
            onClick={() => setValue(null)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '10px 6px',
              borderRadius: 6,
              border: !value ? '2px solid var(--theme-success-500, #2563eb)' : '1px dashed var(--theme-elevation-150)',
              background: !value ? 'var(--theme-elevation-100)' : 'var(--theme-input-bg)',
              color: 'var(--theme-elevation-400)',
              cursor: readOnly ? 'default' : 'pointer',
            }}
          >
            <span style={{ fontSize: 10.5, lineHeight: 1.2, textAlign: 'center' }}>No icon</span>
          </button>
        ) : null}
        {options.map((opt) => {
          const selected = opt.value === value
          return (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={selected}
              title={opt.label}
              disabled={readOnly}
              onClick={() => setValue(opt.value)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                padding: '10px 6px',
                borderRadius: 6,
                border: selected ? '2px solid var(--theme-success-500, #2563eb)' : '1px solid var(--theme-elevation-150)',
                background: selected ? 'var(--theme-elevation-100)' : 'var(--theme-input-bg)',
                color: 'var(--theme-text)',
                cursor: readOnly ? 'default' : 'pointer',
              }}
            >
              <span style={{ width: 22, height: 22, display: 'block' }}>
                <IconGlyph name={opt.value} />
              </span>
              <span
                style={{
                  fontSize: 10.5,
                  lineHeight: 1.2,
                  textAlign: 'center',
                  color: 'var(--theme-elevation-500)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                }}
              >
                {opt.label.replace(/\s*\(.*\)\s*$/, '')}
              </span>
            </button>
          )
        })}
        {options.length === 0 ? (
          <p style={{ gridColumn: '1 / -1', fontSize: 13, color: 'var(--theme-elevation-500)', margin: 0 }}>
            No icon matches &quot;{query}&quot;.
          </p>
        ) : null}
      </div>

      <FieldDescription
        description={field.admin?.description}
        path={path}
      />
      {showError ? <FieldError path={path} /> : null}
    </div>
  )
}
