'use client'

import type { UIFieldClientProps } from 'payload'

import { useFormFields } from '@payloadcms/ui'
import React, { useLayoutEffect, useRef } from 'react'

import { cssProblems, htmlProblems } from './visualRules'

/**
 * A live preview of the custom visual in the admin, drawn the way the
 * website draws it: in a sealed box with the site's colours available. The
 * admin has none of the site's fonts loaded, so text falls back to a system
 * font here; the page preview shows the real ones.
 */

// The site's main colour, radius and shadow tokens (neuroncx-website globals.css).
const TOKENS = `--ncx-paper:#f6f7fa;--ncx-white:#fff;--ncx-raised:#fbfcfe;--ncx-cloud:#f5f5f7;--ncx-ink:#171c2e;--ncx-body:#1a1a2e;
--ncx-muted:#5a6379;--ncx-faint:#8a92a6;--ncx-rule:#e2e6ef;--ncx-rule-soft:#edf0f6;--ncx-rule-strong:#c9ced8;--ncx-navy:#1a2035;
--ncx-navy-tint:#252d4a;--ncx-crimson:#c62828;--ncx-crimson-hover:#a81f1f;--ncx-crimson-tint:#ffebee;--ncx-crimson-ink:#c62828;
--ncx-teal:#136b74;--ncx-teal-tint:#e4f1f1;--ncx-teal-ink:#136b74;--ncx-on-navy:#fff;
--ncx-shadow:0 1px 2px rgba(20,26,45,.05),0 8px 24px -12px rgba(20,26,45,.14);
--ncx-lift:0 2px 4px rgba(20,26,45,.06),0 16px 38px -16px rgba(20,26,45,.34);
--ncx-r-card:12px;--ncx-r-panel:20px;--ncx-r-section:26px;
--font-display:Poppins,system-ui;--font-body:Inter,system-ui;--font-label:'IBM Plex Mono',monospace;`

export const HeroCustomPreview: React.FC<UIFieldClientProps> = ({ path }) => {
  const base = path.slice(0, path.lastIndexOf('.') + 1)
  const html = useFormFields(([fields]) => fields[`${base}visualHtml`]?.value) as string | undefined
  const css = useFormFields(([fields]) => fields[`${base}visualCss`]?.value) as string | undefined
  const hostRef = useRef<HTMLDivElement>(null)
  const blocked = htmlProblems(html).length > 0 || cssProblems(css).length > 0

  useLayoutEffect(() => {
    const host = hostRef.current
    if (!host) return
    const root = host.shadowRoot ?? host.attachShadow({ mode: 'open' })
    root.innerHTML = blocked
      ? ''
      : `<style>:host{${TOKENS}display:block;position:relative;overflow:hidden;contain:paint;isolation:isolate;
container-type:inline-size;container-name:visual;font-family:var(--font-body);color:var(--ncx-body)}
*,*::before,*::after{box-sizing:border-box}${css ?? ''}</style>${html ?? ''}`
  }, [html, css, blocked])

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Preview</div>
      {!html?.trim() ? (
        <p style={{ fontSize: 13, opacity: 0.7, margin: 0 }}>Paste HTML above to see the visual here.</p>
      ) : blocked ? (
        <p style={{ fontSize: 13, margin: 0 }}>Fix the problems shown on the HTML or CSS box to see the preview.</p>
      ) : null}
      <div
        ref={hostRef}
        style={{
          display: html?.trim() && !blocked ? 'block' : 'none',
          background: '#f5f5f7',
          border: '1px solid #e2e6ef',
          borderRadius: 12,
          padding: 16,
          maxWidth: 720,
        }}
      />
    </div>
  )
}
