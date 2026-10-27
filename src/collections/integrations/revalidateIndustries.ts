import { byVerticals, revalidateIndustriesShowing } from '../Sectors/revalidate'

/**
 * afterChange on an integration: when it is published, or was before this
 * change, the published industry pages whose Industry integrations section
 * lists it: industries whose verticals share one with the integration's,
 * before or after the change.
 */
export const revalidateIndustriesForIntegration = revalidateIndustriesShowing('industryIntegrations', byVerticals)
