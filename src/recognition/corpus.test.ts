import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { corpusRoot, listSheets, PGN_FILE, PHOTO_FILE } from './corpus.ts'

const temps: string[] = []

function tempRoot(): string {
  const root = mkdtempSync(path.join(os.tmpdir(), 'score-snap-corpus-'))
  temps.push(root)
  return root
}

function writeSheet(
  root: string,
  id: string,
  files: { photo?: boolean; pgn?: boolean },
): void {
  const dir = path.join(root, id)
  mkdirSync(dir)
  if (files.photo === true) {
    writeFileSync(path.join(dir, PHOTO_FILE), 'fake-jpeg')
  }
  if (files.pgn === true) {
    writeFileSync(path.join(dir, PGN_FILE), '[Event "test"]\n*')
  }
}

afterEach(() => {
  for (const dir of temps.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('corpusRoot', () => {
  it('resolves fixtures/ under the given cwd', () => {
    expect(corpusRoot('/repo')).toBe(path.join('/repo', 'fixtures'))
  })
})

describe('listSheets', () => {
  it('returns an empty list when the corpus root is missing', () => {
    expect(listSheets(path.join(tempRoot(), 'does-not-exist'))).toEqual([])
  })

  it('ignores README files and empty directories', () => {
    const root = tempRoot()
    writeFileSync(path.join(root, 'README.md'), '# fixtures')
    mkdirSync(path.join(root, 'notes'))
    expect(listSheets(root)).toEqual([])
  })

  it('lists well-formed sheets sorted by id', () => {
    const root = tempRoot()
    writeSheet(root, '2026-06-14-b', { photo: true, pgn: true })
    writeSheet(root, '2026-06-13-a', { photo: true, pgn: true })

    expect(listSheets(root).map((sheet) => sheet.id)).toEqual([
      '2026-06-13-a',
      '2026-06-14-b',
    ])
  })

  it('throws when a sheet directory is missing the photo', () => {
    const root = tempRoot()
    writeSheet(root, 'broken', { pgn: true })
    expect(() => listSheets(root)).toThrow(/missing photo\.jpeg/)
  })

  it('throws when a sheet directory is missing the PGN', () => {
    const root = tempRoot()
    writeSheet(root, 'broken', { photo: true })
    expect(() => listSheets(root)).toThrow(/missing game\.pgn/)
  })
})
