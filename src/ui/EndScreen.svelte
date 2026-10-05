<script lang="ts">
  import type { EndReason, GameStats } from "../game/session";

  interface Props {
    credits: number;
    startingCredits: number;
    reason: EndReason;
    stats: GameStats;
    previousCredits: number | null; // score de la partie précédente
    recordToBeat: number | null; // meilleur score des AUTRES parties
    isNewRecord: boolean;
    onrestart: () => void;
  }

  let {
    credits,
    startingCredits,
    reason,
    stats,
    previousCredits,
    recordToBeat,
    isNewRecord,
    onrestart,
  }: Props = $props();

  const diff = $derived(credits - startingCredits);

  /** Formate un écart avec son signe : +120, −45, ±0 */
  function signed(n: number): string {
    if (n > 0) return `+${n}`;
    if (n < 0) return `−${-n}`;
    return "±0";
  }
</script>

<div class="backdrop">
  <div
    class="panel"
    class:record={isNewRecord}
    role="dialog"
    aria-modal="true"
    aria-labelledby="end-title"
  >
    {#if isNewRecord}
      <p class="badge">🏆 Nouveau record !</p>
    {:else}
      <p class="reason">
        {reason === "time" ? "Temps écoulé !" : "Faillite !"}
      </p>
    {/if}

    <h2 id="end-title">{credits}</h2>
    <p class="diff" class:up={diff > 0} class:down={diff < 0}>
      {signed(diff)} par rapport au départ
    </p>

    {#if previousCredits !== null || recordToBeat !== null}
      <ul class="compare">
        {#if previousCredits !== null}
          <li>
            <span>Partie précédente</span>
            <strong>{previousCredits}</strong>
            <em
              class:up={credits > previousCredits}
              class:down={credits < previousCredits}
            >
              {signed(credits - previousCredits)}
            </em>
          </li>
        {/if}
        {#if recordToBeat !== null}
          <li>
            <span>{isNewRecord ? "Ancien record" : "Record"}</span>
            <strong>{recordToBeat}</strong>
            <em
              class:up={credits > recordToBeat}
              class:down={credits < recordToBeat}
            >
              {signed(credits - recordToBeat)}
            </em>
          </li>
        {/if}
      </ul>
    {/if}

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
    width: min(100%, 24rem);
    padding: 2rem;
    background: #1b1b2f;
    border-radius: 20px;
    text-align: center;
  }

  .panel.record {
    box-shadow:
      0 0 0 3px #f5c542,
      0 0 50px rgb(245 197 66 / 0.35);
    animation: arrive 0.5s cubic-bezier(0.2, 1.3, 0.4, 1);
  }

  @keyframes arrive {
    from {
      transform: scale(0.85);
      opacity: 0;
    }
  }

  .reason {
    margin: 0;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    opacity: 0.7;
  }

  .badge {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #f5c542;
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

  .compare {
    width: 100%;
    margin: 0.75rem 0 0;
    padding: 0;
    list-style: none;
  }

  .compare li {
    display: grid;
    grid-template-columns: 1fr auto 4.5rem;
    gap: 0.75rem;
    padding: 0.4rem 0;
    border-top: 1px solid rgb(255 255 255 / 0.08);
    font-variant-numeric: tabular-nums;
    text-align: left;
  }

  .compare span {
    opacity: 0.7;
  }

  .compare em {
    font-style: normal;
    font-weight: 700;
    text-align: right;
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

  @media (prefers-reduced-motion: reduce) {
    .panel.record {
      animation: none;
    }
  }
</style>
