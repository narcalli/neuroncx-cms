/**
 * Gives every user saved before roles existed a role (10 Nov 2026). Users with
 * no role get Author. --admin and --owner name, by email, the people who get
 * Admin and Content owner; a named user who already has a role is changed too.
 * Anyone else who already has a role is left alone, so a second run changes
 * nothing.
 *
 * Usage (from neuroncx-cms):
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" node --env-file=.env scripts/backfill-user-roles.ts --admin a@example.com[,b@example.com] [--owner c@example.com] [--dry-run]
 *
 * --dry-run lists what would change and writes nothing. Needs at least one
 * --admin: only admins can change roles in the admin afterwards, so a run that
 * left nobody as Admin could not be put right there. Every named email must
 * match a user, and nothing is written if one does not. Runs only against a
 * database on this machine; add --remote to run it anywhere else (production,
 * after the CMS deploy that adds the role field). Back up first.
 *
 * Writes only the role field, directly to the database, so it touches nothing
 * else on a user (API keys included) and needs no production PAYLOAD_SECRET.
 * Against production, give the production database in DATABASE_URL, which
 * takes precedence over the one in .env.
 */
import fs from 'fs'
import { getPayload } from 'payload'

import config from '../src/payload.config'
import type { User } from '../src/payload-types'

const say = (s = '') => fs.writeSync(1, s + '\n')
const args = process.argv.slice(2)
const DRY = args.includes('--dry-run')
const emailsAfter = (flag: string): string[] => {
  const i = args.indexOf(flag)
  if (i === -1 || !args[i + 1] || args[i + 1].startsWith('--')) return []
  return args[i + 1].split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
}
const admins = emailsAfter('--admin')
const owners = emailsAfter('--owner')

const local = /^mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(process.env.DATABASE_URL || '')
if (!local && !args.includes('--remote')) {
  say('Refusing to run: this database is not on this machine. Add --remote to run it anyway.')
  process.exit(1)
}
if (!admins.length) {
  say('Refusing to run: name at least one admin with --admin <email>.')
  process.exit(1)
}
const both = admins.filter((e) => owners.includes(e))
if (both.length) {
  say(`Refusing to run: named as both admin and content owner: ${both.join(', ')}.`)
  process.exit(1)
}
say(`${local ? 'Local' : 'Remote'} database${DRY ? ', dry run: nothing is written' : ''}.`)

const payload = await getPayload({ config })
const users = (await payload.find({ collection: 'users', depth: 0, pagination: false, overrideAccess: true })).docs
// Read back from the database, not the documents above: a missing role is
// what this script exists to find.
const missing = new Set(
  (
    await payload.find({
      collection: 'users',
      depth: 0,
      pagination: false,
      overrideAccess: true,
      where: { role: { exists: false } },
    })
  ).docs.map((u) => u.id),
)

const known = new Set(users.map((u) => u.email.toLowerCase()))
const unknown = [...admins, ...owners].filter((e) => !known.has(e))
if (unknown.length) {
  say(`Refusing to run: no user has the email ${unknown.join(', ')}. Nothing was written.`)
  process.exit(1)
}

const target = (u: User): User['role'] | null => {
  const email = u.email.toLowerCase()
  if (admins.includes(email)) return 'admin'
  if (owners.includes(email)) return 'contentOwner'
  return missing.has(u.id) ? 'author' : null
}

let changed = 0
for (const u of users) {
  const role = target(u)
  const before = missing.has(u.id) ? '(none)' : u.role
  if (!role || role === before) {
    say(`  ${u.email}: ${before}, unchanged`)
    continue
  }
  say(`  ${u.email}: ${before} -> ${role}`)
  changed++
  if (!DRY) {
    // Straight to the database, the role field only: a save through payload.update
    // runs the API key hooks, which re-encrypt each user's key with this machine's
    // PAYLOAD_SECRET and would break production keys if it differs.
    await payload.db.updateOne({ collection: 'users', id: u.id, data: { role } })
  }
}
say(`${users.length} users, ${changed} ${DRY ? 'would change' : 'changed'}.`)
process.exit(0)
