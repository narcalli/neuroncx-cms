'use client'
import { useRowLabel } from '@payloadcms/ui'
import React from 'react'

import type { ProductInActionBlock } from '@/payload-types'

type CardRow = NonNullable<ProductInActionBlock['cards']>[number]

export const ProductInActionRowLabel: React.FC = () => {
  const data = useRowLabel<CardRow>()
  const rowNumber = data?.rowNumber !== undefined ? data.rowNumber + 1 : undefined
  const fallback = rowNumber ? `Card ${rowNumber}` : 'Card'

  return <div>{data?.data?.title || fallback}</div>
}
