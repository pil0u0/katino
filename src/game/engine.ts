import type { GameConfig, SymbolId } from './config';
import { pickWeighted, type Rng } from './rng';

/** grid[col][row] */
export type Grid = SymbolId[][];

export interface LineWin {
  paylineId: string;
  symbol: SymbolId;
  amount: number;
}

export interface SpinResult {
  grid: Grid;
  bet: number;
  wins: LineWin[];
  totalWin: number;
}

export function generateGrid(config: GameConfig, rng: Rng = Math.random): Grid {
  return Array.from({ length: 3 }, () =>
    Array.from({ length: 3 }, () => pickWeighted(config.symbols, rng).id),
  );
}

function getBetTier(config: GameConfig, bet: number) {
  const tier = config.bets.find((b) => b.amount === bet);
  if (!tier) throw new Error(`Mise inconnue : ${bet}`);
  return tier;
}

export function evaluate(grid: Grid, bet: number, config: GameConfig): SpinResult {
  const tier = getBetTier(config, bet);
  const wins: LineWin[] = [];

  for (const line of config.paylines) {
    const [[c0, r0], [c1, r1], [c2, r2]] = line.cells;
    const a = grid[c0][r0];
    const b = grid[c1][r1];
    const c = grid[c2][r2];

    if (a === b && b === c) {
      const symbol = config.symbols.find((s) => s.id === a)!;
      wins.push({
        paylineId: line.id,
        symbol: a,
        amount: Math.floor(bet * symbol.payout * tier.payoutBonus),
      });
    }
  }

  const totalWin = wins.reduce((sum, w) => sum + w.amount, 0);
  return { grid, bet, wins, totalWin };
}

export function spin(bet: number, config: GameConfig, rng: Rng = Math.random): SpinResult {
  return evaluate(generateGrid(config, rng), bet, config);
}

/** RTP exact : nb_lignes × Σ p³ × payout × bonus */
export function theoreticalRtp(config: GameConfig, bet: number): number {
  const tier = getBetTier(config, bet);
  const totalWeight = config.symbols.reduce((sum, s) => sum + s.weight, 0);
  const perLine = config.symbols.reduce(
    (sum, s) => sum + (s.weight / totalWeight) ** 3 * s.payout,
    0,
  );
  return config.paylines.length * perLine * tier.payoutBonus;
}