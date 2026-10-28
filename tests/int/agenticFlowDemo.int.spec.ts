import type { Field, SelectField } from 'payload'
import { describe, expect, it } from 'vitest'

import { AgenticFlowDemo } from '@/blocks/AgenticFlowDemo/config'
import { pastedLabelProblem } from '@/blocks/AgenticFlowDemo/pastedLabel'

/** The Agentic Flow Demo: Flow mode as before, and Agent features mode. */

const field = (name: string): any => AgenticFlowDemo.fields.find((f: Field) => 'name' in f && f.name === name)
const shown = (name: string, mode?: string) => field(name).admin?.condition?.({}, { mode }, {} as never) ?? true

describe('Agentic Flow Demo modes', () => {
  it('is Flow or Agent features, Flow by default, so saved blocks stay as they are', () => {
    const mode = field('mode') as SelectField
    expect(mode.options).toEqual([
      { label: 'Flow', value: 'flow' },
      { label: 'Agent features', value: 'agentFeatures' },
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

  it('shows the events and the note in Flow mode only, unset counting as Flow', () => {
    for (const name of ['events', 'footnote']) {
      expect(shown(name, undefined), name).toBe(true)
      expect(shown(name, 'flow'), name).toBe(true)
      expect(shown(name, 'agentFeatures'), name).toBe(false)
    }
  })

  it('shows the families and the two button labels in Agent features mode only', () => {
    for (const name of ['families', 'pickFamilyLabel', 'pickAgentLabel']) {
      expect(shown(name, 'agentFeatures'), name).toBe(true)
      expect(shown(name, 'flow'), name).toBe(false)
      expect(shown(name, undefined), name).toBe(false)
    }
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
      'heading', 'intro', 'mode', 'agentsFor', 'industries', 'families', 'pickFamilyLabel', 'pickAgentLabel', 'events', 'footnote', 'collapsible', 'tabs',
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
    }
    const behaviour = tabs.tabs[0].fields.find((c: any) => c.label === 'Behaviour (Flow mode)')
    expect(Object.keys(flatten(behaviour.fields))).toEqual(['autoplay', 'startEvent'])
    expect(behaviour.admin.condition({}, { mode: 'flow' })).toBe(true)
    expect(behaviour.admin.condition({}, { mode: 'agentFeatures' })).toBe(false)
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
