import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import type { AdminViewServerProps } from 'payload'
import React from 'react'

import { isApiKeyRequest } from '@/access/apiKeyRequest'

import { pendingSchedules, reviewQueue } from './queue'
import { canPublish, reviewWorkflowOn } from './scope'

const when = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Kolkata',
})

/**
 * The review queue at /admin/review: every entry an author has marked Ready
 * for review, read with the viewer's own access. Custom admin views skip
 * Payload's admin-access check, so this one checks for itself: people only,
 * never a key, and the scheduled jobs (read with full access) only for those
 * who can publish.
 */
export async function ReviewQueue({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, locale, permissions, visibleEntities } = initPageResult
  const { payload, i18n, user } = req
  const signedIn = Boolean(user) && !isApiKeyRequest(req)
  const publisher = signedIn && canPublish(user)
  const rows = signedIn ? await reviewQueue(req) : []
  const schedules = publisher ? await pendingSchedules(req) : []
  const on = signedIn ? await reviewWorkflowOn(req) : false
  const cell: React.CSSProperties = {
    padding: '10px 12px',
    borderTop: '1px solid var(--theme-elevation-100)',
    verticalAlign: 'top',
  }

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
              Entries marked Ready for review on Pages, Posts, Industries, Industry topics and Bot
              swarm, oldest request first. Publishing an entry takes it off this list.
              {on
                ? null
                : ' The review workflow is off (Content standards), so authors can still publish and no review emails are sent.'}
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
                        <div style={{ color: 'var(--theme-elevation-600)' }}>
                          {r.at ? when.format(new Date(r.at)) : ''}
                        </div>
                      </td>
                      <td style={cell}>
                        {r.note || (
                          <span style={{ color: 'var(--theme-elevation-500)' }}>(none)</span>
                        )}
                      </td>
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
            {publisher ? (
              <>
                <h2 style={{ margin: '32px 0 8px' }}>Scheduled publishes and unpublishes</h2>
                <p style={{ color: 'var(--theme-elevation-600)', marginTop: 0 }}>
                  Not run yet, or failed when they ran, soonest first. A schedule runs as the person
                  who made it, so one made by an author is refused when it runs while the review
                  workflow is on: an owner should cancel it and schedule it again, or publish it.
                </p>
                {schedules.length === 0 ? (
                  <p>Nothing is scheduled.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                      <tr style={{ textAlign: 'left' }}>
                        <th style={cell}>Entry</th>
                        <th style={cell}>Runs</th>
                        <th style={cell}>Scheduled by</th>
                        <th style={cell}>With the workflow on</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedules.map((s) => (
                        <tr key={s.key}>
                          <td style={cell}>
                            <a href={s.edit}>
                              <strong>{s.title}</strong>
                            </a>
                            <div style={{ color: 'var(--theme-elevation-600)' }}>
                              {s.type === 'publish' ? 'Publish' : 'Unpublish'} · {s.collection}
                            </div>
                          </td>
                          <td style={cell}>
                            {s.at ? when.format(new Date(s.at)) : 'As soon as jobs run'}
                          </td>
                          <td style={cell}>
                            {s.by}
                            <div style={{ color: 'var(--theme-elevation-600)' }}>{s.role}</div>
                          </td>
                          <td style={cell}>
                            {s.failed ? (
                              <strong>Failed when it ran: publish it, or schedule it again</strong>
                            ) : s.noUser ? (
                              <strong>Runs with full access: check where it came from</strong>
                            ) : s.refusedWhenOn ? (
                              <strong>Will be refused</strong>
                            ) : s.inScope ? (
                              'Runs as scheduled'
                            ) : (
                              'Not covered by the workflow'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            ) : null}
          </>
        )}
      </Gutter>
    </DefaultTemplate>
  )
}
