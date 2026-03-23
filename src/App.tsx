import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import rawDataset from './data/disney-characters.json';
import { GuessBoard } from './components/GuessBoard';
import { SearchCombobox } from './components/SearchCombobox';
import { Home } from './components/Home';
import { EmojiDisplay } from './components/EmojiDisplay';
import { SilhouetteDisplay } from './components/SilhouetteDisplay';
import { getDailyCharacter, getDailyEmojiCharacter, getDailySilhouetteCharacter } from './lib/game';
import { normalizeCharacters } from './lib/normalize';
import type { DisneyCharacter, RawDataset } from './types';

const CLASSIC_STORAGE_KEY = 'ouag-daily-state-v4';
const EMOJI_STORAGE_KEY = 'ouag-emoji-state-v1';
const SILHOUETTE_STORAGE_KEY = 'ouag-silhouette-state-v1';

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

function loadStoredGuesses(characters: DisneyCharacter[], storageKey: string): DisneyCharacter[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(storageKey);
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
  const [view, setView] = useState<'home' | 'classic' | 'emoji' | 'silhouette'>(() => {
    if (typeof window === 'undefined') return 'home';
    const hash = window.location.hash.replace('#', '');
    if (['classic', 'emoji', 'silhouette'].includes(hash)) return hash as any;
    return 'home';
  });

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (['classic', 'emoji', 'silhouette'].includes(hash)) {
        setView(hash as any);
      } else {
        setView('home');
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigateTo = (newView: 'home' | 'classic' | 'emoji' | 'silhouette') => {
    if (newView === 'home') {
      window.history.pushState(null, '', window.location.pathname);
    } else {
      window.location.hash = newView;
    }
    setView(newView);
  };

  const dataset = rawDataset as RawDataset;
  const characters = useMemo(() => normalizeCharacters(dataset), [dataset]);

  const classicSecret = useMemo(() => getDailyCharacter(characters), [characters]);
  const emojiSecret = useMemo(() => getDailyEmojiCharacter(characters), [characters]);
  const silhouetteSecret = useMemo(() => getDailySilhouetteCharacter(characters), [characters]);

  const [classicGuesses, setClassicGuesses] = useState<DisneyCharacter[]>(() => loadStoredGuesses(characters, CLASSIC_STORAGE_KEY));
  const [emojiGuesses, setEmojiGuesses] = useState<DisneyCharacter[]>(() => loadStoredGuesses(characters, EMOJI_STORAGE_KEY));
  const [silhouetteGuesses, setSilhouetteGuesses] = useState<DisneyCharacter[]>(() => loadStoredGuesses(characters, SILHOUETTE_STORAGE_KEY));

  const isEmojiMode = view === 'emoji';
  const isSilhouetteMode = view === 'silhouette';
  
  const secret = isEmojiMode ? emojiSecret : (isSilhouetteMode ? silhouetteSecret : classicSecret);
  const guesses = isEmojiMode ? emojiGuesses : (isSilhouetteMode ? silhouetteGuesses : classicGuesses);
  const setGuesses = isEmojiMode ? setEmojiGuesses : (isSilhouetteMode ? setSilhouetteGuesses : setClassicGuesses);

  const [status, setStatus] = useState('');
  const [hintRevealed, setHintRevealed] = useState(false);

  const guessedIds = useMemo(() => new Set(guesses.map((g) => g.id)), [guesses]);
  const hasWon = guesses.some((g) => g.id === secret.id);

  // Sync Classic Guesses to Storage
  useEffect(() => {
    localStorage.setItem(CLASSIC_STORAGE_KEY, JSON.stringify({
      date: todayKey(),
      guessIds: classicGuesses.map((g) => g.id),
    }));
  }, [classicGuesses]);

  // Sync Emoji Guesses to Storage
  useEffect(() => {
    localStorage.setItem(EMOJI_STORAGE_KEY, JSON.stringify({
      date: todayKey(),
      guessIds: emojiGuesses.map((g) => g.id),
    }));
  }, [emojiGuesses]);

  // Sync Silhouette Guesses to Storage
  useEffect(() => {
    localStorage.setItem(SILHOUETTE_STORAGE_KEY, JSON.stringify({
      date: todayKey(),
      guessIds: silhouetteGuesses.map((g) => g.id),
    }));
  }, [silhouetteGuesses]);

  // Restore win status on load or mode switch
  useEffect(() => {
    if (hasWon) {
      setStatus(`You found ${secret.name} in ${guesses.length} guess${guesses.length === 1 ? '' : 'es'}!`);
    } else {
      setStatus('');
    }
  }, [hasWon, secret.name, guesses.length, view]);

  function handleGuess(character: DisneyCharacter) {
    if (hasWon || guessedIds.has(character.id)) return;

    const nextGuesses = [...guesses, character];
    setGuesses(nextGuesses);
  }

  const getModeLabel = () => {
    if (isEmojiMode) return 'Emoji';
    if (isSilhouetteMode) return 'Silhouette';
    return 'Classic';
  };

  return (
    <div className="page-shell">
      <div className="page-overlay" aria-hidden="true" />

      {view === 'home' ? (
        <Home onSelectMode={(mode) => navigateTo(mode)} />
      ) : (
        <main className="game-stage">
          <header className="game-topbar">
            <div className="game-back-wrap">
              <button className="new-game-button" type="button" onClick={() => navigateTo('home')}>
                &larr; Home
              </button>
            </div>
            <div className="game-title-wrap">
              <span className="game-mode">{getModeLabel()} · {formatDate()}</span>
              <div className="game-title">
                <img src="/logo.png" alt="Mousdle - The daily character guessing challenge" className="game-logo" />
              </div>
            </div>

          </header>

          <section className="game-panel">
            {isEmojiMode && (
              <EmojiDisplay secret={secret} guesses={guesses} hasWon={hasWon} />
            )}
            {isSilhouetteMode && (
              <SilhouetteDisplay 
                secret={secret} 
                guesses={guesses} 
                hasWon={hasWon} 
              />
            )}
            <SearchCombobox characters={characters} guessedIds={guessedIds} onGuess={handleGuess} disabled={hasWon} />
            {status ? <div className="win-banner">{status}</div> : null}
            <GuessBoard guesses={guesses} secret={secret} />
          </section>

          <AnimatePresence>
            {guesses.length >= (isSilhouetteMode || isEmojiMode ? 5 : 4) && !hasWon && !hintRevealed && (
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
