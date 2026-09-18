import { describe, expect, it, vi } from 'vitest'
import { chooseBotTurn } from './bot'
import { applyMove, createInitialState, totalScore } from './engine'
import type { GameState, Patch, PlacedPatch } from './types'

function patch(color: Patch['color'], name: string = color): Patch {
  return { id: name, name, color, grain: 'down', pattern: 'dot', size: 1, cost: 1, basePoints: 1 }
}

function placed(color: Patch['color']): PlacedPatch {
  return { ...patch(color), placementId: `placed-${color}` }
}

function botState(): GameState {
  const state = createInitialState(123)
  state.activePlayer = 1
  state.market = [patch('rose', 'Rose'), patch('sage', 'Sage'), patch('sun', 'Sun')]
  return state
}

describe('bot move source', () => {
  it('uses applyMove-compatible moves to take the highest-scoring one-ply option', () => {
    const state = botState()
    state.players[1].board[0] = placed('rose')
    state.players[1].board[1] = placed('rose')
    state.players[1].board[5] = placed('rose')

    const plan = chooseBotTurn(state, () => 0.9)
    expect(plan).not.toBeNull()
    expect(plan?.marketIndex).toBe(0)
    expect(plan?.row).toBe(1)
    expect(plan?.col).toBe(1)

    let resolved = state
    for (const move of plan!.moves) resolved = applyMove(resolved, move).state
    expect(totalScore(resolved.players[1])).toBe(11)
    expect(resolved.activePlayer).toBe(0)
  })

  it('breaks equally scoring candidates using the injected random source', () => {
    const random = vi.fn(() => 0)
    const plan = chooseBotTurn(botState(), random)
    expect(plan?.kind).toBe('place')
    expect(random).toHaveBeenCalled()
  })

  it('does not choose a turn for the human player', () => {
    const state = botState()
    state.activePlayer = 0
    expect(chooseBotTurn(state)).toBeNull()
  })
})
