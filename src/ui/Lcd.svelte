<script lang="ts">
  interface Props {
    label: string;
    value: string; // ce qui est affiché, en chiffres (et « : » pour le chrono)
    ghost: string; // segments éteints derrière, ex. « 88:88 »
    tone?: "normal" | "gold" | "warning" | "critical";
    large?: boolean; // grande version, pour le score final
  }

  let { label, value, ghost, tone = "normal", large = false }: Props = $props();
</script>

<div class="lcd {tone}" class:large>
  <span class="label">{label}</span>
  <div class="screen">
    <!-- Les segments éteints, comme sur un vrai afficheur -->
    <span class="ghost" aria-hidden="true">{ghost}</span>
    <span class="value">{value}</span>
  </div>
</div>

<style>
  .lcd {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .label {
    font-size: 0.8rem;
    color: var(--phosphore);
  }

  .screen {
    position: relative;
    display: grid;
    justify-items: end;
    padding: 8px 10px;
    background: var(--encre);
    border: var(--contour);
    box-shadow: inset 0 0 0 2px var(--riso);
    font-family: var(--font-lcd);
    font-size: clamp(1.2rem, 6.5vw, 1.9rem);
    line-height: 1;
  }

  .large .screen {
    padding: 12px 14px;
    font-size: clamp(2rem, 11vw, 3rem);
  }

  .ghost,
  .value {
    grid-area: 1 / 1;
  }

  .ghost {
    color: rgb(159 240 255 / 0.08);
  }

  .value {
    color: var(--phosphore);
    text-shadow: 0 0 8px rgb(159 240 255 / 0.55);
    transition: color 0.2s;
  }

  .gold .value {
    color: var(--moutarde);
    text-shadow: 0 0 8px rgb(240 196 25 / 0.6);
  }

  .warning .value {
    color: var(--alarme);
    text-shadow: 0 0 8px rgb(255 79 109 / 0.6);
  }

  .critical .value {
    color: var(--alarme);
    text-shadow: 0 0 10px rgb(255 79 109 / 0.8);
    animation: blink 0.5s steps(2, jump-none) infinite;
  }

  @keyframes blink {
    50% {
      opacity: 0.25;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .critical .value {
      animation: none;
    }
  }
</style>
