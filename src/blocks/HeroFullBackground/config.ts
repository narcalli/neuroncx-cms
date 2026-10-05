import type { Block } from 'payload'

import { optionalCta } from '@/fields/optionalCta'

export const HeroFullBackground: Block = {
  slug: 'heroFullBackground',
  interfaceName: 'HeroFullBackgroundBlock',
  labels: { singular: 'Hero — Full Background', plural: 'Heroes — Full Background' },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      label: 'Small label above the headline',
      admin: { description: 'Optional. Short, e.g. "AI automation for patient journeys".' },
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
      name: 'metaItems',
      type: 'array',
      label: 'Short facts under the buttons',
      maxRows: 3,
      admin: {
        initCollapsed: true,
        description:
          'Optional. Up to three short lines, e.g. "New guide every two weeks". Shown with a small dot between them.',
      },
      fields: [{ name: 'text', type: 'text', required: true }],
    },
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Background image or video',
      admin: {
        description:
          'Works best with photos, textures or abstract images that have a calm area on the left for the text. For diagrams or screenshots with their own text, set Media placement to Right. Use MP4 or WebM for moving backgrounds — GIFs work but load much slower and are best kept short and small.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'mediaPlacement',
          type: 'select',
          label: 'Media placement',
          defaultValue: 'fullBleed',
          options: [
            { label: 'Full bleed — fills the hero', value: 'fullBleed' },
            { label: 'Right — image on the right, text on plain navy', value: 'right' },
          ],
          admin: {
            width: '50%',
            description:
              'Right suits a diagram, screenshot or infographic that already has its own text or busy detail.',
          },
        },
        {
          name: 'mediaFit',
          type: 'select',
          label: 'Media fit',
          defaultValue: 'contain',
          options: [
            { label: 'Contain — shows the whole image', value: 'contain' },
            { label: 'Cover — fills the space, may crop', value: 'cover' },
          ],
          admin: {
            width: '50%',
            description: 'Right placement only. Contain suits a diagram; Cover suits a photo.',
            condition: (_, siblingData) => siblingData?.mediaPlacement === 'right',
          },
        },
      ],
    },
    {
      name: 'mediaAlt',
      type: 'text',
      label: 'What the picture shows (optional)',
      admin: {
        description:
          'Leave empty for a purely decorative background — that is the usual choice for a full-bleed hero. Fill this in only when the picture itself carries meaning a screen reader user needs to know.',
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
          'Only used when the background is a video. Shown while the video loads and when motion is off.',
      },
    },
    {
      name: 'mobileMedia',
      type: 'upload',
      relationTo: 'media',
      label: 'Background for small screens (optional)',
      admin: {
        description:
          'Replaces the background above on phones and small tablets. Leave empty to use the same file on every screen size. Has no effect when Media placement is set to Right — that layout already changes to a stacked image on phones.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'focalPoint',
          type: 'select',
          label: 'Focal point',
          defaultValue: 'center',
          options: [
            { label: 'Centre', value: 'center' },
            { label: 'Left', value: 'left' },
            { label: 'Right', value: 'right' },
            { label: 'Top', value: 'top' },
            { label: 'Bottom', value: 'bottom' },
          ],
          admin: {
            width: '50%',
            description: 'Which part of the picture to keep in view when it gets cropped.',
          },
        },
        {
          name: 'overlayStrength',
          type: 'select',
          label: 'Dark overlay',
          defaultValue: 'strong',
          options: [
            { label: 'Light', value: 'light' },
            { label: 'Medium', value: 'medium' },
            { label: 'Strong', value: 'strong' },
          ],
          admin: {
            width: '50%',
            description:
              'Darkens the picture so the text stays readable. Strong is the safest default for a full-bleed photo.',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'animation',
          type: 'select',
          label: 'Motion',
          defaultValue: 'subtle',
          options: [
            { label: 'Off', value: 'off' },
            { label: 'Subtle', value: 'subtle' },
            { label: 'Lively', value: 'lively' },
          ],
          admin: {
            width: '50%',
            description:
              'How the text and background enter. Always off for a visitor whose device asks for reduced motion.',
          },
        },
        {
          name: 'height',
          type: 'select',
          label: 'Height',
          defaultValue: 'tall',
          options: [
            { label: 'Tall', value: 'tall' },
            { label: 'Medium', value: 'medium' },
          ],
          admin: { width: '50%', description: 'On a phone the hero always fits its content.' },
        },
      ],
    },
  ],
}
