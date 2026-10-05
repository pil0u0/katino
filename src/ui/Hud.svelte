<script lang="ts">
  import { Tween } from "svelte/motion";
  import { cubicOut } from "svelte/easing";
  import Lcd from "./Lcd.svelte";

  interface Props {
    credits: number;
    bet: number;
    lastWin: number;
    hasSpun: boolean;
    best: number | null; // meilleur score de la session
    playing: boolean;
  }

  let { credits, bet, lastWin, hasSpun, best, playing }: Props = $props();

  // Le compteur « défile » vers la nouvelle valeur au lieu de sauter.
  // La vraie valeur reste credits : ceci n'est QUE de l'affichage.
  const shownCredits = new Tween(0, { duration: 450, easing: cubicOut });
  $effect(() => {
    shownCredits.target = credits;
  });

  // Résultat net du dernier lancer : gain moins mise
  const net = $derived(lastWin - bet);

  // Le joueur est en train de battre son record
  const beatingRecord = $derived(playing && best !== null && credits > best);
</script>

<!-- display: contents : les deux blocs se placent directement dans la grille de la borne -->
<div class="hud">
  <Lcd
    label="Crédits"
    value={String(Math.round(shownCredits.current))}
    ghost="888888"
    tone={beatingRecord ? "gold" : "normal"}
  />

  <dl class="readouts">
    <div>
      <dt>Dernier lancer</dt>
      <dd class:gain={hasSpun && net > 0} class:loss={hasSpun && net < 0}>
        {#if !hasSpun}
          –
        {:else if lastWin > 0}
          +{lastWin}
        {:else}
          −{bet}
        {/if}
      </dd>
    </div>
    <div>
      <dt>Record</dt>
      <dd class="record">{best ?? "–"}</dd>
    </div>
  </dl>
</div>

<style>
  .hud {
    display: contents;
  }

  .readouts {
    grid-column: 1 / -1;
    display: flex;
    justify-content: space-between;
    margin: 0;
    padding: 6px 10px;
    background: var(--encre);
    border: var(--contour);
  }

  .readouts div {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }

  dt {
    font-size: 0.8rem;
    color: var(--terne);
  }

  dd {
    margin: 0;
    font-size: 1.1rem;
    font-variant-numeric: tabular-nums;
    color: var(--papier);
  }

  .gain {
    color: var(--moutarde);
  }

  .loss {
    color: var(--terne);
  }

  .record {
    color: var(--moutarde);
  }
</style>
