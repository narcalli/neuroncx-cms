import 'dotenv/config'
import { getPayload, type Field, type Payload, type SelectField } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import { AgenticFlowDemo } from '@/blocks/AgenticFlowDemo/config'
import { pastedLabelProblem } from '@/blocks/AgenticFlowDemo/pastedLabel'
import { plainText } from '@/fields/validators/plainText'

/** The Agentic Flow Demo: Flow mode as before, and Agent features mode. */

const field = (name: string): any => AgenticFlowDemo.fields.find((f: Field) => 'name' in f && f.name === name)
const shown = (name: string, mode?: string) => field(name).admin?.condition?.({}, { mode }, {} as never) ?? true

describe('Agentic Flow Demo modes', () => {
  it('is Flow, Agent features or Groups, Flow by default, so saved blocks stay as they are', () => {
    const mode = field('mode') as SelectField
    expect(mode.options).toEqual([
      { label: 'Flow', value: 'flow' },
      { label: 'Agent features', value: 'agentFeatures' },
      { label: 'Groups (typed on this block)', value: 'groups' },
    ])
    expect(mode.defaultValue).toBe('flow')
    expect(mode.required).toBe(true)
  })

  it('keeps the heading and intro in both modes', () => {
    for (const mode of [undefined, 'flow', 'agentFeatures']) {
      expect(shown('heading', mode)).toBe(true)
      expect(shown('intro', mode)).toBe(true)
    }
  })

  it('shows the events and the note in Flow mode only, unset counting as Flow, not in the other two', () => {
    // Required as well as minRows, or Payload lets an empty list through.
    expect(field('events')).toMatchObject({ type: 'array', required: true, minRows: 1, maxRows: 4 })
    for (const name of ['events', 'footnote']) {
      expect(shown(name, undefined), name).toBe(true)
      expect(shown(name, 'flow'), name).toBe(true)
      expect(shown(name, 'agentFeatures'), name).toBe(false)
      expect(shown(name, 'groups'), name).toBe(false)
    }
  })

  it('shows the families in Agent features mode only, and the button labels and "You set" label there and in Groups', () => {
    expect(shown('families', 'agentFeatures')).toBe(true)
    for (const mode of ['flow', undefined, 'groups']) expect(shown('families', mode), String(mode)).toBe(false)
    for (const name of ['pickFamilyLabel', 'pickAgentLabel', 'youSetLabel']) {
      expect(shown(name, 'agentFeatures'), name).toBe(true)
      expect(shown(name, 'groups'), name).toBe(true)
      expect(shown(name, 'flow'), name).toBe(false)
      expect(shown(name, undefined), name).toBe(false)
    }
    expect(field('youSetLabel')).toMatchObject({ type: 'text', maxLength: 24, defaultValue: 'You set:' })
  })

  it('shows the groups in Groups mode only: 1 to 6, each a button over 1 to 8 items', () => {
    for (const mode of ['flow', undefined, 'agentFeatures']) expect(shown('groups', mode), String(mode)).toBe(false)
    expect(shown('groups', 'groups')).toBe(true)
    const groups = field('groups')
    // Required as well: Payload checks minRows only on a required array.
    expect(groups).toMatchObject({ type: 'array', label: 'Groups', required: true, minRows: 1, maxRows: 6, admin: { initCollapsed: true } })
    const own = (fields: any[]) => fields.filter((f) => f.name !== 'id')
    expect(own(groups.fields).map((f: any) => f.name)).toEqual(['label', 'items'])
    expect(groups.fields.find((f: any) => f.name === 'label')).toMatchObject({ type: 'text', required: true, maxLength: 40 })
    expect(groups.fields.find((f: any) => f.name === 'items')).toMatchObject({ type: 'array', label: 'Items', required: true, minRows: 1, maxRows: 8, admin: { initCollapsed: true } })
  })

  it("gives each item the explorer's three cards, its button chip and a link", () => {
    const items = field('groups').fields.find((f: any) => f.name === 'items')
    const byName = Object.fromEntries(items.fields.map((f: any) => [f.name, f]))
    expect(items.fields.map((f: any) => f.name).filter((n: string) => n !== 'id')).toEqual([
      'name', 'chip', 'summary', 'tags', 'features', 'handlerTags', 'icon', 'lands', 'youSet', 'link',
    ])
    expect(byName.name).toMatchObject({ type: 'text', required: true, maxLength: 60 })
    expect(byName.chip).toMatchObject({ type: 'text', maxLength: 24 })
    expect(byName.chip.required).toBeFalsy()
    expect(byName.summary).toMatchObject({ type: 'textarea', required: true, maxLength: 240 })
    expect(byName.tags).toMatchObject({ type: 'array', maxRows: 2 })
    expect(byName.tags.minRows).toBeUndefined()
    expect(byName.tags.fields.find((f: any) => f.name === 'label')).toMatchObject({ type: 'text', required: true, maxLength: 32 })
    expect(byName.features).toMatchObject({ type: 'array', required: true, minRows: 1, maxRows: 5 })
    expect(byName.features.fields.find((f: any) => f.name === 'line')).toMatchObject({ type: 'text', required: true, maxLength: 80, validate: plainText })
    expect(byName.handlerTags).toMatchObject({ type: 'select', hasMany: true })
    expect(byName.handlerTags.options.map((o: any) => o.value)).toEqual(['agent', 'human'])
    expect(byName.handlerTags.defaultValue).toBeUndefined()
    expect(byName.icon).toMatchObject({ type: 'select', name: 'icon' })
    expect(byName.icon.required).toBeFalsy()
    expect(byName.lands).toMatchObject({ type: 'textarea', required: true, maxLength: 240 })
    expect(byName.youSet).toMatchObject({ type: 'text', maxLength: 180 })
    expect(byName.youSet.required).toBeFalsy()
    // The same link as a Flow event's.
    const eventLink = field('events').fields.find((f: any) => f.name === 'link')
    expect(JSON.stringify(byName.link.fields)).toBe(JSON.stringify(eventLink.fields))
  })

  it('picks families from Lists (agent families only), several, in order, optional', () => {
    expect(field('families')).toMatchObject({
      type: 'relationship',
      relationTo: 'lists',
      hasMany: true,
      filterOptions: { type: { equals: 'agentFamily' } },
    })
    expect(field('families').required).toBeFalsy()
  })

  it('has the two button labels, up to 40, with their defaults', () => {
    expect(field('pickFamilyLabel')).toMatchObject({ type: 'text', maxLength: 40, defaultValue: 'Pick a family' })
    expect(field('pickAgentLabel')).toMatchObject({ type: 'text', maxLength: 40, defaultValue: 'Agents' })
  })

  it('types nothing about the agents into the block', () => {
    const names = AgenticFlowDemo.fields.map((f: Field) => ('name' in f ? f.name : f.type))
    // agentsFor and industries only choose which agents to show.
    expect(names).toEqual([
      'heading', 'intro', 'mode', 'agentsFor', 'industries', 'families', 'pickFamilyLabel', 'pickAgentLabel', 'youSetLabel', 'groups', 'events', 'footnote', 'collapsible', 'tabs',
    ])
  })
})

/** The Design tab: every option, its default (today's look) and when it shows. */
describe('Agentic Flow Demo design', () => {
  const tabs = AgenticFlowDemo.fields.find((f: Field) => f.type === 'tabs') as any
  // Every named field, through collapsibles and rows; a group's fields as "group.field".
  const flatten = (fields: any[], prefix = ''): Record<string, any> =>
    Object.assign(
      {},
      ...fields.map((f) =>
        f.type === 'collapsible' || f.type === 'row'
          ? flatten(f.fields, prefix)
          : f.type === 'group'
            ? { [prefix + f.name]: f, ...flatten(f.fields, `${prefix}${f.name}.`) }
            : { [prefix + f.name]: f },
      ),
    )
  const design = flatten(tabs.tabs[0].fields)
  const values = (name: string) => design[name].options.map((o: any) => o.value)

  it('is one tab, Design, after the content fields, which stay where they were', () => {
    expect(tabs.tabs.map((t: any) => t.label)).toEqual(['Design'])
    expect(tabs.tabs[0].name).toBeUndefined()
    expect(AgenticFlowDemo.fields.slice(-1)[0]).toBe(tabs)
  })

  it('groups the options as the brief does', () => {
    expect(tabs.tabs[0].fields.map((c: any) => c.label)).toEqual(['Labels', 'Cards', 'Line', 'Buttons', 'Panel', 'Behaviour (Flow mode)'])
  })

  it('has every option, starting as the block looks today', () => {
    expect(design.promptLabel).toMatchObject({ type: 'text', maxLength: 80, defaultValue: 'Pick an event and watch it travel through.' })
    for (const n of ['trigger', 'route', 'resolve']) {
      expect(design[`stageLabels.${n}`]).toMatchObject({ type: 'text', maxLength: 20 })
      // Empty means the mode's own eyebrow, filled in by the website.
      expect(design[`stageLabels.${n}`].defaultValue).toBeUndefined()
    }
    expect(design['handlerLabels.agent']).toMatchObject({ type: 'text', maxLength: 20, defaultValue: 'Virtual agent' })
    expect(design['handlerLabels.human']).toMatchObject({ type: 'text', maxLength: 20, defaultValue: 'Human team' })
    expect(design.showFootnote).toMatchObject({ type: 'checkbox', defaultValue: true })
    expect(['card1', 'card2', 'card3'].map((c) => design[`accents.${c}`].defaultValue)).toEqual(['crimson', 'crimson', 'teal'])
    for (const c of ['card1', 'card2', 'card3']) expect(values(`accents.${c}`)).toEqual(['crimson', 'navy', 'teal', 'grey'])
    expect(design.cardShadow).toMatchObject({ type: 'checkbox', defaultValue: true })
    expect(design.equalHeights).toMatchObject({ type: 'checkbox', defaultValue: true })
    expect(values('lineStyle')).toEqual(['animated', 'static', 'none'])
    expect(values('lineColor')).toEqual(['grey', 'crimson', 'navy'])
    // The line starts per mode: empty here, filled in by the website.
    expect(design.lineStyle.defaultValue).toBeUndefined()
    expect(design.lineColor.defaultValue).toBeUndefined()
    expect(values('selectedStyle')).toEqual(['solidCrimson', 'solidNavy', 'outline'])
    expect(design.selectedStyle.defaultValue).toBe('solidCrimson')
    expect(values('buttonSize')).toEqual(['regular', 'compact'])
    expect(design.buttonSize.defaultValue).toBe('regular')
    expect(values('panelBackground')).toEqual(['cloud', 'white', 'none'])
    expect(design.panelBackground.defaultValue).toBe('cloud')
    expect(design.panelBorder).toMatchObject({ type: 'checkbox', defaultValue: true })
    expect(values('autoplay')).toEqual(['off', '6', '8', '10'])
    expect(design.autoplay.defaultValue).toBe('off')
    expect(design.startEvent).toMatchObject({ type: 'number', min: 1, max: 4, defaultValue: 1 })
  })

  it('offers named colours only, no free colour field', () => {
    for (const [name, f] of Object.entries(design)) {
      if (/colou?r|accent|card[123]/i.test(name)) expect(['select', 'group'], name).toContain(f.type)
    }
  })

  it('shows the prompt, the note switch and the behaviour in Flow mode only', () => {
    for (const name of ['promptLabel', 'showFootnote']) {
      expect(design[name].admin.condition({}, { mode: 'flow' }), name).toBe(true)
      expect(design[name].admin.condition({}, { mode: 'agentFeatures' }), name).toBe(false)
      expect(design[name].admin.condition({}, { mode: 'groups' }), name).toBe(false)
    }
    const behaviour = tabs.tabs[0].fields.find((c: any) => c.label === 'Behaviour (Flow mode)')
    expect(Object.keys(flatten(behaviour.fields))).toEqual(['autoplay', 'startEvent'])
    expect(behaviour.admin.condition({}, { mode: 'flow' })).toBe(true)
    expect(behaviour.admin.condition({}, { mode: 'agentFeatures' })).toBe(false)
    expect(behaviour.admin.condition({}, { mode: 'groups' })).toBe(false)
  })

  it('gives each event an optional link to a page, an agent or a URL', () => {
    const link = field('events').fields.find((f: any) => f.name === 'link')
    const inner = flatten(link.fields)
    expect(link.type).toBe('group')
    expect(inner.label).toMatchObject({ type: 'text', maxLength: 30 })
    expect(inner.label.required).toBeFalsy()
    expect(inner.reference).toMatchObject({ type: 'relationship', relationTo: ['pages', 'microApps'] })
    expect(inner.reference.required).toBeFalsy()
    expect(inner.url.type).toBe('text')
    expect(inner.reference.admin.condition({}, { type: 'reference' })).toBe(true)
    expect(inner.url.admin.condition({}, { type: 'custom' })).toBe(true)
  })

  it('gives each event optional route points, right after the route text: up to 6 plain lines of 80', () => {
    const fields = field('events').fields as any[]
    const names = fields.map((f) => f.name)
    expect(names.indexOf('routePoints')).toBe(names.indexOf('routeText') + 1)
    const points = fields.find((f) => f.name === 'routePoints')
    expect(points).toMatchObject({
      type: 'array',
      label: 'Route points (optional)',
      maxRows: 6,
      admin: {
        initCollapsed: true,
        description: 'Named items listed under the route text, as ticks. Leave empty for a plain text card.',
      },
    })
    expect(points.minRows).toBeUndefined()
    expect(points.required).toBeFalsy()
    // Payload adds its own row id once the config is loaded; the one field of ours is the line.
    expect(points.fields.filter((f: any) => f.name !== 'id').map((f: any) => f.name)).toEqual(['line'])
    expect(points.fields.find((f: any) => f.name === 'line')).toMatchObject({ type: 'text', required: true, maxLength: 80, validate: plainText })
  })

  it('warns on route and resolve texts that end with a pasted "handlers:" label', () => {
    for (const name of ['routeText', 'resolveText']) {
      const f = field('events').fields.find((x: any) => x.name === name)
      expect(f.admin.components.Description, name).toBe('@/fields/PastedLabelWarning/Component#PastedLabelWarning')
    }
    expect(pastedLabelProblem('Payment services then sends a Razorpay link in the same chat. handlers: agent')).toMatch(/pasted field label/)
    expect(pastedLabelProblem('Sends the link. Handlers: human ')).toMatch(/pasted field label/)
    expect(pastedLabelProblem('The handlers: agent and human decide')).toBeNull()
    expect(pastedLabelProblem('Sends the link in the same chat.')).toBeNull()
    expect(pastedLabelProblem(null)).toBeNull()
  })
})

/** Blocks on a published page (temporary records: zz-afd-). Publishing, as drafts skip validation. */
describe('blocks on a saved page', () => {
  let payload: Payload
  const quiet = { disableRevalidate: true }
  const event = (extra: Record<string, unknown> = {}) => ({
    label: 'ZZ event',
    triggerTitle: 'Trigger',
    triggerText: 'Something happens.',
    routeText: 'It is routed.',
    handlers: ['agent'],
    resolveTitle: 'Resolved',
    resolveText: 'It is done.',
    ...extra,
  })
  const block = (extra: Record<string, unknown>) => ({ blockType: 'agenticFlowDemo', heading: 'ZZ flow', ...extra })
  const publishLayout = (slug: string, layout: unknown[]) =>
    payload.create({
      collection: 'pages',
      data: { title: `ZZ AFD ${slug}`, slug: `zz-afd-${slug}`, hero: { type: 'none' }, layout, _status: 'published' } as never,
      overrideAccess: true,
      depth: 0,
      context: quiet,
    })
  const publish = (slug: string, events: unknown[]) => publishLayout(slug, [block({ mode: 'flow', events })])
  const item = {
    name: 'Customer 360',
    summary: 'One record per customer.',
    features: [{ line: 'Every visit on one record' }],
    lands: 'On the customer record.',
  }
  const sweep = async () => {
    const found = await payload.find({ collection: 'pages', where: { slug: { like: 'zz-afd-' } }, draft: true, pagination: false, depth: 0, overrideAccess: true })
    for (const d of found.docs) await payload.delete({ collection: 'pages', id: d.id, overrideAccess: true, context: quiet })
  }
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await sweep()
  })
  afterAll(() => sweep())

  it('publishes a Flow block saved without route points, as every existing one is', async () => {
    const page = await publish('none', [event()])
    expect((page.layout as any[])[0].events[0].routePoints ?? []).toEqual([])
  })

  it('keeps up to six lines, and refuses a seventh or a line over 80 characters', async () => {
    const lines = (n: number) => Array.from({ length: n }, (_, i) => ({ line: `Customer 360, part ${i + 1}` }))
    const page = await publish('six', [event({ routePoints: lines(6) })])
    expect((page.layout as any[])[0].events[0].routePoints.map((p: any) => p.line)).toEqual(lines(6).map((l) => l.line))
    await expect(publish('seven', [event({ routePoints: lines(7) })])).rejects.toMatchObject({ name: 'ValidationError' })
    await expect(publish('long', [event({ routePoints: [{ line: 'x'.repeat(81) }] })])).rejects.toMatchObject({ name: 'ValidationError' })
  })

  it('publishes a Flow block with four events, as the live ones have, and refuses one with none', async () => {
    const four = ['One', 'Two', 'Three', 'Four'].map((label) => event({ label }))
    const page = await publish('four', four)
    expect((page.layout as any[])[0].events.map((e: any) => e.label)).toEqual(['One', 'Two', 'Three', 'Four'])
    await expect(publish('no-events', [])).rejects.toMatchObject({ name: 'ValidationError' })
  })

  it('publishes a Groups block with no events', async () => {
    const page = await publishLayout('groups', [block({ mode: 'groups', groups: [{ label: 'CRM', items: [item] }] })])
    expect((page.layout as any[])[0].groups[0].items[0]).toMatchObject({ name: 'Customer 360', lands: 'On the customer record.' })
  })

  it('refuses a Groups block with no groups, a group with no items, an item with no features, or one that does not say where it lands', async () => {
    await expect(publishLayout('groups-empty', [block({ mode: 'groups', groups: [] })])).rejects.toMatchObject({ name: 'ValidationError' })
    await expect(publishLayout('groups-no-items', [block({ mode: 'groups', groups: [{ label: 'CRM', items: [] }] })])).rejects.toMatchObject({ name: 'ValidationError' })
    await expect(publishLayout('groups-no-features', [block({ mode: 'groups', groups: [{ label: 'CRM', items: [{ ...item, features: [] }] }] })])).rejects.toMatchObject({
      name: 'ValidationError',
    })
    const { lands: _lands, ...noLands } = item
    await expect(publishLayout('groups-no-lands', [block({ mode: 'groups', groups: [{ label: 'CRM', items: [noLands] }] })])).rejects.toMatchObject({
      name: 'ValidationError',
    })
  })

  it('publishes an Agent features block with no events and no groups', async () => {
    const page = await publishLayout('features', [block({ mode: 'agentFeatures' })])
    expect((page.layout as any[])[0].mode).toBe('agentFeatures')
  })
})
