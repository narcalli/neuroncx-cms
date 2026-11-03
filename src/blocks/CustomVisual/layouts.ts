/**
 * The Custom Visual layouts and their anchor points: the centre of the hub
 * and of each card slot, as x% across and y% down the visual, from its top
 * left. The editor's connector visual is drawn to meet these points, and the
 * website places the hub and the cards on them, so both sides read this one
 * table (neuroncx-website mirrors it; keep the two in step).
 */

export type Anchor = readonly [x: number, y: number]

export type CustomVisualLayout = 'hubSpoke2' | 'hubSpoke3' | 'hubSpoke4' | 'none'

export const CUSTOM_VISUAL_LAYOUTS: Record<
  CustomVisualLayout,
  { label: string; hub: Anchor | null; spokes: readonly Anchor[] }
> = {
  hubSpoke2: {
    label: 'Hub with 2 spokes',
    hub: [50, 50],
    spokes: [
      [15, 50],
      [85, 50],
    ],
  },
  hubSpoke3: {
    label: 'Hub with 3 spokes',
    hub: [50, 50],
    spokes: [
      [50, 17],
      [15, 82],
      [85, 82],
    ],
  },
  hubSpoke4: {
    label: 'Hub with 4 spokes',
    hub: [50, 50],
    spokes: [
      [15, 20],
      [85, 20],
      [15, 80],
      [85, 80],
    ],
  },
  none: { label: 'None (no hub)', hub: null, spokes: [] },
}

export const DEFAULT_CUSTOM_VISUAL_LAYOUT: CustomVisualLayout = 'hubSpoke3'

/** How many cards a layout needs, or null for none, which takes any number. */
export const spokeCount = (layout: unknown): number | null => {
  const key = (
    typeof layout === 'string' && layout in CUSTOM_VISUAL_LAYOUTS
      ? layout
      : DEFAULT_CUSTOM_VISUAL_LAYOUT
  ) as CustomVisualLayout
  return key === 'none' ? null : CUSTOM_VISUAL_LAYOUTS[key].spokes.length
}

const point = ([x, y]: Anchor) => `${x}%, ${y}%`

/** The Layout field's guidance, written from the table above so it can never disagree with it. */
export const anchorGuide = (): string =>
  [
    'Points are the centre of the hub and of each card, as x% across and y% down the visual, from its top left. Draw the connector lines to meet them.',
    ...(['hubSpoke2', 'hubSpoke3', 'hubSpoke4'] as const).map((key) => {
      const { label, hub, spokes } = CUSTOM_VISUAL_LAYOUTS[key]
      return `${label}: hub at ${point(hub!)}; ${spokes.map((s, i) => `card ${i + 1} at ${point(s)}`).join('; ')}.`
    }),
    'None: no hub and no fixed points.',
  ].join(' ')
