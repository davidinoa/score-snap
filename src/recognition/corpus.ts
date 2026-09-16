import { existsSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

export const PHOTO_FILE = 'photo.jpeg'
export const PGN_FILE = 'game.pgn'

export type Fixture = {
  id: string
  dir: string
  photoPath: string
  pgnPath: string
}

/** Node-only. Do not import from the SPA — this reads the gitignored local corpus. */
export function corpusRoot(cwd = process.cwd()): string {
  return path.join(cwd, 'fixtures')
}

export function listFixtures(root: string): Fixture[] {
  if (!existsSync(root)) {
    return []
  }

  if (!statSync(root).isDirectory()) {
    throw new Error(`corpus root is not a directory: ${root}`)
  }

  const fixtures: Fixture[] = []

  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) {
      continue
    }

    const dir = path.join(root, entry.name)
    const photoPath = path.join(dir, PHOTO_FILE)
    const pgnPath = path.join(dir, PGN_FILE)
    const hasPhoto = existsSync(photoPath)
    const hasPgn = existsSync(pgnPath)

    if (!hasPhoto && !hasPgn) {
      continue
    }

    if (!hasPhoto) {
      throw new Error(
        `incomplete fixture "${entry.name}": missing ${PHOTO_FILE}`,
      )
    }

    if (!hasPgn) {
      throw new Error(`incomplete fixture "${entry.name}": missing ${PGN_FILE}`)
    }

    fixtures.push({ id: entry.name, dir, photoPath, pgnPath })
  }

  return fixtures.sort((left, right) => left.id.localeCompare(right.id))
}
