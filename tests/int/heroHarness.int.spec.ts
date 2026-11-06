import { describe, expect, it } from 'vitest'

import { CARD_DEFAULTS, HeroHarness } from '@/blocks/HeroHarness/config'
import { chipRows, chipsFit, CUSTOMER_360_CHIPS, loopFits, loopLines, ONTOLOGY_CHIPS } from '@/blocks/HeroHarness/fit'
import { blockNameOf, blocksPathOf, sectionsOf, validateSection } from '@/blocks/HeroHarness/sectionLink'
import { PAGE_LAYOUT_BLOCKS } from '@/blocks/pageLayoutBlocks'
import { optionalCta } from '@/fields/optionalCta'
import { ALL_LAYOUT_BLOCK_SLUGS, HERO_BLOCKS, HUB_LAYOUT_BLOCK_SLUGS, LAYOUT_HERO_BLOCKS, NEVER_IN_LAYOUT } from '@/content/sections/siteBlocks'

/** Hero (harness loop): the text, style and behaviour settings. The cards and drawing come next. */

type Doc = Record<string, any>
const tabs = (HeroHarness.fields[0] as any).tabs as { label: string; fields: any[] }[]
const flatten = (fields: any[]): Doc =>
  Object.assign(
    {},
    ...fields.map((f) => (f.type === 'row' || f.type === 'collapsible' ? flatten(f.fields) : f.name ? { [f.name]: f } : {})),
  )
const tab = (label: string) => flatten(tabs.find((t) => t.label === label)!.fields)
const all: Doc = Object.assign({}, ...tabs.map((t) => flatten(t.fields)))
const values = (name: string) => all[name].options.map((o: Doc) => o.value)

/** Every field with a name, nested ones included, with where it sits. */
const named = (fields: any[], at = ''): { path: string; field: Doc }[] =>
  fields.flatMap((f) => {
    if (f.type === 'tabs') return f.tabs.flatMap((t: Doc) => named(t.fields, at))
    if (f.type === 'row' || f.type === 'collapsible') return named(f.fields, at)
    const path = at ? `${at}.${f.name}` : f.name
    return [{ path, field: f }, ...(f.fields ? named(f.fields, path) : [])]
  })

describe('the block', () => {
  it('is a page hero with its own H1, offered in page layouts only, not in a hub or entry layout for now', () => {
    expect(HeroHarness.slug).toBe('heroHarness')
    expect(HeroHarness.interfaceName).toBe('HeroHarnessBlock')
    expect(HeroHarness.labels).toEqual({ singular: 'Hero (harness loop)', plural: 'Heroes (harness loop)' })
    const wrapped = PAGE_LAYOUT_BLOCKS.find((b) => b.slug === 'heroHarness')!
    expect(wrapped).toBeTruthy()
    // Its own background edge to edge, so the minimal Appearance panel: hidden and anchor ID only.
    expect(named(wrapped.fields).map((f) => f.path)).toEqual(expect.arrayContaining(['hidden', 'htmlId']))
    expect(named(wrapped.fields).map((f) => f.path)).not.toContain('spacingTop')
    expect(NEVER_IN_LAYOUT).toContain('heroHarness')
    expect(HERO_BLOCKS).toContain('heroHarness')
    // The entry page does not draw it yet, so entries cannot pick it as their hero.
    expect(LAYOUT_HERO_BLOCKS).not.toContain('heroHarness')
    expect(ALL_LAYOUT_BLOCK_SLUGS).not.toContain('heroHarness')
    expect(HUB_LAYOUT_BLOCK_SLUGS).not.toContain('heroHarness')
  })

  it('has Text, Cards, Drawing, Style and Behaviour tabs', () => {
    expect(tabs.map((t) => t.label)).toEqual(['Text', 'Cards', 'Drawing', 'Style', 'Behaviour'])
    expect(Object.keys(tab('Text'))).toEqual(['textLayout', 'textBlock', 'eyebrow', 'headline', 'intro', 'buttons'])
    expect(Object.keys(tab('Cards'))).toEqual(['cardsPosition', 'cards'])
    expect(Object.keys(tab('Drawing'))).toEqual([
      'triggerLabel',
      'triggerEvents',
      'boundaryLabel',
      'ontologyLabel',
      'ontologyItems',
      'policyLabel',
      'policySub',
      'orchestrationLabel',
      'orchestrationSubLabel',
      'guardrailsLabel',
      'actions',
      'handoverLabel',
      'customer360Label',
      'customer360Fields',
      'loopLabel',
      'actionsName',
      'loopName',
    ])
    expect(Object.keys(tab('Style'))).toEqual(['headingSize', 'spacing', 'introWidth', 'introMaxWidth', 'background', 'blockWidth', 'frame'])
    expect(Object.keys(tab('Behaviour'))).toEqual([
      'motion',
      'autoplay',
      'loop',
      'speed',
      'autoplaySeconds',
      'showStatus',
      'showCaption',
      'screenReaderDescription',
    ])
  })

  it('gives every field plain help, with no em dashes anywhere', () => {
    for (const { path, field } of named(HeroHarness.fields)) {
      expect(field.admin?.description, path).toBeTruthy()
    }
    expect(JSON.stringify(HeroHarness, (_k, v) => (typeof v === 'function' ? undefined : v))).not.toContain('\u2014')
  })
})

describe('the text', () => {
  it('lays out centred by default (version 4), or stacked, in a grid, or stacked with a small label', () => {
    expect(values('textLayout')).toEqual(['centred', 'stack', 'grid', 'stackWithLabel'])
    expect(all.textLayout.defaultValue).toBe('centred')
    // The small label shows in every layout when it has text, so the field is always offered, and starts empty.
    expect(all.eyebrow).toMatchObject({ type: 'text', maxLength: 40 })
    expect(all.eyebrow.defaultValue).toBeUndefined()
    expect(all.eyebrow.admin.condition).toBeUndefined()
  })

  it('places the centred text block centred by default, or left with the block centred, or left on the stage edge', () => {
    expect(all.textBlock).toMatchObject({ type: 'select', required: true, defaultValue: 'centred' })
    expect(all.textBlock.options).toEqual([
      { label: 'Centred', value: 'centred' },
      { label: 'Left, block centred', value: 'leftCentred' },
      { label: 'Left, on the stage edge', value: 'leftStage' },
    ])
    // Offered with the centred layout only.
    expect(all.textBlock.admin.condition({}, { textLayout: 'centred' })).toBe(true)
    for (const textLayout of ['stack', 'grid', 'stackWithLabel']) {
      expect(all.textBlock.admin.condition({}, { textLayout }), textLayout).toBe(false)
    }
    expect(all.textBlock.admin.description).toMatch(/^Centred centres every line\. Left, block centred starts every line on one left edge/)
  })

  it('takes a two line title and a one paragraph intro, both required', () => {
    expect(all.headline).toMatchObject({ type: 'textarea', required: true, maxLength: 100 })
    expect(all.headline.defaultValue.split('\n')).toEqual(['An agentic rethink of CRM,', 'marketing automation and omnichannel CX.'])
    expect(all.intro).toMatchObject({ type: 'textarea', required: true, maxLength: 420 })
    expect(all.intro.defaultValue.length).toBeLessThanOrEqual(420)
    expect(all.intro.defaultValue).toMatch(/^NeuronCx is a captive AI harness/)
  })

  it('has up to two optional buttons, none by default, with the Hero (custom CSS) link fields', () => {
    expect(all.buttons).toMatchObject({ type: 'array', maxRows: 2 })
    expect(all.buttons.defaultValue).toBeUndefined()
    expect(all.buttons.minRows).toBeUndefined()
    expect(Object.keys(flatten(all.buttons.fields))).toEqual(['type', 'newTab', 'reference', 'url', 'section', 'label', 'appearance'])
    expect(Object.values(flatten(all.buttons.fields)).some((f: any) => f.required)).toBe(false)
  })

  it('can jump to a section on this page, chosen from a list, with no new tab and no address', () => {
    const f = flatten(all.buttons.fields)
    expect(f.type.options.map((o: Doc) => o.value)).toEqual(['reference', 'custom', 'section'])
    expect(f.type.options[2]).toEqual({ label: 'Section on this page', value: 'section' })
    expect(f.section).toMatchObject({ type: 'text', label: 'Section to jump to' })
    expect(f.section.admin.components.Field).toBe('@/blocks/HeroHarness/SectionPicker#SectionPicker')
    const shown = (name: string, type: string | undefined) => f[name].admin.condition({}, { type })
    expect(shown('section', 'section')).toBe(true)
    expect(shown('section', 'custom')).toBe(false)
    expect(shown('url', 'section')).toBe(false)
    expect(shown('url', 'custom')).toBe(true)
    expect(shown('url', undefined)).toBe(true)
    expect(shown('newTab', 'section')).toBe(false)
    expect(shown('newTab', 'reference')).toBe(true)
    // The other heroes' buttons keep two link types.
    expect(JSON.stringify(optionalCta('cta', 'CTA'))).not.toContain('section')
  })
})

describe('the section a button jumps to', () => {
  const layout = [
    { blockType: 'heroHarness', htmlId: 'top' },
    { blockType: 'howItWorks', heading: 'How it works', htmlId: 'how-it-works' },
    { blockType: 'faq', htmlId: 'faq', hidden: true },
    { blockType: 'logoWall' },
    { blockType: 'integrations', blockName: 'Partners', htmlId: 'partners' },
  ]
  const check = (value: string | null, sibling: Doc = { type: 'section', label: 'See how' }, path: (string | number)[] = ['layout', 0, 'buttons', 0, 'section']) =>
    validateSection(value as string, { data: { layout }, siblingData: sibling, path } as any)

  it('lists the blocks with an Anchor ID, in page order, named by their own name or heading, leaving out the hero itself', () => {
    expect(sectionsOf(layout, 0)).toEqual([
      { id: 'how-it-works', name: 'How it works', hidden: false, index: 1 },
      { id: 'faq', name: 'Faq', hidden: true, index: 2 },
      { id: 'partners', name: 'Partners', hidden: false, index: 4 },
    ])
    expect(blockNameOf({ blockType: 'expandingCardCta' })).toBe('Expanding card cta')
    expect(sectionsOf(undefined)).toEqual([])
  })

  it('finds the page blocks from the field path, as segments or a dotted path', () => {
    expect(blocksPathOf(['layout', 0, 'buttons', 1, 'section'])).toEqual({ blocks: ['layout'], own: 0 })
    expect(blocksPathOf('layout.3.buttons.0.section')).toEqual({ blocks: ['layout'], own: 3 })
    expect(blocksPathOf('section')).toBeNull()
  })

  it('on publish: needs a section on this page that is not hidden, for a shown button set to it', () => {
    expect(check('how-it-works')).toBe(true)
    expect(check(null)).toMatch(/^Choose the section the button jumps to/)
    expect(check('pricing')).toMatch(/No block on this page has the Anchor ID "pricing"/)
    expect(check('faq')).toMatch(/is hidden, so the button would go nowhere/)
    // The hero's own Anchor ID is not a section to jump to.
    expect(check('top')).toMatch(/No block on this page has the Anchor ID "top"/)
    // Not checked for other link types, or for a button with no label (it is not shown).
    expect(check(null, { type: 'custom', label: 'Go' })).toBe(true)
    expect(check(null, { type: 'section', label: '  ' })).toBe(true)
  })

  it('lets each button be Primary or Secondary, named as on the shared link field, empty following its place', () => {
    const appearance = flatten(all.buttons.fields).appearance
    expect(appearance).toMatchObject({ type: 'select', label: 'Style' })
    expect(appearance.options).toEqual([
      { label: 'Primary', value: 'primary' },
      { label: 'Secondary', value: 'secondary' },
    ])
    expect(appearance.defaultValue).toBeUndefined()
    expect(appearance.admin.description).toMatch(/first button is Primary and the second Secondary/)
  })
})

describe('the style', () => {
  it('sets the title size, spacing, intro width and background', () => {
    expect(all.headingSize).toMatchObject({ type: 'number', min: 32, max: 56, defaultValue: 44 })
    expect(values('spacing')).toEqual(['roomy', 'compact'])
    expect(all.spacing.defaultValue).toBe('roomy')
    expect(all.introWidth).toMatchObject({ type: 'number', min: 560, max: 900, defaultValue: 720 })
    // The grid layout caps the intro itself.
    expect(all.introWidth.admin.condition({}, { textLayout: 'grid' })).toBe(false)
    expect(all.introWidth.admin.condition({}, { textLayout: 'centred' })).toBe(false)
    expect(all.introWidth.admin.condition({}, { textLayout: 'stack' })).toBe(true)
    expect(all.introWidth.admin.condition({}, { textLayout: 'stackWithLabel' })).toBe(true)
    // Centred has its own intro width, in three steps, 620px by default.
    expect(all.introMaxWidth).toMatchObject({ type: 'select', required: true, defaultValue: '620' })
    // 1020 is the widest on purpose; there is no 960.
    expect(values('introMaxWidth')).toEqual(['620', '720', '860', '1020'])
    expect(all.introMaxWidth.admin.description).toMatch(/1020 puts the live home passage on three lines at about 119 characters, and is the widest setting offered on purpose\./)
    expect(all.introMaxWidth.admin.condition({}, { textLayout: 'centred' })).toBe(true)
    for (const layout of ['stack', 'grid', 'stackWithLabel']) {
      expect(all.introMaxWidth.admin.condition({}, { textLayout: layout })).toBe(false)
    }
    // The site column as now, or the header's edges.
    expect(values('blockWidth')).toEqual(['site', 'header'])
    expect(all.blockWidth.defaultValue).toBe('site')
    // Plain as today, or Framed: the cards and the drawing in one bordered panel.
    expect(all.frame).toMatchObject({ type: 'select', required: true, defaultValue: 'plain' })
    expect(values('frame')).toEqual(['plain', 'framed'])
    expect(all.frame.options.map((o: Doc) => o.label)).toEqual(['Plain', 'Framed'])
    expect(all.frame.admin.description).toBe('Framed wraps the cards and the drawing in one bordered panel instead of two separate pieces.')
    expect(values('background')).toEqual(['cloud', 'white'])
    expect(all.background.defaultValue).toBe('cloud')
  })
})

describe('the behaviour', () => {
  it('has the shared Motion switches, autoplay on, and the card timing', () => {
    expect(all.motion.defaultValue).toBe('follow')
    expect(all.autoplay).toMatchObject({ type: 'checkbox', defaultValue: true })
    expect(all.loop).toMatchObject({ type: 'checkbox', defaultValue: true })
    expect(values('speed')).toEqual(['slower', 'normal', 'faster'])
    expect(all.autoplaySeconds).toMatchObject({ type: 'number', min: 4, max: 12, defaultValue: 6 })
  })

  it('shows the status line and caption by default, and describes the drawing for screen readers', () => {
    expect(all.showStatus).toMatchObject({ type: 'checkbox', defaultValue: true })
    expect(all.showCaption).toMatchObject({ type: 'checkbox', defaultValue: true })
    expect(all.screenReaderDescription.defaultValue).toMatch(/^A diagram of the NeuronCx harness/)
    expect(all.screenReaderDescription.defaultValue).toContain('(BYOC)')
  })
})

describe('the cards', () => {
  it('sit left of the drawing by default, or above it', () => {
    expect(values('cardsPosition')).toEqual(['left', 'above'])
    expect(all.cardsPosition.defaultValue).toBe('left')
  })

  it('are 3 to 6, each with a title, an explanation and the parts it lights up', () => {
    expect(all.cards).toMatchObject({ type: 'array', minRows: 3, maxRows: 6 })
    const fields = flatten(all.cards.fields)
    expect(fields.title).toMatchObject({ required: true, maxLength: 60 })
    expect(fields.body).toMatchObject({ type: 'textarea', maxLength: 160 })
    expect(fields.highlights).toMatchObject({ type: 'select', hasMany: true, required: true })
    expect(fields.highlights.options.map((o: Doc) => o.value)).toEqual([
      'trigger',
      'boundary',
      'ontology',
      'policy',
      'guardrails',
      'orchestration',
      'actions',
      'handover',
      'customer360',
      'loop',
    ])
  })

  it('start with the six cards of the design', () => {
    expect(all.cards.defaultValue).toBe(CARD_DEFAULTS)
    expect(CARD_DEFAULTS.map((c) => [c.title, c.highlights])).toEqual([
      ['Grounded in your enterprise ontology', ['ontology']],
      ['Orchestrated agents that act on their own', ['orchestration', 'actions']],
      ['Guardrails and a policy framework you set', ['guardrails', 'policy', 'handover']],
      ['One Customer 360 record', ['customer360']],
      ['Your own cloud, beyond SaaS', ['boundary']],
      ['Improves at your own pace', ['loop']],
    ])
    for (const c of CARD_DEFAULTS) {
      expect(c.title.length).toBeLessThanOrEqual(60)
      expect(c.body.length).toBeLessThanOrEqual(160)
    }
  })
})

describe('the drawing labels', () => {
  const rows = (name: string) => (all[name].defaultValue as { label: string }[]).map((r) => r.label)

  it('start with every word of the design', () => {
    expect([all.triggerLabel.defaultValue, rows('triggerEvents')]).toEqual(['Customer event', ['New enquiry', 'Payment due', 'Follow-up due']])
    expect(all.boundaryLabel.defaultValue).toBe('BYOC')
    expect([all.ontologyLabel.defaultValue, rows('ontologyItems')]).toEqual(['Enterprise ontology', ['Locations', 'Services', 'Rules and terms']])
    expect([all.policyLabel.defaultValue, all.policySub.defaultValue]).toEqual(['Policy framework', 'Set by your team'])
    expect(all.guardrailsLabel.defaultValue).toBe('Guardrails')
    expect([all.orchestrationLabel.defaultValue, all.orchestrationSubLabel.defaultValue]).toEqual(['Orchestration', 'Agents'])
    expect(rows('actions')).toEqual(['Qualify', 'Book and pay', 'Follow up', 'Campaigns'])
    expect(all.handoverLabel.defaultValue).toBe('Team steps in')
    expect([all.customer360Label.defaultValue, rows('customer360Fields')]).toEqual(['Customer 360', ['Profile', 'History', 'Next step', 'Care gaps']])
    expect(all.loopLabel.defaultValue).toBe('Learns from every outcome')
  })

  it('name the actions and the loop in the caption, which have no label of their own', () => {
    expect(all.actionsName).toMatchObject({ type: 'text', required: true, maxLength: 24, defaultValue: 'Agent actions' })
    expect(all.loopName).toMatchObject({ type: 'text', required: true, maxLength: 24, defaultValue: 'Learning loop' })
  })

  it('keep the guardrails label short enough to stay clear of the action lines', () => {
    expect(all.guardrailsLabel.maxLength).toBe(12)
  })

  it('keep their counts: 1 to 4 events, up to 3 ontology chips, 2 to 5 actions, up to 4 record chips', () => {
    expect(all.triggerEvents).toMatchObject({ minRows: 1, maxRows: 4 })
    expect(all.ontologyItems.maxRows).toBe(3)
    expect(all.actions).toMatchObject({ minRows: 2, maxRows: 5 })
    expect(all.customer360Fields.maxRows).toBe(4)
  })

  it('every label has a limit, and every default is within it', () => {
    for (const name of Object.keys(tab('Drawing'))) {
      const f = all[name]
      const limit = f.type === 'array' ? flatten(f.fields).label.maxLength : f.maxLength
      expect(limit, name).toBeGreaterThan(0)
      const defaults = f.type === 'array' ? rows(name) : [f.defaultValue]
      for (const d of defaults) expect(d.length, `${name}: ${d}`).toBeLessThanOrEqual(limit)
    }
  })
})

describe('what fits in the drawing', () => {
  it('wraps chips as the drawing does', () => {
    // The design's ontology chips take two rows in both layouts, its record chips one.
    expect(chipRows(['Locations', 'Services', 'Rules and terms'], ONTOLOGY_CHIPS.landscape)).toBe(2)
    expect(chipRows(['Locations', 'Services', 'Rules and terms'], ONTOLOGY_CHIPS.portrait)).toBe(2)
    expect(chipRows(['Profile', 'History', 'Next step', 'Care gaps'], CUSTOMER_360_CHIPS.landscape)).toBe(1)
    expect(chipRows(['Profile', 'History', 'Next step', 'Care gaps'], CUSTOMER_360_CHIPS.portrait)).toBe(1)
  })

  it('refuses chips that need another row', () => {
    const ontology = all.ontologyItems.validate
    expect(ontology([{ label: 'Locations' }, { label: 'Services' }, { label: 'Rules and terms' }])).toBe(true)
    expect(ontology([{ label: 'Opening hours list' }, { label: 'Service catalogue' }, { label: 'Rules and terms' }])).toMatch(/two rows/)
    const record = all.customer360Fields.validate
    expect(record([{ label: 'Profile' }, { label: 'History' }, { label: 'Next step' }, { label: 'Care gaps' }])).toBe(true)
    expect(record([{ label: 'Full profile' }, { label: 'Visit history' }, { label: 'Next step' }, { label: 'Care gaps' }])).toMatch(/one row/)
    expect(chipsFit([], CUSTOMER_360_CHIPS.portrait)).toBe(true)
  })

  it('splits the loop label in two on wide screens, and refuses halves that are too long', () => {
    expect(loopLines('Learns from every outcome')).toEqual(['Learns from', 'every outcome'])
    expect(loopFits('Learns from every outcome')).toBe(true)
    expect(all.loopLabel.validate('Learns from every outcome')).toBe(true)
    expect(all.loopLabel.validate('Continuously improves from outcomes')).toMatch(/too long/)
  })
})
