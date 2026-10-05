<script lang="ts">
  interface Props {
    credits: number;
    bet: number;
    lastWin: number;
    hasSpun: boolean;
  }

  let { credits, bet, lastWin, hasSpun }: Props = $props();

  // Résultat net du dernier lancer : gain moins mise
  const net = $derived(lastWin - bet);
</script>

<div class="hud">
  <div class="stat">
    <span class="label">Crédits</span>
    <span class="value">{credits}</span>
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
        0
      {/if}
    </span>
  </div>
</div>

<style>
  .hud {
    display: flex;
    gap: 2rem;
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 8rem;
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
  }

  .gain {
    color: #4ade80;
  }

  .loss {
    color: #9ca3af;
  }
</style>
