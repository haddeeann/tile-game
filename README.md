# Patchwork Garden

Patchwork Garden is a cozy, two-player tile-placement game about sewing a garden quilt across six seasons. Players draft patterned fabric, arrange it on personal 5×5 boards, and pursue a changing mix of quests and ribbon bonuses.

The game is built for local hot-seat play and runs entirely in the browser. Progress is saved automatically.

## Gameplay

Each turn has two parts:

1. Gain one Thread Spool.
2. Draft and sew a patch, or spend a Button to refresh the market.

Drafted patches may be placed on any open garden plot. Their color, pattern, and diagonal grain direction matter for scoring, but neighboring colors do not need to match. Double Stitch patches occupy two orthogonally adjacent plots and may be rotated before placement.

Three quests score continuously during each season:

- **Sunlit Diagonals** rewards same-color diagonal runs whose grain follows the run.
- **Perimeter Hedge** rewards border patches touching a filled interior plot.
- **Pollinator Patch** rewards completed 2×2 blocks of one color.

At the end of a season, each player can earn the current Ribbon by meeting its personal condition. Ribbons also award a Button. After six seasons—or as soon as a board is full—the player with the highest total wins.

Final scores include:

- Base patch points
- Quest bonuses
- Ribbon bonuses
- One point per unspent Button

## Architecture

The game rules live in a pure TypeScript module, separate from Vue:

```ts
applyMove(state, move) -> { state, error? }
```

`applyMove` does not read the DOM, mutate its input, or depend on Vue. The complete game state is JSON-serializable, which supports:

- Automatic save and resume
- Deterministic seeded games
- Undo history
- Unit tests without a browser
- Future replay or multiplayer synchronization

Vue is responsible only for rendering the current state and dispatching player moves.

## Tech stack

- Vue 3 with the Composition API
- TypeScript
- Vite
- Vitest
- Hand-authored responsive CSS

The visual system uses CSS-generated fabric patterns and stitched details, so the board remains crisp without depending on a large image library.

## Local development

Use Node.js 20 or newer.

```bash
npm install
npm run dev
```

Vite will print the local URL, usually `http://localhost:5173`.

Create a production build with:

```bash
npm run build
```

The optimized site is written to `dist/`.

## Testing

Run the rules-engine test suite:

```bash
npm test
```

The tests cover deterministic setup, immutable moves, valid and invalid placement, quest scoring, market rerolls, and turn progression.

## Project structure

```text
src/
├── App.vue                 Main game interface and browser persistence
├── main.ts                 Vue application entry point
├── style.css               Responsive cottage-core visual system
└── game/
    ├── catalog.ts          Patch, quest, and ribbon definitions
    ├── engine.ts           Pure state transitions and scoring rules
    ├── engine.test.ts      Vitest rules-engine coverage
    └── types.ts            Serializable game and move types

index.html                  Application shell
patchwork-favicon.svg       Patchwork Garden mark
vite.config.ts              Vite and Vue configuration
```

## Useful scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm test` | Run the Vitest suite once |
| `npm run build` | Type-check and create a production build |

## Save data

The current game is stored in browser `localStorage` under `patchwork-garden-v1`. Starting a fresh garden replaces that saved game. No gameplay or player data is sent to a server.

## Extending the game

- Add patch names and patterns in `src/game/catalog.ts`.
- Add a quest by defining its catalog entry and scoring function in `src/game/engine.ts`.
- Add a ribbon in the ribbon catalog and implement its completion check in the engine.
- Add a new player action to the `Move` union in `src/game/types.ts`, then handle it in `applyMove`.

Keep new rules inside the engine rather than Vue components. This preserves deterministic behavior and makes every rule independently testable.
