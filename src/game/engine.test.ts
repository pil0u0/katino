import { describe, it, expect } from 'vitest';
import { CONFIG, type SymbolId } from './config';
import { evaluate, theoreticalRtp } from './engine';
import { pickWeighted } from './rng';

/** Construit une grille à partir de lignes (plus lisible), puis la transpose en grid[col][row]. */
function fromRows(rows: SymbolId[][]): SymbolId[][] {
  return [0, 1, 2].map((col) => rows.map((row) => row[col]));
}

describe('evaluate', () => {
  it('aucun gain quand aucune ligne ne correspond', () => {
    const grid = fromRows([
      ['cherry', 'lemon', 'bell'],
      ['lemon', 'bell', 'cherry'],
      ['clover', 'cherry', 'lemon'],
    ]);
    const result = evaluate(grid, 10, CONFIG);
    expect(result.wins).toHaveLength(0);
    expect(result.totalWin).toBe(0);
  });

  it('détecte une ligne horizontale', () => {
    const grid = fromRows([
      ['seven', 'seven', 'seven'],
      ['lemon', 'bell', 'cherry'],
      ['clover', 'cherry', 'lemon'],
    ]);
    const result = evaluate(grid, 10, CONFIG);
    expect(result.wins).toHaveLength(1);
    expect(result.wins[0].paylineId).toBe('row-0');
    expect(result.totalWin).toBe(600); // 10 × 60
  });

  it('détecte une diagonale', () => {
    const grid = fromRows([
      ['lemon', 'cherry', 'bell'],
      ['cherry', 'lemon', 'bell'],
      ['clover', 'cherry', 'lemon'],
    ]);
    const result = evaluate(grid, 10, CONFIG);
    expect(result.wins.map((w) => w.paylineId)).toEqual(['diag-down']);
    expect(result.totalWin).toBe(20); // 10 × 2
  });

  it('une grille pleine paie les 8 lignes', () => {
    const grid = fromRows([
      ['bell', 'bell', 'bell'],
      ['bell', 'bell', 'bell'],
      ['bell', 'bell', 'bell'],
    ]);
    const result = evaluate(grid, 10, CONFIG);
    expect(result.wins).toHaveLength(8);
    expect(result.totalWin).toBe(320); // 8 × 10 × 4
  });

  it('applique le bonus de mise', () => {
    const grid = fromRows([
      ['seven', 'seven', 'seven'],
      ['lemon', 'bell', 'cherry'],
      ['clover', 'cherry', 'lemon'],
    ]);
    expect(evaluate(grid, 100, CONFIG).totalWin).toBe(6600); // 100 × 60 × 1.10
  });

  it('refuse une mise inconnue', () => {
    const grid = fromRows([
      ['cherry', 'lemon', 'bell'],
      ['lemon', 'bell', 'cherry'],
      ['clover', 'cherry', 'lemon'],
    ]);
    expect(() => evaluate(grid, 33, CONFIG)).toThrow();
  });
});

describe('pickWeighted', () => {
  it('renvoie le premier symbole pour un tirage à 0', () => {
    expect(pickWeighted(CONFIG.symbols, () => 0).id).toBe('cherry');
  });

  it('renvoie le dernier symbole pour un tirage proche de 1', () => {
    expect(pickWeighted(CONFIG.symbols, () => 0.999).id).toBe('seven');
  });
});

describe('theoreticalRtp', () => {
  it('le RTP de la mise minimale est d\'environ 97 %', () => {
    expect(theoreticalRtp(CONFIG, 10)).toBeCloseTo(0.97, 2);
  });

  it('le RTP augmente avec la mise', () => {
    const rtps = CONFIG.bets.map((b) => theoreticalRtp(CONFIG, b.amount));
    expect(rtps).toEqual([...rtps].sort((a, b) => a - b));
  });
});