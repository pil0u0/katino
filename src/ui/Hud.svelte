<script lang="ts">
  import { Tween } from "svelte/motion";
  import { cubicOut } from "svelte/easing";

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

<div class="hud">
  <div class="stat">
    <span class="label">Crédits</span>
    <span class="value" class:beating={beatingRecord}>
      {Math.round(shownCredits.current)}</span
    >
  </div>
  <div class="stat">
    <span class="label">Dernier lancer</span>
    <span
      class="value"
      class:gain={hasSpun && net > 0}
      class:loss={hasSpun && net < 0}
    >
      {#if !hasSpun}
        –
      {:else if lastWin > 0}
        +{lastWin}
      {:else}
        −{bet}
      {/if}
    </span>
  </div>
  <div class="stat">
    <span class="label">Record</span>
    <span class="value record">{best ?? "–"}</span>
  </div>
</div>

<style>
  .hud {
    display: flex;
    gap: 1.5rem;
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 7rem;
  }

  .label {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    opacity: 0.6;
  }

  .value {
    font-size: 2rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    transition: color 0.3s;
  }

  .gain {
    color: #4ade80;
  }

  .loss {
    color: #9ca3af;
  }

  .record {
    color: #f5c542;
  }

  /* Petits écrans : les trois statistiques doivent tenir sur une ligne */
  @media (max-width: 420px) {
    .hud {
      gap: 0.5rem;
    }

    .stat {
      min-width: 4.5rem;
    }

    .label {
      font-size: 0.65rem;
    }

    .value {
      font-size: 1.5rem;
    }
  }

  /* Au-dessus du record : les crédits passent en doré */
  .beating {
    color: #f5c542;
    text-shadow: 0 0 14px rgb(245 197 66 / 0.6);
  }
</style>
