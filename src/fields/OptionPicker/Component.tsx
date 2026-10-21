'use client'

import type { SelectFieldClientProps } from 'payload'

import React, { useMemo, useState } from 'react'
import { FieldLabel, FieldDescription, FieldError, useField } from '@payloadcms/ui'

export type PickerOption = { label: string; value: string }

export type OptionPickerProps = SelectFieldClientProps & {
  /** The choices. Defaults to the select field's own options. */
  options?: PickerOption[]
  /** The picture on each tile, above its label. */
  renderImage: (value: string) => React.ReactNode
  /** A search box above the grid. `noun` names what is searched ("icons"). */
  search?: { noun: string; noMatch: (query: string) => string }
  /** A first tile that clears the value, with this label. */
  clearLabel?: string
  /** Narrowest a tile gets; the grid fits as many per row as it can. */
  minTileWidth?: number
  labelSize?: number
  /** Height before the grid scrolls; null lets it grow to fit every tile. */
  maxHeight?: number | null
}

const labelOf = (o: unknown): PickerOption | null => {
  if (typeof o === 'string') return { label: o, value: o }
  if (o && typeof o === 'object' && 'value' in o) {
    const { label, value } = o as { label?: unknown; value: string }
    return { label: typeof label === 'string' ? label : value, value }
  }
  return null
}

/**
 * A select field shown as a grid of tiles, each with a picture and a label,
 * instead of a plain text dropdown. The stored value is the option's value,
 * exactly as the select would store it. A label's "(hint)" is left off the
 * tile and kept in its tooltip.
 *
 * The picture comes from `renderImage`, so a field gets its own wrapper
 * component (IconPicker, CardDesignPicker) that supplies it.
 */
export const OptionPickerField: React.FC<OptionPickerProps> = ({
  field,
  path,
  readOnly,
  options: given,
  renderImage,
  search,
  clearLabel,
  minTileWidth = 84,
  labelSize = 10.5,
  maxHeight = 300,
}) => {
  const { value, setValue, showError } = useField<string>({ path })
  const [query, setQuery] = useState('')

  const all = useMemo(
    () => given || (field.options || []).map(labelOf).filter((o): o is PickerOption => Boolean(o)),
    [given, field.options],
  )

  const options = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return all
    return all.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q))
  }, [all, query])

  return (
    <div className="field-type" style={{ marginBottom: 'var(--base)' }}>
      <FieldLabel label={field.label} path={path} required={field.required} />

      {search ? (
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${all.length} ${search.noun}…`}
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
      ) : null}

      <div
        role="listbox"
        aria-label={typeof field.label === 'string' ? field.label : field.name}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fill, minmax(${minTileWidth}px, 1fr))`,
          gap: 8,
          maxHeight: maxHeight ?? undefined,
          overflowY: 'auto',
          padding: 10,
          border: '1px solid var(--theme-elevation-100)',
          borderRadius: 4,
          background: 'var(--theme-elevation-50)',
        }}
      >
        {clearLabel ? (
          <button
            type="button"
            role="option"
            aria-selected={!value}
            title={clearLabel}
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
            <span style={{ fontSize: labelSize, lineHeight: 1.2, textAlign: 'center' }}>{clearLabel}</span>
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
              {renderImage(opt.value)}
              <span
                style={{
                  fontSize: labelSize,
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
        {search && options.length === 0 ? (
          <p style={{ gridColumn: '1 / -1', fontSize: 13, color: 'var(--theme-elevation-500)', margin: 0 }}>
            {search.noMatch(query)}
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
