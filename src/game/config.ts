export type SymbolId = 'cherry' | 'lemon' | 'bell' | 'clover' | 'diamond' | 'seven';

/** Règles d'un symbole. Son apparence (image, nom affiché) vit dans src/ui/symbols.ts */
export interface SymbolDef {
  id: SymbolId;
  weight: number;  // poids relatif d'apparition
  payout: number;  // multiplicateur de la mise pour 3 identiques sur une ligne
}

/** Coordonnées d'une case : [colonne, ligne], de 0 à 2 */
export type Cell = readonly [col: number, row: number];

export interface Payline {
  id: string;
  cells: readonly [Cell, Cell, Cell];
}

export interface BetTier {
  amount: number;       // coût du lancer
  payoutBonus: number;  // multiplicateur des gains (pilote le RTP)
}

export interface GameConfig {
  symbols: SymbolDef[];
  paylines: Payline[];
  bets: BetTier[];
  durationMs: number;
  startingCredits: number;
  bigWinThreshold: number; // gain >= X fois la mise → grosse animation
}

// Du plus fréquent (petit gain) au plus rare (jackpot)
export const SYMBOLS: SymbolDef[] = [
  { id: 'cherry',  weight: 30, payout: 2 },
  { id: 'lemon',   weight: 27, payout: 2 },
  { id: 'bell',    weight: 18, payout: 3 },
  { id: 'clover',  weight: 12, payout: 6 },
  { id: 'diamond', weight: 8,  payout: 15 },
  { id: 'seven',   weight: 5,  payout: 50 },
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
  { amount: 25,  payoutBonus: 1.04 },
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