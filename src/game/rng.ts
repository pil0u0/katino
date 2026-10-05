/** Fonction qui renvoie un nombre dans [0, 1[. Injectable pour les tests. */
export type Rng = () => number;

export function pickWeighted<T extends { weight: number }>(
  items: readonly T[],
  rng: Rng = Math.random,
): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let r = rng() * total;
  for (const item of items) {
    r -= item.weight;
    if (r < 0) return item;
  }
  return items[items.length - 1]; // sécurité en cas d'arrondi flottant
}