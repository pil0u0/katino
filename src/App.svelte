<script lang="ts">
  import { untrack } from "svelte";
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
    elapsed,
  } from "./game/session";
  import {
    createHistory,
    recordGame,
    bestGame,
    previousGame,
  } from "./game/history";
  import Hud from "./ui/Hud.svelte";
  import Timer from "./ui/Timer.svelte";
  import SlotMachine from "./ui/SlotMachine.svelte";
  import BetSelector from "./ui/BetSelector.svelte";
  import EndScreen from "./ui/EndScreen.svelte";
  import CreditsChart, { type ChartSeries } from "./ui/CreditsChart.svelte";

  let game = $state(createGame(CONFIG));

  // Historique de la session : vit en mémoire, disparaît à la fermeture de la page
  let history = $state(createHistory());

  // Identifiant de la partie actuelle dans l'historique, une fois terminée
  let currentRecordId = $state<number | null>(null);

  // Horloge de l'interface, mise à jour à chaque frame pendant la partie.
  // Le temps restant en est DÉRIVÉ : rien n'est décrémenté.
  let now = $state(performance.now());
  const remainingMs = $derived(timeRemaining(game, CONFIG, now));

  // ---- Comparaison avec les autres parties ----
  // Quand la partie est finie, elle est déjà dans l'historique :
  // on l'exclut pour la comparer aux AUTRES parties.
  const excludeId = $derived(game.phase === "ended" ? currentRecordId : null);
  const previous = $derived(previousGame(history, excludeId));
  const best = $derived(bestGame(history, excludeId)); // le record à battre
  const overallBest = $derived(bestGame(history)); // le record affiché dans le HUD
  const isNewRecord = $derived(
    game.phase === "ended" && best !== null && game.credits > best.finalCredits,
  );

  // Le graphique n'a pas besoin de 60 images par seconde : 4 mises à jour par seconde suffisent
  const chartElapsed = $derived(
    Math.floor(elapsed(game, CONFIG, now) / 250) * 250,
  );

  const chartSeries = $derived.by((): ChartSeries[] => {
    const series: ChartSeries[] = [];

    if (game.phase !== "menu") {
      const points = [...game.points];
      // Pendant la partie, on prolonge la courbe jusqu'à « maintenant »
      const last = points.at(-1);
      if (game.phase === "playing" && last) {
        points.push({
          t: Math.max(last.t, chartElapsed),
          credits: game.credits,
        });
      }
      series.push({
        label: "Partie actuelle",
        color: "#38bdf8",
        points,
        width: 3,
      });
    }

    if (previous) {
      const isAlsoBest = previous.id === best?.id;
      series.push({
        label: isAlsoBest ? "Partie précédente (record)" : "Partie précédente",
        color: isAlsoBest ? "#f5c542" : "#9ca3af",
        points: previous.points,
        dashed: true,
      });
    }

    if (best && best.id !== previous?.id) {
      series.push({
        label: isNewRecord ? "Ancien record" : "Meilleure partie",
        color: "#f5c542",
        points: best.points,
      });
    }

    return series;
  });

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

  // Enregistrement de la partie dès qu'elle se termine, quelle que soit la raison
  // (fin du temps dans la boucle, faillite pendant une résolution…). Une seule fois.
  $effect(() => {
    if (game.phase === "ended" && currentRecordId === null) {
      currentRecordId = untrack(() => recordGame(history, game).id);
    }
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

  // Raccourcis clavier : Espace / Entrée pour lancer ou arrêter, 1 à 4 pour la mise
  const BET_KEYS = ["Digit1", "Digit2", "Digit3", "Digit4"];
  const NUMPAD_KEYS = ["Numpad1", "Numpad2", "Numpad3", "Numpad4"];

  function handleKeydown(e: KeyboardEvent) {
    if (e.repeat) return; // maintenir la touche ne déclenche qu'une action
    if (game.phase === "ended") return; // l'écran de fin gère ses propres touches

    if (e.code === "Space" || e.code === "Enter") {
      e.preventDefault(); // empêche aussi le bouton qui a le focus de recevoir un « clic » en plus
      if (game.phase === "menu") handleStart();
      else handleSpin();
      return;
    }

    // e.code désigne la touche PHYSIQUE : fonctionne aussi sur un clavier AZERTY sans Maj
    const index = Math.max(
      BET_KEYS.indexOf(e.code),
      NUMPAD_KEYS.indexOf(e.code),
    );
    if (index >= 0 && index < betAmounts.length) {
      setBet(game, betAmounts[index], CONFIG);
    }
  }

  function handleRestart() {
    game = createGame(CONFIG);
    currentRecordId = null;
    handleStart(); // on relance directement : rejouer doit être immédiat
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="layout">
  <main>
    <h1>Slot Rush</h1>

    <Timer {remainingMs} />

    <Hud
      credits={game.credits}
      bet={game.currentSpin?.bet ?? game.bet}
      lastWin={game.lastWin}
      hasSpun={game.currentSpin !== null && game.machine === "ready"}
      best={overallBest?.finalCredits ?? null}
      playing={game.phase === "playing"}
    />

    <SlotMachine
      grid={game.currentSpin?.grid ?? initialGrid}
      wins={game.currentSpin?.wins ?? []}
      totalWin={game.currentSpin?.totalWin ?? 0}
      bet={game.currentSpin?.bet ?? game.bet}
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

    <p class="hint">
      <kbd>Espace</kbd> lancer / arrêter · <kbd>1</kbd>–<kbd>4</kbd> choisir la mise
    </p>
  </main>

  <aside>
    <h2>Progression</h2>
    <CreditsChart
      series={chartSeries}
      durationMs={CONFIG.durationMs}
      baseline={CONFIG.startingCredits}
    />
  </aside>
</div>

{#if game.phase === "ended" && game.endReason}
  <EndScreen
    credits={game.credits}
    startingCredits={CONFIG.startingCredits}
    reason={game.endReason}
    stats={game.stats}
    previousCredits={previous?.finalCredits ?? null}
    recordToBeat={best?.finalCredits ?? null}
    {isNewRecord}
    onrestart={handleRestart}
  />
{/if}

<style>
  .layout {
    display: grid;
    /* minmax(0, 1fr) : la colonne ne peut jamais dépasser la largeur de l'écran */
    grid-template-columns: minmax(0, 1fr);
    gap: 1rem 3rem;
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 1rem 2rem;
  }

  /* Sur grand écran : le jeu à gauche, le graphique à droite */
  @media (min-width: 960px) {
    .layout {
      grid-template-columns: auto minmax(0, 1fr);
      align-items: center;
    }
  }

  aside h2 {
    margin: 0 0 0.75rem;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    opacity: 0.6;
  }

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
    touch-action: manipulation; /* pas de zoom au double tap sur mobile */
    user-select: none;
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
    text-align: center;
    opacity: 0.8;
  }

  .hint {
    margin: -0.5rem 0 0;
    font-size: 0.8rem;
    opacity: 0.5;
  }

  kbd {
    padding: 0.1rem 0.35rem;
    font-family: inherit;
    font-size: 0.75rem;
    border: 1px solid rgb(255 255 255 / 0.3);
    border-radius: 4px;
  }

  /* Petits écrans : la page a déjà une marge sur les côtés, main n'en ajoute pas */
  @media (max-width: 420px) {
    main {
      gap: 1.25rem;
      padding: 1.5rem 0;
    }
  }

  /* Écrans tactiles : pas de clavier, pas d'aide clavier */
  @media (hover: none) {
    .hint {
      display: none;
    }
  }
</style>
