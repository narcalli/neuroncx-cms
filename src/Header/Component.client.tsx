'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import type { Header } from '@/payload-types'

import { HeaderNav } from './Nav'

interface HeaderClientProps {
  data: Header
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data }) => {
  const [theme, setTheme] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const pathname = usePathname()

  useEffect(() => {
    setHeaderTheme(null)
    setMobileOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (headerTheme && headerTheme !== theme) setTheme(headerTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerTheme])

  // Deepens the bar once the page moves, so it separates from the hero.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const signInHref = data?.signInHref || 'https://dash.neuroncx.in'
  const external = /^https?:\/\//.test(signInHref)

  return (
    <header
      className={`ncx-header${scrolled ? ' scrolled' : ''}`}
      {...(theme ? { 'data-theme': theme } : {})}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .ncx-header{--navy:#1A2035;--navy-2:#252D4A;--crimson:#C62828;--ink:#1A1A2E;
          --muted:#6B7280;--line:#E4E4EA;
          position:sticky;top:0;z-index:80;background:var(--navy);
          transition:box-shadow .25s, padding .25s;padding:16px 0;
          font-family:Inter,system-ui,sans-serif}
        .ncx-header.scrolled{padding:10px 0;box-shadow:0 1px 0 rgba(255,255,255,.08),0 8px 24px rgba(15,18,32,.18)}
        .ncx-header .inner{max-width:1180px;margin:0 auto;padding:0 32px;
          display:flex;align-items:center;justify-content:space-between;gap:24px}
        .ncx-header .brand{display:flex;align-items:center;gap:11px;color:#fff;
          font-family:Poppins,system-ui,sans-serif;font-weight:700;font-size:1.16rem;
          letter-spacing:-.01em;text-decoration:none;white-space:nowrap}
        .ncx-header .pin{width:30px;height:30px;flex:0 0 30px;display:block}
        .ncx-header .cta-wrap{display:flex;align-items:center;gap:8px}
        .ncx-header .signin{color:rgba(255,255,255,.82);font-size:.95rem;font-weight:500;
          text-decoration:none;padding:10px 12px;border-radius:8px;white-space:nowrap}
        .ncx-header .signin:hover{color:#fff;background:rgba(255,255,255,.06)}
        .ncx-header .cta{background:var(--crimson);color:#fff;font-size:.95rem;font-weight:600;
          padding:11px 20px;border-radius:9px;text-decoration:none;white-space:nowrap;
          transition:transform .15s, background .15s}
        .ncx-header .cta:hover{background:#B02121;transform:translateY(-1px)}
        .ncx-header a:focus-visible,.ncx-header button:focus-visible{outline:2px solid #fff;outline-offset:2px}
        .ncx-header .toggle{display:none;background:none;border:0;cursor:pointer;padding:6px}
        @media(max-width:1080px){
          .ncx-header .inner{padding:0 20px}
          .ncx-header .cta-wrap{display:none}
          .ncx-header .toggle{display:block}
        }
        @media(prefers-reduced-motion:reduce){.ncx-header,.ncx-header *{transition:none!important}}
      `}</style>

      <div className="inner">
        <Link className="brand" href="/">
          <svg className="pin" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <circle cx="16" cy="16" r="16" fill="#C62828" />
            <path
              d="M16 7c-3.3 0-6 2.7-6 6 0 4.2 6 12 6 12s6-7.8 6-12c0-3.3-2.7-6-6-6z"
              fill="#fff"
            />
            <circle cx="16" cy="13" r="2.4" fill="#C62828" />
          </svg>
          NeuronCx
        </Link>

        <HeaderNav data={data} mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} />

        <div className="cta-wrap">
          {data?.signInLabel ? (
            external ? (
              <a className="signin" href={signInHref} rel="noopener noreferrer">
                {data.signInLabel}
              </a>
            ) : (
              <Link className="signin" href={signInHref}>
                {data.signInLabel}
              </Link>
            )
          ) : null}
          {data?.ctaLabel ? (
            <Link className="cta" href={data?.ctaHref || '/contact'}>
              {data.ctaLabel}
            </Link>
          ) : null}
        </div>

        <button
          className="toggle"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            {mobileOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
          </svg>
        </button>
      </div>
    </header>
  )
}
