import { describe, expect, it } from 'vitest'

import { motionFields, pageMotionField, siteAnimationsField } from '@/fields/motion'

const inner = (f: any) => (f.fields[0]?.type === 'group' ? f.fields[0].fields : f.fields)
const names = (f: any) => inner(f).map((c: any) => c.name)

describe('motion switches', () => {
  it('has the site setting on by default, with three levels', () => {
    expect(siteAnimationsField).toMatchObject({ name: 'animations', defaultValue: 'on', required: true })
    expect(siteAnimationsField.options.map((o: any) => o.value)).toEqual(['on', 'reduced', 'off'])
  })

  it('has the page setting in the sidebar, following the site by default', () => {
    const f = pageMotionField()
    expect(f).toMatchObject({ name: 'pageMotion', defaultValue: 'follow', admin: { position: 'sidebar' } })
    expect(f.options.map((o: any) => o.value)).toEqual(['follow', 'on', 'reduced', 'off'])
  })

  it('gives a block only the motion switch unless asked', () => {
    const f: any = motionFields()
    expect(f).toMatchObject({ type: 'collapsible', label: 'Motion', admin: { initCollapsed: true } })
    expect(names(f)).toEqual(['motion'])
    expect(inner(f)[0]).toMatchObject({ defaultValue: 'follow' })
  })

  it('adds autoplay, loop and speed with their defaults when asked', () => {
    const f: any = motionFields({ autoplay: true, loop: true, speed: true })
    expect(names(f)).toEqual(['motion', 'autoplay', 'loop', 'speed'])
    const [, autoplay, loop, speed] = inner(f)
    expect([autoplay.defaultValue, loop.defaultValue, speed.defaultValue]).toEqual([true, true, 'normal'])
    expect(speed.options.map((o: any) => o.value)).toEqual(['slower', 'normal', 'faster'])
  })

  it('keeps the switches under a named group when given one', () => {
    const f: any = motionFields({ loop: true, group: { name: 'heroAnimation', label: 'Hero animation' } })
    expect(f.fields[0]).toMatchObject({ type: 'group', name: 'heroAnimation' })
    expect(names(f)).toEqual(['motion', 'loop'])
  })
})
