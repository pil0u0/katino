<script lang="ts">
  import type { EndReason, GameStats } from "../game/session";

  interface Props {
    credits: number;
    startingCredits: number;
    reason: EndReason;
    stats: GameStats;
    onrestart: () => void;
  }

  let { credits, startingCredits, reason, stats, onrestart }: Props = $props();

  const diff = $derived(credits - startingCredits);
</script>

<div class="backdrop">
  <div
    class="panel"
    role="dialog"
    aria-modal="true"
    aria-labelledby="end-title"
  >
    <p class="reason">{reason === "time" ? "Temps écoulé !" : "Faillite !"}</p>
    <h2 id="end-title">{credits}</h2>
    <p class="diff" class:up={diff > 0} class:down={diff < 0}>
      {diff >= 0 ? "+" : ""}{diff} par rapport au départ
    </p>

    <dl>
      <div>
        <dt>Lancers</dt>
        <dd>{stats.spins}</dd>
      </div>
      <div>
        <dt>Plus gros gain</dt>
        <dd>{stats.biggestWin}</dd>
      </div>
      <div>
        <dt>Total misé</dt>
        <dd>{stats.totalBet}</dd>
      </div>
    </dl>

    <!-- svelte-ignore a11y_autofocus -->
    <button onclick={onrestart} autofocus>Rejouer</button>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 1rem;
    background: rgb(10 10 20 / 0.75);
    backdrop-filter: blur(4px);
  }

  .panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    width: min(100%, 22rem);
    padding: 2rem;
    background: #1b1b2f;
    border-radius: 20px;
    text-align: center;
  }

  .reason {
    margin: 0;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    opacity: 0.7;
  }

  h2 {
    margin: 0;
    font-size: 3.5rem;
    font-variant-numeric: tabular-nums;
    color: #f5c542;
  }

  .diff {
    margin: 0;
    font-weight: 600;
  }

  .up {
    color: #4ade80;
  }

  .down {
    color: #f87171;
  }

  dl {
    display: flex;
    gap: 1.5rem;
    margin: 1rem 0;
  }

  dl div {
    display: flex;
    flex-direction: column;
  }

  dt {
    font-size: 0.75rem;
    opacity: 0.6;
  }

  dd {
    margin: 0;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  button {
    font-size: 1.25rem;
    font-weight: 700;
    padding: 0.75rem 3rem;
    border: none;
    border-radius: 999px;
    background: #f5c542;
    color: #1b1b2f;
    cursor: pointer;
  }
</style>
