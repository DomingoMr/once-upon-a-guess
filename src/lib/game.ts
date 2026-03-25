import type { ComparisonTile, DisneyCharacter, DisneyMelody, TileState } from '../types';

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

export function getDailyEmojiCharacter(characters: DisneyCharacter[]): DisneyCharacter {
  const dayIndex = getLocalDayIndex();
  
  // Filter only characters that have enough emojis to play the game
  const validCharacters = characters.filter(c => c.emojis && c.emojis.length >= 5);
  if (validCharacters.length === 0) return characters[0]; // Fallback if none exist

  // Use a different prime and a different day offset so it's guaranteed different from classic
  const primeStep = 1000033; 
  let seed = ((dayIndex + 365) * primeStep) % validCharacters.length;
  if (seed < 0) seed += validCharacters.length;
  
  return validCharacters[seed];
}

export function getDailySilhouetteCharacter(characters: DisneyCharacter[]): DisneyCharacter {
  const dayIndex = getLocalDayIndex();
  
  // All characters are now eligible for silhouette mode, 
  // as we generate paths dynamically like in classic mode.
  const validCharacters = characters;

  // Use another unique prime/offset
  const primeStep = 1000037; 
  let seed = ((dayIndex + 730) * primeStep) % validCharacters.length;
  if (seed < 0) seed += validCharacters.length;
  
  return validCharacters[seed];
}

export function getDailySong(melodies: DisneyMelody[]): DisneyMelody {
  const dayIndex = getLocalDayIndex() + 1; // 1-based to match day_number
  const found = melodies.find((m) => m.day_number === ((dayIndex - 1) % melodies.length) + 1);
  return found ?? melodies[0];
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

export function getDailyCard(lorcanaPool: Record<string, any[]>): { characterName: string; card: any } {
  const dayIndex = getLocalDayIndex();
  const characterNames = Object.keys(lorcanaPool).sort(); // Sort to ensure consistent indexing

  const charPrimeStep = 1000039;
  let charSeed = ((dayIndex + 1095) * charPrimeStep) % characterNames.length;
  if (charSeed < 0) charSeed += characterNames.length;
  const characterName = characterNames[charSeed];

  const cards = lorcanaPool[characterName];
  const cardPrimeStep = 1000043;
  let cardSeed = ((dayIndex + 2190) * cardPrimeStep) % cards.length;
  if (cardSeed < 0) cardSeed += cards.length;
  const card = cards[cardSeed];

  return { characterName, card };
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
