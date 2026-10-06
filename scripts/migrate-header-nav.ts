// Moves the Header global's old dropdown columns into the flat dropdown shape.
//
// Usage (from neuroncx-cms). `payload run` swallows both argv and stdout here,
// so this goes through tsx directly, with the env file Payload needs:
//   NODE_OPTIONS="--import=tsx/esm" node --env-file=.env scripts/migrate-header-nav.ts
//   NODE_OPTIONS="--import=tsx/esm" node --env-file=.env scripts/migrate-header-nav.ts --write
//
// Without --write it is a dry run and prints the plan.
//
// Rules, per nav item:
//   no columns   -> type: 'link', href untouched
//   has columns  -> type: 'dropdown', and for each column in order:
//                     its first link  -> items row carrying the column heading
//                     its other links -> items rows with no heading
//                   link descriptions are dropped; the panel has no room.
//
// A nav item already migrated to the old cards-and-rail shape is folded into
// the same flat list, so this is safe to re-run.
//
// `columns` is left in place as the undo. Nothing is deleted. Anything past
// the 12-row cap is named in the output rather than dropped silently.

import fs from 'node:fs'

import config from '@payload-config'
import { getPayload } from 'payload'

type LegacyLink = { label?: string | null; href?: string | null; description?: string | null }
type LegacyColumn = { heading?: string | null; links?: LegacyLink[] | null }
type Item = {
  label: string
  href: string
  badge: string | null
  groupHeading: string | null
  newTab: boolean
}

const WRITE = process.argv.includes('--write')
const ITEM_CAP = 12

const usable = (l: LegacyLink) => Boolean(l?.label && l?.href)
const external = (href?: string | null) => /^https?:\/\//.test(String(href || ''))

// `payload run` pipes stdout, where writes are async and a process.exit can
// drop them. Buffer the report and flush it synchronously before exiting.
const lines: string[] = []
const say = (line = '') => lines.push(line)
const flushAndExit = (code = 0) => {
  fs.writeSync(1, `${lines.join('\n')}\n`)
  process.exit(code)
}

const run = async () => {
  const payload = await getPayload({ config })
  const header = await payload.findGlobal({ slug: 'header', depth: 0 })
  const items = (header.navItems || []) as any[]

  if (!items.length) {
    say('Header has no nav items. Nothing to migrate.')
    flushAndExit()
    return
  }

  const dropped: string[] = []
  const skipped: string[] = []

  const next = items.map((item, i) => {
    const rowLabel = `row ${i + 1} "${item.label}"`
    const columns = (item.columns || []) as LegacyColumn[]
    const built: Item[] = []

    if (columns.length) {
      columns.forEach((col) => {
        // The heading goes on the first link of the column that survives, so
        // an unusable first row cannot take the group heading down with it.
        let headingPending = true
        ;(col.links || []).filter(Boolean).forEach((l) => {
          if (!usable(l)) {
            skipped.push(
              `${rowLabel}: "${l?.label || l?.href || 'empty link'}" has no label or no address`,
            )
            return
          }
          built.push({
            label: l.label as string,
            href: l.href as string,
            badge: null,
            groupHeading: headingPending ? col.heading || null : null,
            newTab: external(l.href),
          })
          headingPending = false
        })
      })
    } else {
      // Already on the cards-and-rail shape: fold it into the same flat list.
      const cells = (item.cells || []) as any[]
      const railItems = (item.rail?.railItems || []) as any[]
      cells.forEach((c) => {
        if (c?.title && c?.href)
          built.push({
            label: c.title,
            href: c.href,
            badge: c.badge || null,
            groupHeading: null,
            newTab: Boolean(c.newTab),
          })
      })
      railItems.forEach((r, ri) => {
        if (r?.label && r?.href)
          built.push({
            label: r.label,
            href: r.href,
            badge: null,
            groupHeading: ri === 0 ? item.rail?.railLabel || null : null,
            newTab: Boolean(r.newTab),
          })
      })
    }

    if (!built.length) {
      say(`  ${rowLabel}: link -> ${item.href || '(no address)'}`)
      return { label: item.label, type: 'link', href: item.href, columns: item.columns, id: item.id }
    }

    const kept = built.slice(0, ITEM_CAP)
    built.slice(ITEM_CAP).forEach((l) => {
      dropped.push(`${rowLabel}: "${l.label}" (${l.href}) did not fit the ${ITEM_CAP}-link cap`)
    })

    say(`  ${rowLabel}: dropdown -> ${kept.length} link(s)`)
    kept.forEach((l) =>
      say(`      ${l.groupHeading ? `[${l.groupHeading}] ` : '           '}${l.label} -> ${l.href}`),
    )

    return {
      label: item.label,
      type: 'dropdown',
      href: item.href,
      items: kept,
      columns: item.columns,
      id: item.id,
    }
  })

  if (skipped.length) {
    say('\nSkipped (incomplete in the old data):')
    skipped.forEach((s) => say(`  - ${s}`))
  }
  if (dropped.length) {
    say(`\nDid not fit, add these by hand if you want them:`)
    dropped.forEach((d) => say(`  - ${d}`))
  }

  if (!WRITE) {
    say('\nDry run. Re-run with --write to apply.')
    flushAndExit()
    return
  }

  // The afterChange hook calls revalidatePath, which only works inside a Next
  // request. Outside one it throws and takes the write down with it.
  await payload.updateGlobal({
    slug: 'header',
    data: { navItems: next } as any,
    context: { disableRevalidate: true },
  })
  say('\nWritten.')
  flushAndExit()
}

void run()
