import type { BasePayload, CollectionSlug } from 'payload'

export type MdFn = (richText: any) => string

export type RagSection = {
  heading: string
  body: string
  /** block anchorId, so a chunk can cite /platform/crm#context-engine */
  anchor?: string
}

export type RagSource = {
  collection: CollectionSlug
  shouldIndex: (doc: any) => boolean
  tenantOf: (doc: any) => string
  visibility: (doc: any) => 'public' | 'internal'
  urlOf: (doc: any) => string
  project: (doc: any, md: MdFn) => { title: string; sections: RagSection[] }
  /** TAG/NUMERIC fields stamped onto every chunk of this doc */
  metadataOf?: (doc: any) => Record<string, string | string[] | number | undefined>
  dependsOn?: {
    collection: CollectionSlug
    findAffected: (payload: BasePayload, changedId: string) => Promise<string[]>
  }[]
}
