'use client'

import type { SelectFieldClientProps } from 'payload'

import React from 'react'

import { OptionPickerField } from '../OptionPicker/Component'
import directory from './thumbs/directory.svg'
import feature from './thumbs/feature.svg'
import grid from './thumbs/grid.svg'
import logoCard from './thumbs/logoCard.svg'
import pill from './thumbs/pill.svg'
import story from './thumbs/story.svg'
import bento from './thumbs/bento.svg'
import detailedSuite from './thumbs/detailedSuite.svg'
import suite from './thumbs/suite.svg'
import suite2 from './thumbs/suite2.svg'
import suiteSteps from './thumbs/suiteSteps.svg'

/**
 * The card design choice (fields/cardDesign.ts) as small pictures: a rough
 * wireframe of each design in the site's colours. The stored value is the
 * select value, as before.
 */
const THUMBS: Record<string, { src: string }> = {
  grid,
  logoCard,
  directory,
  feature,
  story,
  pill,
  suite,
  suiteSteps,
  suite2,
  detailedSuite,
  bento,
}

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

export const CardDesignPickerField: React.FC<SelectFieldClientProps> = (props) => (
  <OptionPickerField {...props} renderImage={thumb} minTileWidth={172} labelSize={12} maxHeight={null} />
)
