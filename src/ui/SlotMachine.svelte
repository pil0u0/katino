<script lang="ts">
  import { untrack } from "svelte";
  import { CONFIG } from "../game/config";
  import { sfx } from "../audio/sfx";
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
    sfx.reelStop(stoppedCount);
    stoppedCount++;
    if (stoppedCount === 3) onallstopped(id);
  }

  // Son du résultat : joué une fois, au moment où le lancer est révélé
  let wasRevealed = false;
  $effect(() => {
    const now = revealed; // seule dépendance suivie
    if (now && !wasRevealed) {
      untrack(() => {
        if (bigWin) sfx.bigWin();
        else if (won) sfx.win(wins.length);
        else sfx.lose();
      });
    }
    wasRevealed = now;
  });
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
    --cell: clamp(56px, calc((100vw - 88px) / 3.1667), 96px);
    --gap: calc(var(--cell) / 12);

    position: relative;
    width: fit-content;
    padding: 12px;
    /* Le cadre de l'écran : épais, sombre, avec un liseré bleu */
    background: var(--encre);
    border: var(--contour);
    box-shadow:
      inset 0 0 0 3px var(--riso),
      var(--ombre-dure);
  }

  /* Effet CRT, uniquement sur l'écran : lignes de balayage + coins assombris */
  .machine::after {
    content: "";
    position: absolute;
    inset: 12px;
    pointer-events: none;
    background: repeating-linear-gradient(
        to bottom,
        rgb(7 8 42 / 0.18) 0 1px,
        transparent 1px 3px
      ),
      radial-gradient(
        ellipse at center,
        transparent 60%,
        rgb(7 8 42 / 0.45) 100%
      );
    z-index: 2;
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
    z-index: 1;
  }

  .cell {
    transition: box-shadow 0.12s;
  }

  .cell.win {
    box-shadow:
      inset 0 0 0 4px var(--moutarde),
      inset 0 0 0 6px var(--encre);
    animation: blink-win 0.5s steps(2, jump-none) 3;
  }

  @keyframes blink-win {
    50% {
      box-shadow: inset 0 0 0 4px var(--encre);
    }
  }

  /* Perte : l'écran « décroche » une fraction de seconde, comme un vieux tube */
  .lost .reels {
    animation: flicker 0.35s steps(3, jump-none);
  }

  @keyframes flicker {
    33% {
      filter: brightness(0.55) contrast(1.3);
      transform: translateX(-2px);
    }
    66% {
      filter: brightness(0.8);
      transform: translateX(1px);
    }
  }

  /* Gros gain : secousse + cadre qui passe en moutarde */
  .shake {
    animation: shake 0.45s steps(6, jump-none);
  }

  .glow {
    box-shadow:
      inset 0 0 0 3px var(--moutarde),
      0 0 0 3px var(--moutarde),
      var(--ombre-dure);
  }

  @keyframes shake {
    15% {
      transform: translate(-6px, 2px);
    }
    30% {
      transform: translate(6px, -2px);
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
    .shake,
    .lost .reels,
    .cell.win {
      animation: none;
    }
  }
</style>
