/**
 * Mega menu migration (24 Oct 2026). Copies the header's menu into the mega
 * menu fields (src/Header/megaMenuMigration.ts); the old fields are kept.
 * Written straight to the stored header, so a label longer than the new
 * limit is copied as it is rather than refused.
 *
 * Usage (from neuroncx-cms):
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" node --env-file=.env scripts/migrate-mega-menu.ts [--dry-run]
 *
 * --dry-run prints the new menu and writes nothing. Runs only against a
 * database on this machine; add --remote to run it anywhere else. Back up
 * first.
 */
import fs from 'fs'
import { getPayload } from 'payload'

import config from '../src/payload.config'
import { megaMenuPatch } from '../src/Header/megaMenuMigration'

const say = (s = '') => fs.writeSync(1, s + '\n')
const DRY = process.argv.includes('--dry-run')
const local = /^mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(process.env.DATABASE_URL || '')
if (!local && !process.argv.includes('--remote')) {
  say('Refusing to run: this database is not on this machine. Add --remote to run it anyway.')
  process.exit(1)
}
say(`${local ? 'Local' : 'Remote'} database${DRY ? ', dry run: nothing is written' : ''}.`)

const payload = await getPayload({ config })
const globals = (payload.db as any).globals
const header = await globals.findOne({ globalType: 'header' }).lean()
if (!header) {
  say('No header saved yet; nothing to copy.')
  process.exit(0)
}

const next = megaMenuPatch(header.navItems)
if (!next) {
  say('Every menu item is already in the mega menu shape; nothing to copy.')
  process.exit(0)
}

for (const item of next) {
  if (item.type === 'megaMenu') {
    const groups = item.groups as any[]
    say(`${item.label}: mega menu, ${groups.length} group(s)`)
    for (const g of groups) {
      say(`  ${g.label || '(no label)'}: ${g.items.map((i: any) => `${i.label} -> ${i.link.url}${i.link.newTab ? ' (new tab)' : ''}`).join('; ')}`)
    }
  } else {
    say(`${item.label}: link -> ${item.link?.url ?? item.link?.reference ?? '(none)'}`)
  }
  for (const [what, value, max] of [['menu label', item.label, 30]] as const) {
    if (String(value).length > max) say(`  note: ${what} "${value}" is ${String(value).length} characters, over the ${max} limit`)
  }
  for (const g of item.groups ?? []) {
    for (const i of g.items ?? []) {
      if (String(i.label).length > 30) say(`  note: item label "${i.label}" is ${String(i.label).length} characters, over the 30 limit; shorten it in the admin`)
    }
  }
}

if (!DRY) {
  // The raw collection: the globals model is shared by every global, and its
  // strict schema would drop navItems, which only the header has.
  const res = await globals.collection.updateOne({ _id: header._id }, { $set: { navItems: next } })
  if (res.modifiedCount !== 1) throw new Error(`Header not updated (${res.modifiedCount} changed).`)
  say('\nHeader updated. The old fields are kept.')
}
process.exit(0)
