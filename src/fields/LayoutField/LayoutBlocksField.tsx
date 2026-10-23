'use client'

import type { BlocksFieldClientProps } from 'payload'

import { BlocksField, useFormFields } from '@payloadcms/ui'
import React from 'react'

/** The layout blocks field, read-only while the entry follows the page defaults. */
export const LayoutBlocksField: React.FC<BlocksFieldClientProps> = (props) => {
  const following = useFormFields(([fields]) => fields.usePageDefaults?.value) !== false
  return <BlocksField {...props} readOnly={Boolean(props.readOnly) || following} />
}
