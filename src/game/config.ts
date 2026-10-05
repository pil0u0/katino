export type SymbolId = 'cherry' | 'lemon' | 'bell' | 'clover' | 'diamond' | 'seven';

export interface SymbolDef {
  id: SymbolId;
  icon: string;
  weight: number;
  payout: number;
}

export type Cell = readonly [col: number, row: number];

export interface Payline {
  id: string;
  cells: readonly [Cell, Cell, Cell];
}

export interface BetTier {
  amount: number;
  payoutBonus: number;
}

export interface GameConfig {
  symbols: SymbolDef[];
  paylines: Payline[];
  bets: BetTier[];
  durationMs: number;
  startingCredits: number;
  bigWinThreshold: number;
}

export const SYMBOLS: SymbolDef[] = [
  { id: 'cherry',  icon: '🍒', weight: 30, payout: 1 },
  { id: 'lemon',   icon: '🍋', weight: 27, payout: 2 },
  { id: 'bell',    icon: '🔔', weight: 18, payout: 4 },
  { id: 'clover',  icon: '🍀', weight: 12, payout: 8 },
  { id: 'diamond', icon: '💎', weight: 8,  payout: 20 },
  { id: 'seven',   icon: '7️⃣', weight: 5,  payout: 60 },
];

export const PAYLINES: Payline[] = [
  // Horizontales
  { id: 'row-0', cells: [[0, 0], [1, 0], [2, 0]] },
  { id: 'row-1', cells: [[0, 1], [1, 1], [2, 1]] },
  { id: 'row-2', cells: [[0, 2], [1, 2], [2, 2]] },
  // Verticales
  { id: 'col-0', cells: [[0, 0], [0, 1], [0, 2]] },
  { id: 'col-1', cells: [[1, 0], [1, 1], [1, 2]] },
  { id: 'col-2', cells: [[2, 0], [2, 1], [2, 2]] },
  // Diagonales
  { id: 'diag-down', cells: [[0, 0], [1, 1], [2, 2]] },
  { id: 'diag-up',   cells: [[0, 2], [1, 1], [2, 0]] },
];

export const BETS: BetTier[] = [
  { amount: 10,  payoutBonus: 1.00 },
  { amount: 25,  payoutBonus: 1.03 },
  { amount: 50,  payoutBonus: 1.06 },
  { amount: 100, payoutBonus: 1.10 },
];

export const CONFIG: GameConfig = {
  symbols: SYMBOLS,
  paylines: PAYLINES,
  bets: BETS,
  durationMs: 60_000,
  startingCredits: 1000,
  bigWinThreshold: 10,
};