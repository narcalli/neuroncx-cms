'use client'
import { useRowLabel } from '@payloadcms/ui'
import React from 'react'

import type { IntegrationsMarqueeBlock } from '@/payload-types'

type LogoRow = NonNullable<IntegrationsMarqueeBlock['logos']>[number]

export const IntegrationsMarqueeRowLabel: React.FC = () => {
  const data = useRowLabel<LogoRow>()
  const rowNumber = data?.rowNumber !== undefined ? data.rowNumber + 1 : undefined
  const fallback = rowNumber ? `Logo ${rowNumber}` : 'Logo'

  return <div>{data?.data?.name || fallback}</div>
}
