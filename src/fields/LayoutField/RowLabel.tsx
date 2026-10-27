'use client'

import { useRowLabel } from '@payloadcms/ui'
import React from 'react'

type Row = { heading?: string | null; title?: string | null; headline?: string | null }

/**
 * A layout row named by its kind, its name and its own heading, such as
 * "Section: Industry problems" or "Block: Bento Grid, Result-day campaigns".
 * A row without a heading of its own shows its kind and name only.
 */
export const LayoutRowLabel: React.FC<{ kind?: 'section' | 'block'; label?: string; headingDefault?: string }> = ({
  kind,
  label = 'Block',
}) => {
  const row = useRowLabel<Row>()
  const own = (row?.data?.heading || row?.data?.title || row?.data?.headline || '').trim()
  const name = kind ? `${kind === 'section' ? 'Section' : 'Block'}: ${label}` : label
  return <span>{own ? `${name}, ${own}` : name}</span>
}
