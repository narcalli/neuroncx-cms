/**
 * Prints what the knowledge base sync would send to NCX post content for a
 * document, without sending anything or writing anything.
 *
 * For each document it says what happens today (sent, or nothing, and why),
 * then shows the post contents, title, text and link, exactly as the sync
 * composes them (src/rag/sync.ts). A document that is not eligible today is
 * previewed as it would be once published, and for an entry, made Live.
 * Relationship names are looked up as a visitor sees them, so a draft family
 * or a Planned agent is left out of the preview just as it would be.
 *
 * Usage (from neuroncx-cms):
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" node --env-file=.env scripts/rag-dry-run.ts
 *   ... scripts/rag-dry-run.ts microApps payment-services hubs bot-swarm
 *
 * Arguments are collection and slug pairs. With none, it runs for Payment
 * services and the Bot swarm hub.
 */
import fs from 'fs'
import { getPayload, type CollectionSlug } from 'payload'

import config from '../src/payload.config'
import { getRagSource } from '../src/rag/sources'
import { composePostContent } from '../src/rag/sync'

const lines: string[] = []
const say = (s = '') => lines.push(s)

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const targets: [string, string][] = []
for (let i = 0; i + 1 < args.length; i += 2) targets.push([args[i], args[i + 1]])
if (!targets.length) targets.push(['microApps', 'payment-services'], ['hubs', 'bot-swarm'])

const payload = await getPayload({ config })

for (const [collection, slug] of targets) {
  say('='.repeat(78))
  const source = getRagSource(collection)
  if (!source) {
    say(`${collection}/${slug}: not a knowledge base source.`)
    continue
  }
  const find = (draft: boolean) =>
    payload.find({
      collection: collection as CollectionSlug,
      where: { slug: { equals: slug } },
      draft,
      depth: 0,
      limit: 1,
      overrideAccess: true,
    })
  const published = (await find(false)).docs[0] as any
  const latest = (await find(true)).docs[0] as any
  if (!latest) {
    say(`${collection}/${slug}: not found.`)
    continue
  }

  const reasons: string[] = []
  if (published?._status !== 'published') reasons.push('not published (a draft)')
  if ('status' in latest && !['live', 'pilot'].includes(published?.status ?? latest.status)) {
    reasons.push(`status is ${published?.status ?? latest.status}, not Live or Pilot`)
  }
  if ((published ?? latest).includeInKbase === false) reasons.push('Include in knowledge base is off')
  const eligible = Boolean(published) && source.shouldIndex(published)

  say(`${collection}/${slug}: ${latest.name}`)
  say(
    eligible
      ? 'Today: sent. Published and eligible; the sections below are what NCX holds once synced.'
      : `Today: nothing is sent (${reasons.join('; ') || 'not eligible'}). Any earlier sections would be archived.`,
  )

  // Preview: the eligible published version, else the latest version as if
  // published (and Live, for an entry with a status).
  const doc = eligible
    ? published
    : { ...latest, _status: 'published', ...('status' in latest ? { status: 'live' } : {}) }
  if (!eligible) {
    say(
      `Preview: as it would be sent once published${'status' in latest ? ' and made Live' : ''}, from the latest saved version.`,
    )
  }
  if (doc.includeInKbase === false) {
    say('Include in knowledge base is off, so nothing would be sent.')
    continue
  }

  const docTitle = String(source.titleOf(doc) || '').trim() || 'NeuronCX'
  const sections = source.serialize ? await source.serialize(payload, doc) : []
  say(`Sections: ${sections.length}. Each arrives in NCX post content as Awaiting Approval.`)
  sections.forEach((section, i) => {
    const { title, text, link } = composePostContent(docTitle, source.urlOf(doc), section)
    say()
    say(`--- ${i + 1}. ${title}`)
    say(`    key  ${collection}:${doc.id}:${section.key}`)
    say(`    link ${link}`)
    say(`    ${text.length} characters:`)
    for (const line of text.split('\n')) say(`    | ${line}`)
  })
  say()
}

fs.writeSync(1, lines.join('\n') + '\n')
process.exit(0)
