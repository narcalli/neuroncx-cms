'use client'

import type { FieldDescriptionClientProps } from 'payload'

import { useFormFields } from '@payloadcms/ui'
import React from 'react'

import { pastedLabelProblem } from '../../blocks/AgenticFlowDemo/pastedLabel'

/**
 * A field's description, plus a warning while its text ends with a pasted
 * field label (pastedLabelProblem). Shown as the editor types; it does not
 * stop the save.
 */
export const PastedLabelWarning: React.FC<FieldDescriptionClientProps> = ({ description, path }) => {
  const value = useFormFields(([fields]) => fields[path]?.value)
  const warning = pastedLabelProblem(value)
  const text = typeof description === 'string' ? description : undefined
  if (!text && !warning) return null
  return (
    <div className={`field-description field-description-${path.replace(/\./g, '__')}`}>
      {text ? <span>{text} </span> : null}
      {warning ? <span style={{ color: 'var(--theme-warning-600, #b45309)', fontWeight: 600 }}>{warning}</span> : null}
    </div>
  )
}
