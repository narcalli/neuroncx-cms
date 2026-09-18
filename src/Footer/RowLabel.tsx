'use client'
import { useRowLabel } from '@payloadcms/ui'
import React from 'react'

import type { Header } from '@/payload-types'

export const RowLabel: React.FC = () => {
  const data = useRowLabel<NonNullable<Header['navItems']>[number]>()

  // Nav items carry `label` directly — they are no longer a nested link group.
  const label = data?.data?.label
    ? `Nav item ${data.rowNumber !== undefined ? data.rowNumber + 1 : ''}: ${data.data.label}`
    : 'Row'

  return <div>{label}</div>
}
