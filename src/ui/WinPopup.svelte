<script lang="ts">
  interface Props {
    amount: number;
    bet: number;
    big: boolean;
  }

  let { amount, bet, big }: Props = $props();

  // Multiplicateur réel du lancer : 1 décimale seulement si nécessaire (×6.6, ×4)
  const multiplier = $derived(
    amount % bet === 0 ? String(amount / bet) : (amount / bet).toFixed(1),
  );

  // Particules du gros gain : angles répartis, distances légèrement aléatoires
  const particles = Array.from({ length: 18 }, (_, i) => ({
    angle: (i / 18) * 360,
    distance: 110 + Math.random() * 70,
    delay: Math.random() * 120,
  }));
</script>

<div class="popup" class:big aria-live="polite">
  {#if big}
    <span class="label">Gros gain !</span>
  {/if}
  <span class="amount">+{amount}</span>
  <span class="mult">×{multiplier}</span>

  {#if big}
    <div class="burst" aria-hidden="true">
      {#each particles as p}
        <i
          style="--angle: {p.angle}deg; --distance: {p.distance}px; animation-delay: {p.delay}ms"
        ></i>
      {/each}
    </div>
  {/if}
</div>

<style>
  .popup {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    pointer-events: none; /* n'empêche jamais de relancer */
    animation: pop 1s ease-out forwards;
  }

  /* Contour épais + couleurs qui « bavent » (cyan à gauche, magenta à droite) comme sur un tube */
  .amount {
    font-family: var(--font-titre);
    font-size: clamp(1.8rem, 9vw, 2.6rem);
    font-variant-numeric: tabular-nums;
    color: var(--moutarde);
    -webkit-text-stroke: 2px var(--encre);
    paint-order: stroke fill;
    text-shadow:
      -3px 0 0 rgb(159 240 255 / 0.85),
      3px 0 0 rgb(255 79 216 / 0.7),
      0 4px 0 var(--encre);
  }

  .mult {
    padding: 0 6px;
    font-family: var(--font-ui);
    font-size: 1.1rem;
    color: var(--encre);
    background: var(--phosphore);
    border: 2px solid var(--encre);
  }

  .label {
    padding: 2px 8px;
    font-family: var(--font-ui);
    font-size: 1rem;
    color: var(--encre);
    background: var(--moutarde);
    border: 2px solid var(--encre);
    transform: rotate(-4deg);
  }

  .big {
    animation: pop-big 1.8s ease-out forwards;
  }

  .big .amount {
    font-size: clamp(2.2rem, 11vw, 3.6rem);
    -webkit-text-stroke: 3px var(--encre);
    text-shadow:
      -4px 0 0 rgb(159 240 255 / 0.9),
      4px 0 0 rgb(255 79 216 / 0.8),
      0 5px 0 var(--encre);
  }

  .big .mult {
    font-size: 1.6rem;
  }

  /* Petit gain : apparaît, monte légèrement, disparaît */
  @keyframes pop {
    0% {
      opacity: 0;
      transform: scale(0.6);
    }
    15% {
      opacity: 1;
      transform: scale(1.1);
    }
    25% {
      transform: scale(1);
    }
    75% {
      opacity: 1;
      transform: translateY(-10px);
    }
    100% {
      opacity: 0;
      transform: translateY(-30px);
    }
  }

  /* Gros gain : arrivée plus marquée, reste plus longtemps */
  @keyframes pop-big {
    0% {
      opacity: 0;
      transform: scale(0.3) rotate(-8deg);
    }
    12% {
      opacity: 1;
      transform: scale(1.25) rotate(3deg);
    }
    22% {
      transform: scale(1) rotate(0);
    }
    85% {
      opacity: 1;
      transform: scale(1);
    }
    100% {
      opacity: 0;
      transform: scale(1.1);
    }
  }

  .burst {
    position: absolute;
    top: 50%;
    left: 50%;
  }

  .burst i {
    position: absolute;
    width: 10px;
    height: 10px;
    margin: -5px;
    background: var(--moutarde);
    border: 2px solid var(--encre);
    animation: burst 0.9s cubic-bezier(0.2, 0.8, 0.3, 1) forwards;
  }

  .burst i:nth-child(3n) {
    background: var(--phosphore);
  }

  .burst i:nth-child(3n + 1) {
    background: var(--papier);
  }

  @keyframes burst {
    0% {
      opacity: 1;
      transform: rotate(var(--angle)) translateX(0) scale(1);
    }
    100% {
      opacity: 0;
      transform: rotate(var(--angle)) translateX(var(--distance)) scale(0.4);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .popup,
    .big {
      animation-name: fade;
    }

    .burst {
      display: none;
    }

    @keyframes fade {
      0%,
      80% {
        opacity: 1;
      }
      100% {
        opacity: 0;
      }
    }
  }
</style>
