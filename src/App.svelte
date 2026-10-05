<script lang="ts">
  import { CONFIG } from "./game/config";
  import { generateGrid } from "./game/engine";
  import {
    createGame,
    startGame,
    canSpin,
    setBet,
    startSpin,
    resolveSpin,
    tick,
    timeRemaining,
  } from "./game/session";
  import Hud from "./ui/Hud.svelte";
  import Timer from "./ui/Timer.svelte";
  import SlotMachine from "./ui/SlotMachine.svelte";
  import BetSelector from "./ui/BetSelector.svelte";
  import EndScreen from "./ui/EndScreen.svelte";

  let game = $state(createGame(CONFIG));

  // Horloge de l'interface, mise à jour à chaque frame pendant la partie.
  // Le temps restant en est DÉRIVÉ : rien n'est décrémenté.
  let now = $state(performance.now());
  const remainingMs = $derived(timeRemaining(game, CONFIG, now));

  const initialGrid = generateGrid(CONFIG);
  const betAmounts = CONFIG.bets.map((b) => b.amount);

  // Boucle d'horloge : tourne uniquement pendant une partie.
  // L'effet se relance quand game.phase change, et se nettoie tout seul.
  $effect(() => {
    if (game.phase !== "playing") return;

    let frameId: number;
    const loop = (t: number) => {
      now = t;
      tick(game, CONFIG, t);
      if (game.phase === "playing") frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(frameId);
  });

  function handleStart() {
    now = performance.now();
    startGame(game, now);
  }

  function handleSpin() {
    const t = performance.now();
    if (game.machine === "spinning") {
      // Slam stop : on résout tout de suite, les rouleaux s'arrêtent d'eux-mêmes
      resolveSpin(game, CONFIG, t);
      return;
    }
    startSpin(game, CONFIG, t);
  }

  // Appelé quand les 3 colonnes ont fini leur animation
  function handleReelsStopped(spinId: number) {
    if (spinId !== game.stats.spins) return; // événement d'un ancien lancer
    resolveSpin(game, CONFIG, performance.now());
  }

  function handleRestart() {
    game = createGame(CONFIG);
    handleStart(); // on relance directement : rejouer doit être immédiat
  }
</script>

<main>
  <h1>Slot Rush</h1>

  <Timer {remainingMs} />

  <Hud
    credits={game.credits}
    bet={game.bet}
    lastWin={game.lastWin}
    hasSpun={game.currentSpin !== null}
  />

  <SlotMachine
    grid={game.currentSpin?.grid ?? initialGrid}
    wins={game.currentSpin?.wins ?? []}
    spinId={game.stats.spins}
    spinning={game.machine === "spinning"}
    onallstopped={handleReelsStopped}
  />

  <BetSelector
    amounts={betAmounts}
    selected={game.bet}
    credits={game.credits}
    disabled={game.phase === "ended"}
    onselect={(amount) => setBet(game, amount, CONFIG)}
  />

  {#if game.phase === "menu"}
    <div class="intro">
      <p>60 secondes. 1000 crédits. Faites le meilleur score possible.</p>
      <button class="spin" onclick={handleStart}>Commencer</button>
    </div>
  {:else}
    <button
      class="spin"
      onclick={handleSpin}
      disabled={game.machine !== "spinning" && !canSpin(game)}
    >
      {game.machine === "spinning" ? "Stop" : `Lancer (${game.bet})`}
    </button>
  {/if}
</main>

{#if game.phase === "ended" && game.endReason}
  <EndScreen
    credits={game.credits}
    startingCredits={CONFIG.startingCredits}
    reason={game.endReason}
    stats={game.stats}
    onrestart={handleRestart}
  />
{/if}

<style>
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    padding: 2rem 1rem;
  }

  .spin {
    font-size: 1.25rem;
    font-weight: 700;
    padding: 0.75rem 3rem;
    border: none;
    border-radius: 999px;
    background: #f5c542;
    color: #1b1b2f;
    cursor: pointer;
  }

  .spin:active {
    transform: scale(0.96);
  }

  .spin:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .intro {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  .intro p {
    margin: 0;
    opacity: 0.8;
  }
</style>
