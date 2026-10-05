<script lang="ts">
  interface Props {
    amounts: number[];
    selected: number;
    credits: number;
    disabled: boolean;
    onselect: (amount: number) => void;
  }

  let { amounts, selected, credits, disabled, onselect }: Props = $props();
</script>

<div class="bets" role="radiogroup" aria-label="Mise">
  {#each amounts as amount}
    <button
      role="radio"
      aria-checked={amount === selected}
      class:selected={amount === selected}
      disabled={disabled || amount > credits}
      onclick={() => onselect(amount)}
    >
      {amount}
    </button>
  {/each}
</div>

<style>
  .bets {
    display: flex;
    gap: 0.5rem;
  }

  button {
    min-width: 4rem;
    padding: 0.5rem 0.75rem;
    font-size: 1rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: #f1f1f1;
    background: #2a2a45;
    border: 2px solid transparent;
    border-radius: 10px;
    cursor: pointer;
  }

  button.selected {
    border-color: #f5c542;
    color: #f5c542;
  }

  button:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  /* Petits écrans : quatre boutons sur une ligne */
  @media (max-width: 420px) {
    button {
      min-width: 3.25rem;
      padding: 0.5rem;
    }
  }
</style>
