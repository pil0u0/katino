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

  // Conversion vers le format Chart.js. On crée de NOUVEAUX objets :
  // Chart.js modifie les tableaux qu'on lui donne, il ne doit pas toucher à l'état du jeu.
  function toDatasets(list: ChartSeries[]) {
    const reference = {
      label: "Départ",
      data: [
        { x: 0, y: baseline },
        { x: durationMs / 1000, y: baseline },
      ],
      borderColor: "rgb(255 255 255 / 0.25)",
      borderWidth: 1,
      borderDash: [4, 4],
      pointRadius: 0,
    };

    return [
      ...list.map((s) => ({
        label: s.label,
        data: s.points.map((p) => ({ x: p.t / 1000, y: p.credits })),
        borderColor: s.color,
        backgroundColor: s.color,
        borderWidth: s.width ?? 2,
        borderDash: s.dashed ? [6, 4] : [],
        stepped: "after" as const, // le solde change par paliers
        pointRadius: 0,
        pointHoverRadius: 4,
      })),
      reference,
    ];
  }

  // Création du graphique au montage, destruction au démontage
  $effect(() => {
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
              color: "#9ca3af",
              callback: (v) => `${v} s`,
            },
            grid: { color: "rgb(255 255 255 / 0.06)" },
          },
          y: {
            suggestedMin: baseline * 0.5,
            suggestedMax: baseline * 1.5,
            ticks: { color: "#9ca3af" },
            grid: { color: "rgb(255 255 255 / 0.06)" },
          },
        },
        plugins: {
          legend: {
            labels: {
              color: "#d1d5db",
              boxWidth: 14,
              boxHeight: 2,
              filter: (item) => item.text !== "Départ",
            },
          },
          tooltip: {
            callbacks: {
              title: (items) => `${Number(items[0].parsed.x).toFixed(1)} s`,
              label: (item) =>
                `${item.dataset.label} : ${item.parsed.y} crédits`,
            },
          },
        },
      },
    });

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
    background: #1b1b2f;
    border-radius: 16px;
  }
</style>
