import { readFileSync, statSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { corpusRoot, listSheets } from './corpus.ts'

const sheets = listSheets(corpusRoot())

describe.skipIf(sheets.length === 0)('local evaluation corpus', () => {
  it('loads every on-disk sheet as a photo plus a non-empty PGN', () => {
    expect(sheets.length).toBeGreaterThan(0)

    for (const sheet of sheets) {
      expect(statSync(sheet.photoPath).size).toBeGreaterThan(0)
      expect(readFileSync(sheet.pgnPath, 'utf8').trim().length).toBeGreaterThan(
        0,
      )
    }
  })
})
