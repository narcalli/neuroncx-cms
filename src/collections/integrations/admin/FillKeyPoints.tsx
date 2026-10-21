'use client'
import { Button, useForm, useFormFields } from '@payloadcms/ui'
import React, { useState } from 'react'

import { cutLine } from './cutLine'

/**
 * "Fill from status flow": turns up to 5 What moves rows into WhatsApp key
 * points, as "<event>: <what happens>", cut to 60 characters by cutLine.ts. It only fills
 * empty key point rows, then adds rows up to the limit of 5. It never
 * changes a line an editor has written, and skips lines already there.
 */

const MAX_ROWS = 5
const MAX_LINE = 60

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

export const FillKeyPoints: React.FC = () => {
  const { addFieldRow, dispatchFields, setModified } = useForm()
  const [message, setMessage] = useState('')

  const state = useFormFields(([f]) => {
    const rows = (path: string) =>
      f[path]?.rows?.length ?? (typeof f[path]?.value === 'number' ? f[path].value : 0)
    const flow = Array.from({ length: rows('statusFlow') }, (_, i) => ({
      event: text(f[`statusFlow.${i}.event`]?.value),
      whatHappens: text(f[`statusFlow.${i}.whatHappens`]?.value),
    }))
    const points = Array.from({ length: rows('waKeyPoints') }, (_, i) =>
      text(f[`waKeyPoints.${i}.line`]?.value),
    )
    return JSON.stringify({ flow, points })
  })
  const { flow, points } = JSON.parse(state) as {
    flow: { event: string; whatHappens: string }[]
    points: string[]
  }

  const fill = () => {
    const have = new Set(points.filter(Boolean).map((p) => p.toLowerCase()))
    const lines = flow
      .filter((r) => r.event && r.whatHappens)
      .map((r) => cutLine(`${r.event}: ${r.whatHappens}`, MAX_LINE))
      .filter((line) => !have.has(line.toLowerCase()))

    if (!lines.length) {
      setMessage(
        flow.length
          ? 'Nothing to add: every status flow line is already a key point.'
          : 'Add rows in the What moves tab first.',
      )
      return
    }

    let filled = 0
    let added = 0
    // Empty rows first, in place.
    points.forEach((p, i) => {
      if (!p && lines.length) {
        dispatchFields({ type: 'UPDATE', path: `waKeyPoints.${i}.line`, value: lines.shift() })
        filled++
      }
    })
    // Then new rows, up to the WhatsApp limit of 5.
    let count = points.length
    while (lines.length && count < MAX_ROWS) {
      const value = lines.shift()
      addFieldRow({
        path: 'waKeyPoints',
        schemaPath: 'waKeyPoints',
        rowIndex: count,
        subFieldState: { line: { initialValue: value, value, valid: true } },
      })
      count++
      added++
    }
    if (filled || added) setModified(true)
    const skipped = lines.length
    if (!filled && !added) {
      setMessage(
        `Key points are full: they hold 5 lines. ${skipped} status line${skipped === 1 ? '' : 's'} did not fit. Clear a line to make room.`,
      )
      return
    }
    setMessage(
      `Filled ${filled} empty line${filled === 1 ? '' : 's'} and added ${added}.` +
        (skipped ? ` ${skipped} more did not fit: key points hold 5 lines.` : '') +
        ' Lines you wrote were left as they are.',
    )
  }

  return (
    <div style={{ marginBottom: 'var(--base)' }}>
      <Button buttonStyle="secondary" size="small" onClick={fill} margin={false}>
        Fill from status flow
      </Button>
      <div style={{ fontSize: 12, color: 'var(--theme-elevation-500)', marginTop: 6 }}>
        {message ||
          'Copies up to 5 What moves rows into the key points below, as "event: what happens". Only empty lines are filled.'}
      </div>
    </div>
  )
}
