import { AppSettings, VocabularyWord, UserWordProgress, LearningStats, CustomDeckCategory } from '../types';
import { BUILTIN_VOCABULARY } from '../data/vocabulary';

const SETTINGS_KEY = 'engion_app_settings';
const PROGRESS_KEY = 'engion_word_progress';
const CUSTOM_WORDS_KEY = 'engion_custom_words';
const STATS_KEY = 'engion_user_stats';
const FAVORITES_KEY = 'engion_favorite_words';
const CUSTOM_DECKS_KEY = 'engion_custom_decks';
const DELETED_WORD_IDS_KEY = 'engion_deleted_words';
const DELETED_DECK_IDS_KEY = 'engion_deleted_decks';

export const DEFAULT_SETTINGS: AppSettings = {
  popupIntervalMinutes: 30, // 30 mins
  selectedDecks: ['it', 'toeic', 'ielts', 'oxford'],
  autoCloseSeconds: 0, // No auto close by default
  soundEnabled: true,
  dndUntil: null,
  quizMode: 'random',
  windowPosition: 'bottom-right',
  autoLaunch: true,
  autoAudio: false,
  accent: 'US',
  targetLanguage: 'vi',
  dndEnabled: false,
  dndStart: '22:00',
  dndEnd: '07:00',
  dailyTargetWords: 10
};

export const StorageService = {
  getSettings(): AppSettings {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: AppSettings): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },

  isDndActive(settings?: AppSettings): boolean {
    const s = settings || this.getSettings();
    const now = new Date();

    // 1. Check temporary DND (dndUntil)
    if (s.dndUntil) {
      const untilDate = new Date(s.dndUntil);
      if (!isNaN(untilDate.getTime()) && now < untilDate) {
        return true;
      }
    }

    // 2. Check scheduled DND (Quiet Hours: dndEnabled, dndStart, dndEnd)
    if (s.dndEnabled && s.dndStart && s.dndEnd) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const [startH, startM] = s.dndStart.split(':').map(Number);
      const [endH, endM] = s.dndEnd.split(':').map(Number);

      const startMinutes = (startH || 0) * 60 + (startM || 0);
      const endMinutes = (endH || 0) * 60 + (endM || 0);

      if (startMinutes <= endMinutes) {
        // e.g. 13:00 to 14:00
        if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
          return true;
        }
      } else {
        // Overnight e.g. 22:00 to 07:00
        if (currentMinutes >= startMinutes || currentMinutes < endMinutes) {
          return true;
        }
      }
    }

    return false;
  },

  getCustomWords(): VocabularyWord[] {
    const raw = localStorage.getItem(CUSTOM_WORDS_KEY);
    if (!raw) return [];
    try {
      const parsed: VocabularyWord[] = JSON.parse(raw);
      return parsed.filter(w => w.word && !w.word.startsWith('term_') && !w.id.startsWith('oxford_3k_'));
    } catch {
      return [];
    }
  },

  saveCustomWord(word: VocabularyWord): void {
    const list = this.getCustomWords();
    list.unshift(word);
    localStorage.setItem(CUSTOM_WORDS_KEY, JSON.stringify(list));
  },

  getDeletedWordIds(): string[] {
    const raw = localStorage.getItem(DELETED_WORD_IDS_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  deleteWord(id: string): void {
    const customList = this.getCustomWords().filter(w => w.id !== id);
    localStorage.setItem(CUSTOM_WORDS_KEY, JSON.stringify(customList));

    const deletedIds = new Set(this.getDeletedWordIds());
    deletedIds.add(id);
    localStorage.setItem(DELETED_WORD_IDS_KEY, JSON.stringify(Array.from(deletedIds)));
  },

  deleteCustomWord(id: string): void {
    this.deleteWord(id);
  },

  importPresetWords(presetWords: VocabularyWord[]): number {
    const existingWords = this.getAllVocabulary();
    const existingWordStrings = new Set(existingWords.map(w => w.word.toLowerCase().trim()));
    const customList = this.getCustomWords();

    let addedCount = 0;

    presetWords.forEach(w => {
      if (!existingWordStrings.has(w.word.toLowerCase().trim())) {
        customList.unshift(w);
        existingWordStrings.add(w.word.toLowerCase().trim());
        addedCount++;
      }
    });

    if (addedCount > 0) {
      localStorage.setItem(CUSTOM_WORDS_KEY, JSON.stringify(customList));
    }

    return addedCount;
  },

  updateWord(word: VocabularyWord): void {
    const customList = this.getCustomWords();
    const index = customList.findIndex(w => w.id === word.id);

    if (index !== -1) {
      customList[index] = word;
      localStorage.setItem(CUSTOM_WORDS_KEY, JSON.stringify(customList));
    } else {
      // If editing a builtin word, save as modified custom word
      this.saveCustomWord(word);
    }
  },

  getCustomDeckCategories(): CustomDeckCategory[] {
    const raw = localStorage.getItem(CUSTOM_DECKS_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  addCustomDeckCategory(name: string): CustomDeckCategory {
    const list = this.getCustomDeckCategories();
    const id = 'custom_' + Date.now();
    const newDeck: CustomDeckCategory = {
      id,
      name,
      createdAt: new Date().toISOString()
    };
    list.push(newDeck);
    localStorage.setItem(CUSTOM_DECKS_KEY, JSON.stringify(list));
    return newDeck;
  },

  getDeletedDeckIds(): string[] {
    const raw = localStorage.getItem(DELETED_DECK_IDS_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  deleteDeck(deckId: string): void {
    const deletedDecks = new Set(this.getDeletedDeckIds());
    deletedDecks.add(deckId);
    localStorage.setItem(DELETED_DECK_IDS_KEY, JSON.stringify(Array.from(deletedDecks)));

    this.deleteCustomDeckCategory(deckId);

    const allWords = this.getAllVocabulary();
    const targetWords = allWords.filter(w => w.deck === deckId);
    const deletedWords = new Set(this.getDeletedWordIds());
    
    targetWords.forEach(w => deletedWords.add(w.id));
    localStorage.setItem(DELETED_WORD_IDS_KEY, JSON.stringify(Array.from(deletedWords)));
  },

  deleteCustomDeckCategory(id: string): void {
    const list = this.getCustomDeckCategories().filter(d => d.id !== id);
    localStorage.setItem(CUSTOM_DECKS_KEY, JSON.stringify(list));

    const customWords = this.getCustomWords();
    const remainingWords = customWords.filter(w => w.deck !== id);
    localStorage.setItem(CUSTOM_WORDS_KEY, JSON.stringify(remainingWords));
  },

  resetAllData(): void {
    this.resetToDefaultPresets();
  },

  resetToDefaultPresets(): void {
    localStorage.removeItem(CUSTOM_WORDS_KEY);
    localStorage.removeItem(CUSTOM_DECKS_KEY);
    localStorage.removeItem(DELETED_WORD_IDS_KEY);
    localStorage.removeItem(DELETED_DECK_IDS_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(PROGRESS_KEY);
    localStorage.removeItem(STATS_KEY);
    localStorage.removeItem(FAVORITES_KEY);
  },

  cleanEverythingCompletely(): void {
    this.resetToDefaultPresets();
    const allBuiltinWordIds = BUILTIN_VOCABULARY.map(w => w.id);
    localStorage.setItem(DELETED_WORD_IDS_KEY, JSON.stringify(allBuiltinWordIds));
    localStorage.setItem(DELETED_DECK_IDS_KEY, JSON.stringify(['it', 'toeic', 'ielts', 'oxford', 'custom']));
  },

  getAllVocabulary(): VocabularyWord[] {
    const custom = this.getCustomWords();
    const deletedIds = new Set(this.getDeletedWordIds());
    const all = [...custom, ...BUILTIN_VOCABULARY];
    return all.filter(w => !deletedIds.has(w.id));
  },

  getProgressMap(): Record<string, UserWordProgress> {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  },

  saveWordProgress(progress: UserWordProgress): void {
    const map = this.getProgressMap();
    map[progress.wordId] = progress;
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(map));

    // Trigger Windows notification when daily target is met
    try {
      const stats = this.getStats();
      const settings = this.getSettings();
      const target = settings.dailyTargetWords || 10;
      if (stats.todayLearnedCount === target) {
        if ((window as any).electronAPI && (window as any).electronAPI.sendNativeNotification) {
          (window as any).electronAPI.sendNativeNotification({
            title: '🎉 Xuất Sắc! Hoàn Thành Mục Tiêu Ngày',
            body: `Chúc mừng bạn đã hoàn thành 100% chỉ tiêu ${target} từ vựng hôm nay!`
          });
        }
      }
    } catch {}
  },

  getStats(): LearningStats {
    const progressMap = this.getProgressMap();
    const progressList = Object.values(progressMap);
    
    let totalLearned = progressList.length;
    let masteredCount = progressList.filter(p => p.box >= 4).length;
    let learningCount = totalLearned - masteredCount;

    let totalReviews = progressList.reduce((acc, p) => acc + p.reviewsCount, 0);
    let totalCorrect = progressList.reduce((acc, p) => acc + p.correctCount, 0);
    let accuracyRate = totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 100;

    const todayStr = new Date().toISOString().split('T')[0];
    let todayLearnedCount = progressList.filter(p => p.lastReviewed && p.lastReviewed.startsWith(todayStr)).length;

    const rawStats = localStorage.getItem(STATS_KEY);
    let streakDays = 1;
    let lastActiveDate = todayStr;

    if (rawStats) {
      try {
        const parsed = JSON.parse(rawStats);
        streakDays = parsed.streakDays || 1;
        lastActiveDate = parsed.lastActiveDate || lastActiveDate;
      } catch {}
    }

    return {
      totalLearned,
      masteredCount,
      learningCount,
      streakDays,
      lastActiveDate,
      accuracyRate,
      todayLearnedCount
    };
  },

  exportData(): string {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings: this.getSettings(),
      customWords: this.getCustomWords(),
      progressMap: this.getProgressMap()
    };
    return JSON.stringify(data, null, 2);
  },

  importData(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.settings) this.saveSettings(parsed.settings);
      if (parsed.customWords && Array.isArray(parsed.customWords)) {
        localStorage.setItem(CUSTOM_WORDS_KEY, JSON.stringify(parsed.customWords));
      }
      if (parsed.progressMap && typeof parsed.progressMap === 'object') {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(parsed.progressMap));
      }
      return true;
    } catch {
      return false;
    }
  },

  getFavoriteIds(): string[] {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  toggleFavorite(wordId: string): boolean {
    const list = this.getFavoriteIds();
    const exists = list.includes(wordId);
    let updated: string[];
    if (exists) {
      updated = list.filter(id => id !== wordId);
    } else {
      updated = [...list, wordId];
    }
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    return !exists;
  },

  exportCSV(): string {
    const words = this.getAllVocabulary();
    const headers = ['Word', 'Phonetic', 'Part of Speech', 'Definition', 'Example', 'Deck'];
    const rows = words.map(w => [
      `"${w.word.replace(/"/g, '""')}"`,
      `"${w.phonetic.replace(/"/g, '""')}"`,
      `"${w.pos.replace(/"/g, '""')}"`,
      `"${w.definition.replace(/"/g, '""')}"`,
      `"${(w.example || '').replace(/"/g, '""')}"`,
      `"${w.deck.replace(/"/g, '""')}"`
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
};
