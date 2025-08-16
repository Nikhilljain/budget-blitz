// UI helpers for Budget Blitz

/**
 * Render the current card and next preview in the DOM.
 * @param {HTMLElement} lane container for cards
 * @param {HTMLElement} preview preview element
 * @param {Object|null} card current card object
 * @param {Object|null} next next card object
 */
export function renderCard(lane, preview, card, next) {
  // Clear current lane
  lane.innerHTML = '';
  if (card) {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';
    cardEl.setAttribute('role', 'group');
    cardEl.setAttribute('aria-live', 'assertive');
    const title = document.createElement('h3');
    title.textContent = `${card.label} – ₹${card.amount}`;
    const note = document.createElement('p');
    note.textContent = card.note;
    cardEl.appendChild(title);
    cardEl.appendChild(note);
    lane.appendChild(cardEl);
  }
  // Render next preview
  if (next) {
    preview.textContent = `Next: ${next.label} – ₹${next.amount}`;
  } else {
    preview.textContent = '';
  }
}

/**
 * Attach swipe gesture handling to allow approving or declining via swipe.
 * @param {HTMLElement} lane card lane element
 * @param {function} onSwipeRight callback for approve
 * @param {function} onSwipeLeft callback for decline
 */
export function setupSwipe(lane, onSwipeRight, onSwipeLeft) {
  let startX = 0;
  let startY = 0;
  let isDragging = false;
  lane.addEventListener('pointerdown', e => {
    if (e.pointerType === 'touch' || e.pointerType === 'mouse') {
      startX = e.clientX;
      startY = e.clientY;
      isDragging = true;
    }
  });
  lane.addEventListener('pointerup', e => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    isDragging = false;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) onSwipeRight();
      else onSwipeLeft();
    }
  });
  lane.addEventListener('pointercancel', () => {
    isDragging = false;
  });
}