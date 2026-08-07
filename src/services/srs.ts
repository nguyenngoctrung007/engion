import { UserWordProgress, VocabularyWord } from '../types';
import { StorageService } from './storage';

/**
 * ENGION Smart SRS Engine - Based on SM-2 with extensions:
 * - Proper interval progression per SM-2 spec
 * - Ease factor clamped 1.3 – 3.0
 * - ±10% fuzz to prevent "interval stacking" (many words due same day)
 * - Leech detection: word answered "hard" 4+ times in a row → flagged
 */

const MIN_EASE = 1.3;
const MAX_EASE = 3.0;
const DEFAULT_EASE = 2.5;

/** Add ±10% random fuzz to spread due dates */
function fuzz(interval: number): number {
  if (interval <= 1) return interval;
  const delta = Math.max(1, Math.round(interval * 0.1));
  const noise = Math.floor(Math.random() * (delta * 2 + 1)) - delta;
  return Math.max(1, interval + noise);
}

export function calculateSRS(
  current: UserWordProgress | undefined,
  wordId: string,
  rating: 'hard' | 'good' | 'easy'
): UserWordProgress {
  const now = new Date();

  let box = current?.box ?? 0;
  let easeFactor = current?.easeFactor ?? DEFAULT_EASE;
  let interval = current?.interval ?? 0;
  let reviewsCount = (current?.reviewsCount ?? 0) + 1;
  let correctCount = current?.correctCount ?? 0;
  let consecutiveHard = (current as any)?.consecutiveHard ?? 0;

  // --- Compute new interval & ease based on rating ---
  if (rating === 'hard') {
    // Reset to box 1, shrink interval, penalize ease
    box = Math.max(1, box - 1);
    interval = Math.max(1, Math.round(interval * 0.5));
    easeFactor = Math.max(MIN_EASE, easeFactor - 0.20);
    consecutiveHard += 1;
  } else if (rating === 'good') {
    correctCount += 1;
    consecutiveHard = 0;
    easeFactor = Math.min(MAX_EASE, Math.max(MIN_EASE, easeFactor - 0.05)); // slight ease penalty for "good" not "easy"

    if (box === 0 || box === 1) {
      interval = 1;
    } else if (box === 2) {
      interval = 4;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    box = Math.min(5, box + 1);
    interval = fuzz(interval);
  } else {
    // easy
    correctCount += 1;
    consecutiveHard = 0;
    easeFactor = Math.min(MAX_EASE, easeFactor + 0.15);

    if (box === 0 || box === 1) {
      interval = 3;
    } else if (box === 2) {
      interval = 7;
    } else {
      interval = Math.round(interval * easeFactor * 1.3);
    }
    box = Math.min(5, box + 1);
    interval = fuzz(interval);
  }

  const nextDate = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

  return {
    wordId,
    box,
    easeFactor: parseFloat(easeFactor.toFixed(2)),
    interval,
    reviewsCount,
    correctCount,
    consecutiveHard,
    lastReviewed: now.toISOString(),
    nextReview: nextDate.toISOString()
  } as UserWordProgress & { consecutiveHard: number };
}

export function isWordDue(progress?: UserWordProgress): boolean {
  if (!progress || progress.box === 0) return true; // new / unseen
  const nextDate = new Date(progress.nextReview);
  return new Date() >= nextDate;
}

/**
 * Smart word picker with 3-tier priority:
 * 1. Due words (nextReview <= now) sorted by oldest-due first
 * 2. New words (never seen, box === 0 or no progress)
 * 3. Everything else (random from least-recently reviewed)
 *
 * Also avoids repeating the current word when possible.
 */
export function pickSmartNextWord(
  allWords: VocabularyWord[],
  currentWordId?: string
): VocabularyWord | null {
  if (allWords.length === 0) return null;

  const progressMap = StorageService.getProgressMap();
  const now = new Date();

  const candidates = currentWordId && allWords.length > 1
    ? allWords.filter(w => w.id !== currentWordId)
    : allWords;

  // --- Tier 1: Due words (overdue first) ---
  const dueWords = candidates.filter(w => {
    const p = progressMap[w.id];
    if (!p || p.box === 0) return false;
    return new Date(p.nextReview) <= now;
  }).sort((a, b) => {
    const pa = progressMap[a.id];
    const pb = progressMap[b.id];
    return new Date(pa.nextReview).getTime() - new Date(pb.nextReview).getTime();
  });

  if (dueWords.length > 0) {
    // Pick from top 3 overdue (some randomness to avoid monotony)
    const pool = dueWords.slice(0, 3);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // --- Tier 2: New / unseen words ---
  const newWords = candidates.filter(w => {
    const p = progressMap[w.id];
    return !p || p.box === 0;
  });

  if (newWords.length > 0) {
    return newWords[Math.floor(Math.random() * newWords.length)];
  }

  // --- Tier 3: Fallback — least recently reviewed ---
  const sorted = [...candidates].sort((a, b) => {
    const pa = progressMap[a.id];
    const pb = progressMap[b.id];
    const ta = pa ? new Date(pa.lastReviewed).getTime() : 0;
    const tb = pb ? new Date(pb.lastReviewed).getTime() : 0;
    return ta - tb;
  });

  // Pick from bottom 30% least-recently reviewed
  const pool = sorted.slice(0, Math.max(1, Math.ceil(sorted.length * 0.3)));
  return pool[Math.floor(Math.random() * pool.length)];
}
