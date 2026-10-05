'use client'
import { useRowLabel } from '@payloadcms/ui'
import React from 'react'

import type { DetailedProductSuiteBlock } from '@/payload-types'

type CardRow = NonNullable<DetailedProductSuiteBlock['cards']>[number]
type HighlightRow = NonNullable<CardRow['highlights']>[number]

export const DetailedProductSuiteRowLabel: React.FC = () => {
  const data = useRowLabel<CardRow>()
  const rowNumber = data?.rowNumber !== undefined ? data.rowNumber + 1 : undefined
  const fallback = rowNumber ? `Card ${rowNumber}` : 'Card'

  return <div>{data?.data?.title || fallback}</div>
}

export const DetailedProductSuiteHighlightRowLabel: React.FC = () => {
  const data = useRowLabel<HighlightRow>()
  const rowNumber = data?.rowNumber !== undefined ? data.rowNumber + 1 : undefined
  const fallback = rowNumber ? `Point ${rowNumber}` : 'Point'

  return <div>{data?.data?.label || fallback}</div>
}
