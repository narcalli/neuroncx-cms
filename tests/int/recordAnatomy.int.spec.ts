import type { Field } from 'payload'
import { describe, expect, it } from 'vitest'

import { RecordAnatomy } from '@/blocks/RecordAnatomy/config'
import { PAGE_LAYOUT_BLOCKS } from '@/blocks/pageLayoutBlocks'

/** Record anatomy: fields in order, limits, defaults and the source guidance. */

const flat = (fields: any[]): any[] => fields.flatMap((f) => (f.type === 'row' ? flat(f.fields) : [f]))
const named = (fields: Field[], name: string): any => flat(fields).find((f) => f.name === name)

describe('the block', () => {
  it('is recordAnatomy, "Record anatomy", in the Pages layout with the full Appearance set', () => {
    expect(RecordAnatomy.slug).toBe('recordAnatomy')
    expect((RecordAnatomy.labels as { singular: string }).singular).toBe('Record anatomy')
    const registered = PAGE_LAYOUT_BLOCKS.find((b) => b.slug === 'recordAnatomy')!
    const appearance = registered.fields.at(-1) as any
    expect(appearance).toMatchObject({ type: 'collapsible', label: 'Appearance' })
    const names = JSON.stringify(appearance)
    for (const n of ['background', 'width', 'spacingTop', 'spacingBottom', 'align', 'hidden', 'htmlId']) expect(names, n).toContain(`"name":"${n}"`)
  })

  it('has its fields in order, with their limits and defaults', () => {
    expect(flat(RecordAnatomy.fields).map((f) => f.name)).toEqual([
      'eyebrow', 'heading', 'intro', 'recordLabel', 'fieldColumnLabel', 'sourceColumnLabel', 'entities',
    ])
    expect(named(RecordAnatomy.fields, 'eyebrow')).toMatchObject({ type: 'text', maxLength: 60 })
    expect(named(RecordAnatomy.fields, 'heading')).toMatchObject({ type: 'text', maxLength: 140, required: true })
    expect(named(RecordAnatomy.fields, 'intro')).toMatchObject({ type: 'textarea', maxLength: 300 })
    expect(named(RecordAnatomy.fields, 'recordLabel')).toMatchObject({ type: 'text', maxLength: 40, defaultValue: 'Customer record' })
    expect(named(RecordAnatomy.fields, 'fieldColumnLabel')).toMatchObject({ type: 'text', maxLength: 30, defaultValue: 'Field' })
    expect(named(RecordAnatomy.fields, 'sourceColumnLabel')).toMatchObject({ type: 'text', maxLength: 30, defaultValue: 'Filled by' })
  })

  it('takes 2 to 10 entities, each a name, an optional icon, a description and fields', () => {
    const entities = named(RecordAnatomy.fields, 'entities')
    expect(entities).toMatchObject({ type: 'array', minRows: 2, maxRows: 10, required: true })
    expect(flat(entities.fields).map((f) => f.name)).toEqual(['label', 'icon', 'description', 'fields'])
    expect(named(entities.fields, 'label')).toMatchObject({ type: 'text', maxLength: 40, required: true })
    const icon = named(entities.fields, 'icon')
    expect(icon.type).toBe('select')
    expect(icon.required).toBeFalsy()
    expect(icon.defaultValue).toBeUndefined()
    expect(icon.admin.components.Field.path).toContain('IconPicker')
    expect(named(entities.fields, 'description')).toMatchObject({ type: 'text', maxLength: 200 })
  })

  it('takes 1 to 8 fields per entity, each a name and a source, with the source guidance', () => {
    const fields = named(named(RecordAnatomy.fields, 'entities').fields, 'fields')
    expect(fields).toMatchObject({ type: 'array', minRows: 1, maxRows: 8, required: true })
    expect(flat(fields.fields).map((f) => f.name)).toEqual(['name', 'source'])
    expect(named(fields.fields, 'name')).toMatchObject({ type: 'text', maxLength: 60, required: true })
    const source = named(fields.fields, 'source')
    expect(source).toMatchObject({ type: 'text', maxLength: 80, required: true })
    expect(source.admin.description).toBe(
      'The system or step that fills the field, such as Lead management system, ERP or Qualification form. Only sources that are live.',
    )
  })
})
