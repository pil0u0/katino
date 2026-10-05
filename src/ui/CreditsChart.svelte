<script lang="ts" module>
  import type { ChartPoint } from "../game/session";

  /** Une courbe à afficher : le composant ne sait rien du jeu, il dessine ce qu'on lui donne */
  export interface ChartSeries {
    label: string;
    color: string;
    points: ChartPoint[];
    dashed?: boolean;
    width?: number;
  }
</script>

<script lang="ts">
  import {
    Chart,
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    Tooltip,
    Legend,
  } from "chart.js";

  // On n'enregistre que ce qu'on utilise : le bundle reste léger
  Chart.register(
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    Tooltip,
    Legend,
  );

  interface Props {
    series: ChartSeries[];
    durationMs: number;
    baseline: number; // ligne de référence (crédits de départ)
  }

  let { series, durationMs, baseline }: Props = $props();

  let canvas: HTMLCanvasElement;
  let chart: Chart<"line", { x: number; y: number }[]> | null = null;

  /**
   * Chart.js dessine sur un canvas : il ne comprend pas « var(--moutarde) ».
   * On lit donc la vraie couleur dans le CSS de la page, pour garder la palette à un seul endroit.
   */
  function resolveColor(color: string): string {
    const match = color.match(/^var\((--[\w-]+)\)$/);
    if (!match) return color;
    return getComputedStyle(document.documentElement)
      .getPropertyValue(match[1])
      .trim();
  }

  // Conversion vers le format Chart.js. On crée de NOUVEAUX objets :
  // Chart.js modifie les tableaux qu'on lui donne, il ne doit pas toucher à l'état du jeu.
  function toDatasets(list: ChartSeries[]) {
    const reference = {
      label: "Départ",
      data: [
        { x: 0, y: baseline },
        { x: durationMs / 1000, y: baseline },
      ],
      borderColor: "rgb(232 243 255 / 0.35)",
      borderWidth: 1,
      borderDash: [2, 4],
      pointRadius: 0,
    };

    return [
      ...list.map((s) => ({
        label: s.label,
        data: s.points.map((p) => ({ x: p.t / 1000, y: p.credits })),
        borderColor: resolveColor(s.color),
        backgroundColor: resolveColor(s.color),
        borderWidth: s.width ?? 2,
        borderDash: s.dashed ? [6, 4] : [],
        stepped: "after" as const, // le solde change par paliers
        pointRadius: 0,
        pointHoverRadius: 5,
        pointStyle: "rect" as const, // points carrés : rien d'arrondi sur la borne
      })),
      reference,
    ];
  }

  // Création du graphique au montage, destruction au démontage
  $effect(() => {
    const textColor = resolveColor("var(--papier)");
    const mutedColor = resolveColor("var(--terne)");
    const gridColor = "rgb(108 108 240 / 0.18)";

    // Le canvas a besoin de connaître la police : on prend celle de l'interface de la borne
    Chart.defaults.font.family = getComputedStyle(document.documentElement)
      .getPropertyValue("--font-ui")
      .trim();
    Chart.defaults.font.size = 12;

    chart = new Chart(canvas, {
      type: "line",
      data: { datasets: [] },
      options: {
        locale: "fr-BE", // 1 500 au lieu de 1,500
        responsive: true,
        maintainAspectRatio: false,
        animation: false, // sinon le graphique « tremble » à chaque mise à jour
        interaction: { mode: "nearest", axis: "x", intersect: false },
        scales: {
          x: {
            type: "linear",
            min: 0,
            max: durationMs / 1000,
            ticks: {
              stepSize: 10,
              color: mutedColor,
              callback: (v) => `${v} s`,
            },
            grid: { color: gridColor },
            border: { color: mutedColor },
          },
          y: {
            suggestedMin: baseline * 0.5,
            suggestedMax: baseline * 1.5,
            ticks: { color: mutedColor },
            grid: { color: gridColor },
            border: { color: mutedColor },
          },
        },
        plugins: {
          legend: {
            labels: {
              color: textColor,
              boxWidth: 16,
              boxHeight: 4,
              filter: (item) => item.text !== "Départ",
            },
          },
          tooltip: {
            backgroundColor: resolveColor("var(--encre)"),
            borderColor: resolveColor("var(--phosphore)"),
            borderWidth: 2,
            cornerRadius: 0,
            titleColor: resolveColor("var(--phosphore)"),
            bodyColor: textColor,
            displayColors: false,
            callbacks: {
              title: (items) => `${Number(items[0].parsed.x).toFixed(1)} s`,
              label: (item) =>
                `${item.dataset.label} : ${item.parsed.y} crédits`,
            },
          },
        },
      },
    });

    // La police peut finir de charger après la création : on redessine à ce moment-là
    document.fonts.ready.then(() => chart?.update("none"));

    return () => {
      chart?.destroy();
      chart = null;
    };
  });

  // Mise à jour des données quand les séries changent
  $effect(() => {
    const datasets = toDatasets(series);
    if (!chart) return;
    chart.data.datasets = datasets;
    chart.update("none");
  });
</script>

<div class="chart">
  <canvas
    bind:this={canvas}
    aria-label="Évolution des crédits pendant la partie"
  ></canvas>
</div>

<style>
  .chart {
    position: relative; /* requis par Chart.js en mode responsive */
    width: 100%;
    height: 280px;
    padding: 12px;
    box-sizing: border-box;
  }
</style>
