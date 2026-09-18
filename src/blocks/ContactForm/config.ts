import type { Block } from 'payload'

export const ContactForm: Block = {
  slug: 'contactForm',
  interfaceName: 'ContactFormBlock',
  labels: { singular: 'Contact Form', plural: 'Contact Forms' },
  fields: [
    { name: 'label', type: 'text', label: 'Small label above the heading' },
    { name: 'heading', type: 'text', label: 'Heading' },
    { name: 'intro', type: 'textarea', label: 'Intro line' },
    {
      name: 'buttonLabel',
      type: 'text',
      label: 'Button text',
      defaultValue: 'Submit enquiry',
    },
    {
      name: 'successMessage',
      type: 'textarea',
      label: 'Message shown after submitting',
      defaultValue: "Thanks — we've got your enquiry and will be in touch shortly.",
    },
    {
      name: 'showMessageField',
      type: 'checkbox',
      label: 'Include a free-text message field',
      defaultValue: true,
    },
  ],
}
