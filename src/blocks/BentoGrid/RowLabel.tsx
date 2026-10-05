'use client'
import { useRowLabel } from '@payloadcms/ui'
import React from 'react'

import type { BentoGridBlock } from '@/payload-types'

const COL_LABELS: Record<string, string> = {
  '3': '1/4 width',
  '4': '1/3 width',
  '6': '1/2 width',
  '8': '2/3 width',
  '9': '3/4 width',
  '12': 'Full width',
}

export const BentoGridRowLabel: React.FC = () => {
  const data = useRowLabel<NonNullable<BentoGridBlock['cards']>[number]>()
  const rowNumber = data?.rowNumber !== undefined ? data.rowNumber + 1 : undefined
  const fallback = rowNumber ? `Card ${rowNumber}` : 'Card'

  const title = data?.data?.title
  if (!title) return <div>{fallback}</div>

  const colSpan = data?.data?.colSpan ? COL_LABELS[data.data.colSpan] || data.data.colSpan : undefined
  const rowSpan = data?.data?.rowSpan
  const size = [colSpan, rowSpan ? `${rowSpan} row${rowSpan === '1' ? '' : 's'}` : undefined]
    .filter(Boolean)
    .join(', ')

  return <div>{size ? `${title} (${size})` : title}</div>
}
