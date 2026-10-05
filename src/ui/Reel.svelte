<script lang="ts">
  import { tick, untrack } from "svelte";
  import { CONFIG, type SymbolId } from "../game/config";
  import { pickWeighted } from "../game/rng";

  interface Props {
    symbols: SymbolId[]; // les 3 symboles finaux de la colonne, de haut en bas
    spinId: number; // change à chaque nouveau lancer
    spinning: boolean; // false pendant un lancer = arrêt forcé (slam stop, fin du temps)
    durationMs: number; // durée de rotation de cette colonne
    onstop: (spinId: number) => void; // appelé quand la colonne est arrêtée
  }

  let { symbols, spinId, spinning, durationMs, onstop }: Props = $props();

  /** Pas entre deux symboles (case + espace), mesuré dans la page : il varie selon l'écran */
  function measureStep(): number {
    const first = stripEl.firstElementChild as HTMLElement;
    const gap = parseFloat(getComputedStyle(stripEl).rowGap) || 0;
    return first.getBoundingClientRect().height + gap;
  }

  const icons = Object.fromEntries(
    CONFIG.symbols.map((s) => [s.id, s.icon]),
  ) as Record<SymbolId, string>;

  const randomSymbol = () => pickWeighted(CONFIG.symbols).id;

  // La bande contient toujours un symbole « tampon » en index 0, au-dessus de la zone visible.
  // C'est lui qu'on aperçoit pendant le rebond. Au repos : [tampon, s0, s1, s2].
  let strip = $state<SymbolId[]>([randomSymbol(), ...untrack(() => symbols)]);

  let stripEl: HTMLDivElement;
  let reelEl: HTMLDivElement;
  let anim: Animation | null = null;
  let lastSpinId = untrack(() => spinId);

  // Nouveau lancer → nouvelle animation
  $effect(() => {
    const id = spinId; // seule dépendance suivie
    if (id === lastSpinId) return;
    lastSpinId = id;

    untrack(() => {
      if (spinning) {
        spinTo(id, symbols);
      } else {
        // Changement sans lancer (nouvelle partie) : on affiche directement
        anim?.cancel();
        anim = null;
        strip = [randomSymbol(), ...symbols];
      }
    });
  });

  // Arrêt forcé : le jeu a résolu le lancer avant la fin de l'animation
  $effect(() => {
    if (!spinning && anim) anim.finish();
  });

  async function spinTo(id: number, finalSymbols: SymbolId[]) {
    anim?.cancel();

    // Plus la colonne tourne longtemps, plus la bande est longue : vitesse constante
    const fillerCount = Math.round(durationMs / 45);
    const previous = strip.slice(1, 4);
    const filler = Array.from({ length: fillerCount }, randomSymbol);

    // Les symboles défilent vers le bas : le résultat est en HAUT de la bande,
    // les symboles actuellement visibles en BAS. On part du bas et on remonte.
    strip = [randomSymbol(), ...finalSymbols, ...filler, ...previous];
    await tick(); // attendre que le DOM contienne la nouvelle bande

    const step = measureStep();
    const overshoot = step * 0.135; // dépassement avant le rebond (14 px pour une case de 96 px)
    const startY = -(strip.length - 3) * step;
    const endY = -step;

    const a = stripEl.animate(
      [
        {
          transform: `translateY(${startY}px)`,
          easing: "cubic-bezier(.25, .55, .35, 1)",
        },
        {
          transform: `translateY(${endY + overshoot}px)`,
          offset: 0.88,
          easing: "ease-out",
        },
        { transform: `translateY(${endY}px)` },
      ],
      { duration: durationMs, fill: "forwards" },
    );
    anim = a;

    a.onfinish = () => {
      if (anim !== a) return; // animation remplacée entre-temps : on ignore

      // On réduit la bande à l'état de repos (même rendu visuel, DOM plus léger)
      strip = [strip[0], ...finalSymbols];
      a.cancel();
      anim = null;

      // Petit flash : chaque colonne « claque » en s'arrêtant
      reelEl.animate(
        [{ filter: "brightness(1.5)" }, { filter: "brightness(1)" }],
        { duration: 220, easing: "ease-out" },
      );

      onstop(id);
    };
  }
</script>

<div class="reel" bind:this={reelEl}>
  <div class="strip" bind:this={stripEl}>
    {#each strip as symbol, i (i)}
      <div class="symbol">{icons[symbol]}</div>
    {/each}
  </div>
</div>

<style>
  /* --cell et --gap viennent de SlotMachine */
  .reel {
    height: calc(var(--cell) * 3 + var(--gap) * 2);
    overflow: hidden;
    border-radius: 10px;
  }

  .strip {
    display: flex;
    flex-direction: column;
    gap: var(--gap);
    /* position de repos : le tampon est caché, une case plus haut */
    transform: translateY(calc(-1 * (var(--cell) + var(--gap))));
    will-change: transform;
  }

  .symbol {
    display: grid;
    place-items: center;
    flex: 0 0 var(--cell);
    font-size: calc(var(--cell) / 2);
    background: #2a2a45;
    border-radius: 10px;
  }
</style>
