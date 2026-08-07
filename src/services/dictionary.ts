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

    const normalizePos = (rawPos: string): string => {
      const p = (rawPos || '').toLowerCase();
      if (p.includes('verb') || p.includes('participle')) return 'verb';
      if (p.includes('adj')) return 'adjective';
      if (p.includes('adv')) return 'adverb';
      if (p.includes('noun')) return 'noun';
      if (p.includes('interjection') || p.includes('preposition') || p.includes('conjunction') || p.includes('phrase')) return 'phrase';
      return 'noun';
    };

    let phonetic = '';
    let pos = '';
    let englishDef = '';
    let example = '';
    let isValidWord = false;

    const detectedPosList: string[] = [];

    // 1. Fetch Phonetics, POS, and Example from Free English Dictionary API
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data) && data.length > 0) {
          isValidWord = true;
          for (const entry of data) {
            if (!phonetic && entry.phonetic) phonetic = entry.phonetic;
            if (!phonetic && entry.phonetics && Array.isArray(entry.phonetics)) {
              const p = entry.phonetics.find((item: any) => item.text && item.text.trim());
              if (p) phonetic = p.text.trim();
            }

            if (entry.meanings && Array.isArray(entry.meanings)) {
              for (const m of entry.meanings) {
                if (m.partOfSpeech) {
                  const norm = normalizePos(m.partOfSpeech);
                  if (!detectedPosList.includes(norm)) detectedPosList.push(norm);
                }

                if (m.definitions && Array.isArray(m.definitions)) {
                  for (const d of m.definitions) {
                    if (!englishDef && d.definition) englishDef = d.definition;
                    if (!example && d.example) {
                      example = d.example;
                      break;
                    }
                  }
                }
              }
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

    // 3. Smart POS selector: If dictionary contains 'verb' & translation is action verb (or ends in -ing/-ed), pick 'verb'!
    const viDefLower = (finalTargetDef || '').toLowerCase().trim();
    const isNounPrefix = viDefLower.startsWith('sự ') || viDefLower.startsWith('cuộc ') || viDefLower.startsWith('trò ') || viDefLower.startsWith('cái ');

    if (detectedPosList.includes('verb')) {
      if (cleanWord.endsWith('ing') || cleanWord.endsWith('ed') || cleanWord.endsWith('ize') || cleanWord.endsWith('ate') || !isNounPrefix) {
        pos = 'verb';
      } else {
        pos = detectedPosList[0] || 'noun';
      }
    } else {
      pos = detectedPosList[0] || 'noun';
    }

    // Helper for natural example sentence generator when dictionary API has no example field
    const generateNaturalExample = (wordStr: string, posType: string): string => {
      const capWord = wordStr.charAt(0).toUpperCase() + wordStr.slice(1);
      const lowerWord = wordStr.toLowerCase();

      if (lowerWord === 'okay' || lowerWord === 'hello' || lowerWord === 'hi') {
        return `"${capWord}, everything is ready for the meeting."`;
      }
      if (posType.includes('verb')) {
        return `Please ${lowerWord} this task as soon as possible.`;
      }
      if (posType.includes('adj')) {
        return `The team found a very ${lowerWord} solution to the problem.`;
      }
      if (posType.includes('adv')) {
        return `She completed the work ${lowerWord} without any issues.`;
      }
      return `She explained the concept of ${lowerWord} clearly to everyone.`;
    };

    return {
      word: cleanWord,
      phonetic: phonetic || `/${cleanWord}/`,
      pos: pos || 'noun',
      definition: finalTargetDef || englishDef || targetWordTrans,
      example: example || generateNaturalExample(cleanWord, pos)
    };
  }
};
