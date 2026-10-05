<script lang="ts">
  import { CONFIG } from "../game/config";
  import type { LineWin } from "../game/engine";

  interface Props {
    wins: LineWin[];
  }

  let { wins }: Props = $props();

  const CELL = 96;
  const GAP = 8;
  const SIZE = CELL * 3 + GAP * 2; // 304 px
  const EXTEND = 30; // la ligne dépasse un peu des cases

  /** Centre d'une case, en pixels dans la grille */
  const center = (i: number) => i * (CELL + GAP) + CELL / 2;

  // Pour chaque ligne gagnante : segment de la 1re à la 3e case, prolongé aux deux bouts
  const segments = $derived(
    wins.map((win) => {
      const line = CONFIG.paylines.find((p) => p.id === win.paylineId)!;
      const [c0, r0] = line.cells[0];
      const [c2, r2] = line.cells[2];
      const x1 = center(c0),
        y1 = center(r0),
        x2 = center(c2),
        y2 = center(r2);
      const len = Math.hypot(x2 - x1, y2 - y1);
      const dx = ((x2 - x1) / len) * EXTEND;
      const dy = ((y2 - y1) / len) * EXTEND;
      return {
        id: win.paylineId,
        x1: x1 - dx,
        y1: y1 - dy,
        x2: x2 + dx,
        y2: y2 + dy,
      };
    }),
  );
</script>

<svg viewBox="0 0 {SIZE} {SIZE}" aria-hidden="true">
  {#each segments as s, i (s.id)}
    <line
      x1={s.x1}
      y1={s.y1}
      x2={s.x2}
      y2={s.y2}
      pathLength="1"
      style="animation-delay: {i * 120}ms"
    />
  {/each}
</svg>

<style>
  svg {
    position: absolute;
    top: 12px;
    left: 12px;
    /* Même taille que la zone des rouleaux : le viewBox de 304 s'adapte tout seul */
    width: calc(var(--cell) * 3 + var(--gap) * 2);
    height: calc(var(--cell) * 3 + var(--gap) * 2);
    overflow: visible;
    pointer-events: none;
  }

  line {
    stroke: #f5c542;
    stroke-width: 6;
    stroke-linecap: round;
    filter: drop-shadow(0 0 6px rgb(245 197 66 / 0.8));
    /* pathLength="1" : longueur normalisée, le tracé va de 1 (caché) à 0 (complet) */
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    animation: draw 0.3s ease-out forwards;
  }

  @keyframes draw {
    to {
      stroke-dashoffset: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    line {
      animation: none;
      stroke-dashoffset: 0;
    }
  }
</style>
