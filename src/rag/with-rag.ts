import type { CollectionConfig } from 'payload'
import { ragAfterChange, ragAfterDelete } from './hooks'

export const withRag = (config: CollectionConfig): CollectionConfig => ({
  ...config,
  hooks: {
    ...config.hooks,
    afterChange: [...(config.hooks?.afterChange ?? []), ragAfterChange],
    afterDelete: [...(config.hooks?.afterDelete ?? []), ragAfterDelete],
  },
})
