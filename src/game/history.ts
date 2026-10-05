import type { ChartPoint, EndReason, GameState, GameStats } from './session';

/** Une partie terminée, figée : on ne garde que ce qui sert à la comparaison */
export interface GameRecord {
  id: number;
  finalCredits: number;
  endReason: EndReason;
  points: ChartPoint[];
  stats: GameStats;
}

export interface SessionHistory {
  games: GameRecord[];
}

export function createHistory(): SessionHistory {
  return { games: [] };
}

/** Enregistre une partie terminée et renvoie son enregistrement. */
export function recordGame(history: SessionHistory, state: GameState): GameRecord {
  if (state.phase !== 'ended' || !state.endReason) {
    throw new Error('Seule une partie terminée peut être enregistrée');
  }

  // Copies explicites : l'enregistrement ne doit plus jamais bouger,
  // même si l'objet de la partie est modifié ou réutilisé ensuite.
  const record: GameRecord = {
    id: history.games.length + 1,
    finalCredits: state.credits,
    endReason: state.endReason,
    points: state.points.map((p) => ({ t: p.t, credits: p.credits })),
    stats: { ...state.stats },
  };
  history.games.push(record);
  return record;
}

/** Meilleure partie (à égalité, la plus ancienne garde le record). */
export function bestGame(
  history: SessionHistory,
  excludeId: number | null = null,
): GameRecord | null {
  let best: GameRecord | null = null;
  for (const game of history.games) {
    if (game.id === excludeId) continue;
    if (!best || game.finalCredits > best.finalCredits) best = game;
  }
  return best;
}

/** Dernière partie terminée, en excluant éventuellement la partie affichée comme « actuelle ». */
export function previousGame(
  history: SessionHistory,
  excludeId: number | null = null,
): GameRecord | null {
  for (let i = history.games.length - 1; i >= 0; i--) {
    if (history.games[i].id !== excludeId) return history.games[i];
  }
  return null;
}