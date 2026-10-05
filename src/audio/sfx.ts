/**
 * Effets sonores synthétisés avec la Web Audio API : aucun fichier audio,
 * aucun droit d'auteur, et un vrai son de borne des années 2000 (ondes carrées).
 *
 * Ce module ne connaît rien du jeu : l'interface l'appelle quand il se passe quelque chose.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;

/** Volume général : les ondes carrées sont fortes, on reste bas */
const MASTER_VOLUME = 0.18;

/**
 * Le navigateur interdit le son avant une interaction de l'utilisateur.
 * Le contexte audio est donc créé au premier son demandé, qui suit toujours un clic ou une touche.
 */
function getContext(): AudioContext | null {
  if (muted) return null;
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = MASTER_VOLUME;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

interface ToneOptions {
  type?: OscillatorType; // 'square' (chiptune), 'triangle' (doux), 'sawtooth' (agressif)
  delayMs?: number;      // départ différé, pour enchaîner des notes
  volume?: number;       // de 0 à 1
  slideTo?: number;      // fréquence d'arrivée, pour un « glissé »
}

/** Joue une note : une fréquence (Hz) pendant une durée, avec une attaque nette et une fin en fondu */
function tone(freq: number, durationMs: number, options: ToneOptions = {}): void {
  const audio = getContext();
  if (!audio || !master) return;

  const { type = 'square', delayMs = 0, volume = 0.6, slideTo } = options;
  const start = audio.currentTime + delayMs / 1000;
  const end = start + durationMs / 1000;

  const osc = audio.createOscillator();
  const gain = audio.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, end);

  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, end); // fondu : évite les « clics » en fin de note

  osc.connect(gain).connect(master);
  osc.start(start);
  osc.stop(end + 0.02);
}

// Quelques notes (Hz) pour les mélodies
const C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5, E6 = 1318.5, G6 = 1567.98;

let lastReelStop = 0;

export const sfx = {
  /** Pièce insérée : début de partie */
  coin() {
    tone(988, 70);
    tone(1319, 220, { delayMs: 70 });
  },

  /** Changement de mise */
  click() {
    tone(880, 35, { volume: 0.3 });
  },

  /** Les rouleaux se lancent */
  spin() {
    tone(180, 160, { type: 'sawtooth', volume: 0.25, slideTo: 520 });
  },

  /** Une colonne s'arrête (index 0, 1 ou 2 : chaque colonne un peu plus grave) */
  reelStop(index: number) {
    // Après un slam stop, les trois colonnes s'arrêtent ensemble : un seul « clac » suffit
    const now = performance.now();
    if (now - lastReelStop < 40) return;
    lastReelStop = now;

    tone(170 - index * 20, 70, { type: 'triangle', volume: 0.9 });
    tone(90, 40, { volume: 0.2 });
  },

  /** Lancer perdu : discret, on perd souvent */
  lose() {
    tone(196, 140, { type: 'triangle', volume: 0.35, slideTo: 147 });
  },

  /** Gain : un arpège, d'autant plus long qu'il y a de lignes gagnantes */
  win(lines: number) {
    const notes = [C5, E5, G5, C6, E6, G6];
    const count = Math.min(notes.length, 2 + lines);
    notes.slice(0, count).forEach((freq, i) => tone(freq, 90, { delayMs: i * 60, volume: 0.45 }));
  },

  /** Gros gain : petite fanfare */
  bigWin() {
    [C5, E5, G5, C6, G5, C6, E6].forEach((freq, i) => tone(freq, 110, { delayMs: i * 85 }));
    tone(C6, 500, { delayMs: 7 * 85, type: 'triangle', volume: 0.7 });
  },

  /** Dernières secondes */
  tick(urgent: boolean) {
    tone(urgent ? 1400 : 1000, 40, { volume: 0.3 });
  },

  /** Fin de partie */
  end() {
    [G5, E5, C5].forEach((freq, i) => tone(freq, 160, { delayMs: i * 140, type: 'triangle' }));
  },

  /** Nouveau record */
  record() {
    [C5, G5, C6, E6, G6].forEach((freq, i) => tone(freq, 120, { delayMs: i * 90 }));
    tone(C6 * 2, 600, { delayMs: 5 * 90, type: 'triangle', volume: 0.6 });
  },
};

export function setMuted(value: boolean): void {
  muted = value;
}