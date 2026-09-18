import Link from 'next/link'
import React from 'react'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { Logo } from '@/components/Logo/Logo'

function hrefFor(link: any): string {
  if (
    link?.type === 'reference' &&
    typeof link?.reference?.value === 'object' &&
    link?.reference?.value?.slug
  ) {
    const prefix = link.reference.relationTo !== 'pages' ? `/${link.reference.relationTo}` : ''
    return `${prefix}/${link.reference.value.slug}`
  }
  return link?.url || '#'
}

export async function Footer() {
  // Tagged as `global_footer` so the revalidateFooter hook can invalidate it.
  const footerData: any = await getCachedGlobal('footer', 2)()

  const columns = footerData?.columns || []
  const legalItems = footerData?.legalItems || []

  return (
    <footer className="ncx-footer">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .ncx-footer{background:#16203A;color:#fff;margin-top:auto;
          font-family:Inter,Arial,sans-serif}
        .ncx-footer .inner{max-width:1120px;margin:0 auto;padding:64px 32px 36px}
        .ncx-footer .cols{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:48px}
        .ncx-footer .tagline{color:#9AA5BF;margin:16px 0 0;max-width:34ch;font-size:16px;line-height:1.6}
        .ncx-footer h5{font-family:Poppins,Arial,sans-serif;font-size:14px;
          font-weight:500;margin:0 0 14px;color:#9AA5BF}
        .ncx-footer a{display:block;color:#fff;text-decoration:none;font-size:16px;
          margin-bottom:9px;opacity:.85}
        .ncx-footer a:hover{opacity:1}
        .ncx-footer .note{margin-top:48px;padding-top:22px;border-top:1px solid rgba(255,255,255,.14);
          font-family:Poppins,Arial,sans-serif;font-size:14px;color:#9AA5BF;
          display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap}
        .ncx-footer .note a{display:inline;margin:0 0 0 16px;color:#9AA5BF;font-size:14px}
        @media(max-width:900px){
          .ncx-footer .inner{padding:44px 20px 28px}
          .ncx-footer .cols{grid-template-columns:1fr;gap:32px}
        }
      `}</style>

      <div className="inner">
        <div className="cols">
          <div>
            <Link href="/">
              <Logo />
            </Link>
            {footerData?.tagline ? <p className="tagline">{footerData.tagline}</p> : null}
          </div>

          {columns.map((column: any, i: number) => (
            <div key={i}>
              <h5>{column?.title}</h5>
              {(column?.navItems || []).map(({ link }: any, j: number) => (
                <Link key={j} href={hrefFor(link)}>
                  {link?.label}
                </Link>
              ))}
            </div>
          ))}

          {footerData?.email || footerData?.phone ? (
            <div>
              <h5>Contact</h5>
              {footerData?.email ? (
                <a href={`mailto:${footerData.email}`}>{footerData.email}</a>
              ) : null}
              {footerData?.phone ? <a href={`tel:${footerData.phone}`}>{footerData.phone}</a> : null}
            </div>
          ) : null}
        </div>

        <div className="note">
          <span>© {new Date().getFullYear()} NeuronCx</span>
          <span>
            {legalItems.map(({ link }: any, i: number) => (
              <Link key={i} href={hrefFor(link)}>
                {link?.label}
              </Link>
            ))}
          </span>
        </div>
      </div>
    </footer>
  )
}
