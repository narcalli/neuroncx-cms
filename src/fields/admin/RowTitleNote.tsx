'use client'

import { useFormFields } from '@payloadcms/ui'
import React from 'react'

import { cutOnWord } from '@/utilities/fitText'

/**
 * Note under the WhatsApp row title, for collections whose hook fills an
 * empty row title from the name cut to 24 characters (whatsappTab option
 * rowTitleFromName). Shown while the row title is that cut name, so an
 * editor replaces it with one that reads well. Read only.
 */

const text = (v: unknown) => (typeof v === 'string' ? v : '')

export const RowTitleNote: React.FC = () => {
  const name = useFormFields(([fields]) => text(fields.name?.value)).trim()
  const title = useFormFields(([fields]) => text(fields.waRowTitle?.value))

  if (name.length <= 24 || !title || title !== cutOnWord(name, 24)) return null

  return (
    <div className="field-description" style={{ color: 'var(--theme-warning-650)' }}>
      Cut from the name to fit 24 characters. Write a row title that reads well on its own.
    </div>
  )
}
