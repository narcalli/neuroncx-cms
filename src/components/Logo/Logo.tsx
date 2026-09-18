import clsx from 'clsx'
import React from 'react'

interface Props {
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
}

export const Logo = (props: Props) => {
  const { loading: loadingFromProps, priority: priorityFromProps, className } = props

  const loading = loadingFromProps || 'eager'
  const priority = priorityFromProps || 'high'

  return (
    <span className={clsx('ncx-logo', className)}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700&display=swap');
        .ncx-logo{display:inline-flex;align-items:center;gap:10px;
          font-family:Poppins,Arial,sans-serif;font-weight:700;
          font-size:21px;letter-spacing:-.025em;color:currentColor;line-height:1}
        .ncx-logo img{width:auto;height:32px;display:block}
      `}</style>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        loading={loading}
        fetchPriority={priority}
        decoding="async"
        src="/ncx-logo.png"
      />
      NeuronCx
    </span>
  )
}
