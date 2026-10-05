<script lang="ts">
  import type { SymbolId } from "../game/config";
  import { SYMBOL_VISUALS } from "./symbols";

  interface Props {
    id: SymbolId;
  }

  let { id }: Props = $props();

  const visual = $derived(SYMBOL_VISUALS[id]);
</script>

{#if visual.image}
  <img src={visual.image} alt={visual.label} draggable="false" />
{:else}
  <span role="img" aria-label={visual.label}>{visual.fallback}</span>
{/if}

<style>
  img {
    width: 78%;
    height: 78%;
    object-fit: contain;
    user-select: none;
    pointer-events: none;
  }
</style>
