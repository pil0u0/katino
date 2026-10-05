import { describe, it, expect } from 'vitest';
import { CONFIG } from './config';
import { createGame, startGame, endGame, type GameState } from './session';
import { createHistory, recordGame, bestGame, previousGame } from './history';

/** Crée une partie terminée avec le solde voulu. */
function finishedGame(credits: number): GameState {
  const game = createGame(CONFIG);
  startGame(game, 0);
  game.credits = credits;
  endGame(game, CONFIG, 'time', 60_000);
  return game;
}

describe('historique', () => {
  it('refuse une partie non terminée', () => {
    const history = createHistory();
    expect(() => recordGame(history, createGame(CONFIG))).toThrow();
  });

  it('numérote les parties et copie leurs données', () => {
    const history = createHistory();
    const game = finishedGame(1200);
    const record = recordGame(history, game);

    expect(record.id).toBe(1);
    expect(record.finalCredits).toBe(1200);

    // Modifier la partie après coup ne change pas l'enregistrement
    game.points.push({ t: 99, credits: 0 });
    game.stats.spins = 999;
    expect(record.points).toHaveLength(2);
    expect(record.stats.spins).toBe(0);
  });

  it('trouve la meilleure partie et la plus récente', () => {
    const history = createHistory();
    recordGame(history, finishedGame(900));
    recordGame(history, finishedGame(1500));
    recordGame(history, finishedGame(1100));

    expect(bestGame(history)?.finalCredits).toBe(1500);
    expect(previousGame(history)?.id).toBe(3);
  });

  it('peut exclure la partie actuelle', () => {
    const history = createHistory();
    recordGame(history, finishedGame(900));
    recordGame(history, finishedGame(1500));

    // La partie 2 vient de se terminer : on la compare aux AUTRES
    expect(previousGame(history, 2)?.id).toBe(1);
    expect(bestGame(history, 2)?.finalCredits).toBe(900);
  });

  it('à égalité, le record reste à la première partie', () => {
    const history = createHistory();
    recordGame(history, finishedGame(1300));
    recordGame(history, finishedGame(1300));
    expect(bestGame(history)?.id).toBe(1);
  });

  it('renvoie null sans partie', () => {
    const history = createHistory();
    expect(bestGame(history)).toBeNull();
    expect(previousGame(history)).toBeNull();
  });
});