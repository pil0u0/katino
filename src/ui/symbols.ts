import type { SymbolId } from '../game/config';

/**
 * Apparence des symboles : tout ce qui concerne l'AFFICHAGE, séparé des règles du jeu.
 *
 * Pour donner une image à un symbole, déposez un fichier dans src/assets/symbols/
 * nommé comme son identifiant : cherry.png, lemon.svg, seven.webp…
 * Tant qu'un symbole n'a pas d'image, son emoji de secours s'affiche.
 */

// Vite trouve toutes les images du dossier au moment du build, et donne leur URL finale
const files = import.meta.glob<string>('../assets/symbols/*.{png,svg,webp,gif,jpg}', {
  eager: true,
  import: 'default',
});

export interface SymbolVisual {
  image: string | null; // URL de l'image, ou null s'il n'y en a pas encore
  fallback: string;     // emoji affiché sans image
  label: string;        // nom lu par les lecteurs d'écran (attribut alt)
}

const FALLBACKS: Record<SymbolId, { fallback: string; label: string }> = {
  cherry:  { fallback: '🍒', label: 'Cerise' },
  lemon:   { fallback: '🍋', label: 'Citron' },
  bell:    { fallback: '🔔', label: 'Cloche' },
  clover:  { fallback: '🍀', label: 'Trèfle' },
  diamond: { fallback: '💎', label: 'Diamant' },
  seven:   { fallback: '7️⃣', label: 'Sept' },
};

/** Cherche dans le dossier un fichier dont le nom (sans extension) est l'identifiant */
function findImage(id: SymbolId): string | null {
  for (const [path, url] of Object.entries(files)) {
    const name = path.split('/').pop()!.replace(/\.[^.]+$/, '');
    if (name === id) return url;
  }
  return null;
}

export const SYMBOL_VISUALS = Object.fromEntries(
  (Object.keys(FALLBACKS) as SymbolId[]).map((id) => [
    id,
    { image: findImage(id), ...FALLBACKS[id] },
  ]),
) as Record<SymbolId, SymbolVisual>;