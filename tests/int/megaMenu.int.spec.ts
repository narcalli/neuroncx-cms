import type { ArrayField, Field, GroupField, SelectField } from 'payload'
import { describe, expect, it } from 'vitest'

import { Header, MEGA_MENU_LAYOUT, MENU_ICONS } from '@/Header/config'
import { megaMenuItem, megaMenuPatch } from '@/Header/megaMenuMigration'
import { iconField, iconOptions } from '@/fields/icons'

/** The header's mega menu fields, and the copy of the old menu into them. */

const named = (fields: Field[], name: string): any => fields.find((f) => 'name' in f && f.name === name)
const navItems = named(Header.fields, 'navItems') as ArrayField
const groups = named(navItems.fields, 'groups') as ArrayField
const items = named(groups.fields, 'items') as ArrayField
const featured = named(navItems.fields, 'featured') as GroupField
const shown = (f: any, siblingData: object) => f.admin?.condition?.({}, siblingData, {} as never) ?? true

describe('menu item fields', () => {
  it('has a label up to 30 and a type of link or mega menu, link by default', () => {
    expect(named(navItems.fields, 'label')).toMatchObject({ required: true, maxLength: 30 })
    const type = named(navItems.fields, 'type') as SelectField
    expect(type.options.map((o) => (typeof o === 'string' ? o : o.value))).toEqual(['link', 'megaMenu'])
    expect(type.defaultValue).toBe('link')
  })

  it('shows the link for a link, and the groups and featured card for a mega menu', () => {
    for (const [field, link, mega] of [
      [named(navItems.fields, 'link'), true, false],
      [groups, false, true],
      [featured, false, true],
    ] as const) {
      expect(shown(field, { type: 'link' }), String(field.name)).toBe(link)
      expect(shown(field, { type: 'megaMenu' }), String(field.name)).toBe(mega)
    }
  })

  it('explains the auto layout to editors', () => {
    expect(groups.admin?.description).toBe(MEGA_MENU_LAYOUT)
    expect(MEGA_MENU_LAYOUT).toMatch(/single group hides its label/)
  })

  it('keeps the old fields, hidden, so no saved menu loses anything', () => {
    for (const name of ['href', 'items', 'columns']) expect(named(navItems.fields, name).admin?.hidden, name).toBe(true)
  })
})

describe('groups and items', () => {
  it('has an optional group label up to 24 and at least one item', () => {
    expect(named(groups.fields, 'label')).toMatchObject({ maxLength: 24 })
    expect(named(groups.fields, 'label').required).toBeFalsy()
    expect(items.minRows).toBe(1)
  })

  it('has an item label up to 30, a description up to 50 with its hint, a link and a badge', () => {
    expect(named(items.fields, 'label')).toMatchObject({ required: true, maxLength: 30 })
    expect(named(items.fields, 'description')).toMatchObject({ maxLength: 50 })
    expect(named(items.fields, 'description').admin.description).toBe('One short line naming what this does')
    expect(named(items.fields, 'link').type).toBe('group')
    const badge = named(items.fields, 'badge') as SelectField
    expect(badge.options.map((o) => (typeof o === 'string' ? o : o.value))).toEqual(['none', 'new', 'beta'])
    expect(badge.defaultValue).toBe('none')
  })

  it('offers 30 icons from the shared library, through the icon picker', () => {
    const icon = named(items.fields, 'icon') as SelectField
    expect(MENU_ICONS).toHaveLength(30)
    expect(icon.options.map((o) => (typeof o === 'string' ? o : o.value))).toEqual(
      iconOptions.map((o) => o.value).filter((v) => (MENU_ICONS as readonly string[]).includes(v)),
    )
    expect((icon.admin?.components?.Field as any).clientProps.only).toEqual([...MENU_ICONS])
    expect(() => iconField(undefined, { only: ['notAnIcon'] })).toThrow(/no icon named notAnIcon/)
  })

  it('has a featured card whose fields show once it is switched on', () => {
    expect(named(featured.fields, 'enabled').defaultValue).toBe(false)
    for (const [name, max] of [['eyebrow', 20], ['title', 50], ['linkLabel', 24]] as const) {
      expect(named(featured.fields, name).maxLength, name).toBe(max)
      expect(shown(named(featured.fields, name), { enabled: false }), name).toBe(false)
      expect(shown(named(featured.fields, name), { enabled: true }), name).toBe(true)
    }
    expect(named(featured.fields, 'image')).toMatchObject({ type: 'upload', relationTo: 'media' })
  })
})

describe('copying the old menu', () => {
  let n = 0
  const id = () => `id${++n}`

  it('turns old columns into groups, links into items with custom URLs, external ones in a new tab', () => {
    const item = megaMenuItem(
      {
        label: 'Platform',
        type: 'link',
        columns: [
          { heading: 'Modules', links: [{ label: 'CRM', href: '/crm', description: 'The record' }] },
          { heading: '', links: [{ label: 'Docs', href: 'https://docs.example.com' }, { label: '', href: '/x' }] },
        ],
      },
      id,
    )
    expect(item.type).toBe('megaMenu')
    expect(item.columns).toHaveLength(2)
    expect(item.groups).toMatchObject([
      { label: 'Modules', items: [{ label: 'CRM', description: 'The record', link: { type: 'custom', url: '/crm', newTab: false }, badge: 'none' }] },
      { label: null, items: [{ label: 'Docs', link: { url: 'https://docs.example.com', newTab: true } }] },
    ])
  })

  it('splits a flat list of old dropdown links at each group heading, and keeps badges', () => {
    const item = megaMenuItem(
      {
        label: 'Resources',
        type: 'dropdown',
        items: [
          { label: 'Guides', href: '/guides', badge: 'NEW' },
          { label: 'API', href: '/api-docs', groupHeading: 'Developers', badge: 'Beta' },
          { label: 'Status', href: '/status', badge: 'Soon' },
        ],
      },
      id,
    )
    expect(item.groups.map((g: any) => [g.label, g.items.map((i: any) => [i.label, i.badge])])).toEqual([
      [null, [['Guides', 'new']]],
      ['Developers', [['API', 'beta'], ['Status', 'none']]],
    ])
  })

  it('moves a plain link address into the link field', () => {
    expect(megaMenuItem({ label: 'Success Stories', type: 'link', href: '/customers' })).toMatchObject({
      type: 'link',
      href: '/customers',
      link: { type: 'custom', url: '/customers', newTab: false },
    })
  })

  it('treats an old dropdown that also has an address as a mega menu, as the website does today', () => {
    const item = megaMenuItem({ label: 'Solutions', type: 'dropdown', href: '/solutions', columns: [{ heading: 'Verticals', links: [{ label: 'Healthcare', href: '/healthcare' }] }] }, id)
    expect(item.type).toBe('megaMenu')
  })

  it('copies labels word for word, even past the new limit', () => {
    const long = 'Supervisory Reasoning and Continuous Improvements'
    const item = megaMenuItem({ label: 'Platform', columns: [{ links: [{ label: long, href: '/x' }] }] }, id)
    expect(item.groups[0].items[0].label).toBe(long)
  })

  it('leaves items already copied alone, so a second run changes nothing', () => {
    const once = megaMenuPatch([{ label: 'Platform', type: 'link', columns: [{ heading: 'M', links: [{ label: 'CRM', href: '/crm' }] }] }, { label: 'Stories', type: 'link', href: '/customers' }], id)!
    expect(once).not.toBeNull()
    expect(megaMenuPatch(once, id)).toBeNull()
    expect(megaMenuPatch(null)).toBeNull()
  })
})
