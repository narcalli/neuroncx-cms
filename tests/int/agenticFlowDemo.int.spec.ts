import type { Field, SelectField } from 'payload'
import { describe, expect, it } from 'vitest'

import { AgenticFlowDemo } from '@/blocks/AgenticFlowDemo/config'

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
    expect(names).toEqual(['heading', 'intro', 'mode', 'families', 'pickFamilyLabel', 'pickAgentLabel', 'events', 'footnote'])
  })
})
