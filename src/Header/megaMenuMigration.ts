import crypto from 'crypto'

/**
 * The mega menu migration (24 Oct 2026), as pure functions over the stored
 * header, so scripts/migrate-mega-menu.ts applies them and tests can check
 * them. Nothing is removed: the old fields (href, items, columns) stay as
 * they are, hidden in the admin.
 *
 * An item the website draws as a dropdown today (it has old links, and is
 * not a plain link with an address) becomes a mega menu: each old column a
 * group, its heading the group's label, each link an item with a custom URL
 * (external addresses open in a new tab). A flat list of old dropdown links
 * splits into groups at each group heading. Any other item becomes a link,
 * its old address moved into the link field. An item already copied is kept.
 * Labels are copied word for word, even past the new limits; the admin asks
 * for a shorter one on the next save.
 */

type Doc = Record<string, any>

const newId = () => crypto.randomBytes(12).toString('hex')
const isExternal = (href: string) => /^https?:\/\//.test(href)
const linkTo = (href: string) => ({ type: 'custom', url: href, newTab: isExternal(href) })
const badgeOf = (text: unknown) =>
  typeof text === 'string' && /^new$/i.test(text.trim()) ? 'new' : typeof text === 'string' && /^beta$/i.test(text.trim()) ? 'beta' : 'none'

const usable = (l: Doc | null | undefined): l is Doc => Boolean(l?.label && l?.href)

const hasGroups = (item: Doc) => Array.isArray(item.groups) && item.groups.some((g: Doc) => g?.items?.length)
const hasLink = (item: Doc) => Boolean(item.link?.url || item.link?.reference)

const groupsFrom = (item: Doc, id: () => string): Doc[] => {
  const columns = (item.columns ?? []).filter((c: Doc) => (c?.links ?? []).some(usable))
  if (columns.length) {
    return columns.map((c: Doc) => ({
      id: id(),
      label: c.heading || null,
      items: c.links.filter(usable).map((l: Doc) => ({
        id: id(),
        label: l.label,
        description: l.description || null,
        link: linkTo(l.href),
        badge: 'none',
      })),
    }))
  }
  const groups: Doc[] = []
  for (const l of (item.items ?? []).filter(usable)) {
    if (!groups.length || l.groupHeading) groups.push({ id: id(), label: l.groupHeading || null, items: [] })
    groups[groups.length - 1].items.push({
      id: id(),
      label: l.label,
      description: null,
      link: { ...linkTo(l.href), newTab: Boolean(l.newTab) || isExternal(l.href) },
      badge: badgeOf(l.badge),
    })
  }
  return groups
}

/** One menu item in the new shape, the old fields kept. */
export const megaMenuItem = (item: Doc, id: () => string = newId): Doc => {
  if (item.type === 'megaMenu' && hasGroups(item)) return item
  if (item.type === 'link' && hasLink(item)) return item

  const legacyLinks = (item.columns ?? []).some((c: Doc) => (c?.links ?? []).some(usable)) || (item.items ?? []).some(usable)
  const plainLink = item.type === 'link' && Boolean(item.href)
  if (legacyLinks && !plainLink) {
    return { ...item, type: 'megaMenu', groups: groupsFrom(item, id) }
  }
  return { ...item, type: 'link', ...(item.href && !hasLink(item) ? { link: linkTo(item.href) } : {}) }
}

/** The header's new navItems, or null when every item is already in the new shape. */
export const megaMenuPatch = (navItems: Doc[] | null | undefined, id: () => string = newId): Doc[] | null => {
  if (!Array.isArray(navItems)) return null
  const next = navItems.map((item) => megaMenuItem(item, id))
  return next.some((item, i) => item !== navItems[i]) ? next : null
}
