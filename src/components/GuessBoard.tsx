import { AnimatePresence, motion } from 'framer-motion';
import { createTileComparisons } from '../lib/game';
import type { DisneyCharacter } from '../types';
import { CharacterAvatar } from './CharacterAvatar';

type GuessBoardProps = {
  guesses: DisneyCharacter[];
  secret: DisneyCharacter;
};

const columns = ['Character', 'Movie', 'Role', 'Gender', 'Species', 'Magic', 'Year'];

export function GuessBoard({ guesses, secret }: GuessBoardProps) {
  return (
    <section className="board-wrap" aria-live="polite">
      {guesses.length > 0 && (
        <div className="board-columns" aria-hidden="true">
          {columns.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      )}

      <AnimatePresence initial={false}>
        {guesses.map((guess, guessIndex) => {
          const tiles = createTileComparisons(guess, secret);

          return (
            <motion.div
              key={guess.id}
              className="guess-row"
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {tiles.map((tile, tileIndex) => (
                <motion.article
                  key={`${guess.id}-${tile.key}`}
                  className={`guess-tile is-${tile.state} ${tile.key === 'character' ? 'guess-tile--character' : ''}`}
                  initial={{ opacity: 0, y: 18, scale: 0.96, rotateX: -70, transformPerspective: 1000 }}
                  animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                  transition={{
                    duration: 0.42,
                    ease: [0.2, 0.9, 0.2, 1],
                    delay: tileIndex * 0.07 + guessIndex * 0.03,
                  }}
                >
                  {tile.key === 'character' && tile.character ? (
                    <div className="guess-tile__character">
                      <CharacterAvatar character={tile.character} size="md" />
                      <span className="guess-tile__character-name">{tile.value}</span>
                    </div>
                  ) : (
                    <>
                      <strong className="guess-tile__value">{tile.value}</strong>
                      {tile.hint ? <span className="guess-tile__hint">{tile.hint}</span> : null}
                    </>
                  )}
                </motion.article>
              ))}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </section>
  );
}
