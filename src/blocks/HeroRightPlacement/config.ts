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
  labels: { singular: 'Hero — Right Placement', plural: 'Heroes — Right Placement' },
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
          'This becomes the page’s main heading (the H1), so use it only once per page — set the page hero above to "None" when this block is on the page.',
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
          'Shown in full on the right — nothing gets cropped, so a diagram, screenshot or product shot stays readable. Use MP4 or WebM for moving media — GIFs work but load much slower and are best kept short and small.',
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
