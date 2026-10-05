import { describe, it, expect } from 'vitest';
import { CONFIG } from './config';
import {
  createGame, startGame, setBet, startSpin, resolveSpin, endGame,
  tick, timeRemaining, type GameState,
} from './session';
import type { Rng } from './rng';

/** RNG qui renvoie une suite de valeurs fixées, en boucle. */
function sequence(values: number[]): Rng {
  let i = 0;
  return () => values[i++ % values.length];
}

const allCherries: Rng = () => 0;          // grille pleine de cerises → 8 lignes × mise
const noWin = sequence([0.1, 0.4, 0.8, 0.4, 0.6, 0.1, 0.6, 0.1, 0.4]); // aucune ligne

/** Crée une partie déjà démarrée au temps 0. */
function startedGame(): GameState {
  const game = createGame(CONFIG);
  startGame(game, 0);
  return game;
}

describe('session', () => {
  it('commence dans le menu avec les crédits de départ et la mise minimale', () => {
    const game = createGame(CONFIG);
    expect(game.phase).toBe('menu');
    expect(game.credits).toBe(1000);
    expect(game.bet).toBe(10);
  });

  it('refuse de lancer avant le début de la partie', () => {
    const game = createGame(CONFIG);
    expect(startSpin(game, CONFIG, 0)).toBeNull();
  });

  it('retire la mise au lancer et crédite le gain à la résolution', () => {
    const game = startedGame();
    startSpin(game, CONFIG, 100, allCherries);
    expect(game.credits).toBe(990);
    expect(game.machine).toBe('spinning');

    resolveSpin(game, CONFIG, 200);
    expect(game.credits).toBe(990 + 80);
    expect(game.lastWin).toBe(80);
    expect(game.machine).toBe('ready');
  });

  it('refuse un second lancer pendant que la machine tourne', () => {
    const game = startedGame();
    expect(startSpin(game, CONFIG, 100, noWin)).not.toBeNull();
    expect(startSpin(game, CONFIG, 110, noWin)).toBeNull();
    expect(game.credits).toBe(990);
    expect(game.stats.spins).toBe(1);
  });

  it('refuse une mise inconnue ou supérieure au solde', () => {
    const game = startedGame();
    expect(setBet(game, 33, CONFIG)).toBe(false);
    game.credits = 40;
    expect(setBet(game, 50, CONFIG)).toBe(false);
    expect(setBet(game, 25, CONFIG)).toBe(true);
    expect(game.bet).toBe(25);
  });

  it('baisse automatiquement la mise quand elle devient trop chère', () => {
    const game = startedGame();
    game.credits = 120;
    setBet(game, 100, CONFIG);
    startSpin(game, CONFIG, 100, noWin);
    resolveSpin(game, CONFIG, 200);
    expect(game.credits).toBe(20);
    expect(game.bet).toBe(10);
  });

  it('termine la partie en faillite sous la mise minimale', () => {
    const game = startedGame();
    game.credits = 15;
    startSpin(game, CONFIG, 100, noWin);
    resolveSpin(game, CONFIG, 200);
    expect(game.credits).toBe(5);
    expect(game.phase).toBe('ended');
    expect(game.endReason).toBe('bankrupt');
  });
});

describe('chronomètre', () => {
  it('le temps restant diminue sans rien stocker', () => {
    const game = startedGame();
    expect(timeRemaining(game, CONFIG, 0)).toBe(60_000);
    expect(timeRemaining(game, CONFIG, 13_000)).toBe(47_000);
  });

  it('tick termine la partie à 60 secondes', () => {
    const game = startedGame();
    tick(game, CONFIG, 59_999);
    expect(game.phase).toBe('playing');
    tick(game, CONFIG, 60_000);
    expect(game.phase).toBe('ended');
    expect(game.endReason).toBe('time');
    expect(timeRemaining(game, CONFIG, 99_999)).toBe(0);
  });

  it('refuse un lancer après la fin du temps, même sans tick préalable', () => {
    const game = startedGame();
    expect(startSpin(game, CONFIG, 61_000)).toBeNull();
    expect(game.phase).toBe('ended');
    expect(game.credits).toBe(1000);
  });

  it('un lancer en cours est résolu quand le temps se termine', () => {
    const game = startedGame();
    startSpin(game, CONFIG, 59_500, allCherries);
    tick(game, CONFIG, 60_016);
    expect(game.credits).toBe(1070);
    expect(game.phase).toBe('ended');
    expect(game.endReason).toBe('time');
  });

  it('la faillite fige le chronomètre', () => {
    const game = startedGame();
    game.credits = 15;
    startSpin(game, CONFIG, 20_000, noWin);
    resolveSpin(game, CONFIG, 21_000);
    expect(timeRemaining(game, CONFIG, 50_000)).toBe(39_000);
  });

  it('endGame est sans effet sur une partie déjà terminée', () => {
    const game = startedGame();
    endGame(game, CONFIG, 'bankrupt', 1000);
    endGame(game, CONFIG, 'time', 60_000);
    expect(game.endReason).toBe('bankrupt');
  });
});