// Data definitions and helpers for Budget Blitz

export const CATEGORIES = {
  RENT: { type: 'essential', label: 'Rent', min: 18000, max: 25000, spawn: 'fixed-early' },
  UTIL: { type: 'essential', label: 'Utilities', min: 800, max: 2500, spawn: 'early' },
  GROC: { type: 'essential', label: 'Groceries', min: 700, max: 2200, spawn: 'any' },
  TRAN: { type: 'essential', label: 'Transport', min: 200, max: 800, spawn: 'any' },
  DINE: { type: 'discretionary', label: 'Dining', min: 300, max: 1500, spawn: 'mid-late' },
  SUBS: { type: 'discretionary', label: 'Subscription', min: 99, max: 999, spawn: 'mid' },
  ENTR: { type: 'discretionary', label: 'Entertainment', min: 500, max: 4000, spawn: 'late' },
  IMPL: { type: 'discretionary', label: 'Impulse', min: 500, max: 4000, spawn: 'late' }
};

// Targets for essentials used in scoring
export const ESSENTIAL_TARGETS = {
  GROC: 2000,
  TRAN: 1000,
  UTIL: 1 // count of utility bills
};

// Generate a random amount within category bounds
export function randomAmount(key) {
  const c = CATEGORIES[key];
  if (!c) throw new Error(`Unknown category ${key}`);
  return Math.floor(Math.random() * (c.max - c.min + 1)) + c.min;
}

// Simple notes for each category
const NOTES = {
  RENT: ['Monthly apartment rent'],
  UTIL: ['Electricity bill', 'Water bill', 'Internet bill'],
  GROC: ['Weekly groceries', 'Fresh veggies & fruits', 'Grocery restock'],
  TRAN: ['Bus fare', 'Taxi ride', 'Fuel refill'],
  DINE: ['Dinner at restaurant', 'Quick lunch', 'Coffee and snacks'],
  SUBS: ['Music streaming', 'Video subscription', 'News subscription'],
  ENTR: ['Movie ticket', 'Concert pass', 'Game purchase'],
  IMPL: ['Flash sale item', 'Late night ride', 'Limited-time offer']
};

export function randomNote(key) {
  const arr = NOTES[key] || ['Expense'];
  return arr[Math.floor(Math.random() * arr.length)];
}

// Build a deterministic spawn list based on difficulty. Returns array of events
// with properties { time: ms, key: categoryKey }
export function buildSpawnList(difficulty = 'normal') {
  const list = [];
  const totalDuration = 60000; // 60s
  // early phase: 0–20s, 1 card/sec, mostly essentials
  for (let i = 0; i < 20; i++) {
    const time = i * 1000;
    // choose category based on early weight
    const possible = Object.keys(CATEGORIES).filter(k => {
      const s = CATEGORIES[k].spawn;
      return s === 'fixed-early' || s === 'early' || s === 'any';
    });
    const key = possible[Math.floor(Math.random() * possible.length)];
    list.push({ time, key });
  }
  // ensure rent appears once around 5s
  list.push({ time: 5000, key: 'RENT' });
  // schedule 2 utilities bills at random early times
  const utilTimes = [8000 + Math.random() * 6000, 12000 + Math.random() * 6000];
  utilTimes.forEach(t => list.push({ time: Math.floor(t), key: 'UTIL' }));
  // mid phase: 20–45s, 1.5 cards/sec, mix of essentials & discretionary (mid, any, mid-late)
  const midStart = 20000;
  const midEnd = 45000;
  const midInterval = 1000 / 1.5; // ~666ms
  for (let t = midStart; t < midEnd; t += midInterval) {
    const possible = Object.keys(CATEGORIES).filter(k => {
      const s = CATEGORIES[k].spawn;
      return s === 'any' || s === 'mid' || s === 'mid-late' || s === 'early';
    });
    const key = possible[Math.floor(Math.random() * possible.length)];
    list.push({ time: Math.floor(t), key });
  }
  // late phase: 45–60s, 2 cards/sec, more discretionary
  const lateStart = 45000;
  const lateEnd = totalDuration;
  const lateInterval = 500; // 2 per sec
  for (let t = lateStart; t < lateEnd; t += lateInterval) {
    const possible = Object.keys(CATEGORIES).filter(k => {
      const s = CATEGORIES[k].spawn;
      return s === 'late' || s === 'mid-late' || s === 'any';
    });
    const key = possible[Math.floor(Math.random() * possible.length)];
    list.push({ time: Math.floor(t), key });
  }
  // sort by time ascending
  list.sort((a, b) => a.time - b.time);
  return list;
}

// Scoring functions
export function qualityIndex(summary) {
  let score = 100;
  if ((summary.groceriesTotal || 0) < ESSENTIAL_TARGETS.GROC) score -= 15;
  if ((summary.transportTotal || 0) < ESSENTIAL_TARGETS.TRAN) score -= 15;
  if ((summary.utilitiesCount || 0) < ESSENTIAL_TARGETS.UTIL) score -= 15;
  return Math.max(0, score);
}

export function frugalityIndex(summary) {
  let score = 100;
  const diningOver = Math.max(0, (summary.diningTotal || 0) - 1500);
  const impulseCount = summary.impulseCount || 0;
  // Each Rs 500 over 1500 reduces 10 points, capped at 40
  score -= Math.min(40, Math.floor(diningOver / 500) * 10);
  // Each impulse beyond first deducts 20 points, capped at 40
  score -= Math.min(40, Math.max(0, impulseCount - 1) * 20);
  return Math.max(0, score);
}