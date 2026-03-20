# Once Upon a Guess

A front-end-only Disney character guessing game inspired by comparison-based daily guessing games, adapted here for a **classic random mode**.

## Why this version does not need a backend

For the classic mode you described, a backend is not necessary yet.

The current app handles everything in the browser:

- loads the character archive from JSON
- selects a random hidden character locally
- compares guesses against the hidden character
- stores progress in `localStorage`

A backend becomes useful later only if you want shared daily puzzles, user accounts, leaderboards, moderation, analytics, or remote content management.

## Stack

- React
- TypeScript
- Vite
- Framer Motion
- Custom CSS (no Tailwind, no generic dashboard UI)

## Project structure

- `src/App.tsx` – overall page composition and game state
- `src/styles.css` – full art direction, atmosphere, layout, motion feel
- `src/components/StoryHeader.tsx` – cinematic introduction block
- `src/components/SearchCombobox.tsx` – searchable character picker
- `src/components/GuessBoard.tsx` – animated reveal grid
- `src/components/GuessLegend.tsx` – clue explanation
- `src/lib/normalize.ts` – Spanish-to-English dataset normalization
- `src/lib/game.ts` – random selection and tile comparison logic
- `src/data/disney-characters.json` – the archive you uploaded

## Run locally

```bash
npm install
npm run dev
```

## Design intention

This is not designed like a SaaS dashboard or generic template.
The visual language aims for a **storybook observatory**:

- layered darkness with warm cinematic light
- editorial serif typography for emotional tone
- asymmetrical framed panels instead of repetitive cards
- soft magical motion rather than flashy gimmicks
- rich atmosphere without copying official Disney brand assets

## Notes for the next iteration

Good next steps would be:

1. add a true daily mode
2. add silhouettes or abstract emblem art per character
3. create streaks and statistics
4. add sound design and subtle hover particles
5. split the classic game into reusable feature modules
