import type { CollectionConfig } from 'payload'

import { anyone } from '../../access/anyone'
import { authenticated } from '../../access/authenticated'

/**
 * Industry sectors used to tag customers. A plain collection rather than a
 * fixed select, so new sectors can be added without a redeploy.
 */
export const Sectors: CollectionConfig = {
  slug: 'sectors',
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['name', 'slug', 'order'],
    useAsTitle: 'name',
    group: 'Customers',
  },
  defaultSort: 'order',
  fields: [
    { name: 'name', type: 'text', required: true, unique: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    {
      name: 'order',
      type: 'number',
      defaultValue: 100,
      admin: { description: 'Lower numbers come first.' },
    },
  ],
}
