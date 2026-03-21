import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { DisneyCharacter } from '../types';
import { CharacterAvatar } from './CharacterAvatar';

type SearchComboboxProps = {
  characters: DisneyCharacter[];
  guessedIds: Set<string>;
  onGuess: (character: DisneyCharacter) => void;
  disabled?: boolean;
};

export function SearchCombobox({ characters, guessedIds, onGuess, disabled = false }: SearchComboboxProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const suggestions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const pool = characters.filter((character) => !guessedIds.has(character.id));

    if (!normalized) {
      return [];
    }

    return pool
      .filter((character) => character.name.toLowerCase().startsWith(normalized));
  }, [characters, guessedIds, query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const submit = (character: DisneyCharacter | undefined) => {
    if (!character) return;
    onGuess(character);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="search-box" ref={containerRef}>
      <div className="search-box__field">
        <input
          aria-label="Search a character"
          className="search-box__input"
          placeholder="Search a character"
          value={query}
          autoComplete="off"
          disabled={disabled}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((current) => Math.min(current + 1, suggestions.length - 1));
            }

            if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActiveIndex((current) => Math.max(current - 1, 0));
            }

            if (event.key === 'Enter') {
              event.preventDefault();
              submit(suggestions[activeIndex] ?? suggestions[0]);
            }

            if (event.key === 'Escape') {
              setOpen(false);
            }
          }}
        />

        <button
          type="button"
          className="search-box__submit"
          onClick={() => submit(suggestions[activeIndex] ?? suggestions[0])}
          disabled={disabled || suggestions.length === 0}
          aria-label="Submit guess"
        >
          ➜
        </button>
      </div>

      <AnimatePresence>
        {open && suggestions.length > 0 && !disabled ? (
          <motion.div
            className="search-dropdown"
            initial={{ opacity: 0, y: 10, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.985 }}
            transition={{ duration: 0.16 }}
          >
            {suggestions.map((character, index) => (
              <button
                key={character.id}
                type="button"
                className={`search-option ${index === activeIndex ? 'is-active' : ''}`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => submit(character)}
              >
                <CharacterAvatar character={character} size="sm" />
                <span className="search-option__text">
                  <span className="search-option__name">{character.name}</span>
                  <span className="search-option__meta">{character.movie}</span>
                </span>
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
