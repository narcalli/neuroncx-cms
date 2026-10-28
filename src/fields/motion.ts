import type { CheckboxField, Field, SelectField } from 'payload'

/**
 * Animation switches at three levels (docs/cms/fields_reference.md, Other
 * shared pieces): the site (Site Settings), each page, and each animated
 * block. The strictest wins: a visitor whose system asks for less motion
 * always gets the final state; otherwise site off beats everything, then
 * the page, then the block. Reduced keeps a simple fade and drops loops,
 * tilt and 3D. The website combines them (neuroncx-website src/motion/).
 */

// TODO(foundation.md 7.2): give the collection cards block motionFields() when it is made.

const LEVELS = [
  { label: 'On', value: 'on' },
  { label: 'Reduced (a simple fade)', value: 'reduced' },
  { label: 'Off (no animation)', value: 'off' },
]

/** Site Settings: animations across the whole site. */
export const siteAnimationsField: SelectField = {
  name: 'animations',
  type: 'select',
  label: 'Animations',
  defaultValue: 'on',
  required: true,
  options: LEVELS,
  admin: {
    description:
      'Turns animations on, down or off across the whole site. Reduced keeps a simple fade. Off shows every block with no animation.',
  },
}

/** A page's own setting, in the sidebar of pages, hubs and every collection with a page. */
export const pageMotionField = (): SelectField => ({
  name: 'pageMotion',
  type: 'select',
  label: 'Animations on this page',
  defaultValue: 'follow',
  options: [{ label: 'Follow the site', value: 'follow' }, ...LEVELS],
  admin: {
    position: 'sidebar',
    description:
      'Follow the site setting, or set this page on its own. The strictest of the site, page and block settings wins.',
  },
})

type MotionOptions = {
  /** For blocks that play a sequence: the hero chat, the swarm diagram, How it works 2, the layers, the Episode Timeline. */
  autoplay?: boolean
  /** For blocks that loop: the hero chat and the swarm diagram. */
  loop?: boolean
  /** For blocks whose timing can be slowed or sped up. */
  speed?: boolean
  /**
   * Keep the values under one name, where the switches sit on a record
   * rather than a block (a hub's hero). Left out, they are the block's own.
   */
  group?: { name: string; label: string }
}

/**
 * A block's animation switches, in a Motion panel collapsed by default:
 * motion (follow the page, on, reduced or off), and, where `options` asks,
 * autoplay, loop and speed.
 */
export const motionFields = ({ autoplay = false, loop = false, speed = false, group }: MotionOptions = {}): Field => {
  const fields: Field[] = [
    {
      name: 'motion',
      type: 'select',
      label: 'Animation',
      defaultValue: 'follow',
      options: [{ label: 'Follow the page', value: 'follow' }, ...LEVELS],
      admin: { description: 'Reduced keeps a simple fade. Off shows the block with no animation.' },
    },
    ...(autoplay
      ? [
          {
            name: 'autoplay',
            type: 'checkbox',
            label: 'Play on its own',
            defaultValue: true,
            admin: { description: 'Plays once when it comes into view. Off shows the finished state.' },
          } satisfies CheckboxField,
        ]
      : []),
    ...(loop
      ? [
          {
            name: 'loop',
            type: 'checkbox',
            label: 'Loop',
            defaultValue: true,
            admin: { description: 'Plays again while it stays on screen. Off plays it once.' },
          } satisfies CheckboxField,
        ]
      : []),
    ...(speed
      ? [
          {
            name: 'speed',
            type: 'select',
            label: 'Speed',
            defaultValue: 'normal',
            options: [
              { label: 'Slower', value: 'slower' },
              { label: 'Normal', value: 'normal' },
              { label: 'Faster', value: 'faster' },
            ],
          } satisfies SelectField,
        ]
      : []),
  ]
  return {
    type: 'collapsible',
    label: 'Motion',
    admin: { initCollapsed: true, description: 'Optional. Follows the page unless set here.' },
    fields: group ? [{ name: group.name, type: 'group', label: group.label, fields }] : fields,
  }
}
