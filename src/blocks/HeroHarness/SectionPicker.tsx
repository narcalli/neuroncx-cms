'use client'

import type { TextFieldClientComponent } from 'payload'

import React, { useMemo } from 'react'
import { SelectInput, useField, useFormFields } from '@payloadcms/ui'

import { blocksPathOf, sectionsOf } from './sectionLink'

const NAME_KEYS = ['htmlId', 'hidden', 'blockType', 'blockName', 'heading', 'title', 'headline', 'label']
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * "Section to jump to": a dropdown of the blocks on this page that have an
 * Anchor ID, read live from the form, so a block given an ID a moment ago is
 * listed straight away. Stores the ID itself. An ID that is no longer on the
 * page stays shown, marked, until the editor picks another; publishing checks
 * it too (sectionLink.ts).
 */
export const SectionPicker: TextFieldClientComponent = ({ field, path, readOnly }) => {
  const { value, setValue, showError } = useField<string>({ path })
  const where = blocksPathOf(path)

  // The page's blocks, as far as the list needs them, kept as a string so the form's other changes do not redraw this.
  const snapshot = useFormFields(([fields]) => {
    if (!where) return '[]'
    const match = new RegExp(`^${escape(where.blocks.join('.'))}\\.(\\d+)\\.(${NAME_KEYS.join('|')})$`)
    const blocks: Record<string, unknown>[] = []
    for (const [key, state] of Object.entries(fields)) {
      const m = key.match(match)
      if (m) (blocks[Number(m[1])] ??= {})[m[2]] = state?.value
    }
    return JSON.stringify(Array.from(blocks, (b) => b ?? {}))
  })

  const sections = useMemo(() => sectionsOf(JSON.parse(snapshot), where?.own), [snapshot, where?.own])
  const options = sections.map((s) => ({
    label: `${s.name} (#${s.id})${s.hidden ? ', hidden' : ''}`,
    value: s.id,
  }))
  if (value && !sections.some((s) => s.id === value)) {
    options.unshift({ label: `#${value} (no longer on this page)`, value })
  }

  const label = typeof field.label === 'string' ? field.label : 'Section to jump to'
  // The field's width in its row, as Payload's own fields set it (mergeFieldStyles, not exported).
  const style = (field.admin?.width ? { '--field-width': field.admin.width } : { flex: '1 1 auto' }) as React.CSSProperties

  return (
    <SelectInput
      path={path}
      name={field.name}
      label={label}
      required={field.required}
      readOnly={readOnly}
      options={options}
      value={value ?? ''}
      isClearable
      showError={showError}
      style={style}
      placeholder={sections.length ? 'Choose a section' : 'No section has an Anchor ID yet'}
      onChange={(option) => setValue(option && !Array.isArray(option) ? (option as { value: string }).value : null)}
      description={
        sections.length
          ? (field.admin?.description as string | undefined)
          : 'No block on this page has an Anchor ID yet. Open the block to jump to, set "Anchor ID (advanced)" in its Appearance panel, then choose it here.'
      }
    />
  )
}
