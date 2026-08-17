export type DeckType = 'oxford' | 'toeic' | 'ielts' | 'it' | 'custom' | string;

export interface CustomDeckCategory {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
}

export interface VocabularyWord {
  id: string;
  word: string;
  phonetic: string;
  pos: string; // Part of speech (noun, verb, adj, etc.)
  definition: string; // Vietnamese translation
  definitionEn?: string; // English definition
  example: string; // Example sentence using the word
  deck: DeckType;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface UserWordProgress {
  wordId: string;
  box: number; // SRS box / level (0=new, 1-5)
  easeFactor: number; // SM-2 ease factor (default 2.5, min 1.3, max 3.0)
  interval: number; // Days until next review
  reviewsCount: number;
  correctCount: number;
  consecutiveHard: number; // How many times in a row rated "hard" (leech detection)
  lastReviewed: string; // ISO date string
  nextReview: string; // ISO date string
}

export type TargetLanguage = 'vi' | 'ja' | 'ko' | 'zh' | 'fr' | 'es' | 'de';

export interface AppSettings {
  popupIntervalMinutes: number; // e.g. 15, 30, 60, or 0.16 (10 sec test)
  selectedDecks: DeckType[];
  autoCloseSeconds: number; // 0 = disabled, or e.g. 45 seconds
  soundEnabled: boolean;
  dndUntil: string | null; // ISO string if DND is active
  quizMode: 'random' | 'flashcard' | 'fill' | 'choice';
  windowPosition: 'bottom-right' | 'top-right' | 'center';
  autoLaunch?: boolean;
  autoAudio?: boolean;
  accent?: 'US' | 'UK';
  targetLanguage?: TargetLanguage;
  dndEnabled?: boolean;
  dndStart?: string;
  dndEnd?: string;
  dailyTargetWords?: number; // e.g. 5, 10, 15, 20, 30 words/day
  wordDifficulty?: number; // 1=Easy, 2=Med-Easy, 3=Medium, 4=Med-Hard, 5=Hard
}

export interface LearningStats {
  totalLearned: number;
  masteredCount: number;
  learningCount: number;
  streakDays: number;
  lastActiveDate: string;
  accuracyRate: number;
  todayLearnedCount: number;
  totalReviews?: number;
  totalWrong?: number;
  box1Count?: number;
  box2Count?: number;
  box3Count?: number;
  box4Count?: number;
  box5Count?: number;
}
