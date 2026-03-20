import { useEffect, useMemo, useState } from 'react';
import rawDataset from './data/disney-characters.json';
import { GuessBoard } from './components/GuessBoard';
import { SearchCombobox } from './components/SearchCombobox';
import { chooseRandomCharacter } from './lib/game';
import { normalizeCharacters } from './lib/normalize';
import type { DisneyCharacter, RawDataset } from './types';

const STORAGE_KEY = 'once-upon-a-guess-classic-v2';

type StoredState = {
  secretId?: string;
  guessIds?: string[];
};

function loadStoredState(characters: DisneyCharacter[]) {
  if (typeof window === 'undefined') return null;

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredState;
    const secret = characters.find((character) => character.id === parsed.secretId);
    if (!secret) return null;

    const guesses = (parsed.guessIds ?? [])
      .map((id) => characters.find((character) => character.id === id))
      .filter(Boolean) as DisneyCharacter[];

    return { secret, guesses };
  } catch {
    return null;
  }
}

export default function App() {
  const dataset = rawDataset as RawDataset;
  const characters = useMemo(() => normalizeCharacters(dataset), [dataset]);
  const initialStored = useMemo(() => loadStoredState(characters), [characters]);

  const [secret, setSecret] = useState<DisneyCharacter>(initialStored?.secret ?? chooseRandomCharacter(characters));
  const [guesses, setGuesses] = useState<DisneyCharacter[]>(initialStored?.guesses ?? []);
  const [status, setStatus] = useState('');

  const guessedIds = useMemo(() => new Set(guesses.map((guess) => guess.id)), [guesses]);
  const hasWon = guesses.some((guess) => guess.id === secret.id);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        secretId: secret.id,
        guessIds: guesses.map((guess) => guess.id),
      }),
    );
  }, [secret, guesses]);

  function handleGuess(character: DisneyCharacter) {
    if (hasWon || guessedIds.has(character.id)) {
      return;
    }

    const nextGuesses = [...guesses, character];
    setGuesses(nextGuesses);

    if (character.id === secret.id) {
      setStatus(`You found ${secret.name} in ${nextGuesses.length} guess${nextGuesses.length === 1 ? '' : 'es'}.`);
      return;
    }

    setStatus('');
  }

  function handleNewGame() {
    const nextSecret = chooseRandomCharacter(characters, secret.id);
    setSecret(nextSecret);
    setGuesses([]);
    setStatus('');
  }

  return (
    <div className="page-shell">
      <div className="page-overlay" aria-hidden="true" />
      <main className="game-stage">
        <header className="game-topbar">
          <div />
          <div className="game-title-wrap">
            <span className="game-mode">Classic</span>
            <h1 className="game-title">Once Upon a Guess</h1>
          </div>
          <button className="new-game-button" type="button" onClick={handleNewGame}>
            New game
          </button>
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
