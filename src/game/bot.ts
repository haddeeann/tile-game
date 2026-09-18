import { applyMove, totalScore } from './engine'
import type { GameState, Move } from './types'

export interface BotPlan {
  kind: 'place' | 'reroll'
  moves: Move[]
  marketIndex?: number
  row?: number
  col?: number
}

/**
 * Selects a move source for the active bot player. Rules and validation remain
 * entirely inside applyMove: every candidate is evaluated by running the same
 * move sequence a UI or future remote player would dispatch.
 */
export function chooseBotTurn(state: GameState, random = Math.random): BotPlan | null {
  if (state.status !== 'playing' || state.activePlayer !== 1) return null

  let bestScore = Number.NEGATIVE_INFINITY
  let best: BotPlan | null = null
  let tiedCandidates = 0

  state.market.forEach((patch, marketIndex) => {
    const selected = applyMove(state, { type: 'select', marketIndex })
    if (selected.error) return

    const grains = patch.grain === 'up' ? [false, true] : [false, true]
    const orientations = patch.size === 2 ? [false, true] : [false]

    for (const shouldFlip of grains) {
      for (const shouldRotate of orientations) {
        const setupMoves: Move[] = [{ type: 'select', marketIndex }]
        let prepared = selected.state

        if (shouldFlip) {
          const flipped = applyMove(prepared, { type: 'flip' })
          if (flipped.error) continue
          prepared = flipped.state
          setupMoves.push({ type: 'flip' })
        }
        if (shouldRotate) {
          const rotated = applyMove(prepared, { type: 'rotate' })
          if (rotated.error) continue
          prepared = rotated.state
          setupMoves.push({ type: 'rotate' })
        }

        for (let row = 0; row < 5; row += 1) {
          for (let col = 0; col < 5; col += 1) {
            const place: Move = { type: 'place', row, col }
            const simulated = applyMove(prepared, place)
            if (simulated.error) continue

            const score = totalScore(simulated.state.players[1])
            const candidate: BotPlan = {
              kind: 'place', moves: [...setupMoves, place], marketIndex, row, col,
            }
            if (score > bestScore) {
              bestScore = score
              best = candidate
              tiedCandidates = 1
            } else if (score === bestScore) {
              tiedCandidates += 1
              if (random() < 1 / tiedCandidates) best = candidate
            }
          }
        }
      }
    }
  })

  if (best) return best
  if (state.players[1].buttons > 0) return { kind: 'reroll', moves: [{ type: 'reroll' }] }
  return null
}
