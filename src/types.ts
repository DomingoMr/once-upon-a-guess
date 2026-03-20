export type Gender = 'Female' | 'Male' | 'Neutral';
export type Role = 'Lead' | 'Supporting' | 'Villain';
export type TileState = 'exact' | 'near' | 'miss';

export type RawCharacter = {
  nombre: string;
  pelicula: string;
  rol: string;
  especie: string;
  poderes: 'Sí' | 'No' | string;
  año: number;
  género: string;
};

export type RawMovie = {
  title: string;
  year: number;
  characters: RawCharacter[];
};

export type RawDataset = {
  scope: unknown;
  movies: RawMovie[];
};

export type DisneyCharacter = {
  id: string;
  name: string;
  movie: string;
  role: Role;
  species: string;
  powers: boolean;
  year: number;
  gender: Gender;
  imageFile: string;
};

export type ComparisonTile = {
  key: string;
  label: string;
  value: string;
  state: TileState;
  hint?: string;
  character?: DisneyCharacter;
};
