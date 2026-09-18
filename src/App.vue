<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { applyMove, canPlace, createInitialState, scoreQuest, totalScore } from './game/engine'
import type { GameState, Move, Patch } from './game/types'

const STORAGE_KEY = 'patchwork-garden-v1'
const saved = localStorage.getItem(STORAGE_KEY)
const state = ref<GameState>(saved ? JSON.parse(saved) : createInitialState())
const history = ref<GameState[]>([])
const toast = ref('')
const showRules = ref(false)
const showSettings = ref(false)
const handoff = ref<null | { nextPlayer: string; recap: string; scoreChange: number }>(null)
let toastTimer: number | undefined

const player = computed(() => state.value.players[state.value.activePlayer])
const selectedPatch = computed(() => state.value.selection ? state.value.market[state.value.selection.marketIndex] : null)
const winner = computed(() => {
  const [a, b] = state.value.players
  const aScore = totalScore(a); const bScore = totalScore(b)
  return aScore === bScore ? null : aScore > bScore ? a : b
})
const leadingPlayerId = computed<0 | 1 | null>(() => {
  const [a, b] = state.value.players
  const aScore = totalScore(a); const bScore = totalScore(b)
  return aScore === bScore ? null : aScore > bScore ? 0 : 1
})

watch(state, (value) => localStorage.setItem(STORAGE_KEY, JSON.stringify(value)), { deep: true })
onMounted(() => document.documentElement.classList.add('ready'))

function dispatch(move: Move, remember = false) {
  const placingPlayer = state.value.activePlayer
  const scoreBefore = totalScore(state.value.players[placingPlayer])
  const placedPatch = move.type === 'place' ? selectedPatch.value : null
  if (remember) history.value.push(JSON.parse(JSON.stringify(state.value)) as GameState)
  const result = applyMove(state.value, move)
  if (result.error) {
    if (remember) history.value.pop()
    toast.value = result.error
    window.clearTimeout(toastTimer)
    toastTimer = window.setTimeout(() => { toast.value = '' }, 2600)
    return
  }
  state.value = result.state
  if (move.type === 'place' && placedPatch && result.state.status === 'playing') {
    const scoreChange = totalScore(result.state.players[placingPlayer]) - scoreBefore
    const plot = `${String.fromCharCode(65 + move.col)}${move.row + 1}`
    handoff.value = {
      nextPlayer: result.state.players[result.state.activePlayer].name,
      recap: `${result.state.players[placingPlayer].name} sewed ${placedPatch.name} into ${plot}.`,
      scoreChange,
    }
  }
}

function undo() {
  handoff.value = null
  const previous = history.value.pop()
  if (previous) state.value = previous
}

function newGame() {
  if (!window.confirm('Start a fresh garden? This game will be replaced.')) return
  history.value = []
  handoff.value = null
  state.value = createInitialState()
  showSettings.value = false
}

function patchStyle(patch: Patch | null) {
  return patch ? [`patch-${patch.color}`, `pattern-${patch.pattern}`, `grain-${patch.grain}`] : []
}

function questIcon(kind: string) {
  return kind === 'diagonal' ? '⌁' : kind === 'boundary' ? '▣' : '✣'
}
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <a class="brand" href="#" aria-label="Patchwork Garden home">
        <span class="brand-mark"><i></i><i></i><i></i><i></i></span>
        <span>Patchwork <strong>Garden</strong></span>
      </a>
      <div class="season-center">
        <div class="season-pill">
          <span>Season {{ state.round }} <small>of 6</small></span>
          <i></i>
          <span>{{ state.ribbon.name }}</span>
        </div>
        <p class="win-condition">Highest score after Season 6 wins.</p>
      </div>
      <nav class="top-actions">
        <button class="text-button" @click="showRules = true">How to play</button>
        <button class="icon-button" :disabled="!history.length" aria-label="Undo last move" title="Undo" @click="undo">↶</button>
        <button class="icon-button" aria-label="Open settings" @click="showSettings = true">⚙</button>
      </nav>
    </header>

    <main>
      <section class="quest-section" aria-labelledby="quest-heading">
        <div class="section-heading">
          <div>
            <p class="eyebrow">This season</p>
            <h1 id="quest-heading">Garden quests</h1>
          </div>
          <div class="turns-left"><span>⌛</span> {{ 6 - state.turnInSeason }} turns until the seasons change</div>
        </div>
        <div class="quest-row">
          <article v-for="quest in state.quests" :key="quest.id" class="quest-card" :class="[`quest-${quest.kind}`, { focus: quest.id === state.focusQuestId }]">
            <span v-if="quest.id === state.focusQuestId" class="focus-label">✦ Active focus</span>
            <div class="quest-card-top">
              <span class="quest-icon">{{ questIcon(quest.kind) }}</span>
              <div><h2>{{ quest.name }}</h2><p>{{ quest.kicker }}</p></div>
              <span class="reward">{{ quest.reward }}</span>
            </div>
            <p class="quest-description">{{ quest.description }}</p>
            <div class="quest-progress">
              <span>Current garden value</span>
              <strong>{{ scoreQuest(player.board, quest) }} pts</strong>
            </div>
          </article>
        </div>
      </section>

      <section class="game-layout">
        <aside class="panel market-panel">
          <div class="panel-title">
            <div><p class="eyebrow">Draft market</p><h2>Patch baskets</h2></div>
            <span class="basket-icon">♧</span>
          </div>
          <p class="panel-help">Choose a cloth patch, then stitch it onto your quilt.</p>

          <div class="basket-list">
            <button v-for="(patch, index) in state.market" :key="patch.id" class="basket" :class="{ selected: state.selection?.marketIndex === index }" @click="dispatch({ type: 'select', marketIndex: index })">
              <span class="fabric-swatch" :class="patchStyle(patch)"><i>{{ patch.grain === 'up' ? '↗' : '↘' }}</i></span>
              <span class="basket-copy">
                <strong>{{ patch.name }}</strong>
                <small>{{ patch.size === 2 ? 'Double stitch' : patch.pattern }} · {{ patch.basePoints }} base pt{{ patch.basePoints > 1 ? 's' : '' }}</small>
              </span>
              <span class="cost"><b>{{ patch.cost }}</b> 🧵</span>
            </button>
          </div>

          <button class="reroll" :disabled="player.buttons < 1" @click="dispatch({ type: 'reroll' }, true)">
            <span>↻</span> Refresh baskets <small>1 button</small>
          </button>
          <div class="market-tip">
            <span>✦</span><p><strong>Garden whisper</strong> Corners are worth tending for this season's ribbon.</p>
          </div>
        </aside>

        <section class="board-panel">
          <div class="board-heading">
            <div>
              <p class="eyebrow"><span class="live-dot"></span> {{ player.name }}'s turn · Action phase</p>
              <h2>{{ player.name }}'s garden quilt</h2>
            </div>
            <div class="board-actions" v-if="selectedPatch">
              <button @click="dispatch({ type: 'flip' })"><span>⇄</span> Flip grain</button>
              <button :disabled="selectedPatch.size !== 2" @click="dispatch({ type: 'rotate' })"><span>↻</span> Rotate</button>
              <button class="clear" @click="dispatch({ type: 'clearSelection' })">×</button>
            </div>
          </div>

          <div class="quilt-wrap">
            <div class="column-labels"><span v-for="letter in ['A','B','C','D','E']" :key="letter">{{ letter }}</span></div>
            <div class="board-and-rows">
              <div class="row-labels"><span v-for="n in 5" :key="n">{{ n }}</span></div>
              <div class="quilt-board" :class="{ 'has-selection': selectedPatch }">
                <button v-for="(cell, index) in player.board" :key="index" class="quilt-cell" :class="[...patchStyle(cell), { filled: cell, valid: canPlace(state, Math.floor(index / 5), index % 5) }]" :aria-label="cell ? `${cell.name} at ${String.fromCharCode(65 + index % 5)}${Math.floor(index / 5) + 1}` : `Open soil ${String.fromCharCode(65 + index % 5)}${Math.floor(index / 5) + 1}`" @click="dispatch({ type: 'place', row: Math.floor(index / 5), col: index % 5 }, true)">
                  <template v-if="cell"><span class="tile-stitch"></span><span class="grain-mark">{{ cell.grain === 'up' ? '↗' : '↘' }}</span></template>
                  <template v-else><span class="soil-plus">+</span></template>
                </button>
              </div>
            </div>
          </div>
          <div class="density-row">
            <span>Quilt density · {{ player.board.filter(Boolean).length }} / 25 plots sewn</span>
            <div class="density-track"><i :style="{ width: `${player.board.filter(Boolean).length * 4}%` }"></i></div>
            <strong>{{ 25 - player.board.filter(Boolean).length }} open soil</strong>
          </div>

          <div class="selection-tray" :class="{ empty: !selectedPatch }">
            <template v-if="selectedPatch">
              <span class="selected-swatch fabric-swatch" :class="patchStyle({ ...selectedPatch, grain: state.selection!.grain })"></span>
              <div><p class="eyebrow">Selected from basket</p><h3>{{ selectedPatch.name }}</h3><p>Click any softly outlined open plot to sew.</p></div>
              <div class="grain-chip">Grain {{ state.selection?.grain === 'up' ? '↗' : '↘' }}</div>
            </template>
            <template v-else>
              <span class="needle-icon">⌁</span><div><p class="eyebrow">Needle is ready</p><h3>Choose a patch basket</h3><p>Your available placements will appear here.</p></div>
            </template>
          </div>
        </section>

        <aside class="right-rail">
          <section class="panel standings">
            <div class="panel-title"><div><p class="eyebrow">Tabletop standings</p><h2>Gardeners</h2></div><span>♟</span></div>
            <div v-for="p in state.players" :key="p.id" class="player-row" :class="{ active: p.id === state.activePlayer }">
              <span class="avatar">{{ p.name.charAt(0) }}</span>
              <span><strong>{{ p.name }} <small v-if="p.id === 0">(You)</small><span v-if="leadingPlayerId === p.id" class="leader-badge" aria-label="Current leader" title="Current leader">🏆</span></strong><em>{{ p.id === state.activePlayer ? 'Planting now' : 'Waiting by the gate' }}</em></span>
              <b>{{ totalScore(p) }}<small> pts</small></b>
            </div>
          </section>

          <section class="panel supplies">
            <p class="eyebrow">Supplies & tokens</p>
            <div class="supply-grid">
              <div><span class="token spool">⌇</span><p><b>{{ player.spools }}</b><small>Thread spools</small></p></div>
              <div><span class="token button-token">●</span><p><b>{{ player.buttons }}</b><small>Buttons</small></p></div>
            </div>
          </section>

          <section class="panel scoring">
            <p class="eyebrow">Scoring breakdown <strong>{{ totalScore(player) }} total</strong></p>
            <div><span>Base patches</span><b>{{ player.baseScore }} pts</b></div>
            <div><span>Quest blooms</span><b class="sage-text">+{{ player.questScore }} pts</b></div>
            <div><span>Ribbon keepsakes</span><b class="rose-text">+{{ player.ribbonScore }} pts</b></div>
            <div><span>Button value</span><b>+{{ player.buttons }} pts</b></div>
            <div class="ribbon-card"><span>⌁</span><p><strong>{{ state.ribbon.name }}</strong><small>{{ state.ribbon.description }}</small></p><b>+{{ state.ribbon.points }}</b></div>
          </section>

          <section class="panel stitch-log">
            <p class="eyebrow">Stitch log</p>
            <ul><li v-for="entry in state.log.slice(0, 4)" :key="entry.id" :class="entry.tone"><span></span>{{ entry.text }}</li></ul>
          </section>
        </aside>
      </section>
    </main>

    <footer><span>❦</span> Handcrafted tabletop play · Patchwork Garden <i></i> Game saves automatically in this browser</footer>

    <Transition name="toast"><div v-if="toast" class="toast" role="status">{{ toast }}</div></Transition>

    <div v-if="handoff" class="handoff-backdrop">
      <section class="handoff-card" role="dialog" aria-modal="true" aria-labelledby="handoff-title">
        <span class="handoff-emblem" aria-hidden="true"><i></i>❦</span>
        <p class="eyebrow">Turn complete</p>
        <h2 id="handoff-title">Pass to {{ handoff.nextPlayer }}</h2>
        <div class="handoff-recap">
          <span class="recap-stitch">⌁</span>
          <p>{{ handoff.recap }} <strong>{{ handoff.scoreChange >= 0 ? '+' : '' }}{{ handoff.scoreChange }} point{{ Math.abs(handoff.scoreChange) === 1 ? '' : 's' }}</strong></p>
        </div>
        <p class="handoff-hint">When {{ handoff.nextPlayer }} has the garden, they can continue.</p>
        <button autofocus @click="handoff = null">Ready</button>
      </section>
    </div>

    <div v-if="showRules" class="modal-backdrop" @click.self="showRules = false">
      <section class="modal rules-modal" role="dialog" aria-modal="true" aria-labelledby="rules-title">
        <button class="modal-close" aria-label="Close" @click="showRules = false">×</button>
        <p class="eyebrow">The gardener's almanac</p><h2 id="rules-title">How to play</h2>
        <p class="modal-lede">Grow the highest-scoring quilt through six cozy seasons.</p>
        <div class="rule-steps">
          <article><b>1</b><div><h3>Gather thread</h3><p>At the start of your turn, gain one spool. Pick a basket you can afford.</p></div></article>
          <article><b>2</b><div><h3>Sew a patch</h3><p>Flip its grain if you like, then choose open soil. Double patches need two neighboring plots.</p></div></article>
          <article><b>3</b><div><h3>Grow quests</h3><p>All three quests score continuously. At season's end, complete the ribbon for a keepsake and button.</p></div></article>
        </div>
        <p class="rules-note">Buttons refresh all baskets and are worth one point if saved. Highest score after Season 6 wins.</p>
      </section>
    </div>

    <div v-if="showSettings" class="modal-backdrop" @click.self="showSettings = false">
      <section class="modal settings-modal" role="dialog" aria-modal="true">
        <button class="modal-close" aria-label="Close" @click="showSettings = false">×</button>
        <p class="eyebrow">Game options</p><h2>Tend your table</h2>
        <label v-for="p in state.players" :key="p.id">Player {{ p.id + 1 }} name<input :value="p.name" maxlength="18" @change="dispatch({ type: 'rename', player: p.id, name: ($event.target as HTMLInputElement).value })" /></label>
        <button class="new-game" @click="newGame">Start a fresh garden</button>
      </section>
    </div>

    <div v-if="state.status === 'finished'" class="modal-backdrop game-over">
      <section class="modal finish-modal" role="dialog" aria-modal="true">
        <span class="finish-flower">✿</span><p class="eyebrow">The final stitch</p><h2>{{ winner ? `${winner.name}'s garden blooms brightest!` : 'A perfectly tied garden!' }}</h2>
        <p>{{ state.players[0].name }} {{ totalScore(state.players[0]) }} · {{ state.players[1].name }} {{ totalScore(state.players[1]) }}</p>
        <button class="new-game" @click="state = createInitialState(); history = []">Plant a new garden</button>
      </section>
    </div>
  </div>
</template>
