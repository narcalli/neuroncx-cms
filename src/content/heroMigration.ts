/**
 * The hero design migration (23 Oct 2026), as pure
 * functions over a stored record, so scripts/migrate-hero-design.ts applies
 * them and tests can check them.
 *
 * Entries (microApps): the old Own page `media` field moves to `heroMedia`,
 * keeping what is there; the hero design is Picture on the right where there
 * is a picture, else Conversation. A value already set
 * is kept, so running it twice changes nothing.
 *
 * Hubs: the chat follows the shared chat field
 * (src/fields/chatExample.ts): sender "entry" becomes "business", and square
 * brackets in a message, which the plain-text rule rejects, become round
 * ones ("[branch]" reads "(branch)").
 */

type Doc = Record<string, any>

const has = (v: unknown) => v !== undefined && v !== null && v !== ''

/** The fields to set on a microApps record, or an empty object when it needs nothing. */
export const entryHeroPatch = (doc: Doc): Doc => {
  const patch: Doc = {}
  const media = has(doc.heroMedia) ? doc.heroMedia : has(doc.media) ? doc.media : null
  if (!has(doc.heroMedia) && media) patch.heroMedia = media
  if (!has(doc.heroDesign)) patch.heroDesign = media ? 'rightPlacement' : 'conversation'
  return patch
}

const roundBrackets = (text: unknown) => (typeof text === 'string' ? text.replace(/\[/g, '(').replace(/\]/g, ')') : text)

/** The fields to set on a hubs record, or an empty object when it needs nothing. */
export const hubHeroPatch = (doc: Doc): Doc => {
  const patch: Doc = {}
  if (Array.isArray(doc.heroChat)) {
    const chat = doc.heroChat.map((row: Doc) => ({
      ...row,
      sender: row?.sender === 'entry' ? 'business' : row?.sender,
      text: roundBrackets(row?.text),
    }))
    if (JSON.stringify(chat) !== JSON.stringify(doc.heroChat)) patch.heroChat = chat
  }
  return patch
}

/** The same patch for a saved version, whose fields sit under `version`. */
export const versionPatch = (patch: Doc): Doc =>
  Object.fromEntries(Object.entries(patch).map(([k, v]) => [`version.${k}`, v]))
