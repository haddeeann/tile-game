export type PatchColor = 'rose' | 'sage' | 'sun' | 'honey' | 'lavender'
export type Grain = 'up' | 'down'
export type Orientation = 'horizontal' | 'vertical'
export type Pattern = 'petal' | 'stripe' | 'dot' | 'check' | 'sprig' | 'honeycomb'

export interface Patch {
  id: string
  name: string
  color: PatchColor
  grain: Grain
  pattern: Pattern
  size: 1 | 2
  cost: 1 | 2
  basePoints: 1 | 2
}

export interface PlacedPatch extends Patch {
  placementId: string
}

export type Board = Array<PlacedPatch | null>

export type QuestKind = 'diagonal' | 'boundary' | 'cluster'
export interface Quest {
  id: string
  kind: QuestKind
  name: string
  kicker: string
  description: string
  reward: string
}

export interface Ribbon {
  id: string
  name: string
  description: string
  points: number
}

export interface PlayerState {
  id: 0 | 1
  name: string
  board: Board
  spools: number
  buttons: number
  baseScore: number
  questScore: number
  ribbonScore: number
  ribbons: string[]
  seasonQuestScores: Record<string, number>
  patchesPlaced: number
}

export interface Selection {
  marketIndex: number
  grain: Grain
  orientation: Orientation
}

export interface LogEntry {
  id: number
  player: 0 | 1
  text: string
  tone: 'sew' | 'quest' | 'season' | 'button'
}

export interface GameState {
  version: 1
  seed: number
  round: number
  turnInSeason: number
  activePlayer: 0 | 1
  status: 'playing' | 'finished'
  players: [PlayerState, PlayerState]
  market: Patch[]
  quests: Quest[]
  focusQuestId: string
  ribbon: Ribbon
  selection: Selection | null
  log: LogEntry[]
  nextId: number
}

export type Move =
  | { type: 'select'; marketIndex: number }
  | { type: 'flip' }
  | { type: 'rotate' }
  | { type: 'place'; row: number; col: number }
  | { type: 'reroll' }
  | { type: 'clearSelection' }
  | { type: 'rename'; player: 0 | 1; name: string }
  | { type: 'newGame'; seed?: number }

export interface MoveResult {
  state: GameState
  error?: string
}
