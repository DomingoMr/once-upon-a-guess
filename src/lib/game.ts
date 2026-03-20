import type { ComparisonTile, DisneyCharacter, TileState } from '../types';

export function chooseRandomCharacter(characters: DisneyCharacter[], excludeId?: string) {
  const pool = excludeId ? characters.filter((character) => character.id !== excludeId) : characters;
  return pool[Math.floor(Math.random() * pool.length)];
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
      key: 'gender',
      label: 'Gender',
      value: guess.gender,
      state: stateForMatch(guess.gender === secret.gender),
    },
    {
      key: 'role',
      label: 'Role',
      value: guess.role,
      state: stateForMatch(guess.role === secret.role),
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
      key: 'movie',
      label: 'Movie',
      value: guess.movie,
      state: stateForMatch(guess.movie === secret.movie),
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
