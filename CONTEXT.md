# ScoreSnap

Turns a photographed handwritten chess scoresheet into a verified PGN. Recognition, review, and the library live on the device.

## Product

**Scoresheet**:
The paper form a player writes a game on. One scoresheet may span several pages.
_Avoid_: Sheet, form

**Page**:
One photographed side of a scoresheet.
_Avoid_: Sheet, photo, image (as the entity name)

**Game**:
A chess game as ScoreSnap stores it: identity, header, dialect, ordered pages, and plies.
_Avoid_: Match, PGN (a PGN is an export of a Game)

**Ply**:
One half-move in a Game (White’s turn or Black’s), tied to a page and a reading.
_Avoid_: Move (one written move is often two plies)

## Evaluation

**Corpus**:
The set of labeled examples used to measure recognition. Not part of a player’s library.
_Avoid_: Dataset

**Fixture**:
One labeled example in the Corpus: a scoresheet photograph paired with the ground-truth Game.
_Avoid_: Sheet, Sample, Case
