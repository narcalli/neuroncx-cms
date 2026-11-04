import { Gutter, SetDocumentStepNav } from '@payloadcms/ui'
import type { DocumentViewServerProps } from 'payload'
import React from 'react'

import { buildHistory } from './build'
import { HistoryList } from './HistoryList'
import { HISTORY_PREVIEWS } from './previews'

/**
 * The History tab, in place of Payload's Versions tab on every collection
 * with drafts (src/history/index.ts): who saved each version, what changed,
 * when it was live, and Compare, Preview and Roll back to this.
 */
export async function HistoryView(props: DocumentViewServerProps) {
  const {
    initPageResult: { collectionConfig, docID, req },
    searchParams,
  } = props
  if (!collectionConfig || docID === undefined || docID === null) return null

  const page = Math.max(1, Number(searchParams?.page) || 1)
  const history = await buildHistory({
    req,
    collection: collectionConfig,
    id: String(docID),
    page,
    preview: HISTORY_PREVIEWS[collectionConfig.slug],
  })
  const {
    routes: { admin, api },
    serverURL,
  } = req.payload.config
  const plural = collectionConfig.labels?.plural

  return (
    <Gutter>
      <SetDocumentStepNav
        collectionSlug={collectionConfig.slug}
        id={docID}
        pluralLabel={typeof plural === 'function' ? undefined : plural}
        useAsTitle={collectionConfig.admin?.useAsTitle}
        view="History"
      />
      <HistoryList
        {...history}
        adminRoute={admin}
        apiURL={`${serverURL || ''}${api}`}
        collection={collectionConfig.slug}
        docID={String(docID)}
      />
    </Gutter>
  )
}
