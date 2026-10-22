'use client'
import { useRowLabel } from '@payloadcms/ui'
import React from 'react'

import type { IntegrationsMaster } from '@/payload-types'

type SectionRow = NonNullable<IntegrationsMaster['integrationSections']>[number]

/** A section row named by its eyebrow, else its heading, else its number. */
export const SectionRowLabel: React.FC = () => {
  const data = useRowLabel<SectionRow>()
  const rowNumber = data?.rowNumber !== undefined ? data.rowNumber + 1 : undefined
  const fallback = rowNumber ? `Section ${rowNumber}` : 'Section'

  return <div>{data?.data?.eyebrow || data?.data?.heading || fallback}</div>
}
