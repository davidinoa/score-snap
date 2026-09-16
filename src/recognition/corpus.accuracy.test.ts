import { readFileSync, statSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { corpusRoot, listFixtures } from './corpus.ts'

const fixtures = listFixtures(corpusRoot())

describe.skipIf(fixtures.length === 0)('local evaluation corpus', () => {
  it('loads every on-disk fixture as a photo plus a non-empty PGN', () => {
    expect(fixtures.length).toBeGreaterThan(0)

    for (const fixture of fixtures) {
      expect(statSync(fixture.photoPath).size).toBeGreaterThan(0)
      expect(
        readFileSync(fixture.pgnPath, 'utf8').trim().length,
      ).toBeGreaterThan(0)
    }
  })
})
