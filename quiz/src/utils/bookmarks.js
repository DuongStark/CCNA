const STORAGE_KEY = 'ccna_bookmarks';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function save(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // quota / private mode — silently ignore
  }
}

export function getAll() {
  return load();
}

export function getAllIds() {
  return Object.keys(load());
}

export function isBookmarked(questionId) {
  return !!load()[questionId];
}

export function toggle(questionId) {
  const all = load();
  if (all[questionId]) {
    delete all[questionId];
  } else {
    all[questionId] = Date.now(); // store timestamp for potential future use
  }
  save(all);
  return !!all[questionId];
}

export function remove(questionId) {
  const all = load();
  if (all[questionId]) {
    delete all[questionId];
    save(all);
  }
}

export function clearAll() {
  save({});
}

export function count() {
  return Object.keys(load()).length;
}
