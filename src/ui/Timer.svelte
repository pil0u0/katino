<script lang="ts">
  import Lcd from "./Lcd.svelte";

  interface Props {
    remainingMs: number;
  }

  let { remainingMs }: Props = $props();

  // Arrondi au supérieur : on affiche 00:01 jusqu'à la dernière milliseconde,
  // et 00:00 seulement quand la partie est vraiment finie.
  const seconds = $derived(Math.ceil(remainingMs / 1000));
  const label = $derived(
    `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`,
  );
  const tone = $derived(
    seconds <= 3 && seconds > 0
      ? "critical"
      : seconds <= 10 && seconds > 0
        ? "warning"
        : "normal",
  );
</script>

<div role="timer" aria-label="Temps restant : {seconds} secondes">
  <Lcd label="Temps" value={label} ghost="88:88" {tone} />
</div>
