import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import rawDataset from './data/disney-characters.json';
import { GuessBoard } from './components/GuessBoard';
import { SearchCombobox } from './components/SearchCombobox';
import { getDailyCharacter } from './lib/game';
import { normalizeCharacters } from './lib/normalize';
import type { DisneyCharacter, RawDataset } from './types';

const STORAGE_KEY = 'ouag-daily-state-v4';

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

type DailyStoredState = {
  date: string;
  guessIds: string[];
};

function loadStoredGuesses(characters: DisneyCharacter[]): DisneyCharacter[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DailyStoredState;
    if (parsed.date !== todayKey()) return [];
    return (parsed.guessIds ?? [])
      .map((id) => characters.find((c) => c.id === id))
      .filter(Boolean) as DisneyCharacter[];
  } catch {
    return [];
  }
}

export default function App() {
  const dataset = rawDataset as RawDataset;
  const characters = useMemo(() => normalizeCharacters(dataset), [dataset]);

  const secret = useMemo(() => getDailyCharacter(characters), [characters]);
  const [guesses, setGuesses] = useState<DisneyCharacter[]>(() => loadStoredGuesses(characters));
  const [status, setStatus] = useState('');
  const [hintRevealed, setHintRevealed] = useState(false);

  const guessedIds = useMemo(() => new Set(guesses.map((g) => g.id)), [guesses]);
  const hasWon = guesses.some((g) => g.id === secret.id);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        date: todayKey(),
        guessIds: guesses.map((g) => g.id),
      }),
    );
  }, [guesses]);

  // Restore win status on load if already won
  useEffect(() => {
    if (hasWon && !status) {
      setStatus(`You found ${secret.name} in ${guesses.length} guesses.`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleGuess(character: DisneyCharacter) {
    if (hasWon || guessedIds.has(character.id)) return;

    const nextGuesses = [...guesses, character];
    setGuesses(nextGuesses);

    if (character.id === secret.id) {
      setStatus(`You found ${secret.name} in ${nextGuesses.length} guess${nextGuesses.length === 1 ? '' : 'es'}.`);
    } else {
      setStatus('');
    }
  }

  function handleResetTest() {
    // Clear daily state and sequence for testing
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('ouag-daily-sequence');
    window.location.reload();
  }

  return (
    <div className="page-shell">
      <div className="page-overlay" aria-hidden="true" />
      <main className="game-stage">
        <header className="game-topbar">
          <button className="new-game-button" type="button" onClick={handleResetTest}>
            Reset
          </button>
          <div className="game-title-wrap">
            <span className="game-mode">Classic · {formatDate()}</span>
            <div className="game-title">
              <img src="/logo.png" alt="Once Upon a Guess" className="game-logo" />
            </div>
          </div>
          <div className="game-hint-wrap">
            <AnimatePresence>
              {guesses.length >= 4 && !hasWon && (
                <motion.div
                  className="hint-container"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <motion.button
                    className="hint-sphere-btn"
                    onClick={() => setHintRevealed(true)}
                    animate={{
                      y: [0, -8, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <div className="hint-sphere" />
                    <span className="hint-label">Hint!</span>
                  </motion.button>
                  
                  <AnimatePresence>
                    {hintRevealed && (
                      <motion.div 
                        className="hint-reveal"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        Movie: <strong>{secret.movie}</strong>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        <section className="game-panel">
          <SearchCombobox characters={characters} guessedIds={guessedIds} onGuess={handleGuess} disabled={hasWon} />
          {status ? <div className="win-banner">{status}</div> : null}
          <GuessBoard guesses={guesses} secret={secret} />
        </section>
      </main>
    </div>
  );
}
