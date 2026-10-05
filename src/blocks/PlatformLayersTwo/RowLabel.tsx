'use client'
import { useRowLabel } from '@payloadcms/ui'
import React from 'react'

import type { PlatformLayersTwoBlock } from '@/payload-types'

type LayerRow = NonNullable<PlatformLayersTwoBlock['layers']>[number]

export const PlatformLayersTwoRowLabel: React.FC = () => {
  const data = useRowLabel<LayerRow>()
  const rowNumber = data?.rowNumber !== undefined ? data.rowNumber + 1 : undefined
  const fallback = rowNumber ? `Layer ${rowNumber}` : 'Layer'

  return <div>{data?.data?.title || fallback}</div>
}
