const STORAGE_KEY = 'ccna_srs_data';

const DEFAULT_EASE = 2.5;
const MIN_EASE = 1.3;
const DAY_MS = 24 * 60 * 60 * 1000;

function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveAll(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // quota / private mode — silently ignore
  }
}

export function getCard(questionId) {
  const all = loadAll();
  return all[questionId] || null;
}

export function getAllCards() {
  return loadAll();
}

function newCard() {
  return {
    easeFactor: DEFAULT_EASE,
    interval: 0,
    repetitions: 0,
    nextReview: new Date().toISOString(),
    lastResult: null,
  };
}

// SM-2 update. quality: 0–5. correct ≈ 4, incorrect ≈ 1.
function updateCard(card, quality) {
  const next = { ...card };

  if (quality < 3) {
    next.repetitions = 0;
    next.interval = 1;
  } else {
    next.repetitions += 1;
    if (next.repetitions === 1) {
      next.interval = 1;
    } else if (next.repetitions === 2) {
      next.interval = 3;
    } else {
      next.interval = Math.round(next.interval * next.easeFactor);
    }
  }

  const ef = next.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  next.easeFactor = Math.max(MIN_EASE, ef);

  next.nextReview = new Date(Date.now() + next.interval * DAY_MS).toISOString();
  next.lastResult = quality >= 3 ? 'correct' : 'incorrect';
  return next;
}

export function recordAnswer(questionId, isCorrect) {
  const all = loadAll();
  const existing = all[questionId] || newCard();
  const quality = isCorrect ? 4 : 1;
  all[questionId] = updateCard(existing, quality);
  saveAll(all);
  return all[questionId];
}

export function isDue(questionId, now = Date.now()) {
  const card = getCard(questionId);
  if (!card) return true;
  return new Date(card.nextReview).getTime() <= now;
}

// Order: due first (oldest nextReview), then unseen, then not-yet-due (closest first).
export function sortByPriority(questionIds, now = Date.now()) {
  const all = loadAll();
  return [...questionIds].sort((a, b) => {
    const ca = all[a];
    const cb = all[b];
    const dueA = !ca || new Date(ca.nextReview).getTime() <= now;
    const dueB = !cb || new Date(cb.nextReview).getTime() <= now;
    if (dueA && !dueB) return -1;
    if (!dueA && dueB) return 1;

    const seenA = !!ca;
    const seenB = !!cb;
    if (dueA && dueB) {
      if (!seenA && seenB) return 1;
      if (seenA && !seenB) return -1;
      const ta = ca ? new Date(ca.nextReview).getTime() : 0;
      const tb = cb ? new Date(cb.nextReview).getTime() : 0;
      return ta - tb;
    }
    return new Date(ca.nextReview).getTime() - new Date(cb.nextReview).getTime();
  });
}

export function resetCard(questionId) {
  const all = loadAll();
  delete all[questionId];
  saveAll(all);
}

export function resetAll() {
  saveAll({});
}
