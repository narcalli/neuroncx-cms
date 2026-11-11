'use client'
import { useConfig } from '@payloadcms/ui'
import Link from 'next/link'
import React from 'react'

/** The nav link to the review queue (src/review/ReviewQueue.tsx). */
export const ReviewNavLink: React.FC = () => {
  const {
    config: {
      routes: { admin },
    },
  } = useConfig()
  return (
    <Link className="nav__link" href={`${admin}/review`} prefetch={false}>
      <span className="nav__link-label">Review queue</span>
    </Link>
  )
}
