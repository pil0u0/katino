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

  .amount {
    font-size: 3rem;
    font-weight: 900;
    font-variant-numeric: tabular-nums;
    color: #4ade80;
    text-shadow:
      0 2px 0 #10101e,
      0 0 18px rgb(74 222 128 / 0.6);
  }

  .mult {
    font-size: 1.1rem;
    font-weight: 800;
    color: #f1f1f1;
    text-shadow: 0 1px 0 #10101e;
  }

  .label {
    font-size: 1rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: #f5c542;
    text-shadow: 0 1px 0 #10101e;
  }

  .big {
    animation: pop-big 1.8s ease-out forwards;
  }

  .big .amount {
    font-size: 4.5rem;
    color: #f5c542;
    text-shadow:
      0 3px 0 #10101e,
      0 0 28px rgb(245 197 66 / 0.8);
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
    border-radius: 50%;
    background: #f5c542;
    animation: burst 0.9s cubic-bezier(0.2, 0.8, 0.3, 1) forwards;
  }

  .burst i:nth-child(3n) {
    background: #4ade80;
  }

  .burst i:nth-child(3n + 1) {
    background: #f87171;
    border-radius: 2px;
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
