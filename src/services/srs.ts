import { UserWordProgress } from '../types';

export function calculateSRS(
  current: UserWordProgress | undefined,
  wordId: string,
  rating: 'hard' | 'good' | 'easy'
): UserWordProgress {
  const now = new Date();
  
  let box = current ? current.box : 1;
  let easeFactor = current ? current.easeFactor : 2.5;
  let interval = current ? current.interval : 1;
  let reviewsCount = current ? current.reviewsCount + 1 : 1;
  let correctCount = current ? current.correctCount : 0;

  if (rating === 'hard') {
    box = 1;
    interval = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else if (rating === 'good') {
    correctCount += 1;
    if (box === 1) {
      interval = 1;
    } else if (box === 2) {
      interval = 3;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    box = Math.min(5, box + 1);
  } else if (rating === 'easy') {
    correctCount += 1;
    if (box === 1) {
      interval = 2;
    } else if (box === 2) {
      interval = 5;
    } else {
      interval = Math.round(interval * easeFactor * 1.3);
    }
    box = Math.min(5, box + 1);
    easeFactor += 0.15;
  }

  const nextDate = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

  return {
    wordId,
    box,
    easeFactor: parseFloat(easeFactor.toFixed(2)),
    interval,
    reviewsCount,
    correctCount,
    lastReviewed: now.toISOString(),
    nextReview: nextDate.toISOString()
  };
}

export function isWordDue(progress?: UserWordProgress): boolean {
  if (!progress) return true; // Unlearned words are due
  const nextDate = new Date(progress.nextReview);
  return new Date() >= nextDate;
}
