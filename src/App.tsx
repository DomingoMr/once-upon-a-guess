import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import rawDataset from './data/disney-characters.json';
import rawMelodies from './data/disney-songs.json';
import { GuessBoard } from './components/GuessBoard';
import { SearchCombobox } from './components/SearchCombobox';
import { Home, ModeButton } from './components/Home';
import { EmojiDisplay } from './components/EmojiDisplay';
import { SilhouetteDisplay } from './components/SilhouetteDisplay';
import { SongDisplay } from './components/SongDisplay';
import { ReportModal } from './components/ReportModal';
import { getDailyCharacter, getDailyEmojiCharacter, getDailySilhouetteCharacter, getDailySong } from './lib/game';
import { normalizeCharacters } from './lib/normalize';
import type { DisneyCharacter, DisneyMelody, RawDataset } from './types';

const CLASSIC_STORAGE_KEY = 'ouag-daily-state-v4';
const EMOJI_STORAGE_KEY = 'ouag-emoji-state-v1';
const SILHOUETTE_STORAGE_KEY = 'ouag-silhouette-state-v1';
const SONG_STORAGE_KEY = 'ouag-song-state-v1';

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

type SongStoredState = {
  date: string;
  guessedSongIds: string[];
  hasWon: boolean;
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

function loadStoredSongState(): SongStoredState {
  if (typeof window === 'undefined') return { date: '', guessedSongIds: [], hasWon: false };
  try {
    const raw = localStorage.getItem(SONG_STORAGE_KEY);
    if (!raw) return { date: todayKey(), guessedSongIds: [], hasWon: false };
    const parsed = JSON.parse(raw) as SongStoredState;
    if (parsed.date !== todayKey()) return { date: todayKey(), guessedSongIds: [], hasWon: false };
    return parsed;
  } catch {
    return { date: todayKey(), guessedSongIds: [], hasWon: false };
  }
}

type ViewType = 'home' | 'classic' | 'emoji' | 'silhouette' | 'song' | 'card';
const VALID_VIEWS: ViewType[] = ['classic', 'emoji', 'silhouette', 'song'];

const MODE_SEQUENCE: { id: ViewType; name: string; icon: string | React.ReactNode; subtitle: string }[] = [
  { id: 'classic', name: 'Classic', icon: '✨', subtitle: 'Get clues with every try' },
  { id: 'emoji', name: 'Emoji', icon: '😃', subtitle: 'Guess with a set of emojis' },
  { id: 'silhouette', name: 'Silhouette', icon: '👤', subtitle: 'Whose silhouette is this?' },
  { id: 'song', name: 'Song', icon: '🎵', subtitle: 'Guess the song!' },
  {
    id: 'card',
    name: 'Card',
    icon: <img src="/lorcana.png" alt="Lorcana" style={{ width: '65%', height: '65%', objectFit: 'contain', backgroundColor: 'transparent', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />,
    subtitle: 'Wait and see!',
  },
  { id: 'home', name: 'X', icon: '❓', subtitle: 'Coming soon!' }, // 'home' or a future view
];

export default function App() {
  const [view, setView] = useState<ViewType>(() => {
    if (typeof window === 'undefined') return 'home';
    const hash = window.location.hash.replace('#', '') as ViewType;
    if (VALID_VIEWS.includes(hash)) return hash;
    return 'home';
  });

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '') as ViewType;
      if (VALID_VIEWS.includes(hash)) {
        setView(hash);
      } else {
        setView('home');
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigateTo = (newView: ViewType) => {
    if (newView === 'home') {
      window.history.pushState(null, '', window.location.pathname);
    } else {
      window.location.hash = newView;
    }
    setView(newView);
  };

  const dataset = rawDataset as RawDataset;
  const characters = useMemo(() => normalizeCharacters(dataset), [dataset]);
  const melodies = rawMelodies as DisneyMelody[];

  const classicSecret = useMemo(() => getDailyCharacter(characters), [characters]);
  const emojiSecret = useMemo(() => getDailyEmojiCharacter(characters), [characters]);
  const silhouetteSecret = useMemo(() => getDailySilhouetteCharacter(characters), [characters]);
  const songSecret = useMemo(() => getDailySong(melodies), [melodies]);

  const [classicGuesses, setClassicGuesses] = useState<DisneyCharacter[]>(() => loadStoredGuesses(characters, CLASSIC_STORAGE_KEY));
  const [emojiGuesses, setEmojiGuesses] = useState<DisneyCharacter[]>(() => loadStoredGuesses(characters, EMOJI_STORAGE_KEY));
  const [silhouetteGuesses, setSilhouetteGuesses] = useState<DisneyCharacter[]>(() => loadStoredGuesses(characters, SILHOUETTE_STORAGE_KEY));

  const initSongState = loadStoredSongState();
  const [songGuessedIds, setSongGuessedIds] = useState<string[]>(initSongState.guessedSongIds);
  const [songHasWon, setSongHasWon] = useState<boolean>(initSongState.hasWon);
  const [songHintRevealed, setSongHintRevealed] = useState(false);

  // Derive full song objects from IDs
  const songGuessedSongs = useMemo(
    () => songGuessedIds.map((id) => melodies.find((m) => m.id === id)).filter(Boolean) as DisneyMelody[],
    [songGuessedIds, melodies],
  );

  const isEmojiMode = view === 'emoji';
  const isSilhouetteMode = view === 'silhouette';
  const isSongMode = view === 'song';

  const secret = isEmojiMode ? emojiSecret : (isSilhouetteMode ? silhouetteSecret : classicSecret);
  const guesses = isEmojiMode ? emojiGuesses : (isSilhouetteMode ? silhouetteGuesses : classicGuesses);
  const setGuesses = isEmojiMode ? setEmojiGuesses : (isSilhouetteMode ? setSilhouetteGuesses : setClassicGuesses);

  const [status, setStatus] = useState('');
  const [hintRevealed, setHintRevealed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const nextModeRef = useRef<HTMLDivElement>(null);

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

  // Sync Song state to Storage
  useEffect(() => {
    localStorage.setItem(SONG_STORAGE_KEY, JSON.stringify({
      date: todayKey(),
      guessedSongIds: songGuessedIds,
      hasWon: songHasWon,
    }));
  }, [songGuessedIds, songHasWon]);

  useEffect(() => {
    if (hasWon) {
      setStatus(`You found ${secret.name} in ${guesses.length} guess${guesses.length === 1 ? '' : 'es'}!`);
      // Auto-scroll to next mode button with more delay for smoothness
      setTimeout(() => {
        nextModeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 3000);
    } else {
      setStatus('');
    }
  }, [hasWon, secret.name, guesses.length, view]);

  useEffect(() => {
    if (songHasWon) {
      // Auto-scroll to next mode button for song mode with more delay
      setTimeout(() => {
        nextModeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 3000);
    }
  }, [songHasWon]);

  function handleGuess(character: DisneyCharacter) {
    if (hasWon || guessedIds.has(character.id)) return;
    const nextGuesses = [...guesses, character];
    setGuesses(nextGuesses);
  }

  function handleSongGuess(song: DisneyMelody) {
    if (songHasWon || songGuessedIds.includes(song.id)) return;
    const nextIds = [...songGuessedIds, song.id];
    setSongGuessedIds(nextIds);
    if (song.id === songSecret.id) setSongHasWon(true);
  }

  const getModeLabel = () => {
    if (isEmojiMode) return 'Emoji';
    if (isSilhouetteMode) return 'Silhouette';
    if (isSongMode) return 'Song';
    return 'Classic';
  };

  return (
    <div className="page-shell">
      <div className="page-overlay" aria-hidden="true" />

      {view === 'home' ? (
        <Home onSelectMode={(mode) => navigateTo(mode)} onOpenReport={() => setIsReportOpen(true)} />
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
            <div className="game-report-wrap" style={{ gridColumn: 3, justifySelf: 'end', alignSelf: 'start' }}>
              <button 
                className="bug-report-btn" 
                onClick={() => setIsReportOpen(true)}
                aria-label="Report Bug"
              >
                <span>📩</span>
              </button>
            </div>
          </header>

          {isSongMode ? (
            <section className="game-panel">
              <SongDisplay
                secret={songSecret}
                guessedSongIds={songGuessedIds}
                guessedSongs={songGuessedSongs}
                onGuess={handleSongGuess}
                hasWon={songHasWon}
                hintRevealed={songHintRevealed}
                onHintReveal={() => setSongHintRevealed(true)}
              />

              {songHasWon && (
                <div className="next-mode-section" ref={nextModeRef} style={{ width: '100%', marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', paddingBottom: '40px' }}>
                  <h3 style={{ color: 'var(--blue-200)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Next Challenge</h3>
                  {(() => {
                    const currentIndex = MODE_SEQUENCE.findIndex((m) => m.id === view);
                    const nextMode = MODE_SEQUENCE[currentIndex + 1];
                    if (!nextMode) return null;
                    const isCard = nextMode.id === 'card';
                    return (
                      <div style={{ width: 'min(400px, 100%)' }}>
                        <ModeButton
                          id={nextMode.id}
                          name={nextMode.name}
                          subtitle={nextMode.subtitle}
                          icon={nextMode.icon}
                          active={!isCard}
                          onClick={() => navigateTo(nextMode.id)}
                        />
                      </div>
                    );
                  })()}
                </div>
              )}
            </section>

          ) : (
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
              <SearchCombobox characters={characters} guessedIds={guessedIds} onGuess={handleGuess} onOpenChange={setIsSearchOpen} disabled={hasWon} />

              {guesses.length >= (isSilhouetteMode || isEmojiMode ? 5 : 4) && !hasWon && (
                <div className="hint-trigger-wrap" style={isSearchOpen ? { visibility: 'hidden' } : undefined}>
                  <button
                    className={`hint-trigger-btn${hintRevealed ? ' hint-trigger-btn--revealed' : ''}`}
                    onClick={() => setHintRevealed(true)}
                    type="button"
                    disabled={hintRevealed}
                  >
                    <span className="hint-trigger-sparkle">✨</span>
                    <span>{hintRevealed ? 'Hint revealed!' : 'Magical Hint'}</span>
                    <span className="hint-trigger-sparkle">✨</span>
                  </button>
                </div>
              )}

              {status ? <div className="win-banner">{status}</div> : null}
              <GuessBoard guesses={guesses} secret={secret} />

              {hasWon && (
                <div className="next-mode-section" ref={nextModeRef} style={{ width: '100%', marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                  <h3 style={{ color: 'var(--blue-200)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Next Challenge</h3>
                  {(() => {
                    const currentIndex = MODE_SEQUENCE.findIndex((m) => m.id === view);
                    const nextMode = MODE_SEQUENCE[currentIndex + 1];
                    if (!nextMode) return null;
                    const isCard = nextMode.id === 'card';
                    return (
                      <div style={{ width: 'min(400px, 100%)' }}>
                        <ModeButton
                          id={nextMode.id}
                          name={nextMode.name}
                          subtitle={nextMode.subtitle}
                          icon={nextMode.icon}
                          active={!isCard} // Song to Card disabled
                          onClick={() => navigateTo(nextMode.id)}
                        />
                      </div>
                    );
                  })()}
                </div>
              )}
            </section>
          )}

          <AnimatePresence>
            {hintRevealed && !hasWon && !isSongMode && (
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
            {songHintRevealed && !songHasWon && isSongMode && (
              <motion.div
                className="hint-modal-overlay"
                onClick={() => setSongHintRevealed(false)}
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
                  <button className="hint-modal-close" onClick={() => setSongHintRevealed(false)} aria-label="Close hint">&times;</button>
                  <h3 className="hint-modal-title">✨ Magical Hint ✨</h3>
                  <p className="hint-modal-subtitle">This song belongs to:</p>
                  <div className="hint-modal-movie">{songSecret.metadata.movies.en_US}</div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      )}
      <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />
    </div>
  );
}
