import { StorageService } from './storage';

export interface AutoDictResult {
  word: string;
  phonetic: string;
  pos: string;
  definition: string;
  example: string;
  originalQuery?: string;
  wasCorrected?: boolean;
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
    const rawWord = word.trim().toLowerCase();
    if (!rawWord) return null;

    let cleanWord = rawWord;
    const originalInput = rawWord;
    let wasCorrected = false;

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

    // Helper to query Free English Dictionary API
    const fetchFromDictApi = async (query: string) => {
      let p = '';
      let engDef = '';
      let ex = '';
      let posList: string[] = [];
      let ok = false;
      try {
        const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            ok = true;
            for (const entry of data) {
              if (!p && entry.phonetic) p = entry.phonetic;
              if (!p && entry.phonetics && Array.isArray(entry.phonetics)) {
                const item = entry.phonetics.find((i: any) => i.text && i.text.trim());
                if (item) p = item.text.trim();
              }
              if (entry.meanings && Array.isArray(entry.meanings)) {
                for (const m of entry.meanings) {
                  if (m.partOfSpeech) {
                    const norm = normalizePos(m.partOfSpeech);
                    if (!posList.includes(norm)) posList.push(norm);
                  }
                  if (m.definitions && Array.isArray(m.definitions)) {
                    for (const d of m.definitions) {
                      if (!engDef && d.definition) engDef = d.definition;
                      if (!ex && d.example) {
                        ex = d.example;
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
      return { ok, p, engDef, ex, posList };
    };

    // 1. First attempt: Query exact user input
    let dictRes = await fetchFromDictApi(cleanWord);

    // 2. If 404 (misspelled word like "incridible"), query Datamuse Spellcheck API to find suggestion!
    if (!dictRes.ok) {
      try {
        const suggRes = await fetch(`https://api.datamuse.com/sug?s=${encodeURIComponent(cleanWord)}`);
        if (suggRes.ok) {
          const suggData = await suggRes.json();
          if (Array.isArray(suggData) && suggData.length > 0) {
            const topCandidate = suggData[0].word.toLowerCase().trim();
            if (topCandidate && topCandidate !== cleanWord) {
              const candRes = await fetchFromDictApi(topCandidate);
              if (candRes.ok) {
                dictRes = candRes;
                cleanWord = topCandidate;
                wasCorrected = true;
              }
            }
          }
        }
      } catch {}
    }

    let phonetic = dictRes.p;
    let pos = '';
    let englishDef = dictRes.engDef;
    let example = dictRes.ex;
    let isValidWord = dictRes.ok;
    const detectedPosList = dictRes.posList;

    // 3. Translate word to target language via Google Translate API
    const targetWordTrans = await this.translateToTargetLang(cleanWord, lang);
    const isTransIdentical = targetWordTrans.trim().toLowerCase() === cleanWord;

    // If both Dictionary API failed AND translation is identical or empty, it's gibberish/invalid!
    if (!isValidWord && (isTransIdentical || !targetWordTrans)) {
      return null;
    }

    let finalTargetDef = !isTransIdentical ? targetWordTrans : '';
    if (!finalTargetDef && englishDef) {
      finalTargetDef = await this.translateToTargetLang(englishDef, lang);
    }

    // 4. Smart POS selector
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

    // Helper for natural example sentence generator
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
      example: example || generateNaturalExample(cleanWord, pos),
      originalQuery: originalInput,
      wasCorrected
    };
  },

  getRandomSuggestedWord(diffLevel?: number): string {
    const existingWords = StorageService.getAllVocabulary().map(w => w.word.toLowerCase());
    
    let pool = [
      'resilient', 'pragmatic', 'ubiquitous', 'mitigate', 'ambiguous',
      'delineate', 'scrutinize', 'meticulous', 'eloquent', 'advocate',
      'ephemeral', 'serendipity', 'versatile', 'proactive', 'aesthetic',
      'comprehensive', 'paradigm', 'inevitable', 'quintessential', 'catalyst',
      'idempotent', 'refactor', 'deprecated', 'concurrency', 'middleware',
      'asynchronous', 'polymorphism', 'encapsulation', 'microservices', 'pipeline',
      'negotiate', 'implement', 'collaborate', 'schedule', 'requisition',
      'compliance', 'delegation', 'itinerary', 'remittance', 'lucrative',
      'consolidate', 'facilitate', 'lucid', 'benchmark', 'synergy'
    ];

    if (diffLevel === 1 || diffLevel === 2) {
      pool = ['water', 'house', 'apple', 'smile', 'garden', 'family', 'travel', 'friend', 'listen', 'choice', 'future', 'moment', 'journey', 'nature', 'bright'];
    } else if (diffLevel === 4 || diffLevel === 5) {
      pool = ['defenestration', 'ephemeral', 'quintessential', 'serendipity', 'idempotent', 'ubiquitous', 'scrutinize', 'delineate', 'polymorphism', 'encapsulation'];
    }

    const unadded = pool.filter(w => !existingWords.includes(w.toLowerCase()));
    if (unadded.length > 0) {
      return unadded[Math.floor(Math.random() * unadded.length)];
    }

    return pool[Math.floor(Math.random() * pool.length)];
  },

  getRandomSuggestions(count: number = 4, diffLevel?: number): string[] {
    const existingWords = StorageService.getAllVocabulary().map(w => w.word.toLowerCase());
    
    let pool = [
      'resilient', 'pragmatic', 'ubiquitous', 'mitigate', 'ambiguous',
      'delineate', 'scrutinize', 'meticulous', 'eloquent', 'advocate',
      'ephemeral', 'serendipity', 'versatile', 'proactive', 'aesthetic',
      'comprehensive', 'paradigm', 'inevitable', 'quintessential', 'catalyst',
      'idempotent', 'refactor', 'deprecated', 'concurrency', 'middleware',
      'asynchronous', 'polymorphism', 'encapsulation', 'microservices', 'pipeline',
      'negotiate', 'implement', 'collaborate', 'schedule', 'requisition',
      'compliance', 'delegation', 'itinerary', 'remittance', 'lucrative',
      'consolidate', 'facilitate', 'lucid', 'benchmark', 'synergy'
    ];

    if (diffLevel === 1 || diffLevel === 2) {
      pool = ['water', 'house', 'apple', 'smile', 'garden', 'family', 'travel', 'friend', 'listen', 'choice', 'future', 'moment', 'journey', 'nature', 'bright'];
    } else if (diffLevel === 4 || diffLevel === 5) {
      pool = ['defenestration', 'ephemeral', 'quintessential', 'serendipity', 'idempotent', 'ubiquitous', 'scrutinize', 'delineate', 'polymorphism', 'encapsulation'];
    }

    const unadded = pool.filter(w => !existingWords.includes(w.toLowerCase()));
    const sourceList = unadded.length >= count ? unadded : pool;
    const shuffled = [...sourceList].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  },

  async fetchRandomOnlineWord(diffLevel?: number): Promise<string> {
    const existingWords = StorageService.getAllVocabulary().map(w => w.word.toLowerCase());
    const diffParam = diffLevel && diffLevel >= 1 && diffLevel <= 5 ? `&diff=${diffLevel}` : '';

    // 1. Try Random Word API (https://random-word-api.herokuapp.com/word?number=5&diff=1)
    try {
      const res = await fetch(`https://random-word-api.herokuapp.com/word?number=5${diffParam}`);
      if (res.ok) {
        const words: string[] = await res.json();
        if (Array.isArray(words)) {
          for (const raw of words) {
            const w = raw.toLowerCase().trim();
            if (w.length >= 3 && !existingWords.includes(w)) {
              // Quick check if dictionaryapi.dev knows this word
              const checkRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(w)}`);
              if (checkRes.ok) {
                return w;
              }
            }
          }
        }
      }
    } catch {}

    // 2. Try Datamuse Random Vocabulary API (https://api.datamuse.com/words?sp=??????&max=30)
    try {
      let lengths = ['?????', '??????'];
      if (diffLevel === 1 || diffLevel === 2) lengths = ['???', '????', '?????'];
      else if (diffLevel === 4 || diffLevel === 5) lengths = ['???????', '????????', '?????????'];

      const randomLen = lengths[Math.floor(Math.random() * lengths.length)];
      const res = await fetch(`https://api.datamuse.com/words?sp=${randomLen}&max=30`);
      if (res.ok) {
        const items = await res.json();
        if (Array.isArray(items) && items.length > 0) {
          const shuffled = items.sort(() => 0.5 - Math.random());
          for (const item of shuffled) {
            const w = item.word ? item.word.toLowerCase().trim() : '';
            if (w && !w.includes(' ') && w.length >= 3 && !existingWords.includes(w)) {
              return w;
            }
          }
        }
      }
    } catch {}

    // 3. Fallback to internal local pool if offline or network error
    return this.getRandomSuggestedWord(diffLevel);
  }
};
