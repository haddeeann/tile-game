import { describe, expect, it } from 'vitest'
import { applyMove, createInitialState, scoreQuest } from './engine'
import { QUESTS } from './catalog'
import type { Board, PlacedPatch } from './types'

function tile(color: PlacedPatch['color'], grain: PlacedPatch['grain'] = 'down'): PlacedPatch {
  return {
    id: 'test', placementId: Math.random().toString(), name: 'Test patch', color, grain,
    pattern: 'dot', size: 1, cost: 1, basePoints: 1,
  }
}

describe('pure game engine', () => {
  it('creates deterministic, serializable games', () => {
    const a = createInitialState(1234)
    const b = createInitialState(1234)
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
    expect(a.market).toHaveLength(3)
  })

  it('places a patch without mutating the prior state', () => {
    const original = createInitialState(42)
    original.market[0] = { ...original.market[0], cost: 1, size: 1 }
    const selected = applyMove(original, { type: 'select', marketIndex: 0 }).state
    const result = applyMove(selected, { type: 'place', row: 2, col: 2 })
    expect(result.error).toBeUndefined()
    expect(original.players[0].board[12]).toBeNull()
    expect(result.state.players[0].board[12]).not.toBeNull()
    expect(result.state.activePlayer).toBe(1)
  })

  it('rejects placements on occupied plots', () => {
    const state = createInitialState(42)
    state.market[0] = { ...state.market[0], cost: 1, size: 1 }
    state.players[0].board[0] = tile('rose')
    const selected = applyMove(state, { type: 'select', marketIndex: 0 }).state
    const result = applyMove(selected, { type: 'place', row: 0, col: 0 })
    expect(result.error).toMatch(/already sewn/)
    expect(result.state).toBe(selected)
  })

  it('scores each quest from board state alone', () => {
    const diagonal: Board = Array(25).fill(null)
    diagonal[0] = tile('sage', 'down')
    diagonal[6] = tile('sage', 'down')
    diagonal[12] = tile('sage', 'down')
    expect(scoreQuest(diagonal, QUESTS[0])).toBe(3)

    const cluster: Board = Array(25).fill(null)
    ;[0, 1, 5, 6].forEach((i) => { cluster[i] = tile('rose') })
    expect(scoreQuest(cluster, QUESTS[2])).toBe(5)

    const boundary: Board = Array(25).fill(null)
    boundary[1] = tile('sun')
    boundary[6] = tile('lavender')
    expect(scoreQuest(boundary, QUESTS[1])).toBe(2)
  })

  it('uses buttons to reroll and pass the turn', () => {
    const state = createInitialState(77)
    state.players[0].buttons = 1
    const oldMarket = state.market.map((patch) => patch.id)
    const result = applyMove(state, { type: 'reroll' })
    expect(result.state.players[0].buttons).toBe(0)
    expect(result.state.market.map((patch) => patch.id)).not.toEqual(oldMarket)
    expect(result.state.activePlayer).toBe(1)
  })
})
