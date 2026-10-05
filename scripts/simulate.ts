import { CONFIG, type GameConfig } from '../src/game/config';
import { spin, theoreticalRtp } from '../src/game/engine';

// ---- Paramètres de la simulation ----
const GAMES = 100_000;
const SPIN_MS = 1300;
const SPINS_PER_GAME = Math.floor(CONFIG.durationMs / SPIN_MS);

type Strategy = (credits: number) => number;

const betAmounts = CONFIG.bets.map((b) => b.amount);
const minBet = Math.min(...betAmounts);

const strategies: Record<string, Strategy> = {
  'Toujours 10': () => 10,
  'Toujours 25': () => 25,
  'Toujours 50': () => 50,
  'Toujours 100': () => 100,
  'Adaptative': (credits) => {
    if (credits >= 1500) return 100;
    if (credits >= 800) return 50;
    if (credits >= 400) return 25;
    return 10;
  },
};

function simulateGame(strategy: Strategy, config: GameConfig): number {
  let credits = config.startingCredits;
  for (let i = 0; i < SPINS_PER_GAME; i++) {
    if (credits < minBet) break; // faillite
    let bet = strategy(credits);
    // si la mise voulue dépasse le solde, on prend la plus grosse mise abordable
    if (bet > credits) bet = Math.max(...betAmounts.filter((a) => a <= credits));
    credits -= bet;
    credits += spin(bet, config).totalWin;
  }
  return credits;
}

function percentile(sorted: number[], p: number): number {
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
}

// ---- 1. RTP théorique ----
console.log('\nRTP théorique (sans arrondi) :');
for (const b of CONFIG.bets) {
  const rtp = theoreticalRtp(CONFIG, b.amount) * 100;
  console.log(`  mise ${String(b.amount).padStart(3)} → ${rtp.toFixed(1)} %`);
}

// ---- 2. RTP mesuré ----
console.log('\nRTP mesuré (1 000 000 de lancers par mise) :');
for (const b of CONFIG.bets) {
  let paid = 0, won = 0, hits = 0;
  for (let i = 0; i < 1_000_000; i++) {
    const r = spin(b.amount, CONFIG);
    paid += b.amount;
    won += r.totalWin;
    if (r.totalWin > 0) hits++;
  }
  console.log(
    `  mise ${String(b.amount).padStart(3)} → ${((won / paid) * 100).toFixed(1)} %` +
    `  (gain sur ${(hits / 10_000).toFixed(1)} % des lancers)`,
  );
}

// ---- 3. Parties complètes ----
console.log(`\n${GAMES} parties par stratégie, ${SPINS_PER_GAME} lancers max par partie\n`);
const rows = [];
for (const [name, strategy] of Object.entries(strategies)) {
  const finals: number[] = [];
  let bankrupt = 0;
  for (let g = 0; g < GAMES; g++) {
    const credits = simulateGame(strategy, CONFIG);
    finals.push(credits);
    if (credits < minBet) bankrupt++;
  }
  finals.sort((a, b) => a - b);
  const mean = finals.reduce((s, x) => s + x, 0) / GAMES;
  rows.push({
    'Stratégie': name,
    'Moyenne': Math.round(mean),
    'Médiane': percentile(finals, 50),
    'P10': percentile(finals, 10),
    'P90': percentile(finals, 90),
    'P99': percentile(finals, 99),
    'Faillite': `${((bankrupt / GAMES) * 100).toFixed(1)} %`,
  });
}
console.table(rows);