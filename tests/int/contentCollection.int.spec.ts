import type { CollectionConfig, Field, Tab } from 'payload'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { defineContentCollection } from '../../src/content/defineContentCollection'
import { getContentCollection } from '../../src/content/registry'
import { ragAfterChange } from '../../src/rag/hooks'

/**
 * The collection factory, checked on generated configs. Nothing here touches
 * the database: hooks and access functions are called directly.
 */

const full = (slug = 'zzFull') =>
  defineContentCollection({
    slug,
    label: { singular: 'Agent', plural: 'Agents' },
    route: '/bot-swarm',
    groupBy: { listType: 'agentFamily', field: 'family', required: true },
    groups: ['core', 'card', 'detail', 'ownPage', 'faq', 'whatsapp', 'kbase'],
    sections: ['integrations', 'related'],
    kb: { resolve: ['family'] },
  })

const cardsOnly = (slug = 'zzCards') =>
  defineContentCollection({ slug, label: 'Cards', groups: ['core', 'card'] })

type Doc = Record<string, any>

const req = (logger?: { info: (m: string) => void }) =>
  ({ context: {}, payload: { logger } }) as any

/** Runs the collection's beforeChange hooks in order, as Payload does on a save. */
const save = async (config: CollectionConfig, data: Doc, originalDoc?: Doc): Promise<Doc> => {
  let out: Doc = structuredClone(data)
  for (const hook of config.hooks?.beforeChange ?? []) {
    out =
      (await hook({
        data: out,
        originalDoc,
        operation: originalDoc ? 'update' : 'create',
        req: req(),
        collection: config as any,
        context: {},
      } as any)) ?? out
  }
  return out
}

/** The paths a refused publish names, or [] when it saves. */
const refused = async (config: CollectionConfig, data: Doc): Promise<string[]> => {
  try {
    await save(config, data)
    return []
  } catch (err: any) {
    return (err?.data?.errors ?? []).map((e: { path: string }) => e.path)
  }
}

const tabsOf = (config: CollectionConfig): Tab[] =>
  (config.fields.find((f) => f.type === 'tabs') as { tabs: Tab[] } | undefined)?.tabs ?? []

const tabLabels = (config: CollectionConfig) => tabsOf(config).map((t) => t.label)

/** Names of the sidebar fields, in order, with rows (the slug row) flattened. */
const sidebarNames = (config: CollectionConfig): string[] => {
  const names: string[] = []
  const walk = (fields: Field[], inSidebar: boolean) => {
    for (const f of fields) {
      const sidebar = inSidebar || (f as any).admin?.position === 'sidebar'
      if (f.type === 'row') walk(f.fields, sidebar)
      else if (sidebar && 'name' in f && f.name !== 'generateSlug') names.push(f.name)
    }
  }
  walk(config.fields, false)
  return names
}

describe('access', () => {
  const access = full('zzAccess').access!

  it('gives logged-out readers published Live and Pilot entries only', async () => {
    expect(await access.read!({ req: { user: null } } as any)).toEqual({
      and: [{ _status: { equals: 'published' } }, { status: { in: ['live', 'pilot'] } }],
    })
  })

  it('lets logged-in users read everything', async () => {
    expect(await access.read!({ req: { user: { id: '1' } } } as any)).toBe(true)
  })

  it('needs a login to create, update and delete', async () => {
    for (const op of ['create', 'update', 'delete'] as const) {
      expect(await access[op]!({ req: { user: null } } as any)).toBe(false)
      expect(await access[op]!({ req: { user: { id: '1' } } } as any)).toBe(true)
    }
  })
})

describe('admin layout', () => {
  it('has drafts on with no autosave', () => {
    expect(full('zzDrafts').versions).toEqual({ drafts: { autosave: false } })
  })

  it('puts the sidebar in the fixed order', () => {
    expect(sidebarNames(full('zzSidebar'))).toEqual([
      'name',
      'slug',
      'status',
      'family',
      'featured',
      'order',
      'isUSP',
      'hasOwnPage',
      'usePageDefaults',
      // The stored address, last: it is worked out from the fields above.
      'path',
    ])
  })

  it('keeps the tabs in the fixed order', () => {
    expect(tabLabels(full('zzTabs'))).toEqual([
      'Card',
      'Detail',
      'Page',
      'FAQ',
      'WhatsApp',
      'Knowledge base',
      'SEO',
    ])
  })

  it('leaves empty tabs out', () => {
    expect(tabLabels(cardsOnly('zzEmpty'))).toEqual(['Card'])
    expect(
      tabLabels(
        defineContentCollection({ slug: 'zzSome', label: 'Some', groups: ['faq', 'kbase'] }),
      ),
    ).toEqual(['Card', 'FAQ', 'Knowledge base'])
  })

  it('shows the Page tab only while Own page is on', () => {
    const page = tabsOf(full('zzPageTab')).find((t) => t.label === 'Page')!
    const condition = page.admin!.condition as (data: Doc) => boolean
    expect(condition({ hasOwnPage: false })).toBe(false)
    expect(condition({ hasOwnPage: true })).toBe(true)
  })

  it('generates a unique slug from the name', () => {
    const row = full('zzSlug').fields.find(
      (f) => f.type === 'row' && f.fields.some((g) => 'name' in g && g.name === 'slug'),
    ) as { fields: Field[] }
    const slug = row.fields.find((g) => 'name' in g && g.name === 'slug') as Doc
    expect(slug.unique).toBe(true)
    expect(slug.required).toBe(true)
  })

  it('places an extra tab straight after the tab it names', () => {
    const config = defineContentCollection({
      slug: 'zzExtraTab',
      label: 'X',
      route: '/x',
      groups: ['detail', 'ownPage', 'faq'],
      extraTabs: [{ after: 'detail', tab: { label: 'Panel', fields: [{ name: 'hears', type: 'text' }] } }],
    })
    expect(tabLabels(config)).toEqual(['Card', 'Detail', 'Panel', 'Page', 'FAQ', 'SEO'])
  })

  it('refuses an extra tab after a tab the collection does not have', () => {
    expect(() =>
      defineContentCollection({
        slug: 'zzExtraMissing',
        label: 'X',
        groups: [],
        extraTabs: [{ after: 'faq', tab: { label: 'Panel', fields: [{ name: 'a', type: 'text' }] } }],
      }),
    ).toThrow(/does not have/)
  })

  it('leaves out the Own page fields it is told to', () => {
    const config = defineContentCollection({
      slug: 'zzOmit',
      label: 'X',
      route: '/x',
      groups: ['ownPage'],
      ownPage: { omit: ['howItWorks'] },
    })
    const names = tabsOf(config)
      .find((t) => t.label === 'Page')!
      .fields.map((f) => ('name' in f ? f.name : ''))
    expect(names).not.toContain('howItWorks')
    expect(names).toEqual(expect.arrayContaining(['heroHeading', 'benefits', 'useCases', 'related']))
  })

  it('takes its own list columns and sort', () => {
    const config = defineContentCollection({
      slug: 'zzAdmin',
      label: 'X',
      groups: [],
      admin: { defaultColumns: ['name', 'status'], defaultSort: ['family.order', 'order'] },
    })
    expect(config.admin?.defaultColumns).toEqual(['name', 'status'])
    expect(config.defaultSort).toEqual(['family.order', 'order'])
  })

  it('offers only the card designs it is given', () => {
    const config = defineContentCollection({
      slug: 'zzDesigns',
      label: 'Designs',
      groups: [],
      cardDesigns: ['grid', 'feature'],
    })
    const card = tabsOf(config).find((t) => t.label === 'Card')!
    const design = card.fields.find((f) => 'name' in f && f.name === 'cardDesign') as Doc
    expect(design.options.map((o: Doc) => o.value)).toEqual(['grid', 'feature'])
  })
})

describe('config mistakes', () => {
  it('refuses ownPage without a route', () => {
    expect(() =>
      defineContentCollection({ slug: 'zzNoRoute', label: 'X', groups: ['ownPage'] }),
    ).toThrow(/needs a route/)
  })

  it('refuses page fields without ownPage', () => {
    expect(() =>
      defineContentCollection({
        slug: 'zzPageFields',
        label: 'X',
        route: '/x',
        groups: [],
        fields: { page: [{ name: 'extra', type: 'text' }] },
      }),
    ).toThrow(/needs the ownPage group/)
  })

  it('refuses a route with a trailing slash', () => {
    expect(() =>
      defineContentCollection({ slug: 'zzSlash', label: 'X', route: '/x/', groups: [] }),
    ).toThrow(/route must look like/)
  })
})

describe('publish check', () => {
  const config = full('zzPublish')
  // Two chat messages: what the default conversation hero needs (heroDesign.int.spec.ts).
  const base = {
    name: 'Payment services',
    slug: 'payment-services',
    summary: 'Sends the link.',
  heroChat: [
    { sender: 'customer', text: 'Can I pay here?' },
    { sender: 'business', text: 'Here is your link.' },
  ],
  }

  it('publishes without page fields while Own page is off', async () => {
    expect(await refused(config, { ...base, _status: 'published', hasOwnPage: false })).toEqual([])
  })

  it('saves a draft with Own page on and nothing filled', async () => {
    expect(await refused(config, { name: 'Draft', _status: 'draft', hasOwnPage: true })).toEqual([])
  })

  it('needs the hero heading to publish with Own page on; SEO comes from the fallbacks', async () => {
    expect(await refused(config, { ...base, _status: 'published', hasOwnPage: true })).toEqual([
      'heroHeading',
    ])
  })

  it('needs the SEO description when there is no summary to fill it from', async () => {
    expect(
      await refused(config, { name: 'No summary', heroChat: base.heroChat, _status: 'published', hasOwnPage: true }),
    ).toEqual(['heroHeading', 'meta.description'])
  })

  it('publishes once the page fields are filled', async () => {
    expect(
      await refused(config, {
        ...base,
        _status: 'published',
        hasOwnPage: true,
        heroHeading: 'Payment links that follow through',
      }),
    ).toEqual([])
  })

  it('reads fields saved earlier on a partial update', async () => {
    await expect(
      save(
        config,
        { _status: 'published' },
        { ...base, hasOwnPage: true, heroHeading: 'Saved heading' },
      ),
    ).resolves.toBeDefined()
  })
})

describe('fallbacks', () => {
  const config = full('zzFallbacks')

  it('fills SEO and WhatsApp fields from the name and summary', async () => {
    const out = await save(config, {
      name: 'Payment services',
      slug: 'payment-services',
      summary: 'Customers get a working payment link in the chat.',
    })
    expect(out.meta.title).toBe('Payment services | NeuronCx')
    expect(out.meta.description).toBe('Customers get a working payment link in the chat.')
    expect(out.waRowTitle).toBe('Payment services')
    expect(out.waRowDescription).toBe('Customers get a working payment link in the chat.')
  })

  it('keeps what an editor typed', async () => {
    const out = await save(config, {
      name: 'Payment services',
      slug: 'payment-services',
      summary: 'Summary.',
      meta: { title: 'Typed title', description: 'Typed description' },
      waRowTitle: 'Typed row',
      waRowDescription: 'Typed description',
    })
    expect(out.meta).toEqual({ title: 'Typed title', description: 'Typed description' })
    expect(out.waRowTitle).toBe('Typed row')
    expect(out.waRowDescription).toBe('Typed description')
  })

  it('cuts on whole words to the limits, except the row title', async () => {
    const out = await save(config, {
      name: 'Longitudinal analysis and feedback for every agent on the team',
      slug: 'long',
      summary:
        'One agent picks a fair sample of calls, the next scores them against your sheet, and the third shows progress.',
    })
    expect(out.meta.title).toBe('Longitudinal analysis and feedback for every | NeuronCx')
    expect(out.meta.title.length).toBeLessThanOrEqual(60)
    // A name over 24 characters is never cut short: the row title waits for an editor.
    expect(out.waRowTitle).toBeUndefined()
    expect(out.waRowDescription).toBe(
      'One agent picks a fair sample of calls, the next scores them against',
    )
    expect(out.waRowDescription.length).toBeLessThanOrEqual(70)
  })

  it('leaves WhatsApp fields empty rather than fill them with text WhatsApp would refuse', async () => {
    const out = await save(config, { name: 'Bold *name*', slug: 'bold', summary: 'Uses # marks.' })
    expect(out.waRowTitle).toBeUndefined()
    expect(out.waRowDescription).toBeUndefined()
  })

  it('sets waLink to the own page, else the place on the hub', async () => {
    const on = await save(config, { name: 'A', slug: 'payment-services', hasOwnPage: true })
    const off = await save(config, { name: 'A', slug: 'payment-services', hasOwnPage: false })
    expect(on.waLink).toBe('/bot-swarm/payment-services')
    expect(off.waLink).toBe('/bot-swarm#payment-services')
  })

  it('has no SEO or WhatsApp fallbacks where those tabs do not exist', async () => {
    const out = await save(cardsOnly('zzNoFallbacks'), { name: 'Card', slug: 'card', summary: 'S.' })
    expect(out.meta).toBeUndefined()
    expect(out.waRowTitle).toBeUndefined()
    expect(out.waLink).toBeUndefined()
  })
})

describe('knowledge base, revalidation and registry', () => {
  // Without a secret the helper only logs; one test below sets it.
  beforeEach(() => vi.stubEnv('REVALIDATE_SECRET', ''))
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('posts the paths and the collection to the website with the secret', async () => {
    vi.stubEnv('REVALIDATE_SECRET', 'test-secret')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://site.test/')
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const [afterChange] = full('zzRevalidateFetch').hooks!.afterChange!
    const doc = { _status: 'published', slug: 'payment-services', hasOwnPage: true }
    await afterChange({ doc, previousDoc: {}, req: req({ info: vi.fn() }) } as any)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('http://site.test/api/revalidate')
    expect((init.headers as Record<string, string>)['x-revalidate-secret']).toBe('test-secret')
    expect(JSON.parse(String(init.body))).toEqual({
      paths: ['/bot-swarm/payment-services', '/bot-swarm'],
      collection: 'zzRevalidateFetch',
    })
  })

  it('never fails a save when the website is down', async () => {
    vi.stubEnv('REVALIDATE_SECRET', 'test-secret')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://site.test')
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('down') }))
    const error = vi.fn()
    const [afterChange] = full('zzRevalidateDown').hooks!.afterChange!
    const doc = { _status: 'published', slug: 'a', hasOwnPage: true }
    await expect(afterChange({ doc, previousDoc: {}, req: { context: {}, payload: { logger: { info: vi.fn(), error } } } } as any)).resolves.toBe(doc)
    expect(error).toHaveBeenCalledWith(expect.stringContaining('revalidate failed (down)'))
  })

  it('is watched by the knowledge base only with the kbase group', () => {
    expect(full('zzRag').hooks?.afterChange).toContain(ragAfterChange)
    expect(cardsOnly('zzNoRag').hooks?.afterChange).not.toContain(ragAfterChange)
  })

  it('runs its own hooks after the factory hooks', () => {
    const mine = vi.fn()
    const config = defineContentCollection({
      slug: 'zzHooks',
      label: 'Hooks',
      groups: [],
      hooks: { beforeChange: [mine] },
    })
    expect(config.hooks?.beforeChange?.at(-1)).toBe(mine)
    expect(config.hooks?.beforeChange).toHaveLength(3)
  })

  it('revalidates the entry page and the hub on publish, and the old page on unpublish', async () => {
    const info = vi.fn()
    const config = full('zzRevalidate')
    const [afterChange] = config.hooks!.afterChange!
    const doc = { _status: 'published', slug: 'payment-services', hasOwnPage: true }
    await afterChange({ doc, previousDoc: {}, req: req({ info }) } as any)
    expect(info).toHaveBeenLastCalledWith(
      expect.stringContaining('/bot-swarm/payment-services, /bot-swarm'),
    )
    await afterChange({ doc: { ...doc, _status: 'draft' }, previousDoc: doc, req: req({ info }) } as any)
    expect(info).toHaveBeenLastCalledWith(expect.stringContaining('unpublished'))
    info.mockClear()
    await afterChange({ doc: { _status: 'draft' }, previousDoc: { _status: 'draft' }, req: req({ info }) } as any)
    expect(info).not.toHaveBeenCalled()
  })

  it('revalidates on delete', async () => {
    const info = vi.fn()
    const [afterDelete] = full('zzDelete').hooks!.afterDelete!
    await afterDelete({ doc: { slug: 'a', hasOwnPage: true }, req: req({ info }) } as any)
    expect(info).toHaveBeenCalledWith(expect.stringContaining('/bot-swarm/a, /bot-swarm'))
  })

  it('adds the collection to the registry', () => {
    full('zzRegistry')
    expect(getContentCollection('zzRegistry')).toEqual({
      slug: 'zzRegistry',
      label: { singular: 'Agent', plural: 'Agents' },
      route: '/bot-swarm',
      hasRoute: true,
      routing: { kind: 'base', base: '/bot-swarm' },
      ownPage: true,
      seo: true,
      grouping: { listType: 'agentFamily', field: 'family', required: true },
      sections: ['integrations', 'related'],
      defaultLayout: ['integrations', 'related'],
      headings: {},
      kbase: true,
      heroDesigns: ['conversation', 'rightPlacement', 'stats', 'customCss'],
      kb: { resolve: ['family'], exclude: [] },
    })
    cardsOnly('zzRegistryCards')
    expect(getContentCollection('zzRegistryCards')).toMatchObject({ route: null, hasRoute: false, routing: { kind: 'none' }, ownPage: false })
  })
})
