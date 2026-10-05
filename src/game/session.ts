import type { GameConfig } from './config';
import { spin, type SpinResult } from './engine';
import type { Rng } from './rng';

export type GamePhase = 'menu' | 'playing' | 'ended';
export type MachinePhase = 'ready' | 'spinning';
export type EndReason = 'time' | 'bankrupt';

export interface GameStats {
  spins: number;
  totalBet: number;
  totalWon: number;
  biggestWin: number;
}

export interface GameState {
  phase: GamePhase;
  machine: MachinePhase;
  credits: number;
  bet: number;
  startedAt: number;          // horodatage (performance.now) du début de partie
  endedAt: number | null;     // horodatage de la fin, null tant que la partie continue
  currentSpin: SpinResult | null;
  lastWin: number;
  endReason: EndReason | null;
  stats: GameStats;
}

export function minBet(config: GameConfig): number {
  return Math.min(...config.bets.map((b) => b.amount));
}

export function createGame(config: GameConfig): GameState {
  return {
    phase: 'menu',
    machine: 'ready',
    credits: config.startingCredits,
    bet: minBet(config),
    startedAt: 0,
    endedAt: null,
    currentSpin: null,
    lastWin: 0,
    endReason: null,
    stats: { spins: 0, totalBet: 0, totalWon: 0, biggestWin: 0 },
  };
}

/** Lance le chronomètre. */
export function startGame(state: GameState, now: number): void {
  if (state.phase !== 'menu') return;
  state.phase = 'playing';
  state.startedAt = now;
}

/** Temps écoulé depuis le début, borné à la durée de la partie. */
export function elapsed(state: GameState, config: GameConfig, now: number): number {
  if (state.phase === 'menu') return 0;
  const end = state.endedAt ?? now;
  return Math.min(config.durationMs, Math.max(0, end - state.startedAt));
}

/** Le temps restant est CALCULÉ, jamais stocké ni décrémenté. */
export function timeRemaining(state: GameState, config: GameConfig, now: number): number {
  return config.durationMs - elapsed(state, config, now);
}

/** À appeler à chaque frame : termine la partie si le temps est écoulé. */
export function tick(state: GameState, config: GameConfig, now: number): void {
  if (state.phase === 'playing' && now - state.startedAt >= config.durationMs) {
    endGame(state, config, 'time', now);
  }
}

export function canSpin(state: GameState): boolean {
  return state.phase === 'playing' && state.machine === 'ready' && state.credits >= state.bet;
}

/** Change la mise (aussi possible avant le début). Refuse une mise inconnue ou trop chère. */
export function setBet(state: GameState, amount: number, config: GameConfig): boolean {
  if (state.phase === 'ended') return false;
  if (!config.bets.some((b) => b.amount === amount)) return false;
  if (amount > state.credits) return false;
  state.bet = amount;
  return true;
}

/**
 * Démarre un lancer : retire la mise et calcule le résultat IMMÉDIATEMENT.
 * Renvoie null si le lancer est refusé (double clic, solde insuffisant, temps écoulé…).
 */
export function startSpin(
  state: GameState,
  config: GameConfig,
  now: number,
  rng?: Rng,
): SpinResult | null {
  tick(state, config, now);
  if (!canSpin(state)) return null;

  const result = spin(state.bet, config, rng);
  state.credits -= state.bet;
  state.stats.spins++;
  state.stats.totalBet += state.bet;
  state.currentSpin = result;
  state.machine = 'spinning';
  return result;
}

/** Termine le lancer en cours : crédite le gain, puis vérifie la faillite. */
export function resolveSpin(state: GameState, config: GameConfig, now: number): void {
  if (state.machine !== 'spinning' || !state.currentSpin) return;

  const win = state.currentSpin.totalWin;
  state.credits += win;
  state.lastWin = win;
  state.stats.totalWon += win;
  state.stats.biggestWin = Math.max(state.stats.biggestWin, win);
  state.machine = 'ready';

  if (state.phase !== 'playing') return;

  // Plus assez pour la plus petite mise → fin de partie
  if (state.credits < minBet(config)) {
    endGame(state, config, 'bankrupt', now);
    return;
  }

  // La mise choisie est devenue trop chère → on descend à la plus grosse mise abordable
  if (state.bet > state.credits) {
    const affordable = config.bets.map((b) => b.amount).filter((a) => a <= state.credits);
    state.bet = Math.max(...affordable);
  }
}

export function endGame(state: GameState, config: GameConfig, reason: EndReason, now: number): void {
  if (state.phase !== 'playing') return;
  state.phase = 'ended';
  state.endReason = reason;
  state.endedAt = Math.min(now, state.startedAt + config.durationMs);
  if (state.machine === 'spinning') resolveSpin(state, config, now);
}