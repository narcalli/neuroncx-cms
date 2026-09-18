import { HeaderClient } from './Component.client'
import { getCachedGlobal } from '@/utilities/getGlobals'
import React from 'react'

import type { Header as HeaderType } from '@/payload-types'

export async function Header() {
  // getCachedGlobal tags the cache entry as `global_header`, which is what the
  // revalidateHeader hook invalidates when the global is saved in the admin.
  // Calling payload.findGlobal directly here would bypass that tag, and edits
  // would only appear after a redeploy.
  const headerData: HeaderType = await getCachedGlobal('header', 2)()

  return <HeaderClient data={headerData} />
}
