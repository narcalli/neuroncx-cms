import type { SelectField } from 'payload'

/**
 * "Hero design" on an entry's own page (fields_reference.md section 4): which
 * of the site's light hero blocks draws the page's hero, fed from the shared
 * hero fields. The values match the website's hero adapters
 * (neuroncx-website src/components/sections/EntryHero.tsx).
 */
const DESIGNS = {
  conversation: 'Conversation',
  rightPlacement: 'Picture on the right',
  stats: 'Stats',
  customCss: 'Custom CSS visual',
} as const

export type HeroDesignName = keyof typeof DESIGNS

export const HERO_DESIGN_NAMES = Object.keys(DESIGNS) as HeroDesignName[]

export const DEFAULT_HERO_DESIGN: HeroDesignName = 'conversation'

/** The design a collection's new entries start with: conversation where allowed, else the first allowed, in the usual order. */
export const defaultHeroDesign = (allowed: readonly HeroDesignName[]): HeroDesignName =>
  allowed.includes(DEFAULT_HERO_DESIGN) ? DEFAULT_HERO_DESIGN : (HERO_DESIGN_NAMES.find((d) => allowed.includes(d)) ?? allowed[0])

/** The design an entry draws with: its own, or the default when it has none. */
export const heroDesignOf = (
  doc: { heroDesign?: string | null } | null | undefined,
  allowed: readonly HeroDesignName[] = HERO_DESIGN_NAMES,
): HeroDesignName => {
  const own = doc?.heroDesign
  return own && (allowed as readonly string[]).includes(own) ? (own as HeroDesignName) : defaultHeroDesign(allowed)
}

export const heroDesignField = (allowed: readonly HeroDesignName[] = HERO_DESIGN_NAMES): SelectField => {
  if (!allowed.length) throw new Error('heroDesignField: allow at least one design.')
  return {
    name: 'heroDesign',
    type: 'select',
    label: 'Hero design',
    required: true,
    defaultValue: defaultHeroDesign(allowed),
    options: HERO_DESIGN_NAMES.filter((d) => allowed.includes(d)).map((value) => ({ label: DESIGNS[value], value })),
    admin: {
      description:
        'Every design reads the hero fields below; the fields only one design uses show when it is picked. Conversation needs at least 2 chat messages, Picture on the right needs a picture, Stats needs at least 2 stats, Custom CSS visual needs its HTML and a screen reader description.',
      components: { Field: '@/fields/HeroDesignPicker/Component#HeroDesignPickerField' },
    },
  }
}
