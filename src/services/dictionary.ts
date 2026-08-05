import { StorageService } from './storage';

export interface AutoDictResult {
  word: string;
  phonetic: string;
  pos: string;
  definition: string;
  example: string;
}

export const DictionaryService = {
  async translateToTargetLang(text: string, targetLang?: string): Promise<string> {
    const lang = targetLang || StorageService.getSettings().targetLanguage || 'vi';
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`;
      const res = await fetch(url);
      if (!res.ok) return '';
      const data = await res.json();
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        return data[0][0][0];
      }
      return '';
    } catch {
      return '';
    }
  },

  async translateToVietnamese(text: string): Promise<string> {
    return this.translateToTargetLang(text, 'vi');
  },

  async lookupWord(word: string, targetLang?: string): Promise<AutoDictResult | null> {
    const cleanWord = word.trim().toLowerCase();
    if (!cleanWord) return null;

    const lang = targetLang || StorageService.getSettings().targetLanguage || 'vi';

    let phonetic = '';
    let pos = 'noun';
    let englishDef = '';
    let example = '';
    let isValidWord = false;

    // 1. Fetch Phonetics, POS, and Example from Free English Dictionary API
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data) && data.length > 0) {
          isValidWord = true;
          const entry = data[0];
          phonetic = entry.phonetic || entry.phonetics?.find((p: any) => p.text)?.text || '';

          if (entry.meanings && entry.meanings.length > 0) {
            const m = entry.meanings[0];
            pos = m.partOfSpeech || 'noun';
            if (m.definitions && m.definitions.length > 0) {
              englishDef = m.definitions[0].definition || '';
              example = m.definitions[0].example || '';
            }
          }
        }
      }
    } catch {}

    // 2. Translate word to target language via Google Translate API
    const targetWordTrans = await this.translateToTargetLang(cleanWord, lang);
    const isTransIdentical = targetWordTrans.trim().toLowerCase() === cleanWord;

    // If both Dictionary API failed (404/invalid) AND translation is identical or empty, it's gibberish/invalid!
    if (!isValidWord && (isTransIdentical || !targetWordTrans)) {
      return null;
    }

    let finalTargetDef = !isTransIdentical ? targetWordTrans : '';
    if (!finalTargetDef && englishDef) {
      finalTargetDef = await this.translateToTargetLang(englishDef, lang);
    }

    return {
      word: cleanWord,
      phonetic: phonetic || `/${cleanWord}/`,
      pos: pos || 'noun',
      definition: finalTargetDef || englishDef || targetWordTrans,
      example: example || `${cleanWord} is a useful English term.`
    };
  }
};
