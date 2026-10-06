import type { Block } from 'payload'

/**
 * A customer quote, shown alone or as a carousel. A quote can link to its
 * full case study. Photo and logo are optional; the initials are shown when
 * there's no photo.
 */
export const Testimonial: Block = {
  slug: 'testimonial',
  interfaceName: 'TestimonialBlock',
  labels: { singular: 'Testimonial', plural: 'Testimonials' },
  fields: [
    { name: 'eyebrow', type: 'text', label: 'Eyebrow', maxLength: 60 },
    { name: 'heading', type: 'text', label: 'Heading', maxLength: 100 },
    {
      name: 'layout',
      type: 'select',
      label: 'Layout',
      defaultValue: 'single',
      options: [
        { label: 'Single quote', value: 'single' },
        { label: 'Carousel (several quotes)', value: 'carousel' },
      ],
    },
    {
      name: 'quotes',
      type: 'array',
      label: 'Quotes',
      required: true,
      minRows: 1,
      maxRows: 6,
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'quote',
          type: 'textarea',
          label: 'Quote',
          required: true,
          maxLength: 400,
        },
        {
          name: 'attributionName',
          type: 'text',
          label: 'Name',
          required: true,
          maxLength: 80,
        },
        {
          name: 'attributionRole',
          type: 'text',
          label: 'Role',
          maxLength: 100,
        },
        {
          name: 'organisation',
          type: 'text',
          label: 'Organisation',
          required: true,
          maxLength: 100,
        },
        {
          name: 'photo',
          type: 'upload',
          relationTo: 'media',
          label: 'Photo (optional)',
          admin: { description: 'Leave empty to show initials.' },
        },
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'media',
          label: 'Organisation logo (optional)',
        },
        {
          name: 'linkedStory',
          type: 'relationship',
          relationTo: 'caseStudies',
          label: 'Linked case study (optional)',
        },
      ],
    },
  ],
}
