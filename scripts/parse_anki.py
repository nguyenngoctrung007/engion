import zipfile
import sqlite3
import os
import json
import re
import tempfile
import sys

sys.stdout.reconfigure(encoding='utf-8')

def clean_html(text):
    if not text:
        return ''
    clean = re.sub(r'<[^>]+>', '', text)
    clean = re.sub(r'&nbsp;?', ' ', clean, flags=re.IGNORECASE)
    clean = clean.replace('&amp;', '&').replace('&quot;', '"').strip()
    # Strip binary non-printable control characters
    clean = re.sub(r'[\x00-\x1F\x7F-\x9F\uFFFD]', '', clean).strip()
    return clean

def parse_apkg(apkg_path):
    if not os.path.exists(apkg_path):
        return []

    temp_dir = tempfile.mkdtemp()
    db_path = os.path.join(temp_dir, 'collection.anki2')

    try:
        with zipfile.ZipFile(apkg_path, 'r') as z:
            z.extract('collection.anki2', temp_dir)

        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        cursor.execute('SELECT flds FROM notes')
        rows = cursor.fetchall()

        parsed_words = []
        seen_words = set()

        for i, row in enumerate(rows):
            raw_fields = row[0].split('\x1f')
            fields = [clean_html(f) for f in raw_fields]
            
            # 1. Detect English Word
            word = ''
            # Strategy A: Check mp3 sound tags e.g. [sound:4000B2_anxious.mp3] or [sound:afraid.mp3]
            for f in raw_fields:
                sound_m = re.search(r'\[sound:[^\]]*?_([a-zA-Z]{2,30})(?:_[a-zA-Z]+)?\.mp3\]', f, re.IGNORECASE)
                if not sound_m:
                    sound_m = re.search(r'\[sound:([a-zA-Z]{2,30})\.mp3\]', f, re.IGNORECASE)
                if sound_m:
                    word = sound_m.group(1).lower()
                    break

            # Strategy B: Check pure English word in fields
            if not word:
                for f in fields:
                    if re.match(r'^[a-zA-Z\s\-]{2,30}$', f) and f.lower() not in ['noun', 'verb', 'adjective', 'adverb', 'meaning']:
                        word = f.lower()
                        break

            # Strategy C: Check {{c1::word}} in example fields
            if not word:
                for f in fields:
                    c_match = re.search(r'\{\{c\d+::([a-zA-Z\s\-]+)\}\}', f)
                    if c_match:
                        word = c_match.group(1).lower()
                        break

            if not word or word in seen_words or len(word) < 2:
                continue

            # 2. Detect Vietnamese Definition
            vn_def = ''
            # Priority: Short definition field (usually field index 3 or 4)
            for idx in [3, 4, 2, 1, 5]:
                if idx < len(fields):
                    f = fields[idx]
                    clean_def = re.sub(r'\[sound:[^\]]+\]', '', f).strip()
                    if clean_def and len(clean_def) < 120 and not clean_def.startswith('When ') and not clean_def.startswith('To '):
                        if re.search(r'[àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]', clean_def, re.IGNORECASE):
                            vn_def = clean_def
                            break

            if not vn_def:
                for f in fields:
                    if re.search(r'[àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]', f, re.IGNORECASE):
                        clean_def = re.sub(r'\[sound:[^\]]+\]', '', f).strip()
                        if clean_def and len(clean_def) < 120 and not clean_def.startswith('When ') and not clean_def.startswith('To '):
                            vn_def = clean_def
                            break

            if not vn_def:
                vn_def = 'Nghĩa tiếng Việt'

            # Trim definition to 120 chars max
            vn_def = vn_def[:120].strip()

            # 3. Detect Phonetic IPA (Strict short format <= 30 chars)
            phonetic = ''
            for f in raw_fields:
                m = re.search(r'[\[\/]([a-zA-Zæeɪaɪɔɪəʊaʊɪəeəʊəˈˌːθðʃʒŋ\s\-\.\'\(\)\:\;\=]{2,30})[\]\/]', f)
                if m and 'sound:' not in f:
                    phonetic = f"/{m.group(1).strip()}/"
                    break
            if not phonetic:
                phonetic = f'/{word}/'

            # 4. Detect Example Sentence
            example = ''
            for f in fields:
                if '→' in f or '{{c' in f:
                    clean_ex = re.sub(r'\{\{c\d+::(.*?)\}\}', r'\1', f)
                    if '→' in clean_ex:
                        example = clean_ex.split('→')[1].strip()
                    else:
                        example = clean_ex.strip()
                    break

            example = example[:150].strip() if example else f'Practice using "{word}" in your daily conversations.'

            # 5. Detect Part of Speech (POS)
            pos = 'noun'
            raw_full_text = ' '.join(fields)
            if 'tính từ' in raw_full_text or 'adj' in raw_full_text:
                pos = 'adjective'
            elif 'động từ' in raw_full_text or 'verb' in raw_full_text:
                pos = 'verb'
            elif 'trạng từ' in raw_full_text or 'adv' in raw_full_text:
                pos = 'adverb'
            elif 'danh từ' in raw_full_text or 'noun' in raw_full_text:
                pos = 'noun'

            seen_words.add(word)
            parsed_words.append({
                'id': f'apkg_{word}_{i+1}',
                'word': word,
                'phonetic': phonetic,
                'pos': pos,
                'definition': vn_def,
                'example': example,
                'deck': 'custom'
            })

        conn.close()
        return parsed_words
    except Exception as e:
        sys.stderr.write(f"Error parsing APKG: {str(e)}\n")
        return []

if __name__ == '__main__':
    target_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '../src/data/4000_Essential_English_Words_1_-_Vietnamese.apkg')
    words = parse_apkg(target_path)
    
    if len(sys.argv) > 2:
        out_file = sys.argv[2]
        with open(out_file, 'w', encoding='utf-8') as f:
            json.dump(words, f, ensure_ascii=False, indent=2)
    else:
        print(json.dumps(words, ensure_ascii=False))
