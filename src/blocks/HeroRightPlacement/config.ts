import type { Block } from 'payload'

import { optionalCta } from '@/fields/optionalCta'

/**
 * A hero with an image or video pinned to the right, fading into plain navy
 * on the left where the text sits. Built for a diagram, screenshot or
 * product shot that should stay fully visible — not cropped like a
 * full-bleed background, and not covered by a dark overlay.
 *
 * Unlike Hero — Full Background, this one has no placement or fit choice:
 * it always shows the whole image (contain), pinned to the right, at a
 * fixed size. That is the point of the block — for a full-bleed photo
 * background, use Hero — Full Background instead.
 */
export const HeroRightPlacement: Block = {
  slug: 'heroRightPlacement',
  interfaceName: 'HeroRightPlacementBlock',
  labels: { singular: 'Hero (Right Placement)', plural: 'Heroes (Right Placement)' },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      label: 'Small label above the headline',
      admin: { description: 'Optional. Short, e.g. "Bot swarm".' },
    },
    {
      name: 'headline',
      type: 'text',
      required: true,
      label: 'Headline',
      admin: {
        description:
          'This becomes the page’s main heading (the H1), so use it only once per page. Set the page hero above to "None" when this block is on the page.',
      },
    },
    {
      name: 'subhead',
      type: 'textarea',
      label: 'Subhead',
      admin: { description: 'One or two sentences under the headline. Optional.' },
    },
    optionalCta('primaryCta', 'Primary button'),
    optionalCta('secondaryCta', 'Secondary button'),
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Image or video',
      admin: {
        description:
          'Aim for 16:10. 2560 x 1600 is ideal. Nothing is ever cropped: the picture is fitted whole and pinned to the right, so a diagram or screenshot stays readable. But its left edge and its top and bottom edges fade out into the page, so keep labels and text clear of the left quarter and of the top and bottom tenth. Upload at least 2304 px wide so it stays sharp on a 2x screen; anything wider than 2560 px is scaled down to that width. WebP or PNG for diagrams and screenshots. For moving media use MP4 or WebM. A GIF is served at its original size with no resizing, so it looks soft when stretched across the panel and loads slowly.',
      },
    },
    {
      name: 'mediaAlt',
      type: 'text',
      label: 'What the picture shows (optional)',
      admin: {
        description:
          'Leave empty when the picture is purely illustrative. Fill this in when it carries meaning a screen reader user needs to know.',
      },
    },
    {
      name: 'videoPoster',
      type: 'upload',
      relationTo: 'media',
      label: 'Video poster image',
      filterOptions: { mimeType: { contains: 'image' } },
      admin: {
        description:
          'Only used when the media above is a video. Shown while the video loads and when motion is off.',
      },
    },
    {
      name: 'animation',
      type: 'select',
      label: 'Motion',
      defaultValue: 'on',
      options: [
        { label: 'On', value: 'on' },
        { label: 'Off', value: 'off' },
      ],
      admin: {
        description:
          'The headline words fade in and the image slowly breathes. Always off for a visitor whose device asks for reduced motion.',
      },
    },
  ],
}
