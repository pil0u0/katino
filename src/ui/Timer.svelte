<script lang="ts">
  interface Props {
    remainingMs: number;
  }

  let { remainingMs }: Props = $props();

  const seconds = $derived(Math.ceil(remainingMs / 1000));
  const label = $derived(
    `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`,
  );
</script>

<div
  class="timer"
  class:warning={seconds <= 10 && seconds > 3}
  class:critical={seconds <= 3 && seconds > 0}
  role="timer"
  aria-live="off"
>
  {label}
</div>

<style>
  .timer {
    font-size: 3rem;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.04em;
    line-height: 1;
    transition: color 0.3s;
  }

  .warning {
    color: #f87171;
    animation: pulse 1s ease-in-out infinite;
  }

  .critical {
    color: #ef4444;
    animation: pulse 0.4s ease-in-out infinite;
  }

  @keyframes pulse {
    50% {
      transform: scale(1.08);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .warning,
    .critical {
      animation: none;
    }
  }
</style>
