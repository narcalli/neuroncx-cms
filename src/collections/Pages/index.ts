import type { CollectionConfig, Where } from 'payload'

import { authenticated } from '../../access/authenticated'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { PAGE_LAYOUT_BLOCKS } from '../../blocks/pageLayoutBlocks'
import { hero } from '@/heros/config'
import { slugField } from 'payload'
import { populatePublishedAt } from '../../hooks/populatePublishedAt'
import { generatePreviewPath } from '../../utilities/generatePreviewPath'
import { revalidateDelete, revalidatePage } from './hooks/revalidatePage'
import { validateHighlight } from './hooks/validateHighlight'
import { createBreadcrumbsField, createParentField } from '@payloadcms/plugin-nested-docs'

import { pageMotionField } from '../../fields/motion'
import { pageSlugClashCheck } from '../../content/paths'
import {
  notePublishedPath,
  redirectMovedPage,
  revalidateDeletedPageOnSite,
  revalidatePageOnSite,
  validateParent,
  validatePrimaryKeyword,
} from './nesting'

const hasParent = (data: { parent?: unknown } | undefined) => Boolean(data?.parent)

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'

export const Pages: CollectionConfig<'pages'> = {
  slug: 'pages',
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  // This config controls what's populated by default when a page is referenced
  // https://payloadcms.com/docs/queries/select#defaultpopulate-collection-config-property
  // Type safe if the collection slug generic is passed to `CollectionConfig` - `CollectionConfig<'pages'>
  defaultPopulate: {
    title: true,
    slug: true,
  },
  admin: {
    defaultColumns: ['title', 'slug', 'updatedAt'],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug,
          collection: 'pages',
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: 'pages',
        req,
      }),
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [hero],
          label: 'Hero',
        },
        {
          fields: [
            {
              name: 'layout',
              type: 'blocks',
              blocks: PAGE_LAYOUT_BLOCKS,
              required: true,
              admin: {
                initCollapsed: true,
              },
            },
          ],
          label: 'Content',
        },
        {
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),

            MetaDescriptionField({}),
            {
              name: 'primaryKeyword',
              type: 'text',
              label: 'Primary keyword',
              maxLength: 60,
              validate: validatePrimaryKeyword,
              admin: {
                description: 'The one search phrase this page is written for. No two pages share a primary keyword.',
              },
            },
            PreviewField({
              // if the `generateUrl` function is configured
              hasGenerateFn: true,

              // field paths to match the target field for data
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
    // The slug's own hooks generate it from the title first; then the path it
    // gives is checked against every other address (src/content/paths.ts).
    slugField({
      overrides: (row) => ({
        ...row,
        fields: row.fields.map((f) =>
          f.type === 'text' && f.name === 'slug'
            ? { ...f, hooks: { ...f.hooks, beforeChange: [...(f.hooks?.beforeChange ?? []), pageSlugClashCheck] } }
            : f,
        ),
      }),
    }),
    // Pillar and cluster pages (./nesting.ts): the parent page sets the path,
    // /{parent slug}/{slug}. The nested docs plugin finds these two fields by
    // name and keeps the breadcrumbs up to date.
    createParentField('pages', {
      label: 'Parent page (pillar)',
      validate: validateParent,
      // Not the home page, the page itself, or a page under it.
      filterOptions: ({ id }): Where => ({
        and: [
          { slug: { not_equals: 'home' } },
          ...(id ? [{ id: { not_equals: id } }, { 'breadcrumbs.doc': { not_in: [id] } }] : []),
        ],
      }),
      admin: {
        position: 'sidebar',
        description:
          'Optional. Makes this a cluster page under a pillar page, at /pillar-slug/page-slug. One level only.',
      },
    }),
    {
      name: 'stage',
      type: 'text',
      label: 'Stage (cluster pages)',
      maxLength: 30,
      admin: {
        position: 'sidebar',
        condition: hasParent,
        description: 'The stage this page covers, such as Qualification.',
      },
    },
    {
      name: 'stageOrder',
      type: 'number',
      label: 'Stage order (cluster pages)',
      min: 1,
      admin: {
        position: 'sidebar',
        condition: hasParent,
        step: 1,
        description: "This stage's place in the episode. Sets the order of the pillar page's list and the next-stage link.",
      },
    },
    {
      name: 'hideClusterFooter',
      type: 'checkbox',
      label: 'Hide cluster footer',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        condition: hasParent,
        description: 'The links back to the pillar page and on to the next stage, shown at the foot of every cluster page.',
      },
    },
    pageMotionField(),
    createBreadcrumbsField('pages', {
      label: 'Breadcrumbs (set on save)',
      localized: false,
      admin: {
        position: 'sidebar',
        readOnly: true,
        initCollapsed: true,
        condition: hasParent,
        description: 'Built from the parent page on save. The last row is this page and its path.',
      },
    }),
    // Breadcrumb trail only, for pages without a parent page; nothing here
    // changes routing. The parent page above is what sets a cluster's path.
    {
      name: 'breadcrumbParent',
      type: 'group',
      label: 'Breadcrumb parent',
      admin: {
        position: 'sidebar',
      },
      fields: [
        {
          name: 'kind',
          type: 'select',
          label: 'Parent',
          defaultValue: 'none',
          options: [
            { label: 'None', value: 'none' },
            { label: 'Page', value: 'page' },
            { label: 'Label (no link)', value: 'label' },
          ],
        },
        {
          name: 'page',
          type: 'relationship',
          label: 'Parent page',
          relationTo: 'pages',
          // A page cannot be its own parent.
          filterOptions: ({ id }) => (id ? { id: { not_equals: id } } : true),
          admin: {
            condition: (_, siblingData) => siblingData?.kind === 'page',
          },
        },
        {
          name: 'label',
          type: 'text',
          label: 'Parent label',
          maxLength: 30,
          admin: {
            condition: (_, siblingData) => siblingData?.kind === 'label',
          },
        },
      ],
    },
    {
      name: 'breadcrumbLabel',
      type: 'text',
      label: 'Breadcrumb label',
      maxLength: 40,
      admin: {
        position: 'sidebar',
        description: 'Short name for the breadcrumb trail. Defaults to the page title.',
      },
    },
  ],
  hooks: {
    afterChange: [revalidatePage, redirectMovedPage, revalidatePageOnSite],
    beforeValidate: [validateHighlight],
    beforeChange: [populatePublishedAt, notePublishedPath],
    afterDelete: [revalidateDelete, revalidateDeletedPageOnSite],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 100, // We set this interval for optimal live preview
      },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}
