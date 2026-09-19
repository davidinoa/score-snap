import { describe, expect, it } from 'vitest'

import { mainlinePlies } from './pgn'

describe('mainlinePlies', () => {
  it('ignores a variation when listing the mainline', () => {
    const pgn = '1. e4 e5 2. Nf3 (2. f4) 2... Nc6 *'
    const expected = ['e4', 'e5', 'Nf3', 'Nc6']
    expect(mainlinePlies(pgn)).toEqual(expected)
  })

  it('ignores a brace comment when listing the mainline', () => {
    const pgn = '1. e4 e5 {this is not a move} (1... c5) *'
    const expected = ['e4', 'e5']
    expect(mainlinePlies(pgn)).toEqual(expected)
  })

  it('ignores a nested variation when listing the mainline', () => {
    const pgn = '1. e4 e5 2. Nf3 (2. f4 d5 (2... Nc6) 3. exf4) 2... Nc6 *'
    const expected = ['e4', 'e5', 'Nf3', 'Nc6']
    expect(mainlinePlies(pgn)).toEqual(expected)
  })
})
