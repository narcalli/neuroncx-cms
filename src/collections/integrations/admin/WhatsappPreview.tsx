'use client'
import { useConfig, useFormFields } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

/**
 * WhatsApp preview for an integration item (read only). A phone-style mock
 * of the two menu steps, the category row and then this item's row, and the
 * message itself, with live character counts against the WhatsApp limits.
 * The category row and the list button come from the saved category and the
 * main integrations master record.
 */

type Doc = Record<string, any>

const text = (v: unknown) => (typeof v === 'string' ? v : '')
const idOf = (v: unknown) =>
  v && typeof v === 'object' ? String((v as Doc).id) : v ? String(v) : ''

const BAD = 'var(--theme-error-500)'
const AMBER = 'var(--theme-warning-500)'
const MUTED = 'var(--theme-elevation-500)'

// "12 / 24", red over the hard cap, amber over the working limit.
const Count: React.FC<{ value: string; max: number; aim?: number }> = ({ value, max, aim }) => {
  const n = value.length
  const color = n > max ? BAD : aim && n > aim ? AMBER : MUTED
  return (
    <span style={{ fontSize: 11, color, marginLeft: 6, whiteSpace: 'nowrap' }}>
      {n} / {max}
      {aim ? ` (aim ${aim})` : ''}
    </span>
  )
}

const phone: React.CSSProperties = {
  maxWidth: 380,
  background: '#e5ddd5',
  borderRadius: 18,
  padding: 12,
  border: '1px solid var(--theme-elevation-150)',
  fontSize: 13,
  lineHeight: 1.4,
  color: '#111b21',
}
const card: React.CSSProperties = {
  background: '#fff',
  borderRadius: 8,
  padding: '8px 10px',
  marginBottom: 8,
  boxShadow: '0 1px 1px rgba(0,0,0,0.08)',
}
const step: React.CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: '#54656f',
  margin: '6px 2px 4px',
}
const button: React.CSSProperties = {
  background: '#fff',
  borderRadius: 8,
  padding: '7px 10px',
  marginBottom: 6,
  textAlign: 'center',
  color: '#027eb5',
  boxShadow: '0 1px 1px rgba(0,0,0,0.08)',
}

const Empty: React.FC<{ what: string }> = ({ what }) => (
  <span style={{ color: '#8696a0', fontStyle: 'italic' }}>{what}</span>
)

export const WhatsappPreview: React.FC = () => {
  const { config } = useConfig()
  const api = `${config.serverURL || ''}${config.routes?.api || '/api'}`

  const v = useFormFields(([f]) => {
    const rows = (path: string) =>
      f[path]?.rows?.length ?? (typeof f[path]?.value === 'number' ? f[path].value : 0)
    const keyPoints = Array.from({ length: rows('waKeyPoints') }, (_, i) =>
      text(f[`waKeyPoints.${i}.line`]?.value),
    )
    const buttons = Array.from({ length: rows('waButtons') }, (_, i) =>
      text(f[`waButtons.${i}.label`]?.value),
    )
    return JSON.stringify({
      category: idOf(f.category?.value),
      name: text(f.name?.value),
      rowTitle: text(f.waRowTitle?.value),
      rowDescription: text(f.waRowDescription?.value),
      headerType: text(f.waHeaderType?.value) || 'text',
      header: text(f.waHeader?.value),
      body: text(f.waBody?.value),
      keyPoints,
      footer: text(f.waFooter?.value),
      buttons,
      linkLabel: text(f.waLinkLabel?.value),
      link: text(f.waLink?.value),
    })
  })
  const d = JSON.parse(v) as {
    category: string
    name: string
    rowTitle: string
    rowDescription: string
    headerType: string
    header: string
    body: string
    keyPoints: string[]
    footer: string
    buttons: string[]
    linkLabel: string
    link: string
  }

  const [category, setCategory] = useState<Doc | null>(null)
  const [master, setMaster] = useState<Doc | null>(null)

  useEffect(() => {
    if (!d.category) return setCategory(null)
    let live = true
    fetch(`${api}/integrationCategories/${d.category}?depth=0&draft=true`, {
      credentials: 'include',
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((doc) => live && setCategory(doc))
      .catch(() => live && setCategory(null))
    return () => {
      live = false
    }
  }, [api, d.category])

  useEffect(() => {
    let live = true
    fetch(`${api}/integrationsMaster?where[isMain][equals]=true&limit=1&depth=0&draft=true`, {
      credentials: 'include',
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => live && setMaster(res?.docs?.[0] || null))
      .catch(() => live && setMaster(null))
    return () => {
      live = false
    }
  }, [api])

  const catTitle = text(category?.waRowTitle)
  const catDescription = text(category?.waRowDescription)
  const listButton = text(master?.waListButton)
  const sectionTitle = text(master?.waSectionTitle)

  return (
    <div style={{ marginBottom: 'calc(var(--base) * 1.5)' }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>WhatsApp preview</div>
      <div style={{ color: MUTED, fontSize: 12, marginBottom: 10 }}>
        Read only. The category row comes from the saved category, the list button and section title
        from the main integrations master record.
      </div>
      <div style={phone}>
        <div style={step}>1. Menu, the category row</div>
        <div style={card}>
          <div style={{ fontSize: 11, color: '#54656f' }}>
            {sectionTitle || <Empty what="Section title (master record)" />}
            <Count value={sectionTitle} max={24} />
          </div>
          <div style={{ fontWeight: 600, marginTop: 4 }}>
            {catTitle || (
              <Empty what={category ? 'Category row title is empty' : 'Choose a category'} />
            )}
            <Count value={catTitle} max={24} />
          </div>
          <div style={{ color: '#667781' }}>
            {catDescription || <Empty what="Category row description is empty" />}
            <Count value={catDescription} max={70} aim={60} />
          </div>
        </div>
        <div style={button}>
          {listButton || <Empty what="List button (master record)" />}
          <Count value={listButton} max={20} />
        </div>

        <div style={step}>2. Category list, this item&apos;s row</div>
        <div style={card}>
          <div style={{ fontSize: 11, color: '#54656f' }}>{text(category?.name)}</div>
          <div style={{ fontWeight: 600, marginTop: 4 }}>
            {d.rowTitle || (
              <Empty what={`Empty, filled from the name on save: ${d.name.slice(0, 24)}`} />
            )}
            <Count value={d.rowTitle} max={24} />
          </div>
          <div style={{ color: '#667781' }}>
            {d.rowDescription || <Empty what="Row description is empty" />}
            <Count value={d.rowDescription} max={70} aim={60} />
          </div>
        </div>

        <div style={step}>3. The message</div>
        <div style={card}>
          {d.headerType === 'image' ? (
            <div
              style={{
                background: '#d1d7db',
                borderRadius: 6,
                height: 90,
                display: 'grid',
                placeItems: 'center',
                color: '#54656f',
                marginBottom: 6,
              }}
            >
              Image header
            </div>
          ) : (
            <div style={{ fontWeight: 700, marginBottom: 4 }}>
              {d.header || <Empty what="Header is empty" />}
              <Count value={d.header} max={60} aim={30} />
            </div>
          )}
          <div style={{ whiteSpace: 'pre-wrap' }}>
            {d.body || <Empty what="Body is empty" />}
            <Count value={d.body} max={1024} aim={300} />
          </div>
          {d.keyPoints.length > 0 && (
            <div style={{ marginTop: 6 }}>
              {d.keyPoints.map((line, i) => (
                <div key={i}>
                  {line || <Empty what="Empty key point" />}
                  <Count value={line} max={60} />
                </div>
              ))}
              {d.keyPoints.length < 3 && (
                <div style={{ fontSize: 11, color: AMBER }}>Key points need 3 to 5 lines.</div>
              )}
            </div>
          )}
          {(d.footer || d.headerType) && (
            <div style={{ fontSize: 12, color: '#667781', marginTop: 6 }}>
              {d.footer || <Empty what="Footer is empty" />}
              <Count value={d.footer} max={60} aim={30} />
            </div>
          )}
        </div>
        {d.buttons.map((label, i) => (
          <div key={i} style={button}>
            {label || <Empty what="Button label is empty" />}
            <Count value={label} max={20} />
          </div>
        ))}
        <div style={button}>
          {d.linkLabel || <Empty what="Link button text is empty" />}
          <Count value={d.linkLabel} max={20} />
          <div style={{ fontSize: 11, color: '#667781' }}>
            {d.link || 'No link until the item has a slug'}
          </div>
        </div>
      </div>
    </div>
  )
}
