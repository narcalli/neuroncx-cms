'use client'

import type { SelectFieldClientProps } from 'payload'

import React from 'react'

import { OptionPickerField } from '../OptionPicker/Component'
import conversation from './thumbs/conversation.svg'
import rightPlacement from './thumbs/rightPlacement.svg'
import stats from './thumbs/stats.svg'
import customCss from './thumbs/customCss.svg'
import blockHero from './thumbs/blockHero.svg'

/**
 * The hero design choice (fields/heroDesign.ts) as small pictures, like the
 * card design picker. The stored value is the select value.
 */
const THUMBS: Record<string, { src: string }> = { conversation, rightPlacement, stats, customCss, blockHero }

const thumb = (value: string) => {
  const src = THUMBS[value]?.src
  if (!src) return null
  return (
    // A static file from the admin bundle: next/image adds nothing here.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={160}
      height={100}
      style={{ display: 'block', width: '100%', maxWidth: 160, height: 'auto', borderRadius: 4 }}
    />
  )
}

export const HeroDesignPickerField: React.FC<SelectFieldClientProps> = (props) => (
  <OptionPickerField {...props} renderImage={thumb} minTileWidth={172} labelSize={12} maxHeight={null} />
)
