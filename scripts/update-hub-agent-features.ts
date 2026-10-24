/**
 * Switches the Bot swarm hub's Agentic Flow Demo block to Agent features
 * mode, with the heading and intro from the 24 Oct 2026 brief, as a draft.
 * The block's saved events and note are kept (hidden in this mode). Nothing
 * is published. Safe to re-run: a block already in this shape is left alone.
 *
 * Usage (from neuroncx-cms):
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" node --env-file=.env scripts/update-hub-agent-features.ts [--dry-run] [--remote]
 *
 * Runs only against a database on this machine; add --remote to run it
 * anywhere else, after a backup.
 */
import fs from 'fs'
import { getPayload, ValidationError } from 'payload'

import config from '../src/payload.config'

const say = (s = '') => fs.writeSync(1, s + '\n')
const DRY = process.argv.includes('--dry-run')
const local = /^mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(process.env.DATABASE_URL || '')
if (!local && !process.argv.includes('--remote')) {
  say('Refusing to run: this database is not on this machine. Add --remote to run it anyway, after a backup.')
  process.exit(1)
}
say(`${local ? 'Local' : 'Remote'} database${DRY ? ', dry run: nothing is written' : ''}.`)

const BLOCK = {
  mode: 'agentFeatures' as const,
  heading: 'What each agent in the bot swarm does',
  intro: 'Pick a family, then an agent, to see what it does, its features and what it saves to your systems.',
}

const quiet = { overrideAccess: true, context: { disableRevalidate: true, skipRag: true } } as const
const payload = await getPayload({ config })

// The latest version, draft or published, so a pending draft is built on.
const hub = (
  await payload.find({ ...quiet, collection: 'hubs', where: { forCollection: { equals: 'microApps' } }, draft: true, limit: 1, depth: 0 })
).docs[0]
if (!hub) {
  say('Bot swarm hub not found.')
  process.exit(1)
}

const layout = hub.layout ?? []
const demos = layout.filter((b) => b.blockType === 'agenticFlowDemo')
if (demos.length !== 1) {
  say(`Expected one Agentic Flow Demo block in the hub layout, found ${demos.length}. Nothing written.`)
  process.exit(1)
}
const demo = demos[0] as (typeof layout)[number] & Record<string, unknown>
if (demo.mode === BLOCK.mode && demo.heading === BLOCK.heading && demo.intro === BLOCK.intro) {
  say('The Agentic Flow Demo block is already in Agent features mode with this copy. Nothing to do.')
  process.exit(0)
}
if (DRY) {
  say(`Dry run: would set the block (now mode ${demo.mode ?? 'flow'}, heading "${demo.heading}") to Agent features with the new heading and intro, as a draft.`)
  process.exit(0)
}

try {
  await payload.update({
    ...quiet,
    collection: 'hubs',
    id: hub.id,
    draft: true,
    data: {
      layout: layout.map((b) => (b === demo ? { ...b, ...BLOCK } : b)),
      _status: 'draft',
    } as never,
  })
  say('Hub saved as a draft: the Agentic Flow Demo block is in Agent features mode.')
} catch (err) {
  const why =
    err instanceof ValidationError ? err.data.errors.map((e) => `${e.path}: ${e.message}`).join('; ') : String(err)
  say(`Rejected by the CMS: ${why}`)
  process.exit(1)
}
process.exit(0)
