import { readFileSync, statSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { corpusRoot, listFixtures } from './corpus'
import { mainlinePlies } from './pgn'

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

  it('yields known fixture mainlines', () => {
    const actual = Object.fromEntries(
      fixtures.map((fixture) => [
        fixture.id,
        mainlinePlies(readFileSync(fixture.pgnPath, 'utf8')),
      ]),
    )
    expect(actual).toMatchObject(KNOWN_MAINLINES)
  })
})

function plies(movetext: string): string[] {
  return movetext.trim().split(/\s+/)
}

const KNOWN_MAINLINES = {
  // Complete game: 41 moves → 82 plies. Variations omitted.
  '2026-06-13-inoa-sosa': plies(`
    d4 c6 Nc3 d5 Bf4 Nf6 e3 Bf5 f3 e6
    g4 Bg6 h4 h6 Bd3 Bxd3 Qxd3 Qb6 O-O-O Na6
    a3 Rc8 Nge2 Nd7 g5 h5 e4 Nc7 Bxc7 Qxc7
    e5 g6 Rhf1 b5 Na2 a5 c3 Nb6 Kb1 Nc4
    f4 Be7 Ng3 Ra8 Rf2 b4 a4 Rb8 cxb4 Bxb4
    Nxb4 Rxb4 b3 Qb7 Ka2 O-O Rb1 Rb8 Ne2 Qe7
    Nc1 R4b7 Ka1 Qb4 Rc2 Na3 Rxc6 Nxb1 Kxb1 Qxa4
    Rc3 Qd7 Kc2 a4 bxa4 Rb2+ Kd1 Qxa4+ Ke1 Rh2
    Ne2 Rb2
  `),
  // Prefix through 31... Rc8 (62 plies). Analysis (32. Rxc8+) omitted.
  '2026-06-14-inoa-collado': plies(`
    d4 d5 Nc3 Nf6 Bf4 Bf5 f3 e6 g4 Bg6
    h4 h5 g5 Nfd7 e3 a6 Bd3 Bxd3 Qxd3 g6
    e4 c6 Nge2 Nb6 Be5 Rg8 Bf6 Be7 e5 N8d7
    Bxe7 Qxe7 f4 Qb4 b3 Qe7 a4 a5 Nd1 Qb4+
    Kf2 c5 Ne3 cxd4 Qxd4 Qc5 Rac1 Qxd4 Nxd4 Ke7
    c4 dxc4 Nxc4 Nxc4 Rxc4 Rgc8 Rhc1 Rxc4 Rxc4 Kd8
    Nb5 Rc8
  `),
}
