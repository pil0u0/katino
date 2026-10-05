<script lang="ts">
  import { CONFIG } from "../game/config";
  import type { Grid, LineWin } from "../game/engine";
  import Reel from "./Reel.svelte";
  import WinLines from "./WinLines.svelte";
  import WinPopup from "./WinPopup.svelte";

  interface Props {
    grid: Grid;
    wins: LineWin[];
    totalWin: number;
    bet: number;
    spinId: number;
    spinning: boolean;
    onallstopped: (spinId: number) => void;
  }

  let { grid, wins, totalWin, bet, spinId, spinning, onallstopped }: Props =
    $props();

  // Moment d'arrêt de chaque colonne (présentation, pas une règle du jeu)
  const STOP_MS = [600, 800, 1000];

  // Un résultat est « révélé » quand le lancer est résolu (spinId 0 = aucun lancer encore)
  const revealed = $derived(!spinning && spinId > 0);
  const won = $derived(revealed && totalWin > 0);
  const lost = $derived(revealed && totalWin === 0);
  const bigWin = $derived(won && totalWin >= bet * CONFIG.bigWinThreshold);

  // Les gains ne s'affichent qu'une fois le lancer résolu
  const winningCells = $derived(
    won
      ? new Set(
          wins.flatMap((win) => {
            const line = CONFIG.paylines.find((p) => p.id === win.paylineId)!;
            return line.cells.map(([col, row]) => `${col}-${row}`);
          }),
        )
      : new Set<string>(),
  );

  // Compte les colonnes arrêtées pour le lancer en cours
  let countingFor = -1;
  let stoppedCount = 0;

  function handleReelStop(id: number) {
    if (id !== countingFor) {
      countingFor = id;
      stoppedCount = 0;
    }
    stoppedCount++;
    if (stoppedCount === 3) onallstopped(id);
  }
</script>

<div class="machine" class:lost class:shake={bigWin} class:glow={bigWin}>
  <div class="reels">
    {#each [0, 1, 2] as col}
      <Reel
        symbols={grid[col]}
        {spinId}
        {spinning}
        durationMs={STOP_MS[col]}
        onstop={handleReelStop}
      />
    {/each}
  </div>

  <!-- Calque par-dessus les rouleaux pour surligner les cases gagnantes -->
  <div class="overlay" aria-hidden="true">
    {#each [0, 1, 2] as row}
      {#each [0, 1, 2] as col}
        <div class="cell" class:win={winningCells.has(`${col}-${row}`)}></div>
      {/each}
    {/each}
  </div>

  {#if won}
    <WinLines {wins} />
    <WinPopup amount={totalWin} {bet} big={bigWin} />
  {/if}
</div>

<style>
  .machine {
    /* Taille d'une case : 96 px sur ordinateur, plus petite si l'écran est étroit.
       L'espace entre les cases reste proportionnel (8 px pour 96 px),
       pour que tout le reste (lignes, rouleaux) garde les mêmes proportions. */
    --cell: clamp(56px, calc((100vw - 56px) / 3.1667), 96px);
    --gap: calc(var(--cell) / 12);

    position: relative;
    width: fit-content;
    padding: 12px;
    background: #1b1b2f;
    border-radius: 16px;
    transition: box-shadow 0.3s;
  }

  .reels,
  .overlay {
    display: grid;
    grid-template-columns: repeat(3, var(--cell));
    gap: var(--gap);
  }

  .overlay {
    position: absolute;
    inset: 12px;
    grid-template-rows: repeat(3, var(--cell));
    pointer-events: none;
  }

  .cell {
    border-radius: 10px;
    transition:
      box-shadow 0.15s,
      background 0.15s;
  }

  .cell.win {
    background: rgb(245 197 66 / 0.15);
    box-shadow: inset 0 0 0 3px #f5c542;
  }

  /* Perte : la grille se ternit brièvement, sans dramatiser */
  .lost .reels {
    animation: dim 0.45s ease-out;
  }

  @keyframes dim {
    40% {
      filter: brightness(0.6) saturate(0.6);
    }
  }

  /* Gros gain : secousse + halo doré */
  .shake {
    animation: shake 0.45s ease-in-out;
  }

  .glow {
    box-shadow:
      0 0 0 3px #f5c542,
      0 0 40px rgb(245 197 66 / 0.5);
  }

  @keyframes shake {
    15% {
      transform: translate(-6px, 2px) rotate(-1deg);
    }
    30% {
      transform: translate(6px, -2px) rotate(1deg);
    }
    45% {
      transform: translate(-4px, 1px);
    }
    60% {
      transform: translate(4px, -1px);
    }
    80% {
      transform: translate(-2px, 0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .shake {
      animation: none;
    }
  }
</style>
