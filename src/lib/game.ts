import type { ComparisonTile, DisneyCharacter, TileState } from '../types';

const EPOCH = new Date('2025-01-01T00:00:00').getTime();
const MS_PER_DAY = 86_400_000;
const SEQ_KEY = 'ouag-daily-sequence';

function getDayIndex(): number {
  return Math.floor((Date.now() - EPOCH) / MS_PER_DAY);
}

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type DailySequence = { seq: string[]; pos: number; lastDay: number };

export function getDailyCharacter(characters: DisneyCharacter[]): DisneyCharacter {
  const dayIndex = getDayIndex();
  let state: DailySequence | null = null;

  try {
    const raw = localStorage.getItem(SEQ_KEY);
    if (raw) state = JSON.parse(raw) as DailySequence;
  } catch { /* ignore */ }

  // Build a fresh sequence if none exists or if character count changed
  if (!state || state.seq.length !== characters.length) {
    state = { seq: shuffled(characters.map((c) => c.id)), pos: 0, lastDay: dayIndex };
  }

  // If the day has advanced, we move to the next position in the sequence
  if (dayIndex > state.lastDay) {
    const elapsed = dayIndex - state.lastDay;
    state.pos = (state.pos + elapsed) % state.seq.length;
    state.lastDay = dayIndex;

    // Reshuffle if we've cycled back to the beginning to keep it fresh
    if (state.pos < elapsed) {
      state.seq = shuffled(characters.map((c) => c.id));
    }
  }

  try {
    localStorage.setItem(SEQ_KEY, JSON.stringify(state));
  } catch { /* ignore */ }

  const todayId = state.seq[state.pos % state.seq.length];
  return characters.find((c) => c.id === todayId) ?? characters[0];
}

function stateForMatch(isExact: boolean): TileState {
  return isExact ? 'exact' : 'miss';
}

function yearState(guess: number, secret: number): TileState {
  if (guess === secret) return 'exact';
  if (Math.abs(guess - secret) <= 5) return 'near';
  return 'miss';
}

function yearHint(guess: number, secret: number) {
  if (guess === secret) return 'Exact';
  return guess < secret ? 'Later ↑' : 'Earlier ↓';
}

export function createTileComparisons(guess: DisneyCharacter, secret: DisneyCharacter): ComparisonTile[] {
  return [
    {
      key: 'character',
      label: 'Character',
      value: guess.name,
      state: stateForMatch(guess.id === secret.id),
      character: guess,
    },
    {
      key: 'movie',
      label: 'Movie',
      value: guess.movie,
      state: stateForMatch(guess.movie === secret.movie),
    },
    {
      key: 'role',
      label: 'Role',
      value: guess.role,
      state: stateForMatch(guess.role === secret.role),
    },
    {
      key: 'gender',
      label: 'Gender',
      value: guess.gender,
      state: stateForMatch(guess.gender === secret.gender),
    },
    {
      key: 'species',
      label: 'Species',
      value: guess.species,
      state: stateForMatch(guess.species === secret.species),
    },
    {
      key: 'magic',
      label: 'Magic',
      value: guess.powers ? 'Magic' : 'No magic',
      state: stateForMatch(guess.powers === secret.powers),
    },
    {
      key: 'year',
      label: 'Year',
      value: String(guess.year),
      state: yearState(guess.year, secret.year),
      hint: yearHint(guess.year, secret.year),
    },
  ];
}
