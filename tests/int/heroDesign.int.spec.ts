import type { ArrayField, CheckboxField, Field, SelectField } from 'payload'
import { describe, expect, it } from 'vitest'

import { buildHubs } from '@/collections/Hubs'
import { MicroApps } from '@/collections/MicroApps'
import { defineContentCollection } from '@/content/defineContentCollection'
import { entryHeroPatch, hubHeroPatch, versionPatch } from '@/content/heroMigration'
import { heroDesignProblems, ownPageProblems } from '@/content/publishCheck'
import { getContentCollection } from '@/content/registry'
import { CHAT_SENDERS } from '@/fields/chatExample'
import { showsClosing } from '@/fields/closing'
import { heroDesignOf } from '@/fields/heroDesign'
import { ownPage } from '@/fields/ownPage'

/**
 * The hero design and the optional closing on an entry's own page
 * (fields_reference.md section 4): the fields, what each design needs to
 * publish, and the migration that moved the agents onto them.
 */

const find = (fields: Field[], name: string): Field | undefined => {
  for (const f of fields) {
    if ('name' in f && f.name === name) return f
    if (f.type === 'tabs') for (const t of f.tabs) { const hit = find(t.fields, name); if (hit) return hit }
    if ((f.type === 'row' || f.type === 'collapsible') && 'fields' in f) { const hit = find(f.fields, name); if (hit) return hit }
  }
  return undefined
}
const values = (f: Field | undefined) => (f as SelectField).options.map((o) => (typeof o === 'string' ? o : o.value))
const shownFor = (f: Field | undefined, heroDesign?: string) =>
  (f as any).admin.condition({ heroDesign }, {}, {} as never) as boolean

describe('hero design fields', () => {
  const tab = ownPage('microApps').tab

  it('offers the designs a collection allows, conversation first and by default', () => {
    expect(values(find(MicroApps.fields, 'heroDesign'))).toEqual(['conversation', 'rightPlacement', 'stats'])
    expect((find(MicroApps.fields, 'heroDesign') as SelectField).defaultValue).toBe('conversation')
    const only = ownPage('microApps', { heroDesigns: ['stats', 'rightPlacement'] }).tab
    expect(values(find(only.fields, 'heroDesign'))).toEqual(['rightPlacement', 'stats'])
    expect((find(only.fields, 'heroDesign') as SelectField).defaultValue).toBe('rightPlacement')
    expect(getContentCollection('microApps')?.heroDesigns).toEqual(['conversation', 'rightPlacement', 'stats'])
  })

  it('uses the design pictures', () => {
    const component = (find(tab.fields, 'heroDesign') as SelectField).admin?.components?.Field as { path?: string } | string
    expect(typeof component === 'string' ? component : component?.path).toBe('@/fields/HeroDesignPicker/Component#HeroDesignPickerField')
  })

  it('shows each design-only field for its design only, an entry with none counting as conversation', () => {
    expect([undefined, 'conversation', 'rightPlacement', 'stats'].map((d) => shownFor(find(tab.fields, 'heroWorkflowFromChain'), d))).toEqual([true, true, false, false])
    expect([undefined, 'conversation', 'rightPlacement', 'stats'].map((d) => shownFor(find(tab.fields, 'heroMotion'), d))).toEqual([false, false, true, false])
    expect([undefined, 'conversation', 'rightPlacement', 'stats'].map((d) => shownFor(find(tab.fields, 'heroStats'), d))).toEqual([true, true, false, true])
  })

  it('has the shared hero fields, with their limits', () => {
    expect((find(tab.fields, 'heroEyebrow') as any).maxLength).toBe(40)
    expect((find(tab.fields, 'heroMediaAlt') as any).maxLength).toBe(160)
    expect((find(tab.fields, 'heroChips') as ArrayField).maxRows).toBe(4)
    expect((find(tab.fields, 'heroStats') as ArrayField).maxRows).toBe(4)
    expect((find(tab.fields, 'heroChatCaption') as any).maxLength).toBe(80)
    expect(find(tab.fields, 'heroSecondaryCta')).toBeTruthy()
    expect(find(MicroApps.fields, 'media')).toBeUndefined()
  })

  it('refuses heroDesigns without the ownPage group, or a design that does not exist', () => {
    const base = { label: 'T', groups: ['core', 'card'] as const, route: '/t' }
    expect(() => defineContentCollection({ ...base, slug: 'heroNoPage', groups: ['core', 'card'], heroDesigns: ['stats'] })).toThrow(/needs the ownPage group/)
    expect(() =>
      defineContentCollection({ ...base, slug: 'heroBad', groups: ['core', 'card', 'ownPage'], heroDesigns: ['carousel' as never] }),
    ).toThrow(/heroDesigns must be/)
  })
})

describe('the shared chat', () => {
  const chatOf = (fields: Field[]) => find(fields, 'heroChat') as ArrayField

  it('is the same field on hubs and on entries: 8 messages from customer, business or team, plain text up to 300', () => {
    for (const chat of [chatOf(buildHubs().fields), chatOf(ownPage('microApps').tab.fields)]) {
      expect(chat.maxRows).toBe(8)
      expect(values(find(chat.fields, 'sender'))).toEqual([...CHAT_SENDERS])
      const text = find(chat.fields, 'text') as any
      expect(text.maxLength).toBe(300)
      expect(text.validate('A [placeholder]', {})).not.toBe(true)
    }
  })

  it('labels a business message with an entry of the same collection, shown for business messages only', () => {
    const entry = find(chatOf(ownPage('microApps').tab.fields).fields, 'entry') as any
    expect(entry.relationTo).toEqual(['microApps'])
    expect(entry.admin.condition({}, { sender: 'business' })).toBe(true)
    expect(entry.admin.condition({}, { sender: 'customer' })).toBe(false)
  })
})

describe('publish check, per hero design', () => {
  const page = { heroHeading: 'Books slots', meta: { title: 'T', description: 'D' } }
  const chat = (n: number) => Array.from({ length: n }, (_, i) => ({ sender: i % 2 ? 'business' : 'customer', text: `Message ${i}` }))
  const paths = (doc: Record<string, unknown>) => ownPageProblems({ ...page, ...doc }).map((p) => p.path)

  it('conversation needs at least 2 chat messages, also when no design is set', () => {
    expect(paths({ heroDesign: 'conversation', heroChat: chat(1) })).toEqual(['heroChat'])
    expect(paths({ heroChat: chat(1) })).toEqual(['heroChat'])
    expect(paths({ heroDesign: 'conversation', heroChat: [...chat(1), { sender: 'business', text: ' ' }] })).toEqual(['heroChat'])
    expect(paths({ heroDesign: 'conversation', heroChat: chat(2) })).toEqual([])
  })

  it('picture on the right needs a picture', () => {
    expect(paths({ heroDesign: 'rightPlacement' })).toEqual(['heroMedia'])
    expect(paths({ heroDesign: 'rightPlacement', heroMedia: 'media-id' })).toEqual([])
  })

  it('stats needs at least 2 stats with a value and a label', () => {
    expect(paths({ heroDesign: 'stats', heroStats: [{ value: '40%', label: 'fewer calls' }] })).toEqual(['heroStats'])
    expect(paths({ heroDesign: 'stats', heroStats: [{ value: '40%', label: 'fewer calls' }, { value: '2x' }] })).toEqual(['heroStats'])
    expect(paths({ heroDesign: 'stats', heroStats: [{ value: '40%', label: 'fewer calls' }, { value: '2x', label: 'faster' }] })).toEqual([])
  })

  it("follows the collection's allowed designs: a design it does not allow counts as its default", () => {
    expect(heroDesignOf({ heroDesign: 'stats' }, ['conversation', 'rightPlacement'])).toBe('conversation')
    expect(heroDesignProblems({ heroDesign: 'stats' }, ['rightPlacement']).map((p) => p.path)).toEqual(['heroMedia'])
  })

  it('still asks for the heading and SEO fields', () => {
    expect(ownPageProblems({ heroChat: chat(2) }).map((p) => p.path)).toEqual(['heroHeading', 'meta.title', 'meta.description'])
  })
})

describe('optional closing', () => {
  it('is on by default on entries and on hubs', () => {
    for (const fields of [ownPage('microApps').tab.fields, buildHubs().fields]) {
      const f = find(fields, 'showClosing') as CheckboxField
      expect(f.type).toBe('checkbox')
      expect(f.defaultValue).toBe(true)
    }
  })

  it('is hidden only when switched off; a page saved before the switch existed shows it', () => {
    expect(showsClosing({ showClosing: false })).toBe(false)
    expect(showsClosing({ showClosing: true })).toBe(true)
    expect(showsClosing({})).toBe(true)
    expect(showsClosing(null)).toBe(true)
  })
})

describe('migration', () => {
  it('moves the old picture to heroMedia, keeping it, and picks Picture on the right for it', () => {
    expect(entryHeroPatch({ media: 'media-1' })).toEqual({ heroMedia: 'media-1', heroDesign: 'rightPlacement', showClosing: true })
  })

  it('gives an agent without a picture the conversation design and the closing', () => {
    expect(entryHeroPatch({ slug: 'qualify' })).toEqual({ heroDesign: 'conversation', showClosing: true })
  })

  it('keeps what is already set, so a second run changes nothing', () => {
    const once = { media: 'media-1', ...entryHeroPatch({ media: 'media-1' }) }
    expect(entryHeroPatch(once)).toEqual({})
    expect(entryHeroPatch({ heroMedia: 'new', media: 'old', heroDesign: 'stats', showClosing: false })).toEqual({})
  })

  it('moves hub chat senders to business, rounds square brackets and turns the closing on', () => {
    const patch = hubHeroPatch({
      heroChat: [
        { id: 'a', sender: 'customer', text: '[Photo of a prescription]' },
        { id: 'b', sender: 'entry', entry: { relationTo: 'microApps', value: 'x' }, text: 'Your total at the [branch] is [amount].' },
      ],
    })
    expect(patch.showClosing).toBe(true)
    expect(patch.heroChat).toEqual([
      { id: 'a', sender: 'customer', text: '(Photo of a prescription)' },
      { id: 'b', sender: 'business', entry: { relationTo: 'microApps', value: 'x' }, text: 'Your total at the (branch) is (amount).' },
    ])
    expect(hubHeroPatch({ showClosing: true, heroChat: patch.heroChat })).toEqual({})
  })

  it('patches a saved version under version', () => {
    expect(versionPatch({ heroDesign: 'conversation', showClosing: true })).toEqual({
      'version.heroDesign': 'conversation',
      'version.showClosing': true,
    })
  })
})
