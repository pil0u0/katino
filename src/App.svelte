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
  import { sfx, setMuted } from "./audio/sfx";
  import RetroWindow from "./ui/RetroWindow.svelte";

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
        color: "var(--phosphore)",
        points,
        width: 3,
      });
    }

    if (previous) {
      const isAlsoBest = previous.id === best?.id;
      series.push({
        label: isAlsoBest ? "Partie précédente (record)" : "Partie précédente",
        color: isAlsoBest ? "var(--moutarde)" : "var(--terne)",
        points: previous.points,
        dashed: true,
      });
    }

    if (best && best.id !== previous?.id) {
      series.push({
        label: isNewRecord ? "Ancien record" : "Meilleure partie",
        color: "var(--moutarde)",
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
      untrack(() => {
        // Le record à battre AVANT d'enregistrer cette partie
        const previousBest = bestGame(history);
        currentRecordId = recordGame(history, game).id;
        if (previousBest && game.credits > previousBest.finalCredits)
          sfx.record();
        else sfx.end();
      });
    }
  });

  // ---- Son ----
  let soundOn = $state(true);

  function toggleSound() {
    soundOn = !soundOn;
    setMuted(!soundOn);
  }

  // Tic-tac des 5 dernières secondes : l'effet se relance quand la seconde affichée change
  const secondsLeft = $derived(Math.ceil(remainingMs / 1000));
  $effect(() => {
    if (
      secondsLeft <= 5 &&
      secondsLeft > 0 &&
      untrack(() => game.phase) === "playing"
    ) {
      sfx.tick(secondsLeft <= 3);
    }
  });

  function handleBet(amount: number) {
    if (amount !== game.bet && setBet(game, amount, CONFIG)) sfx.click();
  }

  function handleStart() {
    now = performance.now();
    startGame(game, now);
    sfx.coin();
  }

  function handleSpin() {
    const t = performance.now();
    if (game.machine === "spinning") {
      // Slam stop : on résout tout de suite, les rouleaux s'arrêtent d'eux-mêmes
      resolveSpin(game, CONFIG, t);
      return;
    }
    if (startSpin(game, CONFIG, t)) sfx.spin();
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
    if (game.phase === "ended" && e.key.toLowerCase() !== "m") return; // l'écran de fin gère ses touches

    // Une LETTRE se teste avec e.key : sur AZERTY, la touche M n'est pas au même endroit qu'en QWERTY
    if (e.key.toLowerCase() === "m") {
      toggleSound();
      return;
    }

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
      handleBet(betAmounts[index]);
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
  <main class="cabinet">
    <!-- Autocollants collés sur la carrosserie : purement décoratifs -->
    <span class="sticker sticker-time" aria-hidden="true">1 MIN</span>
    <span class="sticker sticker-lucky" aria-hidden="true">ラッキー!</span>

    <header class="marquee">
      <span class="jp" aria-hidden="true">カティノ</span>
      <h1>Katino</h1>
    </header>

    <div class="displays">
      <Timer {remainingMs} />
      <Hud
        credits={game.credits}
        bet={game.currentSpin?.bet ?? game.bet}
        lastWin={game.lastWin}
        hasSpun={game.currentSpin !== null && game.machine === "ready"}
        best={overallBest?.finalCredits ?? null}
        playing={game.phase === "playing"}
      />
    </div>

    <SlotMachine
      grid={game.currentSpin?.grid ?? initialGrid}
      wins={game.currentSpin?.wins ?? []}
      totalWin={game.currentSpin?.totalWin ?? 0}
      bet={game.currentSpin?.bet ?? game.bet}
      spinId={game.stats.spins}
      spinning={game.machine === "spinning"}
      onallstopped={handleReelsStopped}
    />

    <div class="deck">
      <BetSelector
        amounts={betAmounts}
        selected={game.bet}
        credits={game.credits}
        disabled={game.phase === "ended"}
        onselect={handleBet}
      />

      {#if game.phase === "menu"}
        <p class="intro">
          60 secondes, 1000 crédits. Faites le meilleur score possible.
        </p>
        <button class="spin" onclick={handleStart}>Commencer</button>
      {:else}
        <button
          class="spin"
          class:stop={game.machine === "spinning"}
          onclick={handleSpin}
          disabled={game.machine !== "spinning" && !canSpin(game)}
        >
          {game.machine === "spinning" ? "Stop" : `Lancer ${game.bet}`}
        </button>
      {/if}
    </div>

    <div class="footer">
      <button class="sound" onclick={toggleSound} aria-pressed={soundOn}>
        Son : {soundOn ? "oui" : "non"}
      </button>
      <p class="hint">
        <kbd>Espace</kbd> lancer · <kbd>1</kbd>–<kbd>4</kbd> mise · <kbd>M</kbd>
        son
      </p>
    </div>
  </main>

  <aside>
    <RetroWindow title="progression.exe">
      <CreditsChart
        series={chartSeries}
        durationMs={CONFIG.durationMs}
        baseline={CONFIG.startingCredits}
      />
    </RetroWindow>
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
    gap: 2rem 3rem;
    max-width: 1100px;
    margin: 0 auto;
    padding: 2rem 1rem;
    /* Les particules et la secousse d'un gros gain ne créent jamais de défilement horizontal */
    overflow-x: clip;
  }

  /* Sur grand écran : la borne à gauche, le graphique à droite */
  @media (min-width: 960px) {
    .layout {
      grid-template-columns: auto minmax(0, 1fr);
      align-items: center;
    }
  }

  aside h2 {
    margin: 0 0 0.75rem;
    font-size: 0.95rem;
    color: var(--phosphore);
  }

  /* ---- La borne ---- */
  .cabinet {
    position: relative;
    justify-self: center;
    /* Largeur fixe : la borne ne « respire » pas quand son contenu change */
    box-sizing: border-box;
    width: min(100%, 24rem);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 0 18px 18px;
    /* Carrosserie bleu riso, imprimée en trame de points */
    background-color: var(--riso);
    background-image: radial-gradient(
      rgb(7 8 42 / 0.28) 1.3px,
      transparent 1.8px
    );
    background-size: 6px 6px;
    border: var(--contour);
    box-shadow: 8px 8px 0 var(--encre);
  }

  /* Bandeau lumineux en haut de la borne, avec un damier dessous */
  .marquee {
    align-self: stretch;
    margin: 0 -18px;
    padding: 12px 18px 18px;
    text-align: center;
    background:
      repeating-conic-gradient(var(--encre) 0 25%, var(--papier) 0 50%) bottom /
        12px 12px repeat-x,
      var(--moutarde);
    border-bottom: var(--contour);
  }

  .jp {
    display: block;
    font-size: 0.85rem;
    color: var(--encre);
    letter-spacing: 0.2em;
  }

  h1 {
    font-family: var(--font-titre);
    font-size: clamp(2rem, 9vw, 2.8rem);
    line-height: 1.05;
    color: var(--papier);
    -webkit-text-stroke: 3px var(--encre);
    paint-order: stroke fill;
    text-shadow: 4px 4px 0 var(--encre);
  }

  .displays {
    align-self: stretch;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 10px;
  }

  .deck {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
  }

  .intro {
    margin: 0;
    max-width: 22rem;
    text-align: center;
    color: var(--papier);
  }

  /* Gros bouton d'arcade : seul élément rond de la borne */
  .spin {
    min-width: 12rem;
    padding: 0.75rem 2rem;
    font-family: var(--font-titre);
    font-size: 1.35rem;
    color: var(--encre);
    background: var(--moutarde);
    border: var(--contour);
    border-radius: 999px;
    box-shadow:
      inset 0 -5px 0 rgb(7 8 42 / 0.25),
      0 6px 0 var(--encre);
    cursor: pointer;
    touch-action: manipulation; /* pas de zoom au double tap sur mobile */
    user-select: none;
  }

  .spin:active:not(:disabled) {
    transform: translateY(4px);
    box-shadow:
      inset 0 -2px 0 rgb(7 8 42 / 0.25),
      0 2px 0 var(--encre);
  }

  .spin.stop {
    background: var(--phosphore);
  }

  .spin:disabled {
    background: var(--terne);
    cursor: not-allowed;
  }

  /* ---- Autocollants ---- */
  .sticker {
    position: absolute;
    z-index: 3;
    padding: 4px 8px;
    font-size: 0.8rem;
    color: var(--encre);
    border: 2px solid var(--encre);
    box-shadow: 2px 2px 0 var(--encre);
    pointer-events: none;
  }

  .sticker-time {
    top: 14px;
    left: 10px;
    background: var(--phosphore);
    transform: rotate(-8deg);
  }

  .sticker-lucky {
    top: 92px;
    right: 6px;
    background: var(--papier);
    transform: rotate(6deg);
  }

  .footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 8px 12px;
    margin-top: -4px;
  }

  .sound {
    padding: 2px 8px;
    font-size: 0.75rem;
    color: var(--phosphore);
    background: var(--encre);
    border: 2px solid var(--encre);
    box-shadow: inset 0 0 0 1px var(--phosphore);
    cursor: pointer;
  }

  .sound[aria-pressed="false"] {
    color: var(--terne);
    box-shadow: inset 0 0 0 1px var(--terne);
  }

  .hint {
    margin: 0;
    font-size: 0.75rem;
    color: var(--papier);
  }

  kbd {
    padding: 0 0.35rem;
    font-family: inherit;
    font-size: 0.75rem;
    background: var(--encre);
    border: 1px solid var(--phosphore);
  }

  /* Petits écrans : borne plus serrée, stickers plus discrets */
  @media (max-width: 420px) {
    .layout {
      padding: 1rem 0.75rem;
    }

    .cabinet {
      padding: 0 10px 14px;
      gap: 12px;
    }

    .marquee {
      margin: 0 -10px;
    }

    .sticker-lucky {
      display: none;
    }
  }

  /* Très petits écrans : le dernier sticker gênerait le titre */
  @media (max-width: 340px) {
    .sticker-time {
      display: none;
    }
  }

  /* Écrans tactiles : pas de clavier, pas d'aide clavier */
  @media (hover: none) {
    .hint {
      display: none;
    }
  }
</style>
