import JSZip from 'jszip';
import { VocabularyWord } from '../types';

function cleanText(text: string): string {
  if (!text) return '';
  let clean = text.replace(/<[^>]+>/g, '').replace(/&nbsp;?/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').trim();
  // Strip non-printable control characters & binary noise
  clean = clean.replace(/[\x00-\x1F\x7F-\x9F\uFFFD]/g, '').trim();
  return clean;
}

export const PackageParserService = {
  async parseApkgBuffer(buffer: ArrayBuffer): Promise<VocabularyWord[]> {
    try {
      const zip = await JSZip.loadAsync(buffer);
      const dbFile = zip.file('collection.anki2') || zip.file('collection.anki21');
      if (!dbFile) return [];

      const contentBuffer = await dbFile.async('uint8array');
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const rawText = decoder.decode(contentBuffer);

      const words: VocabularyWord[] = [];
      const seenWords = new Set<string>();

      // Note records use 0x1F (\x1f) unit separator between fields
      const noteBlocks = rawText.split('\x1f\x1f').length > 10 ? rawText.split('\x1f\x1f') : [rawText];

      for (const block of noteBlocks) {
        const rawFields = block.split('\x1f');
        const fields = rawFields.map(f => cleanText(f));

        let count = 1;

        for (let i = 0; i < fields.length; i++) {
          let word = '';

          // Strategy A: Check mp3 sound tags e.g. [sound:4000B2_anxious.mp3]
          for (let j = Math.max(0, i - 2); j < Math.min(fields.length, i + 8); j++) {
            const soundMatch = rawFields[j]?.match(/\[sound:[^\]]*?_([a-zA-Z]{2,30})(?:_[a-zA-Z]+)?\.mp3\]/i) || rawFields[j]?.match(/\[sound:([a-zA-Z]{2,30})\.mp3\]/i);
            if (soundMatch && soundMatch[1]) {
              word = soundMatch[1].toLowerCase();
              break;
            }
          }

          // Strategy B: Check pure English word candidate
          if (!word) {
            const candidate = fields[i].replace(/\[sound:[^\]]+\]/g, '').trim();
            if (/^[a-zA-Z\s\-]{2,30}$/.test(candidate) && !['noun', 'verb', 'adjective', 'adverb', 'meaning'].includes(candidate.toLowerCase())) {
              word = candidate.toLowerCase();
            }
          }

          // Strategy C: Check {{c1::word}} in example fields
          if (!word) {
            for (let j = Math.max(0, i - 2); j < Math.min(fields.length, i + 8); j++) {
              const cMatch = rawFields[j]?.match(/\{\{c\d+::([a-zA-Z\s\-]+)\}\}/);
              if (cMatch && cMatch[1]) {
                word = cMatch[1].toLowerCase();
                break;
              }
            }
          }

          if (!word || seenWords.has(word.toLowerCase()) || word.length < 2) {
            continue;
          }

          // Detect Vietnamese Definition (Concise < 120 chars)
          let vnDef = '';
          for (let j = Math.max(0, i - 3); j < Math.min(fields.length, i + 6); j++) {
            const f = fields[j];
            if (/[àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(f)) {
              const clean = f.replace(/\[sound:[^\]]+\]/g, '').trim();
              if (clean && clean.length < 120 && !clean.startsWith('When ') && !clean.startsWith('To ')) {
                vnDef = clean;
                break;
              }
            }
          }

          if (!vnDef) {
            for (let j = Math.max(0, i - 2); j < Math.min(fields.length, i + 5); j++) {
              const f = fields[j];
              if (f && f.toLowerCase() !== word && f.length < 120 && !f.startsWith('[sound:') && !f.startsWith('http')) {
                vnDef = f;
                break;
              }
            }
          }

          vnDef = vnDef ? vnDef.slice(0, 120).trim() : 'Nghĩa tiếng Việt';

          // Detect Phonetic IPA (Strict short format <= 30 chars)
          let phonetic = '';
          for (let j = Math.max(0, i - 2); j < Math.min(fields.length, i + 6); j++) {
            const rf = rawFields[j] || '';
            const m = rf.match(/[\[\/]([a-zA-Zæeɪaɪɔɪəʊaʊɪəeəʊəˈˌːθðʃʒŋ\s\-\.\'\(\)\:\;\=]{2,30})[\]\/]/);
            if (m && !rf.includes('sound:')) {
              phonetic = `/${m[1].trim()}/`;
              break;
            }
          }

          const cleanPhonetic = phonetic ? phonetic : `/${word}/`;

          // Detect Example
          let example = '';
          for (let j = Math.max(0, i - 2); j < Math.min(fields.length, i + 6); j++) {
            const f = fields[j];
            if (f.includes('→') || f.includes('{{c')) {
              let cleanEx = f.replace(/\{\{c\d+::(.*?)\}\}/g, '$1');
              if (cleanEx.includes('→')) {
                example = cleanEx.split('→')[1].trim();
              } else {
                example = cleanEx.trim();
              }
              break;
            }
          }

          // Detect POS
          let pos = 'noun';
          const combinedWindow = fields.slice(Math.max(0, i - 2), Math.min(fields.length, i + 6)).join(' ');
          if (combinedWindow.includes('tính từ') || combinedWindow.includes('adj')) {
            pos = 'adjective';
          } else if (combinedWindow.includes('động từ') || combinedWindow.includes('verb')) {
            pos = 'verb';
          } else if (combinedWindow.includes('trạng từ') || combinedWindow.includes('adv')) {
            pos = 'adverb';
          } else if (combinedWindow.includes('danh từ') || combinedWindow.includes('noun')) {
            pos = 'noun';
          }

          seenWords.add(word.toLowerCase());
          words.push({
            id: `imported_${word}_${Date.now()}_${count}`,
            word: word,
            phonetic: cleanPhonetic,
            pos: pos,
            definition: vnDef,
            example: example.slice(0, 150) || `Practice using "${word}" in your daily conversations.`,
            deck: 'custom'
          });
          count++;
        }
      }

      return words;
    } catch (err) {
      console.error('Package client-side parse error:', err);
      return [];
    }
  }
};
