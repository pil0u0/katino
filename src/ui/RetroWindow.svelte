<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    title: string; // affiché dans la barre de titre, façon nom de programme
    children: Snippet; // le contenu de la fenêtre
  }

  let { title, children }: Props = $props();
</script>

<section class="window" aria-label={title}>
  <header class="titlebar">
    <span class="title">{title}</span>
    <!-- Boutons décoratifs, comme sur un vieux bureau : ils ne font rien -->
    <span class="controls" aria-hidden="true">
      <i>_</i><i>□</i><i>×</i>
    </span>
  </header>
  <div class="body">
    {@render children()}
  </div>
</section>

<style>
  .window {
    /* Cadre en relief : clair en haut à gauche, sombre en bas à droite */
    padding: 3px;
    background: var(--papier);
    border: 2px solid;
    border-color: #ffffff var(--encre) var(--encre) #ffffff;
    box-shadow: 6px 6px 0 var(--encre);
  }

  .titlebar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 3px 4px 3px 8px;
    color: var(--papier);
    background-color: var(--riso);
    background-image: radial-gradient(rgb(7 8 42 / 0.3) 1px, transparent 1.4px);
    background-size: 4px 4px;
  }

  .title {
    font-size: 0.9rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .controls {
    display: flex;
    gap: 2px;
  }

  .controls i {
    display: grid;
    place-items: center;
    width: 18px;
    height: 16px;
    font-style: normal;
    font-size: 0.75rem;
    line-height: 1;
    color: var(--encre);
    background: var(--papier);
    border: 2px solid;
    border-color: #ffffff var(--encre) var(--encre) #ffffff;
  }

  /* Zone de contenu : un petit écran sombre creusé dans la fenêtre */
  .body {
    position: relative;
    margin-top: 3px;
    background: var(--encre);
    border: 2px solid;
    border-color: var(--encre) #ffffff #ffffff var(--encre);
  }

  /* Lignes de balayage, comme sur l'écran de la borne */
  .body::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: repeating-linear-gradient(
      to bottom,
      rgb(7 8 42 / 0.25) 0 1px,
      transparent 1px 3px
    );
  }
</style>
