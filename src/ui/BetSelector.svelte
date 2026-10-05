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
    gap: 8px;
  }

  button {
    min-width: 3.6rem;
    padding: 0.45rem 0.6rem;
    font-family: var(--font-lcd);
    font-size: 0.95rem;
    color: var(--phosphore);
    background: var(--encre);
    border: var(--contour);
    box-shadow:
      inset 0 0 0 2px var(--riso),
      3px 3px 0 var(--encre);
    cursor: pointer;
  }

  /* Touche enfoncée : elle descend, l'ombre disparaît */
  button:active:not(:disabled) {
    transform: translate(3px, 3px);
    box-shadow: inset 0 0 0 2px var(--riso);
  }

  button.selected {
    color: var(--encre);
    background: var(--moutarde);
    box-shadow:
      inset 0 0 0 2px #fff6c8,
      3px 3px 0 var(--encre);
  }

  button:disabled {
    color: rgb(159 240 255 / 0.3);
    box-shadow: inset 0 0 0 2px rgb(59 59 214 / 0.4);
    cursor: not-allowed;
  }

  /* Petits écrans : quatre boutons sur une ligne */
  @media (max-width: 420px) {
    button {
      min-width: 3.1rem;
      padding: 0.45rem 0.4rem;
      font-size: 0.85rem;
    }
  }
</style>
