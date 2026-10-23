'use client'

import { useRowLabel } from '@payloadcms/ui'
import React from 'react'

type Row = { heading?: string | null; title?: string | null; headline?: string | null }

/**
 * A layout row named by its block and heading, such as "Testimonial: What
 * changed at the front desk". A section with no heading of its own shows
 * its default heading.
 */
export const LayoutRowLabel: React.FC<{ label?: string; headingDefault?: string }> = ({
  label = 'Block',
  headingDefault,
}) => {
  const row = useRowLabel<Row>()
  const own = row?.data?.heading || row?.data?.title || row?.data?.headline
  const heading = own || (headingDefault ? `${headingDefault} (default)` : '')
  return <span>{heading ? `${label}: ${heading}` : label}</span>
}
