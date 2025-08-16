import { Game } from './game.js';
import { renderCard, setupSwipe } from './ui.js';
import { loadSettings, saveSettings, getQueryParams } from './storage.js';

// Grab DOM elements
const landingSection = document.getElementById('landing');
const gameSection = document.getElementById('game');
const resultsSection = document.getElementById('results');
const pauseOverlay = document.getElementById('pause-overlay');

const startBtn = document.getElementById('start-btn');
const settingsBtn = document.getElementById('settings-btn');
const approveBtn = document.getElementById('approve-btn');
const declineBtn = document.getElementById('decline-btn');
const pauseBtn = document.getElementById('pause-btn');
const resumeBtn = document.getElementById('resume-btn');
const playAgainBtn = document.getElementById('play-again-btn');
const shareBtn = document.getElementById('share-btn');

const timerEl = document.getElementById('timer');
const balanceEl = document.getElementById('balance');
const qualityMeter = document.getElementById('quality-meter');
const frugalityMeter = document.getElementById('frugality-meter');
const cardLane = document.getElementById('card-lane');
const nextPreview = document.getElementById('next-preview');
const resultsSummary = document.getElementById('results-summary');

let currentGame = null;

// Read settings and query params
const savedSettings = loadSettings();
const queryParams = getQueryParams();
const initialIncome = parseInt(queryParams.income) || savedSettings.income || 50000;
const initialDifficulty = queryParams.difficulty || savedSettings.difficulty || 'normal';

function hideAllScreens() {
  landingSection.classList.remove('active');
  gameSection.classList.remove('active');
  resultsSection.classList.remove('active');
}

function showLanding() {
  hideAllScreens();
  landingSection.classList.add('active');
}

function showGame() {
  hideAllScreens();
  gameSection.classList.add('active');
}

function showResults() {
  hideAllScreens();
  resultsSection.classList.add('active');
}

function startGame() {
  // Create a new game instance with callbacks
  currentGame = new Game({
    income: initialIncome,
    difficulty: initialDifficulty,
    onCard: ({ card, next }) => {
      renderCard(cardLane, nextPreview, card, next);
    },
    onUpdate: ({ time, balance, quality, frugality }) => {
      timerEl.textContent = Math.ceil(time).toString().padStart(1, '0');
      balanceEl.textContent = balance.toString();
      qualityMeter.value = quality;
      qualityMeter.setAttribute('aria-valuetext', `${quality}`);
      frugalityMeter.value = frugality;
      frugalityMeter.setAttribute('aria-valuetext', `${frugality}`);
    },
    onEnd: (results) => {
      displayResults(results);
    }
  });
  showGame();
  // Setup swipe gestures anew each game
  setupSwipe(cardLane, () => currentGame.approve(), () => currentGame.decline());
  // Start the game
  currentGame.start();
}

function displayResults(results) {
  // Build summary HTML
  resultsSummary.innerHTML = '';
  const list = document.createElement('ul');
  list.innerHTML = `
    <li><strong>Ending Balance:</strong> ₹${results.endingBalance}</li>
    <li><strong>Total Approved:</strong> ₹${results.totalApproved}</li>
    <li><strong>Total Declined:</strong> ₹${results.totalDeclined}</li>
    <li><strong>Total Missed:</strong> ₹${results.totalMissed}</li>
    <li><strong>Quality Index:</strong> ${results.quality}</li>
    <li><strong>Frugality Index:</strong> ${results.frugality}</li>
  `;
  resultsSummary.appendChild(list);
  // Determine recommendation badge
  const badge = document.createElement('p');
  badge.className = 'badge';
  const q = results.quality;
  const f = results.frugality;
  const bal = results.endingBalance;
  let label;
  let desc;
  if (q >= 70 && f >= 70 && bal >= 0) {
    label = 'Balanced';
    desc = 'You met essentials and stayed within budget. Keep a weekly dining cap to maintain this.';
  } else if (bal < 0) {
    label = 'Overspent';
    desc = 'Overshoot came from Dining and Impulse. Consider a category cap or cooling-off rule.';
  } else if (q < 60 && bal >= 0) {
    label = 'Too Frugal';
    desc = 'You saved cash but skipped essentials. Allocate a baseline for groceries and utilities.';
  } else if (q >= 70 && f >= 70 && bal >= results.income * 0.1) {
    label = 'Well Allocated';
    desc = 'All essentials met with low discretionary spend. Nice savings ratio!';
  } else {
    label = 'Results';
    desc = '';
  }
  const heading = document.createElement('h3');
  heading.textContent = label;
  badge.appendChild(heading);
  const d = document.createElement('p');
  d.textContent = desc;
  badge.appendChild(d);
  resultsSummary.appendChild(badge);
  showResults();
}

// Event listeners
startBtn.addEventListener('click', () => {
  startGame();
});

approveBtn.addEventListener('click', () => {
  if (currentGame) currentGame.approve();
});
declineBtn.addEventListener('click', () => {
  if (currentGame) currentGame.decline();
});
pauseBtn.addEventListener('click', () => {
  if (currentGame) {
    if (!currentGame.paused) {
      currentGame.pause();
      pauseOverlay.classList.remove('hidden');
    } else {
      currentGame.resume();
      pauseOverlay.classList.add('hidden');
    }
  }
});
resumeBtn.addEventListener('click', () => {
  if (currentGame) {
    currentGame.resume();
    pauseOverlay.classList.add('hidden');
  }
});

playAgainBtn.addEventListener('click', () => {
  // Reset values and start new game
  startGame();
});

shareBtn.addEventListener('click', () => {
  // Construct share text
  const url = window.location.href;
  const text = `I just played Budget Blitz and finished with ₹${balanceEl.textContent}! Try it yourself:`;
  if (navigator.share) {
    navigator.share({ title: 'Budget Blitz', text, url }).catch(() => {});
  } else {
    // Fallback: copy to clipboard
    const full = `${text} ${url}`;
    navigator.clipboard.writeText(full).then(() => {
      alert('Link copied to clipboard!');
    });
  }
});

// Keyboard controls
document.addEventListener('keydown', e => {
  if (!currentGame || currentGame.paused) return;
  if (e.key === 'a' || e.key === 'A') {
    e.preventDefault();
    currentGame.approve();
  } else if (e.key === 'd' || e.key === 'D') {
    e.preventDefault();
    currentGame.decline();
  } else if (e.key === ' ') {
    e.preventDefault();
    if (!currentGame.paused) {
      currentGame.pause();
      pauseOverlay.classList.remove('hidden');
    } else {
      currentGame.resume();
      pauseOverlay.classList.add('hidden');
    }
  }
});

// Initially show landing screen
showLanding();