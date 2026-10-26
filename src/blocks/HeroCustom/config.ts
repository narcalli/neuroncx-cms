import type { Block, Condition, Validate } from 'payload'

import { optionalCta } from '@/fields/optionalCta'

import { cssProblems, htmlProblems } from './visualRules'

const notBackground: Condition = (_data, siblingData) => siblingData?.visualPosition !== 'background'
const beside: Condition = (_data, siblingData) => ['right', 'left'].includes(siblingData?.visualPosition ?? 'right')

const checked =
  (problems: (value: unknown) => string[]): Validate =>
  (value) => {
    const found = problems(value)
    return found.length ? found.join(' ') : true
  }

/**
 * A hero whose visual is your own HTML and CSS. Everything else is fixed and
 * built like the other heroes: the eyebrow, the heading (the page's H1), the
 * subhead, two optional buttons, the breadcrumbs, the room under the header,
 * the page widths and the phone layout. Only the visual is free.
 *
 * The website draws the visual in a sealed box of its own, so its CSS cannot
 * change the rest of the page and nothing in it can cover the header. Its
 * animations stop for visitors who ask for reduced motion. Code that runs,
 * and files from other sites, are refused on save (visualRules.ts).
 */
export const HeroCustom: Block = {
  slug: 'heroCustom',
  interfaceName: 'HeroCustomBlock',
  labels: { singular: 'Hero (custom CSS)', plural: 'Heroes (custom CSS)' },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'eyebrow',
              type: 'text',
              label: 'Small label above the headline',
              maxLength: 60,
              admin: { description: 'Optional.' },
            },
            {
              name: 'headline',
              type: 'text',
              required: true,
              label: 'Headline',
              maxLength: 120,
              admin: {
                description:
                  "This becomes the page's main heading (the H1), so use it only once per page. Set the page hero above to None when this block is on the page.",
              },
            },
            {
              name: 'subhead',
              type: 'textarea',
              label: 'Subhead',
              maxLength: 400,
              admin: { description: 'One or two sentences under the headline. Optional.' },
            },
            optionalCta('primaryCta', 'Primary button'),
            optionalCta('secondaryCta', 'Secondary button'),
          ],
        },
        {
          label: 'Layout',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'visualPosition',
                  type: 'select',
                  label: 'Visual',
                  required: true,
                  defaultValue: 'right',
                  options: [
                    { label: 'Right of the text', value: 'right' },
                    { label: 'Left of the text', value: 'left' },
                    { label: 'Below the text', value: 'below' },
                    { label: 'Behind the text (background)', value: 'background' },
                  ],
                  admin: { width: '50%' },
                },
                {
                  name: 'split',
                  type: 'select',
                  label: 'Text and visual widths',
                  required: true,
                  defaultValue: '50',
                  options: [
                    { label: 'Half and half', value: '50' },
                    { label: 'Narrower text, wider visual', value: '40' },
                  ],
                  admin: { width: '50%', condition: beside },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'height',
                  type: 'select',
                  label: 'Height',
                  required: true,
                  defaultValue: 'natural',
                  options: [
                    { label: 'As tall as its content', value: 'natural' },
                    { label: 'Tall (most of the screen)', value: 'tall' },
                  ],
                  admin: { width: '50%' },
                },
                {
                  name: 'phoneVisual',
                  type: 'select',
                  label: 'On phones',
                  required: true,
                  defaultValue: 'below',
                  options: [
                    { label: 'Show the visual below the text', value: 'below' },
                    { label: 'Hide the visual', value: 'hide' },
                  ],
                  admin: { width: '50%', description: 'Phones and small tablets, below 900px wide.' },
                },
              ],
            },
            {
              name: 'background',
              type: 'select',
              label: 'Background',
              required: true,
              defaultValue: 'cloud',
              options: [
                { label: 'Pale grey', value: 'cloud' },
                { label: 'White', value: 'white' },
                { label: 'Navy', value: 'navy' },
              ],
              admin: { description: 'Navy switches the text to light colours.' },
            },
          ],
        },
        {
          label: 'Custom visual',
          description:
            "Your own HTML and CSS, drawn in a sealed box: its CSS only styles the visual, never the rest of the page. The site's colours and fonts are available, such as var(--ncx-crimson) and var(--font-display). Animations stop for visitors who ask for reduced motion, so make the first frame look right on its own.",
          fields: [
            {
              name: 'visualHtml',
              type: 'code',
              label: 'HTML',
              admin: {
                language: 'html',
                description: 'The markup only, no <style> or <script>. Text in it is read by search engines.',
              },
              validate: checked(htmlProblems),
            },
            {
              name: 'visualCss',
              type: 'code',
              label: 'CSS',
              admin: {
                language: 'css',
                description:
                  'Styles for the HTML above. Use @media or @container visual (max-width: 480px) for small screens. Images and fonts must come from the media library.',
              },
              validate: checked(cssProblems),
            },
            {
              name: 'visualPreview',
              type: 'ui',
              admin: {
                components: { Field: '@/blocks/HeroCustom/Preview#HeroCustomPreview' },
              },
            },
            {
              name: 'visualAlt',
              type: 'text',
              label: 'Description for screen readers',
              maxLength: 200,
              admin: { description: 'What the visual shows, in a sentence. Leave empty if it is only decoration.' },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'aspect',
                  type: 'select',
                  label: 'Shape',
                  required: true,
                  defaultValue: 'auto',
                  options: [
                    { label: 'As tall as its content', value: 'auto' },
                    { label: 'Wide (16:9)', value: '16/9' },
                    { label: 'Landscape (4:3)', value: '4/3' },
                    { label: 'Square (1:1)', value: '1/1' },
                    { label: 'Portrait (3:4)', value: '3/4' },
                  ],
                  admin: { width: '50%', condition: notBackground },
                },
                {
                  name: 'maxWidth',
                  type: 'number',
                  label: 'Widest it gets (px, optional)',
                  min: 120,
                  max: 1440,
                  admin: { width: '50%', condition: notBackground, description: 'Empty fills its column.' },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
