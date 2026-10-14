import { describe, expect, it } from 'vitest'

import {
  cutOnWord,
  fallbackMetaTitle,
  fitNames,
  onlyNameToken,
} from '@/collections/integrations/hooks'

// Pure helpers only; nothing is read or saved.
const opts = { req: { payload: { config: {} }, t: (key: string) => key } } as any

describe('integrations helpers', () => {
  it('cuts on a whole word', () => {
    expect(cutOnWord('Tata Smartflo telephony integration', 24)).toBe('Tata Smartflo telephony')
    expect(cutOnWord('Short', 24)).toBe('Short')
    expect(cutOnWord('Averyveryverylongsingleword', 10)).toBe('Averyveryv')
  })

  it('builds the fallback SEO title within 60 characters', () => {
    expect(fallbackMetaTitle('docpulse whatsapp booking')).toBe(
      'docpulse whatsapp booking with NeuronCx | NeuronCx',
    )
    const long = fallbackMetaTitle('booking appointments and payments online today')
    expect(long.length).toBeLessThanOrEqual(60)
    expect(long.endsWith(' | NeuronCx')).toBe(true)
  })

  it('fits whole names into 70 characters', () => {
    const names = [
      'Exotel',
      'Knowlarity',
      'Tata Smartflo',
      'Asttecs',
      'Another long telephony name',
      'One more',
    ]
    const text = fitNames(names)
    expect(text.length).toBeLessThanOrEqual(70)
    expect(text).toBe('Exotel, Knowlarity, Tata Smartflo, Asttecs')
    expect(fitNames([])).toBe('')
  })

  it('allows {name} and nothing else in heading labels', async () => {
    expect(await onlyNameToken('What moves between {name} and NeuronCx', opts)).toBe(true)
    expect(await onlyNameToken('No placeholder at all', opts)).toBe(true)
    expect(await onlyNameToken('Connect {slug}', opts)).toMatch(
      /^Only \{name\} can be used here\. Remove \{slug\}/,
    )
    expect(await onlyNameToken('Broken {name', opts)).toMatch(/Remove \{name/)
  })
})
