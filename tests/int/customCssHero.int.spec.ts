import { describe, expect, it } from 'vitest'

import { heroCustomVisualFields } from '@/blocks/HeroCustom/config'
import { MicroApps } from '@/collections/MicroApps'
import { heroDesignProblems } from '@/content/publishCheck'
import { heroDesignField } from '@/fields/heroDesign'
import { ownPage } from '@/fields/ownPage'

/** The Custom CSS visual hero design on an entry's own page. */

const flat = (fields: any[]): any[] => fields.flatMap((f) => (f.type === 'row' ? flat(f.fields) : [f]))

describe('the design', () => {
  it('is offered as "Custom CSS visual"', () => {
    expect(heroDesignField().options).toContainEqual({ label: 'Custom CSS visual', value: 'customCss' })
  })

  it('is open to the bot swarm agents', () => {
    const design = flat(MicroApps.fields as any[]).find((f) => f.name === 'hasOwnPage')
    expect(design).toBeTruthy()
    const tabs = (MicroApps.fields as any[]).find((f) => f.type === 'tabs').tabs
    const select = tabs.flatMap((t: any) => t.fields).find((f: any) => f.name === 'heroDesign')
    expect(select.options.map((o: any) => o.value)).toContain('customCss')
  })
})

describe('the visual fields', () => {
  const { tab } = ownPage('microApps')
  const group = tab.fields.find((f: any) => f.type === 'collapsible' && f.label === 'Custom CSS visual') as any

  it("reuse the Hero (custom CSS) block's own visual fields", () => {
    expect(group.fields).toBe(heroCustomVisualFields)
    expect(flat(group.fields).map((f) => f.name)).toEqual(['visualHtml', 'visualCss', 'visualPreview', 'visualAlt', 'aspect', 'maxWidth'])
  })

  it('show only while Custom CSS visual is picked', () => {
    expect(group.admin.condition({ heroDesign: 'customCss' })).toBe(true)
    expect(group.admin.condition({ heroDesign: 'stats' })).toBe(false)
    expect(group.admin.condition({})).toBe(false)
  })
})

describe('publishing with Own page on', () => {
  it('needs the HTML and the screen reader description', () => {
    expect(heroDesignProblems({ heroDesign: 'customCss' }).map((p) => p.path)).toEqual(['visualHtml', 'visualAlt'])
    expect(heroDesignProblems({ heroDesign: 'customCss', visualHtml: '<div>Paid</div>' })).toEqual([
      { path: 'visualAlt', message: 'Add a screen reader description for the Custom CSS visual hero, or pick another hero design.' },
    ])
    expect(heroDesignProblems({ heroDesign: 'customCss', visualHtml: '<div>Paid</div>', visualAlt: 'A receipt.' })).toEqual([])
  })
})
