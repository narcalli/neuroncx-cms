/**
 * Sends every published website section to NCX post content, once.
 * After this, publishing in the admin keeps NCX up to date on its own.
 *
 * Usage (from neuroncx-cms):
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" node --env-file=.env scripts/ncx-backfill.ts [--dry-run] [collection ...]
 *
 *   --dry-run   print the sections that would be sent; sends nothing
 *   collection  limit to these collections, e.g. integrations
 *
 * Needs DATABASE_URL, and NCX_SYNC_URL + NCX_SYNC_KEY unless --dry-run.
 * Safe to run twice: unchanged sections are skipped. Run it while the job
 * scheduler is paused, so the same document is not sent from two places.
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'
import { projectDoc } from '../src/rag/serialize'
import { ragSources } from '../src/rag/sources'
import { syncDoc } from '../src/rag/sync'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const only = args.filter((a) => !a.startsWith('--'))
const slugs = Object.keys(ragSources).filter((s) => !only.length || only.includes(s))

const payload = await getPayload({ config })
const totals = { docs: 0, skipped: 0, sections: 0, sent: 0, unchanged: 0, archived: 0, failed: 0 }

for (const slug of slugs) {
  const source = ragSources[slug]
  const { docs } = await payload.find({
    collection: slug as any,
    pagination: false,
    depth: 0,
    draft: false,
    overrideAccess: true,
  })

  for (const doc of docs as any[]) {
    totals.docs++
    const visitorDoc = source.prepare ? source.prepare(doc) : doc
    const label = `${slug}/${doc.id} "${source.titleOf(visitorDoc)}"`

    if (dryRun) {
      if (!source.shouldIndex(doc)) {
        totals.skipped++
        console.log(`- ${label}: not visible on the site, skipped`)
        continue
      }
      const sections = projectDoc((payload.collections as any)[slug].config.fields, visitorDoc, {
        getBlock: (b) => (payload.blocks as any)?.[b],
        omit: source.omit,
      })
      totals.sections += sections.length
      console.log(`\n# ${label} ${source.urlOf(visitorDoc)}: ${sections.length} sections`)
      for (const s of sections) console.log(`  [${s.key}] ${s.heading} (${s.body.length} chars)\n    ${s.body.slice(0, 160).replace(/\n/g, ' / ')}`)
      continue
    }

    try {
      // No time budget here: this runs on a machine, not inside a request.
      const r = await syncDoc(payload, { collection: slug, id: String(doc.id) }, { budgetMs: Infinity })
      totals.sent += r.sent
      totals.unchanged += r.unchanged
      totals.archived += r.archived
      console.log(`- ${label}: sent ${r.sent}, unchanged ${r.unchanged}, archived ${r.archived}`)
    } catch (err) {
      totals.failed++
      console.log(`! ${label}: ${(err as Error).message}`)
    }
  }
}

console.log('\n', totals)
process.exit(totals.failed ? 1 : 0)
