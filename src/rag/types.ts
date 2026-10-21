import type { CollectionSlug } from 'payload'

/** One piece of a document that becomes one NCX post content. */
export type RagSection = {
  /** Stable within the document: a block id, a tab name or a heading position. */
  key: string
  heading: string
  body: string
  /** block anchorId, so a chunk can cite /platform/crm#context-engine */
  anchor?: string
  raw?: unknown
}

export type RagSource = {
  collection: CollectionSlug
  /** Mirrors what the website shows: only content a visitor can see is sent. */
  shouldIndex: (doc: any) => boolean
  /**
   * The document as a visitor receives it, for collections whose public API
   * strips fields in an afterRead hook. The sync reads through the Local API,
   * which skips those hooks, so it applies the same stripping here.
   */
  prepare?: (doc: any) => any
  /** The name the bot and the dashboard see for this document. */
  titleOf: (doc: any) => string
  /** Path on the public site, starting with "/". */
  urlOf: (doc: any) => string
  /** Top-level field names never sent, on top of the defaults in serialize.ts. */
  omit?: string[]
}
