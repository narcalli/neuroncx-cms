// src/rag/types.ts
import type { BasePayload, CollectionSlug } from 'payload'

export type RagSection = { heading: string; body: string }

export type RagSource = {
  collection: CollectionSlug
  project: (doc: any) => { title: string; sections: RagSection[] }
  tenantOf: (doc: any) => string
  visibility: (doc: any) => 'public' | 'internal'
  urlOf: (doc: any) => string
  shouldIndex: (doc: any) => boolean
  /** when a doc in `collection` changes, which docs here need reindexing */
  dependsOn?: {
    collection: CollectionSlug
    findAffected: (payload: BasePayload, changedId: string) => Promise<string[]>
  }[]
}
