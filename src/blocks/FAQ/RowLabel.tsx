'use client'
import { useRowLabel } from '@payloadcms/ui'
import React from 'react'

import type { FAQBlock } from '@/payload-types'

type ItemRow = NonNullable<FAQBlock['items']>[number]

export const FAQRowLabel: React.FC = () => {
  const data = useRowLabel<ItemRow>()
  const rowNumber = data?.rowNumber !== undefined ? data.rowNumber + 1 : undefined
  const fallback = rowNumber ? `Question ${rowNumber}` : 'Question'

  return <div>{data?.data?.question || fallback}</div>
}
