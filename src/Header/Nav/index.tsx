'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { Header as HeaderType } from '@/payload-types'

type Props = {
  data: HeaderType
  mobileOpen?: boolean
  onNavigate?: () => void
}

export const HeaderNav: React.FC<Props> = ({ data, mobileOpen, onNavigate }) => {
  const items: any[] = (data?.navItems as any[]) || []
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const wrapRef = useRef<HTMLElement | null>(null)

  // Close on outside click and on Escape.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpenIndex(null)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenIndex(null)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  if (!items.length) return null

  const go = () => {
    setOpenIndex(null)
    onNavigate?.()
  }

  return (
    <nav ref={wrapRef as any} className={`ncx-nav${mobileOpen ? ' open' : ''}`}>
      <style>{`
        .ncx-nav{--crimson:#C62828;--ink:#1A1A2E;--muted:#6B7280;--line:#E4E4EA;--navy:#1A2035;
          display:flex;align-items:center;gap:2px;font-family:Inter,system-ui,sans-serif}
        .ncx-nav .item{position:relative}
        .ncx-nav .item > a,.ncx-nav .item > button{background:none;border:0;cursor:pointer;
          color:rgba(255,255,255,.82);font-size:.95rem;font-weight:500;font-family:inherit;
          padding:10px 12px;display:flex;align-items:center;gap:5px;border-radius:8px;
          text-decoration:none;transition:color .2s,background .2s;white-space:nowrap}
        .ncx-nav .item > a:hover,.ncx-nav .item > button:hover,
        .ncx-nav .item.open > button{color:#fff;background:rgba(255,255,255,.06)}
        .ncx-nav .chev{width:12px;height:12px;transition:transform .2s}
        .ncx-nav .item.open .chev{transform:rotate(180deg)}

        .ncx-nav .mega{position:absolute;top:calc(100% + 12px);left:50%;
          transform:translateX(-50%) translateY(-8px);background:#fff;border:1px solid var(--line);
          border-radius:16px;box-shadow:0 30px 60px -20px rgba(15,18,32,.35);padding:26px;
          opacity:0;pointer-events:none;transition:opacity .18s ease,transform .18s ease;z-index:90}
        .ncx-nav .item.open .mega{opacity:1;pointer-events:auto;transform:translateX(-50%) translateY(0)}
        .ncx-nav .mega.narrow{min-width:280px;left:0;transform:translateX(0) translateY(-8px)}
        .ncx-nav .item.open .mega.narrow{transform:translateX(0) translateY(0)}
        .ncx-nav .cols{display:grid;gap:22px}
        .ncx-nav .cols[data-n="1"]{grid-template-columns:1fr}
        .ncx-nav .cols[data-n="2"]{grid-template-columns:repeat(2,minmax(190px,1fr))}
        .ncx-nav .cols[data-n="3"]{grid-template-columns:repeat(3,minmax(180px,1fr))}
        .ncx-nav .cols[data-n="4"]{grid-template-columns:repeat(4,minmax(170px,1fr))}
        .ncx-nav h6{font-family:Poppins,system-ui,sans-serif;font-weight:600;font-size:.78rem;
          color:var(--crimson);letter-spacing:.02em;margin:0 0 10px;text-transform:none}
        .ncx-nav .mega a{display:block;font-size:.9rem;color:var(--ink);padding:6px 0;
          text-decoration:none;transition:color .15s}
        .ncx-nav .mega a:hover{color:var(--crimson)}
        .ncx-nav .mega .desc{display:block;font-size:.8rem;color:var(--muted);margin-top:2px}

        @media(max-width:1080px){
          .ncx-nav{display:none}
          .ncx-nav.open{display:flex;flex-direction:column;align-items:stretch;gap:0;
            position:absolute;top:100%;left:0;right:0;background:var(--navy);
            padding:8px 20px 20px;max-height:76vh;overflow-y:auto;
            box-shadow:0 20px 40px rgba(15,18,32,.35)}
          .ncx-nav.open .item > a,.ncx-nav.open .item > button{width:100%;justify-content:space-between;
            padding:13px 4px;font-size:1rem}
          .ncx-nav.open .mega{position:static;transform:none;opacity:1;pointer-events:auto;
            display:none;box-shadow:none;border:0;border-radius:10px;padding:10px 12px 16px;
            background:rgba(255,255,255,.05)}
          .ncx-nav.open .item.open .mega{display:block;transform:none}
          .ncx-nav.open .cols{grid-template-columns:1fr!important;gap:14px}
          .ncx-nav.open h6{color:#FF8A8A}
          .ncx-nav.open .mega a{color:rgba(255,255,255,.9)}
          .ncx-nav.open .mega a:hover{color:#fff}
          .ncx-nav.open .mega .desc{color:rgba(255,255,255,.55)}
        }
        @media(prefers-reduced-motion:reduce){.ncx-nav *{transition:none!important}}
      `}</style>

      {items.map((item, i) => {
        const columns = (item?.columns as any[]) || []
        const hasMenu = columns.length > 0
        const isOpen = openIndex === i

        if (!hasMenu) {
          return (
            <div className="item" key={item.id || i}>
              <Link href={item?.href || '#'} onClick={go}>
                {item?.label}
              </Link>
            </div>
          )
        }

        return (
          <div className={`item${isOpen ? ' open' : ''}`} key={item.id || i}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
            >
              {item?.label}
              <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            <div className={`mega${columns.length < 2 ? ' narrow' : ''}`}>
              <div className="cols" data-n={String(columns.length)}>
                {columns.map((col: any, c: number) => (
                  <div key={col.id || c}>
                    {col?.heading ? <h6>{col.heading}</h6> : null}
                    {((col?.links as any[]) || []).map((l: any, k: number) => (
                      <Link key={l.id || k} href={l?.href || '#'} onClick={go}>
                        {l?.label}
                        {l?.description ? <span className="desc">{l.description}</span> : null}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </nav>
  )
}
