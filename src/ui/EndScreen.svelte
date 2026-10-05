<script lang="ts">
  import type { EndReason, GameStats } from "../game/session";
  import RetroWindow from "./RetroWindow.svelte";
  import Lcd from "./Lcd.svelte";

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
  const title = $derived(
    isNewRecord ? "nouveau_record.exe" : "partie_terminee.exe",
  );

  /** Formate un écart avec son signe : +120, −45, ±0 */
  function signed(n: number): string {
    if (n > 0) return `+${n}`;
    if (n < 0) return `−${-n}`;
    return "±0";
  }
</script>

<div class="backdrop">
  <div
    class="dialog"
    class:record={isNewRecord}
    role="dialog"
    aria-modal="true"
    aria-labelledby="end-reason"
  >
    {#if isNewRecord}
      <span class="sticker" aria-hidden="true">Nouveau record !</span>
    {/if}

    <RetroWindow {title}>
      <div class="content">
        <p class="reason" id="end-reason">
          {reason === "time" ? "Temps écoulé" : "Faillite"}
        </p>

        <Lcd
          label="Score final"
          value={String(credits)}
          ghost="888888"
          tone={isNewRecord ? "gold" : "normal"}
          large
        />

        <p class="diff" class:up={diff > 0} class:down={diff < 0}>
          {signed(diff)} par rapport au départ
        </p>

        {#if previousCredits !== null || recordToBeat !== null}
          <dl class="compare">
            {#if previousCredits !== null}
              <div>
                <dt>Partie précédente</dt>
                <dd>{previousCredits}</dd>
                <dd
                  class="delta"
                  class:up={credits > previousCredits}
                  class:down={credits < previousCredits}
                >
                  {signed(credits - previousCredits)}
                </dd>
              </div>
            {/if}
            {#if recordToBeat !== null}
              <div>
                <dt>{isNewRecord ? "Ancien record" : "Record"}</dt>
                <dd>{recordToBeat}</dd>
                <dd
                  class="delta"
                  class:up={credits > recordToBeat}
                  class:down={credits < recordToBeat}
                >
                  {signed(credits - recordToBeat)}
                </dd>
              </div>
            {/if}
          </dl>
        {/if}

        <dl class="stats">
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
    </RetroWindow>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 10;
    display: grid;
    place-items: center;
    padding: 1rem;
    /* La salle s'assombrit, avec la même trame que le fond */
    background-color: rgb(7 8 42 / 0.8);
    background-image: radial-gradient(
      rgb(108 108 240 / 0.25) 1px,
      transparent 1.4px
    );
    background-size: 6px 6px;
  }

  .dialog {
    position: relative;
    width: min(100%, 24rem);
    animation: arrive 0.3s steps(4, jump-none);
  }

  /* La fenêtre « s'ouvre » par à-coups, comme sur un vieux PC */
  @keyframes arrive {
    from {
      transform: scale(0.85);
      opacity: 0;
    }
  }

  .sticker {
    position: absolute;
    right: -8px;
    bottom: -14px;
    z-index: 2;
    padding: 4px 10px;
    font-size: 0.9rem;
    color: var(--encre);
    background: var(--moutarde);
    border: 2px solid var(--encre);
    box-shadow: 3px 3px 0 var(--encre);
    transform: rotate(-5deg);
  }

  .content {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 16px;
    color: var(--papier);
  }

  .reason {
    margin: 0;
    text-align: center;
    font-size: 1rem;
    color: var(--phosphore);
  }

  .diff {
    margin: 0;
    text-align: center;
  }

  .up {
    color: var(--moutarde);
  }

  .down {
    color: var(--alarme);
  }

  /* Tableau de comparaison : une ligne par partie de référence */
  .compare {
    margin: 0;
    border: 2px solid var(--riso);
  }

  .compare div {
    display: grid;
    grid-template-columns: 1fr auto 4.5rem;
    gap: 10px;
    padding: 6px 10px;
  }

  .compare div + div {
    border-top: 2px solid var(--riso);
  }

  .compare dt {
    color: var(--terne);
  }

  .compare dd {
    margin: 0;
    font-variant-numeric: tabular-nums;
  }

  .compare .delta {
    text-align: right;
  }

  .stats {
    display: flex;
    justify-content: space-between;
    margin: 0;
  }

  .stats div {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .stats dt {
    font-size: 0.75rem;
    color: var(--terne);
  }

  .stats dd {
    margin: 0;
    font-size: 1.05rem;
    font-variant-numeric: tabular-nums;
  }

  /* Même bouton d'arcade que sur la borne */
  button {
    align-self: center;
    min-width: 12rem;
    margin-top: 4px;
    padding: 0.7rem 2rem;
    font-family: var(--font-titre);
    font-size: 1.3rem;
    color: var(--encre);
    background: var(--moutarde);
    border: var(--contour);
    border-radius: 999px;
    box-shadow:
      inset 0 -5px 0 rgb(7 8 42 / 0.25),
      0 6px 0 #000;
    cursor: pointer;
    touch-action: manipulation;
  }

  button:active {
    transform: translateY(4px);
    box-shadow:
      inset 0 -2px 0 rgb(7 8 42 / 0.25),
      0 2px 0 #000;
  }

  @media (prefers-reduced-motion: reduce) {
    .dialog {
      animation: none;
    }
  }
</style>
