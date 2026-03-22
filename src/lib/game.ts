import type { ComparisonTile, DisneyCharacter, TileState } from '../types';

const EPOCH_UTC = Date.UTC(2025, 0, 1);
const MS_PER_DAY = 86_400_000;

function getLocalDayIndex(): number {
  const d = new Date();
  // Get milliseconds for the exact start (midnight) of the user's current local day
  const localMidnightUtc = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.floor((localMidnightUtc - EPOCH_UTC) / MS_PER_DAY);
}

export function getDailyCharacter(characters: DisneyCharacter[]): DisneyCharacter {
  const dayIndex = getLocalDayIndex();
  
  // Use a pseudo-random deterministic selection based on the day.
  // This large prime ensures we jump around the array randomly but consistently.
  const primeStep = 1000003; 
  let seed = (dayIndex * primeStep) % characters.length;
  if (seed < 0) seed += characters.length;
  
  return characters[seed];
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
