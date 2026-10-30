/**
 * Writes docs/cms/blocks-reference.md from the live block
 * configs: every page block, every field, with types, limits, options and the
 * editor guidance from each field's description. Written for Claude to read
 * before producing page content, so it leaves out admin layout detail (rows,
 * widths) and keeps everything that decides what a valid, good entry is.
 *
 * Reads the Pages collection and the globals directly rather than
 * payload.config, so it does not need a database or a running CMS.
 *
 *   NODE_OPTIONS="--no-deprecation --import=tsx/esm" node scripts/block-reference.ts
 *
 * Production usage comes from the public pages API; pass PROD_URL to point it
 * elsewhere, or PROD_URL=none to skip it.
 */
import fs from 'fs'
import path from 'path'
import type { Block } from 'payload'

import { Pages } from '../src/collections/Pages'
import { Header } from '../src/Header/config'
import { Footer } from '../src/Footer/config'
import { SiteSettings } from '../src/SiteSettings/config'
import { iconOptions } from '../src/fields/icons'

const ROOT = path.resolve(import.meta.dirname, '..')
// Kept in the repo so each block change can commit its reference alongside.
const OUT = path.resolve(ROOT, 'docs', 'cms', 'blocks-reference.md')
const PROD_URL = process.env.PROD_URL ?? 'https://main.duebzy83yxxuo.amplifyapp.com'

// Blocks whose headline renders the page's <h1>. Checked against the website
// components; a page should carry exactly one of them, first, with the page
// hero set to none.
const H1_BLOCKS = new Set([
  'conversationHero', 'statHero', 'heroFullBackground', 'heroRightPlacement', 'heroWorkforceGrid', 'agenticHero',
  'heroCustom', 'heroHarness', 'heroStack', 'integrationsLanding',
])

// Where a config's own doc comment no longer matches what the block draws.
// Everything else comes from the comment above the block's config.
const PURPOSE_OVERRIDES: Record<string, string> = {
  heroRightPlacement:
    'Hero with copy on the left and an image or video on the right, on the light stage. The picture is always shown whole, never cropped; its left, top and bottom edges fade into the page. Suits a diagram, screenshot or product shot.',
  agenticHero:
    'Hero on the light stage with a word-by-word headline reveal and an animated network of agents and people around a central point. Built for agentic CRM and workflow pages.',
  heroFullBackground:
    'Hero over a full-bleed background image or video with a dark overlay for legibility, or with the media placed on the right. Suits photos and textures; for a diagram with its own text use Media placement Right, or Hero (Right Placement).',
  conversationHero:
    'Hero on the light stage: headline, subhead, two buttons and capability chips on the left; a chat transcript card on the right, with optional workflow steps and a row of stats. Leaving the conversation empty leaves the right half of the hero blank.',
  statHero: 'Hero on the light stage with a headline, subhead, two buttons and a row of headline figures.',
  whatsappWidget:
    'A floating "Chat with us" button fixed to the bottom-right corner that opens WhatsApp. It appears once the visitor scrolls, and hides while the closing call to action is on screen. Not a section: it takes no space in the page.',
}

// Read loosely on purpose: this walks every field shape Payload has, and the
// full Field union would need a type guard at every property it touches.
type AnyField = Record<string, any>

const q = (s: unknown) => `"${String(s).replace(/\s+/g, ' ').trim()}"`
const code = (s: unknown) => '`' + String(s) + '`'
const descOf = (f: AnyField) => {
  const d = f.admin?.description
  return typeof d === 'string' && d.trim() ? d.replace(/\s+/g, ' ').trim() : ''
}
const labelOf = (f: AnyField) => (typeof f.label === 'string' ? f.label : '')

/** Turns a simple admin.condition into words; anything cleverer is just "conditional". */
const conditionText = (f: AnyField): string => {
  const c = f.admin?.condition
  if (typeof c !== 'function') return ''
  // At runtime the transpiler has rewritten the source: double quotes, no
  // spaces. Match either quote style so this reads the same in both.
  const src: string = c.toString()
  const m = src.match(/siblingData\??\.(\w+)\s*(===|!==)\s*['"]([^'"]+)['"]/)
  if (m) return m[2] === '===' ? `only when ${code(m[1])} is ${code(m[3])}` : `only when ${code(m[1])} is not ${code(m[3])}`
  const inc = src.match(/\[([^\]]+)\]\.includes\((?:siblingData\??\.)?(\w+)\)/)
  if (inc) {
    const values = inc[1].split(',').map((v) => v.trim().replace(/^['"]|['"]$/g, ''))
    return `only when ${code(inc[2])} is ${values.map(code).join(' or ')}`
  }
  const b = src.match(/Boolean\(\s*siblingData\??\.(\w+)/)
  if (b) return `only when ${code(b[1])} is on`
  const bool = src.match(/siblingData\??\.(\w+)\s*(===|!==)\s*(true|false)/)
  if (bool) {
    const on = (bool[2] === '===') === (bool[3] === 'true')
    return `only when ${code(bool[1])} is ${on ? 'on' : 'off'}`
  }
  return 'shown only in some states'
}

const isIconSelect = (f: AnyField) =>
  f.type === 'select' && Array.isArray(f.options) && f.options.length === iconOptions.length &&
  f.options.every((o: any, i: number) => o.value === iconOptions[i].value)

/** A link group: link(), optionalCta() and friends all share this shape. */
const linkShape = (f: AnyField) => {
  if (f.type !== 'group') return null
  const flat = flatten(f.fields || [])
  const names = new Set(flat.map((x) => x.name))
  if (!(names.has('type') && names.has('url') && names.has('reference'))) return null
  const ref = flat.find((x) => x.name === 'reference')
  const label = flat.find((x) => x.name === 'label')
  const appearance = flat.find((x) => x.name === 'appearance')
  return {
    labelRequired: Boolean(label?.required),
    required: Boolean(ref?.required),
    appearance: appearance?.options?.map((o: any) => (typeof o === 'string' ? o : o.value)) as string[] | undefined,
  }
}

/** Layout-only wrappers carry no data: lift their children up a level. */
function flatten(fields: AnyField[]): AnyField[] {
  const out: AnyField[] = []
  for (const f of fields as AnyField[]) {
    if (f.type === 'ui' || f.admin?.hidden) continue
    if (f.type === 'row' || f.type === 'collapsible') out.push(...flatten(f.fields))
    else if (f.type === 'tabs') for (const t of f.tabs) out.push(...(t.name ? [{ ...t, type: 'group' }] : flatten(t.fields)))
    else out.push(f)
  }
  return out
}

function describe(f: AnyField, depth: number): string[] {
  const pad = '  '.repeat(depth)
  const bits: string[] = []
  const notes: string[] = []

  const link = linkShape(f)
  if (link) {
    bits.push('link')
    if (link.required) bits.push('**required**')
    const parts = [
      `${code('type')}: ${code('reference')} (an internal page or post, set in ${code('reference')}) or ${code('custom')} (a URL or site path in ${code('url')})`,
      `${code('label')}${link.labelRequired ? ' (required)' : ''}: the visible text`,
      `${code('newTab')}: open in a new tab`,
    ]
    if (link.appearance) parts.push(`${code('appearance')}: ${link.appearance.map(code).join(' or ')}`)
    const head = `${pad}- ${code(f.name)} (${bits.join(', ')})${labelOf(f) ? ` "${labelOf(f)}"` : ''}`
    const lines = [head + (descOf(f) ? `: ${descOf(f)}` : '')]
    lines.push(`${pad}  - ${parts.join('; ')}`)
    return lines
  }

  switch (f.type) {
    case 'text': case 'textarea': case 'email':
      bits.push(f.type === 'textarea' ? 'textarea' : f.type)
      if (f.maxLength) notes.push(`max ${f.maxLength} characters`)
      if (f.minLength) notes.push(`min ${f.minLength} characters`)
      break
    case 'number':
      bits.push('number')
      if (f.min !== undefined) notes.push(`min ${f.min}`)
      if (f.max !== undefined) notes.push(`max ${f.max}`)
      break
    case 'checkbox': bits.push('checkbox'); break
    case 'date': bits.push('date'); break
    case 'richText': bits.push('rich text'); break
    case 'json': bits.push('json'); break
    case 'code': bits.push('code'); break
    case 'upload':
      bits.push(`upload from ${code(f.relationTo)}`)
      if (f.filterOptions) notes.push('images only')
      break
    case 'relationship':
      bits.push(`relationship to ${[f.relationTo].flat().map(code).join(' or ')}${f.hasMany ? ', several allowed' : ''}`)
      break
    case 'select': case 'radio':
      if (isIconSelect(f)) { bits.push('icon name from the icon library'); break }
      bits.push(f.hasMany ? `${f.type}, several allowed` : f.type)
      notes.push('one of: ' + (f.options || []).map((o: any) =>
        typeof o === 'string' ? code(o) : `${code(o.value)}${o.label && o.label !== o.value ? ` (${typeof o.label === 'string' ? o.label : o.value})` : ''}`).join(', '))
      break
    case 'array':
      bits.push('list')
      if (f.minRows && f.maxRows) notes.push(f.minRows === f.maxRows ? `exactly ${f.minRows} items` : `${f.minRows} to ${f.maxRows} items`)
      else if (f.minRows) notes.push(`at least ${f.minRows} items`)
      else if (f.maxRows) notes.push(`up to ${f.maxRows} items`)
      break
    case 'group': bits.push('group'); break
    case 'blocks': bits.push('blocks'); break
    default: bits.push(String(f.type))
  }

  if (f.required) bits.push('**required**')
  if (f.defaultValue !== undefined && typeof f.defaultValue !== 'function' && f.type !== 'array') {
    const dv = f.defaultValue
    if (!(Array.isArray(dv) && !dv.length)) notes.push(`default ${code(typeof dv === 'string' ? dv : JSON.stringify(dv))}`)
  }
  const cond = conditionText(f)
  if (cond) notes.push(cond)

  const label = labelOf(f)
  const head = `${pad}- ${code(f.name)} (${bits.join(', ')})` + (label && label.toLowerCase() !== String(f.name).toLowerCase() ? ` "${label}"` : '')
  const tail = [notes.join('; '), descOf(f)].filter(Boolean).join('. ')
  const lines = [head + (tail ? `: ${tail}` : '')]

  if (f.type === 'array' || f.type === 'group') for (const sub of flatten(f.fields || [])) lines.push(...describe(sub, depth + 1))
  if (f.type === 'blocks') lines.push(`${pad}  - one of: ${(f.blocks || []).map((b: Block) => code(b.slug)).join(', ')}`)
  return lines
}

/** The comment directly above `export const X: Block` in the block's config file. */
function purposeFromSource(slug: string): string {
  const dir = path.join(ROOT, 'src', 'blocks')
  for (const name of fs.readdirSync(dir)) {
    const file = path.join(dir, name, 'config.ts')
    if (!fs.existsSync(file)) continue
    const src = fs.readFileSync(file, 'utf8')
    if (!new RegExp(`slug:\\s*'${slug}'`).test(src)) continue
    // The comment body may not contain "*/", so an earlier comment in the
    // file (a validator's, say) cannot run on into this one.
    const m = src.match(/\/\*\*((?:(?!\*\/)[\s\S])*?)\*\/\s*export const \w+\s*:\s*Block/)
    if (!m) return ''
    return m[1].split('\n').map((l) => l.replace(/^\s*\*\s?/, '').trim()).filter(Boolean).join(' ')
  }
  return ''
}

/** Strip the Appearance collapsible withPresentation appended, and say which set it was. */
function presentationOf(block: Block): { set: 'full' | 'minimal' | 'own'; fields: AnyField[] } {
  const fields = [...(block.fields as AnyField[])]
  const last = fields[fields.length - 1]
  if (last?.type === 'collapsible' && last.label === 'Appearance') {
    fields.pop()
    const names = flatten(last.fields).map((f) => f.name)
    return { set: names.includes('background') ? 'full' : 'minimal', fields }
  }
  return { set: 'own', fields }
}

async function productionUsage(): Promise<Map<string, string[]>> {
  const used = new Map<string, string[]>()
  if (PROD_URL === 'none') return used
  try {
    const res = await fetch(`${PROD_URL}/api/pages?limit=200&depth=0&draft=false`)
    const { docs } = (await res.json()) as { docs: any[] }
    for (const p of docs) for (const b of p.layout || []) {
      const list = used.get(b.blockType) || []
      if (!list.includes(p.slug)) list.push(p.slug)
      used.set(b.blockType, list)
    }
  } catch { /* offline: leave usage out rather than fail */ }
  return used
}

async function main() {
  const pageFields = flatten(Pages.fields as AnyField[])
  const layout = pageFields.find((f) => f.name === 'layout') as AnyField
  const heroField = pageFields.find((f) => f.name === 'hero') as AnyField
  const blocks = layout.blocks as Block[]
  const used = await productionUsage()
  const today = new Date().toISOString().slice(0, 10)

  const groups: [string, (s: string) => boolean][] = [
    ['Heroes (open the page; each renders the page H1)', (s) => H1_BLOCKS.has(s)],
    ['Agentic set (built for /crm-for-agentic-workflows)', (s) => s.startsWith('agentic')],
    ['Everything else', () => true],
  ]
  const placed = new Set<string>()

  const L: string[] = []
  L.push('# NeuronCx CMS: page block reference', '')
  L.push(`Generated ${today} from the block configs by \`neuroncx-cms/scripts/block-reference.ts\`. Re-run it after any field change rather than editing this file by hand.`, '')
  L.push('Read this with `ncx-content-notes.md`, which holds the writing rules and the publishing workflow. This file says what each block is for and exactly what it accepts.', '')
  L.push('## How to read an entry', '')
  L.push('- `blockType` is the value that goes in each `layout` item. Field names are exact and case-sensitive.')
  L.push('- **required** fields must be filled or the page will not publish. Lists give their allowed number of items.')
  L.push('- Selects and radios take only the listed values. The text in brackets is the label editors see; the value is what is stored.')
  L.push('- Quoted text after a field name is its label in the admin. Text after the colon is the editor guidance written into the CMS: treat it as the brief for that field.')
  if (used.size) L.push('- "Used on" lists the production pages that currently carry the block, as live examples.', '')

  L.push('## Rules for the whole page', '')
  L.push(`- **One H1.** These blocks render the page's main heading: ${[...H1_BLOCKS].map(code).join(', ')}. Use exactly one of them, as the first block, and set the page hero to ${code('none')}.`)
  L.push(`- **One highlight.** ${code('background: navy')} ("Highlight (navy)") marks the single section the page most wants read. Only one block per page may use it; a second one stops the page saving. There is no crimson background.`)
  L.push('- **Appearance fields.** Most blocks accept the optional set below. Leave every one at its default unless asked; the blocks are designed to look right as they are.', '')
  L.push('| Field | Values | Notes |', '|---|---|---|')
  L.push('| `background` | `default`, `white`, `cloud` (pale grey), `navy` (Highlight) | One `navy` per page at most. |')
  L.push('| `width` | `default`, `narrow` (long text), `wide`, `full` (full bleed) | |')
  L.push('| `spacingTop`, `spacingBottom` | `default`, `none`, `sm`, `lg` | |')
  L.push('| `align` | `default`, `left`, `center` | |')
  L.push('| `hidden` | `true` / `false` | Keeps the block but takes it off the page. |')
  L.push('| `htmlId` | text | An anchor for links like `#how-it-works`: lowercase words and dashes, no `#`. |', '')
  L.push('Each block says which set it takes: **full** (all of the above), **minimal** (`hidden` and `htmlId` only: blocks that draw their own ground, so a background would do nothing), or **own** (the block carries its own equivalents, listed in its fields).', '')

  L.push('## The page hero field', '')
  L.push(`Separate from the blocks: every page has a ${code('hero')} group. When the first block is one of the H1 heroes above, set its ${code('type')} to ${code('none')}.`, '')
  for (const f of flatten(heroField.fields)) L.push(...describe(f, 0))
  L.push('')

  L.push('## Icon library', '')
  L.push('Icon fields take one of these names. The text in brackets is what each one is for. Never invent a name.', '')
  L.push(iconOptions.map((o) => `${code(o.value)} (${o.label.replace(/^[^(]*\(|\)$/g, '')})`).join(', '), '')

  for (const [title, test] of groups) {
    const members = blocks.filter((b) => !placed.has(b.slug) && test(b.slug))
    if (!members.length) continue
    L.push(`## ${title}`, '')
    for (const b of members) {
      placed.add(b.slug)
      const { set, fields } = presentationOf(b)
      const label = typeof b.labels?.singular === 'string' ? b.labels.singular : b.slug
      const purpose = PURPOSE_OVERRIDES[b.slug] || purposeFromSource(b.slug)
      L.push(`### ${label}`, '')
      L.push(`blockType: ${code(b.slug)} · appearance: **${set}**${H1_BLOCKS.has(b.slug) ? ' · renders the page H1' : ''}`, '')
      if (purpose) L.push(purpose, '')
      const u = used.get(b.slug)
      // Without the production lookup (PROD_URL=none) there is nothing to say.
      if (used.size) L.push(`Used on: ${u?.length ? u.map((s) => code('/' + s)).join(', ') : 'no production page yet'}`, '')
      for (const f of flatten(fields)) L.push(...describe(f, 0))
      L.push('')
    }
  }

  L.push('## Site-wide settings (globals)', '')
  L.push('Not blocks: these are edited once and apply to every page.', '')
  for (const g of [Header, Footer, SiteSettings]) {
    L.push(`### ${typeof g.label === 'string' ? g.label : g.slug}`, '')
    L.push(`slug: ${code(g.slug)}`, '')
    for (const f of flatten(g.fields as AnyField[])) L.push(...describe(f, 0))
    L.push('')
  }

  fs.writeFileSync(OUT, L.join('\n').replace(/\n{3,}/g, '\n\n'))
  fs.writeSync(1, `wrote ${OUT}\nblocks: ${blocks.length}  lines: ${L.length}  production usage: ${used.size ? 'yes' : 'skipped'}\n`)
}

main().then(() => process.exit(0), (e) => { fs.writeSync(2, String(e?.stack || e) + '\n'); process.exit(1) })
