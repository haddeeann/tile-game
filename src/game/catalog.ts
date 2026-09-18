import type { Patch, PatchColor, Pattern, Quest, Ribbon } from './types'

const NAMES: Record<PatchColor, Array<[string, Pattern]>> = {
  rose: [['Blush Peony', 'petal'], ['Rosebud Dot', 'dot'], ['Picnic Gingham', 'check']],
  sage: [['Fern Stitch', 'sprig'], ['Mint Ticking', 'stripe'], ['Clover Check', 'check']],
  sun: [['Sunflower Polk', 'dot'], ['Daisy Chain', 'petal'], ['Morning Stripe', 'stripe']],
  honey: [['Honeycomb', 'honeycomb'], ['Marigold Check', 'check'], ['Golden Sprig', 'sprig']],
  lavender: [['Lavender Check', 'check'], ['Violet Petal', 'petal'], ['Heather Stripe', 'stripe']],
}

export function makePatch(index: number, roll: number): Patch {
  const colors = Object.keys(NAMES) as PatchColor[]
  const color = colors[roll % colors.length]
  const option = NAMES[color][Math.floor(roll / colors.length) % NAMES[color].length]
  const premium = roll % 9 === 0
  const isDouble = roll % 11 === 0
  return {
    id: `patch-${index}-${roll}`,
    name: isDouble ? `Double ${option[0]}` : option[0],
    color,
    grain: roll % 2 ? 'up' : 'down',
    pattern: option[1],
    size: isDouble ? 2 : 1,
    cost: premium || isDouble ? 2 : 1,
    basePoints: premium || isDouble ? 2 : 1,
  }
}

export const QUESTS: Quest[] = [
  {
    id: 'sunlit-diagonals', kind: 'diagonal', name: 'Sunlit Diagonals', kicker: 'Pattern quest',
    description: 'Build same-color diagonal runs of 3+, with every grain following the path.', reward: '+3 / run',
  },
  {
    id: 'perimeter-hedge', kind: 'boundary', name: 'Perimeter Hedge', kicker: 'Boundary quest',
    description: 'Border patches score when they touch a filled interior patch.', reward: '+2 / tile',
  },
  {
    id: 'pollinator-patch', kind: 'cluster', name: 'Pollinator Patch', kicker: 'Cluster quest',
    description: 'Complete a 2×2 block using four patches of the same color.', reward: '+5 / block',
  },
]

export const RIBBONS: Ribbon[] = [
  { id: 'corner-stitches', name: 'Corner Stitches', description: 'Fill at least 3 garden corners.', points: 6 },
  { id: 'tidy-row', name: 'Tidy Row', description: 'Complete any full row.', points: 5 },
  { id: 'color-story', name: 'Color Story', description: 'Sew 4+ patches in one color.', points: 5 },
  { id: 'full-column', name: 'Tall Trellis', description: 'Complete any full column.', points: 6 },
]
