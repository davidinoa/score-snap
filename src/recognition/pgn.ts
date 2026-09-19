import { Chess } from 'chess.js'

export function mainlinePlies(pgn: string): string[] {
  const chess = new Chess()
  chess.loadPgn(pgn)
  return chess.history()
}
