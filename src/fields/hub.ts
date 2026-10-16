import type { Field } from 'payload'

import { iconField } from './icons'
import { plainText } from './validators/plainText'

/**
 * Hub fields for a grouping collection (integration categories, agent
 * families): the section heading and intro on the hub page, an icon, and how
 * the group appears as a row in a WhatsApp list menu. `afterIntro` fields go
 * between the intro and the icon. Wording is the collection's own.
 */
export const hubFields = (opts: {
  hubHeading: string
  hubIntro: string
  icon: string
  waRowTitle: string
  waRowDescriptionAuto: string
  waRowDescription: string
  afterIntro?: Field[]
}): Field[] => [
  {
    name: 'hubHeading',
    type: 'text',
    label: 'Hub heading',
    maxLength: 60,
    admin: { description: opts.hubHeading },
  },
  {
    name: 'description',
    type: 'textarea',
    label: 'Hub intro',
    maxLength: 140,
    admin: { description: opts.hubIntro },
  },
  ...(opts.afterIntro || []),
  iconField(undefined, { description: opts.icon }),
  {
    name: 'waRowTitle',
    type: 'text',
    label: 'WhatsApp row title',
    maxLength: 24,
    validate: plainText,
    admin: { description: opts.waRowTitle },
  },
  {
    name: 'waRowDescriptionAuto',
    type: 'checkbox',
    label: 'Fill the WhatsApp row description automatically',
    defaultValue: false,
    admin: { description: opts.waRowDescriptionAuto },
  },
  {
    name: 'waRowDescription',
    type: 'text',
    label: 'WhatsApp row description',
    maxLength: 70,
    validate: plainText,
    admin: { description: opts.waRowDescription },
  },
]
