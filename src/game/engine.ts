import { makePatch, QUESTS, RIBBONS } from './catalog'
import type { Board, GameState, Grain, Move, MoveResult, Patch, PlayerState, Quest } from './types'

const SIZE = 5
const TURNS_PER_SEASON = 6

function random(seed: number): [number, number] {
  const next = (seed * 1664525 + 1013904223) >>> 0
  return [next, next / 4294967296]
}

function drawMarket(seed: number, id: number): [number, Patch[]] {
  const market: Patch[] = []
  let current = seed
  for (let i = 0; i < 3; i += 1) {
    let value: number
    ;[current, value] = random(current)
    market.push(makePatch(id + i, Math.floor(value * 10_000)))
  }
  return [current, market]
}

function emptyPlayer(id: 0 | 1, name: string): PlayerState {
  return {
    id, name, board: Array(25).fill(null), spools: 3, buttons: 0,
    baseScore: 0, questScore: 0, ribbonScore: 0, ribbons: [],
    seasonQuestScores: {}, patchesPlaced: 0,
  }
}

export function createInitialState(seed = Date.now() >>> 0): GameState {
  const [nextSeed, market] = drawMarket(seed, 1)
  return {
    version: 1, seed: nextSeed, round: 1, turnInSeason: 0, activePlayer: 0, status: 'playing',
    players: [emptyPlayer(0, 'Mabel'), emptyPlayer(1, 'Rowan')],
    market, quests: QUESTS, focusQuestId: QUESTS[0].id, ribbon: RIBBONS[0], selection: null,
    log: [{ id: 0, player: 0, text: 'The first season begins. Mabel has the needle.', tone: 'season' }],
    nextId: 4,
  }
}

const at = (row: number, col: number) => row * SIZE + col

function diagonalScore(board: Board): number {
  let runs = 0
  const directions: Array<[number, number, Grain]> = [[1, 1, 'down'], [1, -1, 'up']]
  for (const [dr, dc, grain] of directions) {
    for (let row = 0; row < SIZE; row += 1) {
      for (let col = 0; col < SIZE; col += 1) {
        const tile = board[at(row, col)]
        if (!tile || tile.grain !== grain) continue
        const previousRow = row - dr
        const previousCol = col - dc
        const previous = previousRow >= 0 && previousRow < SIZE && previousCol >= 0 && previousCol < SIZE
          ? board[at(previousRow, previousCol)] : null
        if (previous?.color === tile.color && previous.grain === grain) continue
        let length = 1
        let r = row + dr
        let c = col + dc
        while (r >= 0 && r < SIZE && c >= 0 && c < SIZE) {
          const next = board[at(r, c)]
          if (!next || next.color !== tile.color || next.grain !== grain) break
          length += 1; r += dr; c += dc
        }
        if (length >= 3) runs += 1
      }
    }
  }
  return runs * 3
}

function boundaryScore(board: Board): number {
  let count = 0
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      if (!board[at(row, col)] || (row > 0 && row < 4 && col > 0 && col < 4)) continue
      const touchesInterior = [[-1, 0], [1, 0], [0, -1], [0, 1]].some(([dr, dc]) => {
        const r = row + dr; const c = col + dc
        return r > 0 && r < 4 && c > 0 && c < 4 && Boolean(board[at(r, c)])
      })
      if (touchesInterior) count += 1
    }
  }
  return Math.min(count * 2, 16)
}

function clusterScore(board: Board): number {
  let blocks = 0
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const cells = [board[at(row, col)], board[at(row, col + 1)], board[at(row + 1, col)], board[at(row + 1, col + 1)]]
      if (cells.every(Boolean) && cells.every((cell) => cell?.color === cells[0]?.color)) blocks += 1
    }
  }
  return blocks * 5
}

export function scoreQuest(board: Board, quest: Quest): number {
  if (quest.kind === 'diagonal') return diagonalScore(board)
  if (quest.kind === 'boundary') return boundaryScore(board)
  return clusterScore(board)
}

function ribbonEarned(board: Board, ribbonId: string): boolean {
  if (ribbonId === 'corner-stitches') return [0, 4, 20, 24].filter((i) => board[i]).length >= 3
  if (ribbonId === 'tidy-row') return Array.from({ length: 5 }, (_, r) => board.slice(r * 5, r * 5 + 5).every(Boolean)).some(Boolean)
  if (ribbonId === 'full-column') return Array.from({ length: 5 }, (_, c) => Array.from({ length: 5 }, (_, r) => board[at(r, c)]).every(Boolean)).some(Boolean)
  const counts = board.reduce<Record<string, number>>((all, tile) => {
    if (tile) all[tile.color] = (all[tile.color] || 0) + 1
    return all
  }, {})
  return Math.max(0, ...Object.values(counts)) >= 4
}

function clone(state: GameState): GameState {
  // JSON cloning is intentional: GameState is a persistence/replay format and
  // may arrive wrapped in a framework proxy at the render boundary.
  return JSON.parse(JSON.stringify(state)) as GameState
}

function addLog(state: GameState, player: 0 | 1, text: string, tone: GameState['log'][number]['tone']) {
  state.log.unshift({ id: state.nextId++, player, text, tone })
  state.log = state.log.slice(0, 8)
}

function finishTurn(state: GameState) {
  state.selection = null
  state.turnInSeason += 1
  const fullBoard = state.players.some((p) => p.board.every(Boolean))
  if (fullBoard) {
    state.status = 'finished'
    addLog(state, state.activePlayer, 'The last open soil was covered. The garden is complete!', 'season')
    return
  }
  if (state.turnInSeason >= TURNS_PER_SEASON) {
    for (const player of state.players) {
      if (ribbonEarned(player.board, state.ribbon.id) && !player.ribbons.includes(`${state.round}-${state.ribbon.id}`)) {
        player.ribbons.push(`${state.round}-${state.ribbon.id}`)
        player.ribbonScore += state.ribbon.points
        player.buttons += 1
        addLog(state, player.id, `${player.name} earned the ${state.ribbon.name} ribbon and a button.`, 'button')
      }
      player.seasonQuestScores = {}
    }
    if (state.round >= 6) {
      state.status = 'finished'
      addLog(state, state.activePlayer, 'Six seasons have passed. Time to admire the quilts!', 'season')
      return
    }
    state.round += 1
    state.turnInSeason = 0
    state.ribbon = RIBBONS[(state.round - 1) % RIBBONS.length]
    state.focusQuestId = QUESTS[(state.round - 1) % QUESTS.length].id
    addLog(state, state.activePlayer, `Season ${state.round} begins with a new ribbon to stitch.`, 'season')
  }
  state.activePlayer = state.activePlayer === 0 ? 1 : 0
  state.players[state.activePlayer].spools += 1
}

export function totalScore(player: PlayerState): number {
  return player.baseScore + player.questScore + player.ribbonScore + player.buttons
}

export function applyMove(source: GameState, move: Move): MoveResult {
  if (move.type === 'newGame') return { state: createInitialState(move.seed) }
  const state = clone(source)
  if (move.type === 'rename') {
    state.players[move.player].name = move.name.trim().slice(0, 18) || state.players[move.player].name
    return { state }
  }
  if (state.status === 'finished') return { state: source, error: 'The game has already ended.' }
  const player = state.players[state.activePlayer]

  if (move.type === 'select') {
    const patch = state.market[move.marketIndex]
    if (!patch) return { state: source, error: 'That basket is no longer available.' }
    if (player.spools < patch.cost) return { state: source, error: `You need ${patch.cost} thread spools for this patch.` }
    state.selection = { marketIndex: move.marketIndex, grain: patch.grain, orientation: 'horizontal' }
    return { state }
  }
  if (move.type === 'clearSelection') { state.selection = null; return { state } }
  if (move.type === 'flip') {
    if (!state.selection) return { state: source, error: 'Choose a patch first.' }
    state.selection.grain = state.selection.grain === 'up' ? 'down' : 'up'
    return { state }
  }
  if (move.type === 'rotate') {
    if (!state.selection) return { state: source, error: 'Choose a patch first.' }
    if (state.market[state.selection.marketIndex].size !== 2) return { state: source, error: 'Only Double Stitch patches rotate.' }
    state.selection.orientation = state.selection.orientation === 'horizontal' ? 'vertical' : 'horizontal'
    return { state }
  }
  if (move.type === 'reroll') {
    if (player.buttons < 1) return { state: source, error: 'You need a button to refresh the baskets.' }
    player.buttons -= 1
    ;[state.seed, state.market] = drawMarket(state.seed, state.nextId)
    state.nextId += 3
    addLog(state, player.id, `${player.name} spent a button to refresh the market.`, 'button')
    finishTurn(state)
    return { state }
  }
  if (!state.selection) return { state: source, error: 'Choose a patch basket first.' }
  const patch = state.market[state.selection.marketIndex]
  const cells = [[move.row, move.col]]
  if (patch.size === 2) cells.push(state.selection.orientation === 'horizontal' ? [move.row, move.col + 1] : [move.row + 1, move.col])
  if (cells.some(([r, c]) => r < 0 || r >= SIZE || c < 0 || c >= SIZE || player.board[at(r, c)])) {
    return { state: source, error: patch.size === 2 ? 'The Double Stitch needs two open neighboring plots.' : 'That garden plot is already sewn.' }
  }
  const placementId = `placed-${state.nextId++}`
  for (const [r, c] of cells) {
    player.board[at(r, c)] = { ...patch, grain: state.selection.grain, placementId }
  }
  player.spools -= patch.cost
  player.baseScore += patch.basePoints
  player.patchesPlaced += patch.size
  addLog(state, player.id, `${player.name} sewed ${patch.name} into ${String.fromCharCode(65 + move.col)}${move.row + 1}.`, 'sew')
  for (const quest of state.quests) {
    const score = scoreQuest(player.board, quest)
    const previous = player.seasonQuestScores[quest.id] || 0
    if (score > previous) {
      const gained = score - previous
      player.questScore += gained
      if (Math.floor(score / 5) > Math.floor(previous / 5)) player.buttons += 1
      addLog(state, player.id, `${quest.name} bloomed for +${gained} points.`, 'quest')
    }
    player.seasonQuestScores[quest.id] = Math.max(previous, score)
  }
  let nextPatch: Patch
  let value: number
  ;[state.seed, value] = random(state.seed)
  nextPatch = makePatch(state.nextId++, Math.floor(value * 10_000))
  state.market.splice(state.selection.marketIndex, 1, nextPatch)
  finishTurn(state)
  return { state }
}

export function canPlace(state: GameState, row: number, col: number): boolean {
  if (!state.selection) return false
  const player = state.players[state.activePlayer]
  const patch = state.market[state.selection.marketIndex]
  if (player.board[at(row, col)]) return false
  if (patch.size === 1) return true
  const [r, c] = state.selection.orientation === 'horizontal' ? [row, col + 1] : [row + 1, col]
  return r < SIZE && c < SIZE && !player.board[at(r, c)]
}
