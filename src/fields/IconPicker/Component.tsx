'use client'

import type { SelectFieldClientProps } from 'payload'

import React from 'react'

import { iconOptions } from '../icons'
import { OptionPickerField } from '../OptionPicker/Component'
import { IconGlyph } from './icons'

/**
 * Replaces the plain text dropdown with a grid you can actually see:
 * every option shows its real icon, not just a name. Used everywhere an
 * icon is picked, since it is wired in once from iconField() rather than
 * per block. Built on OptionPicker, with a search box and, for optional
 * fields, a "No icon" tile.
 */
type Props = SelectFieldClientProps & {
  allowClear?: boolean
  /** Offer only these icons (iconField's `only`). All of them when left out. */
  only?: string[]
}

const glyph = (name: string) => (
  <span style={{ width: 22, height: 22, display: 'block' }}>
    <IconGlyph name={name} />
  </span>
)

const search = { noun: 'icons', noMatch: (query: string) => `No icon matches "${query}".` }

export const IconPickerField: React.FC<Props> = ({ allowClear, only, ...props }) => (
  <OptionPickerField
    {...props}
    options={only ? iconOptions.filter((o) => only.includes(o.value)) : iconOptions}
    renderImage={glyph}
    search={search}
    clearLabel={allowClear ? 'No icon' : undefined}
  />
)
