<script lang="ts">
  import { CONFIG } from "../game/config";
  import type { Grid, LineWin } from "../game/engine";
  import Reel from "./Reel.svelte";

  interface Props {
    grid: Grid;
    wins: LineWin[];
    spinId: number;
    spinning: boolean;
    onallstopped: (spinId: number) => void;
  }

  let { grid, wins, spinId, spinning, onallstopped }: Props = $props();

  // Moment d'arrêt de chaque colonne (présentation, pas une règle du jeu)
  const STOP_MS = [600, 800, 1000];

  // Les gains ne s'affichent qu'une fois le lancer résolu
  const winningCells = $derived(
    spinning
      ? new Set<string>()
      : new Set(
          wins.flatMap((win) => {
            const line = CONFIG.paylines.find((p) => p.id === win.paylineId)!;
            return line.cells.map(([col, row]) => `${col}-${row}`);
          }),
        ),
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

<div class="machine">
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
</div>

<style>
  .machine {
    position: relative;
    padding: 12px;
    background: #1b1b2f;
    border-radius: 16px;
  }

  .reels,
  .overlay {
    display: grid;
    grid-template-columns: repeat(3, 96px);
    gap: 8px;
  }

  .overlay {
    position: absolute;
    inset: 12px;
    grid-template-rows: repeat(3, 96px);
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
</style>
