// Core game engine for Budget Blitz
import { CATEGORIES, randomAmount, randomNote, buildSpawnList, qualityIndex, frugalityIndex } from './data.js';

/**
 * Represents a single game run. Handles timing, card spawning, user actions
 * and scoring. UI interactions are delegated through callbacks.
 */
// internal shim for requestAnimationFrame in Node (test) and browser
const raf = (typeof window !== 'undefined' && window.requestAnimationFrame)
  ? window.requestAnimationFrame.bind(window)
  : (cb) => setTimeout(cb, 16);

export class Game {
  /**
   * Construct a new game instance.
   * @param {Object} opts configuration options
   * @param {number} opts.income starting income in rupees
   * @param {string} opts.difficulty difficulty level (easy|normal|hard)
   * @param {function} opts.onCard called when a new card is displayed ({ card, next })
   * @param {function} opts.onUpdate called periodically with { time, balance, quality, frugality }
   * @param {function} opts.onEnd called when the game ends, with summary object
   */
  constructor(opts = {}) {
    this.income = opts.income || 50000;
    this.difficulty = opts.difficulty || 'normal';
    this.onCard = opts.onCard || (() => {});
    this.onUpdate = opts.onUpdate || (() => {});
    this.onEnd = opts.onEnd || (() => {});

    // Game state
    this.running = false;
    this.paused = false;
    this.elapsed = 0;
    this.remaining = 60000; // ms
    this.startTime = 0;

    // Financials
    this.balance = this.income;
    this.totalApproved = 0;
    this.totalDeclined = 0;
    this.totalMissed = 0;

    // Per-category summary
    this.summary = {
      groceriesTotal: 0,
      transportTotal: 0,
      utilitiesCount: 0,
      diningTotal: 0,
      impulseCount: 0
    };

    // Quality/Frugality indices start at 100
    this.quality = 100;
    this.frugality = 100;

    // Spawn schedule
    this.spawnList = buildSpawnList(this.difficulty);
    this.nextSpawnIndex = 0;
    // Queue of ready cards not yet displayed
    this.queue = [];
    this.currentCard = null;
    this.currentCardStart = 0;
    this.cardTimeout = null;

    // Bind handlers
    this.loop = this.loop.bind(this);
  }

  /** Start the game */
  start() {
    if (this.running) return;
    this.running = true;
    this.paused = false;
    this.elapsed = 0;
    this.startTime = performance.now();
    this.onUpdate({ time: this.remaining / 1000, balance: this.balance, quality: this.quality, frugality: this.frugality });
    raf(this.loop);
  }

  /** Pause the game */
  pause() {
    if (!this.running || this.paused) return;
    this.paused = true;
    // cancel current card timeout but preserve remaining time for card
    if (this.cardTimeout) {
      clearTimeout(this.cardTimeout);
      this.cardTimeout = null;
    }
  }

  /** Resume the game */
  resume() {
    if (!this.running || !this.paused) return;
    this.paused = false;
    // adjust startTime so that elapsed continues properly
    this.startTime = performance.now() - this.elapsed;
    // if a card is active, restart its timeout based on leftover time
    if (this.currentCard) {
      const timeSinceCardStart = this.elapsed - this.currentCardStart;
      const remaining = 3000 - timeSinceCardStart;
      if (remaining > 0) {
        this.cardTimeout = setTimeout(() => this.missCurrentCard(), remaining);
      } else {
        // If already overdue, treat as missed
        this.missCurrentCard();
      }
    }
    requestAnimationFrame(this.loop);
  }

  /** The main loop, called via requestAnimationFrame */
  loop() {
    if (!this.running) return;
    const now = performance.now();
    if (!this.paused) {
      this.elapsed = now - this.startTime;
      // End game when time runs out
      if (this.elapsed >= this.remaining) {
        this.endGame();
        return;
      }
      // Spawn cards when their scheduled time has passed
      while (this.nextSpawnIndex < this.spawnList.length && this.spawnList[this.nextSpawnIndex].time <= this.elapsed) {
        const spawn = this.spawnList[this.nextSpawnIndex++];
        this.queue.push(this.createCard(spawn.key));
      }
      // If no current card, pop from queue
      if (!this.currentCard && this.queue.length > 0) {
        const card = this.queue.shift();
        this.showCard(card);
      }
      // Update HUD every frame
      const timeLeft = (this.remaining - this.elapsed) / 1000;
      this.onUpdate({ time: timeLeft, balance: this.balance, quality: this.quality, frugality: this.frugality });
    }
    // schedule next frame
    raf(this.loop);
  }

  /** Create a card object given a category key */
  createCard(key) {
    return {
      id: `${key}-${Math.random().toString(36).slice(2)}`,
      key,
      label: CATEGORIES[key].label,
      amount: randomAmount(key),
      note: randomNote(key)
    };
  }

  /** Display a card and set expiration */
  showCard(card) {
    this.currentCard = card;
    this.currentCardStart = this.elapsed;
    // schedule auto-miss after 3 seconds
    this.cardTimeout = setTimeout(() => this.missCurrentCard(), 3000);
    const nextCard = this.queue[0] || null;
    this.onCard({ card, next: nextCard });
  }

  /** Approve the current card */
  approve() {
    if (!this.currentCard || this.paused) return;
    clearTimeout(this.cardTimeout);
    this.cardTimeout = null;
    const card = this.currentCard;
    this.currentCard = null;
    // Deduct from balance
    this.balance -= card.amount;
    this.totalApproved += card.amount;
    // Update summary per category
    this.updateSummary(card, 'approve');
    // Check for early end if overspent
    if (this.balance < -10000) {
      this.endGame();
      return;
    }
    // Update indices
    this.updateIndices();
    // Show next card if available
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      this.showCard(next);
    }
  }

  /** Decline the current card */
  decline() {
    if (!this.currentCard || this.paused) return;
    clearTimeout(this.cardTimeout);
    this.cardTimeout = null;
    const card = this.currentCard;
    this.currentCard = null;
    this.totalDeclined += card.amount;
    this.updateSummary(card, 'decline');
    this.updateIndices();
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      this.showCard(next);
    }
  }

  /** Auto-miss the current card */
  missCurrentCard() {
    if (!this.currentCard) return;
    this.cardTimeout = null;
    this.totalMissed += this.currentCard.amount;
    this.updateSummary(this.currentCard, 'miss');
    this.currentCard = null;
    this.updateIndices();
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      this.showCard(next);
    }
  }

  /** Update summary per action */
  updateSummary(card, action) {
    // Update totals only when approved (spending) or missed (ignored). Declined has no category spending
    if (action === 'approve') {
      switch (card.key) {
        case 'GROC':
          this.summary.groceriesTotal += card.amount;
          break;
        case 'TRAN':
          this.summary.transportTotal += card.amount;
          break;
        case 'UTIL':
          this.summary.utilitiesCount += 1;
          break;
        case 'DINE':
          this.summary.diningTotal += card.amount;
          break;
        case 'IMPL':
          this.summary.impulseCount += 1;
          break;
        default:
          break;
      }
    }
  }

  /** Recalculate quality and frugality indices */
  updateIndices() {
    this.quality = qualityIndex(this.summary);
    this.frugality = frugalityIndex(this.summary);
  }

  /** Finish the game and compute final metrics */
  endGame() {
    if (!this.running) return;
    this.running = false;
    if (this.cardTimeout) {
      clearTimeout(this.cardTimeout);
      this.cardTimeout = null;
    }
    // Final indices
    this.updateIndices();
    // Build summary object for results
    const endingBalance = this.balance;
    const quality = this.quality;
    const frugality = this.frugality;
    const results = {
      endingBalance,
      totalApproved: this.totalApproved,
      totalDeclined: this.totalDeclined,
      totalMissed: this.totalMissed,
      quality,
      frugality,
      summary: { ...this.summary },
      income: this.income
    };
    this.onEnd(results);
  }
}