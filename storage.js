// Settings persistence using localStorage

const STORAGE_KEY = 'budgetBlitzSettings';

/**
 * Load settings from localStorage. Returns default values if none stored.
 */
export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings();
    const data = JSON.parse(raw);
    return { ...defaultSettings(), ...data };
  } catch (e) {
    return defaultSettings();
  }
}

/**
 * Save settings to localStorage.
 * @param {Object} settings
 */
export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    // ignore
  }
}

function defaultSettings() {
  return {
    income: 50000,
    difficulty: 'normal',
    reducedMotion: false,
    sound: false
  };
}

/**
 * Parse query string parameters from location.search.
 */
export function getQueryParams() {
  const params = {};
  if (typeof window === 'undefined') return params;
  const query = window.location.search.substring(1);
  query.split('&').forEach(part => {
    const [key, value] = part.split('=');
    if (key) params[decodeURIComponent(key)] = decodeURIComponent(value || '');
  });
  return params;
}