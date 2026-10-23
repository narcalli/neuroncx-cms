'use client'

import type { FieldDescriptionClientProps } from 'payload'

import { useFormFields } from '@payloadcms/ui'
import React from 'react'

/**
 * A field's description with a live character count under it, such as
 * "120 of 200 characters". The count turns red past the limit, before the
 * save is refused. Wired in by countedText() (src/fields/counted.ts).
 */
export const CharCounterDescription: React.FC<FieldDescriptionClientProps> = ({
  description,
  field,
  path,
}) => {
  const value = useFormFields(([fields]) => fields[path]?.value)
  const max = (field as { maxLength?: number }).maxLength
  const length = typeof value === 'string' ? value.length : 0
  const over = typeof max === 'number' && length > max
  const text = typeof description === 'string' ? description : undefined

  return (
    <div className={`field-description field-description-${path.replace(/\./g, '__')}`}>
      {text ? <span>{text} </span> : null}
      <span style={over ? { color: 'var(--theme-error-500)', fontWeight: 600 } : undefined}>
        {length}
        {typeof max === 'number' ? ` of ${max}` : ''} characters
      </span>
    </div>
  )
}
