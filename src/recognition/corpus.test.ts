import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { corpusRoot, listFixtures, PGN_FILE, PHOTO_FILE } from './corpus'

const temps: string[] = []

function tempRoot(): string {
  const root = mkdtempSync(path.join(os.tmpdir(), 'score-snap-corpus-'))
  temps.push(root)
  return root
}

function writeFixture(
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

describe('protect-main probe', () => {
  it('fails so #11 can confirm a red test job blocks merge', () => {
    expect(true).toBe(false)
  })
})

describe('listFixtures', () => {
  it('returns an empty list when the corpus root is missing', () => {
    expect(listFixtures(path.join(tempRoot(), 'does-not-exist'))).toEqual([])
  })

  it('ignores README files and empty directories', () => {
    const root = tempRoot()
    writeFileSync(path.join(root, 'README.md'), '# fixtures')
    mkdirSync(path.join(root, 'notes'))
    expect(listFixtures(root)).toEqual([])
  })

  it('lists well-formed fixtures sorted by id', () => {
    const root = tempRoot()
    writeFixture(root, '2026-06-14-b', { photo: true, pgn: true })
    writeFixture(root, '2026-06-13-a', { photo: true, pgn: true })

    expect(listFixtures(root).map((fixture) => fixture.id)).toEqual([
      '2026-06-13-a',
      '2026-06-14-b',
    ])
  })

  it('throws when a fixture directory is missing the photo', () => {
    const root = tempRoot()
    writeFixture(root, 'broken', { pgn: true })
    expect(() => listFixtures(root)).toThrow(/missing photo\.jpeg/)
  })

  it('throws when a fixture directory is missing the PGN', () => {
    const root = tempRoot()
    writeFixture(root, 'broken', { photo: true })
    expect(() => listFixtures(root)).toThrow(/missing game\.pgn/)
  })
})
