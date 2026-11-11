import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import type { AdminViewServerProps } from 'payload'
import React from 'react'

import { reviewQueue } from './queue'
import { reviewWorkflowOn } from './scope'

const when = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })

/** The review queue at /admin/review: every entry an author has marked Ready for review. */
export async function ReviewQueue({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, locale, permissions, visibleEntities } = initPageResult
  const { payload, i18n, user } = req
  const signedIn = Boolean(user)
  const [rows, on] = signedIn ? await Promise.all([reviewQueue(req), reviewWorkflowOn(req)]) : [[], false]
  const cell: React.CSSProperties = { padding: '10px 12px', borderTop: '1px solid var(--theme-elevation-100)', verticalAlign: 'top' }

  return (
    <DefaultTemplate
      i18n={i18n}
      locale={locale}
      params={params}
      payload={payload}
      permissions={permissions}
      searchParams={searchParams}
      user={user ?? undefined}
      visibleEntities={visibleEntities}
    >
      <Gutter>
        <h1 style={{ margin: '24px 0 8px' }}>Review queue</h1>
        {!signedIn ? (
          <p>Sign in to see the review queue.</p>
        ) : (
          <>
            <p style={{ color: 'var(--theme-elevation-600)', marginTop: 0 }}>
              Entries marked Ready for review on Pages, Posts, Industries, Industry topics and Bot swarm, oldest request first. Publishing an entry
              takes it off this list.
              {on ? null : ' The review workflow is off (Content standards), so authors can still publish and no review emails are sent.'}
            </p>
            {rows.length === 0 ? (
              <p>Nothing is waiting for review.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ textAlign: 'left' }}>
                    <th style={cell}>Entry</th>
                    <th style={cell}>Marked by</th>
                    <th style={cell}>Note</th>
                    <th style={cell}>Benchmark</th>
                    <th style={cell} />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.key}>
                      <td style={cell}>
                        <strong>{r.title}</strong>
                        <div style={{ color: 'var(--theme-elevation-600)' }}>{r.label}</div>
                      </td>
                      <td style={cell}>
                        {r.by}
                        <div style={{ color: 'var(--theme-elevation-600)' }}>{r.at ? when.format(new Date(r.at)) : ''}</div>
                      </td>
                      <td style={cell}>{r.note || <span style={{ color: 'var(--theme-elevation-500)' }}>(none)</span>}</td>
                      <td style={cell}>{r.benchmark}</td>
                      <td style={{ ...cell, whiteSpace: 'nowrap' }}>
                        <a href={r.edit}>Open</a>
                        {r.compare ? (
                          <>
                            {' · '}
                            <a href={r.compare}>Compare with live</a>
                          </>
                        ) : (
                          <div style={{ color: 'var(--theme-elevation-500)' }}>Not live yet</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </Gutter>
    </DefaultTemplate>
  )
}
