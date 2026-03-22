import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import rawDataset from './data/disney-characters.json';
import { GuessBoard } from './components/GuessBoard';
import { SearchCombobox } from './components/SearchCombobox';
import { Home } from './components/Home';
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
  const [view, setView] = useState<'home' | 'classic'>(() => {
    return typeof window !== 'undefined' && window.location.hash === '#classic' ? 'classic' : 'home';
  });

  useEffect(() => {
    const onHashChange = () => {
      setView(window.location.hash === '#classic' ? 'classic' : 'home');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigateTo = (newView: 'home' | 'classic') => {
    if (newView === 'classic') {
      window.location.hash = 'classic';
    } else {
      window.history.pushState(null, '', window.location.pathname);
    }
    setView(newView);
  };

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
      setStatus(`You found ${secret.name} in ${guesses.length} guesses!`);
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

  return (
    <div className="page-shell">
      <div className="page-overlay" aria-hidden="true" />

      {view === 'home' ? (
        <Home onSelectMode={(mode) => navigateTo('classic')} />
      ) : (
        <main className="game-stage">
          <header className="game-topbar">
            <div className="game-back-wrap">
              <button className="new-game-button" type="button" onClick={() => navigateTo('home')}>
                &larr; Home
              </button>
            </div>
            <div className="game-title-wrap">
              <span className="game-mode">Classic · {formatDate()}</span>
              <div className="game-title">
                <img src="/logo.png" alt="Mousdle - The daily character guessing challenge" className="game-logo" />
              </div>
            </div>

          </header>

          <section className="game-panel">
            <SearchCombobox characters={characters} guessedIds={guessedIds} onGuess={handleGuess} disabled={hasWon} />
            {status ? <div className="win-banner">{status}</div> : null}
            <GuessBoard guesses={guesses} secret={secret} />
          </section>

          <AnimatePresence>
            {guesses.length >= 4 && !hasWon && !hintRevealed && (
              <motion.div
                className="hint-fab-container"
                initial={{ opacity: 0, scale: 0, rotate: -90 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ type: 'spring', duration: 0.6 }}
              >
                <motion.button
                  className="hint-fab-btn"
                  onClick={() => setHintRevealed(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  aria-label="Unlock magical hint"
                >
                  <div className="hint-sphere" />
                  <span className="hint-fab-badge">!</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {hintRevealed && !hasWon && (
              <motion.div
                className="hint-modal-overlay"
                onClick={() => setHintRevealed(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="hint-modal-content"
                  onClick={(e) => e.stopPropagation()}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ type: 'spring', bounce: 0.4 }}
                >
                  <button className="hint-modal-close" onClick={() => setHintRevealed(false)} aria-label="Close hint">&times;</button>
                  <h3 className="hint-modal-title">✨ Magical Hint ✨</h3>
                  <p className="hint-modal-subtitle">The character appears in:</p>
                  <div className="hint-modal-movie">{secret.movie}</div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      )}
    </div>
  );
}
