import React, { useState, useEffect, useRef } from 'react';
import { StorageService } from '../../services/storage';
import { DictionaryService } from '../../services/dictionary';
import { Sparkles, X, CheckCircle2, Zap, Volume2, Save, Search, ArrowRight, Lightbulb } from 'lucide-react';
import { DeckType } from '../../types';

export const QuickAddModal: React.FC = () => {
  const [searchWord, setSearchWord] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [difficulty, setDifficulty] = useState<number>(StorageService.getSettings().wordDifficulty || 1);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const [draft, setDraft] = useState<{
    word: string;
    phonetic: string;
    pos: string;
    definition: string;
    example: string;
    deck: DeckType;
  } | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const definitionInputRef = useRef<HTMLInputElement>(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  useEffect(() => {
    setSuggestions(DictionaryService.getRandomSuggestions(4, difficulty));
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || (e.altKey && e.key.toLowerCase() === 'q')) {
        e.preventDefault();
        handleClose();
      } else if ((e.ctrlKey || e.altKey) && e.key === 'Enter') {
        e.preventDefault();
        handleConfirmSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDifficultyChange = (newDiff: number) => {
    setDifficulty(newDiff);
    const settings = StorageService.getSettings();
    StorageService.saveSettings({ ...settings, wordDifficulty: newDiff });
    setSuggestions(DictionaryService.getRandomSuggestions(4, newDiff));
  };

  const handlePickRandomSuggestion = async (wordToUse?: string) => {
    setLoading(true);
    try {
      const target = wordToUse || (await DictionaryService.fetchRandomOnlineWord(difficulty));
      setSearchWord(target);
      await handleLookupWord(target);
      setSuggestions(DictionaryService.getRandomSuggestions(4, difficulty));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if ((window as any).electronAPI?.closeQuickAdd) {
      (window as any).electronAPI.closeQuickAdd();
    } else {
      window.close();
    }
  };

  const handleLookupWord = async (wordToSearch: string) => {
    const cleanWord = wordToSearch.trim();
    if (!cleanWord) {
      setToastMessage({ text: '⚠️ Vui lòng nhập từ tiếng Anh trước khi tra từ.', isError: true });
      return;
    }

    setLoading(true);
    setToastMessage(null);

    try {
      // 1-Click Auto Dictionary Lookup
      const dictData = await DictionaryService.lookupWord(cleanWord);

      const parsedDraft = {
        word: dictData?.word || cleanWord,
        phonetic: dictData?.phonetic || `/${cleanWord}/`,
        pos: dictData?.pos || 'noun',
        definition: dictData?.definition || 'Từ mới vừa thêm',
        example: dictData?.example || `Example sentence for ${cleanWord}.`,
        deck: 'custom' as DeckType
      };

      setDraft(parsedDraft);
      if (dictData?.word) {
        setSearchWord(dictData.word);
      }
      playAudio(dictData?.word || cleanWord);

      if (dictData?.wasCorrected) {
        setToastMessage({
          text: `💡 Đã tự động sửa lỗi chính tả: "${dictData.originalQuery}" ➔ "${dictData.word}"`,
          isError: false
        });
      }

      setTimeout(() => {
        if (definitionInputRef.current) {
          definitionInputRef.current.focus();
        }
      }, 100);
    } catch (err) {
      console.error('[QuickAdd] Lookup error:', err);
      setDraft({
        word: cleanWord,
        phonetic: `/${cleanWord}/`,
        pos: 'noun',
        definition: '',
        example: `Example sentence for ${cleanWord}.`,
        deck: 'custom' as DeckType
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handleLookupWord(searchWord);
  };

  const playAudio = (textWord: string) => {
    if ('speechSynthesis' in window && textWord) {
      try {
        const utterance = new SpeechSynthesisUtterance(textWord);
        utterance.lang = 'en-US';
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      } catch {}
    }
  };

  const handleConfirmSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const currentDraft = draftRef.current;
    if (!currentDraft || !currentDraft.word.trim()) {
      setToastMessage({ text: '⚠️ Vui lòng gõ từ tiếng Anh & tra từ trước khi lưu.', isError: true });
      return;
    }

    if (!currentDraft.definition.trim()) {
      setToastMessage({ text: '⚠️ Vui lòng nhập nghĩa tiếng Việt trước khi lưu.', isError: true });
      return;
    }

    const finalWord = {
      id: 'custom-' + Date.now(),
      word: currentDraft.word.trim(),
      phonetic: currentDraft.phonetic.trim() || `/${currentDraft.word.trim()}/`,
      pos: currentDraft.pos || 'noun',
      definition: currentDraft.definition.trim(),
      example: currentDraft.example.trim() || `Example sentence for ${currentDraft.word.trim()}.`,
      deck: currentDraft.deck || 'custom'
    };

    StorageService.saveCustomWord(finalWord);

    // Close window cleanly on save
    handleClose();
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: 'rgba(15, 23, 42, 0.98)',
        border: '1px solid rgba(99, 102, 241, 0.5)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85), 0 0 25px rgba(99, 102, 241, 0.3)',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        userSelect: 'none',
        overflow: 'hidden'
      }}
    >
      {/* Header Bar - Draggable region */}
      <div
        style={
          {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            WebkitAppRegion: 'drag',
            cursor: 'grab',
            marginBottom: '12px'
          } as React.CSSProperties
        }
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              padding: '3px 8px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
              color: '#FFF',
              fontWeight: 800,
              fontSize: '0.72rem',
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Zap size={12} /> ALT + N
          </div>
          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFF' }}>
            Thêm Từ Vựng Siêu Nhanh
          </span>
        </div>

        <button
          onClick={handleClose}
          style={
            {
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              WebkitAppRegion: 'no-drag'
            } as React.CSSProperties
          }
          title="Đóng cửa sổ (ESC)"
        >
          <X size={18} />
        </button>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSubmitSearch} style={{ marginBottom: '12px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            ref={searchInputRef}
            type="text"
            value={searchWord}
            onChange={(e) => setSearchWord(e.target.value)}
            placeholder="Gõ từ tiếng Anh (ví dụ: resilient, refactor, negotiate...)"
            disabled={loading}
            style={{
              width: '100%',
              padding: '11px 14px',
              paddingRight: '150px',
              fontSize: '0.98rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1.5px solid var(--accent-primary)',
              color: '#FFF',
              outline: 'none',
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.2)'
            }}
          />

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              position: 'absolute',
              right: '4px',
              top: '4px',
              bottom: '4px',
              padding: '0 16px',
              fontSize: '0.84rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-sm)'
            }}
          >
            {loading ? (
              <span className="animate-pulse">🔍 Đang tra...</span>
            ) : (
              <>
                <Sparkles size={14} /> Tra từ (Enter)
              </>
            )}
          </button>
        </div>
      </form>

      {/* Main Body Section */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {/* Case 1: Empty State Before Search */}
        {!draft && !loading && (
          <div
            className="animate-pop"
            style={{
              padding: '20px 16px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: '10px'
            }}
          >
            <div style={{ padding: '10px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)' }}>
              <Lightbulb size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#FFF', marginBottom: '4px' }}>
                Gõ từ tiếng Anh ➔ Bấm Enter để tra từ điển tự động
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Hệ thống sẽ tự động điền phiên âm IPA, loại từ & dịch nghĩa Tiếng Việt để bạn kiểm tra.
              </div>
            </div>

            {/* Quick Suggestions Chips & Random Word Recommendation */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              {/* Difficulty Selector Bar */}
              <div style={{ display: 'flex', gap: '4px', background: 'rgba(255, 255, 255, 0.05)', padding: '3px', borderRadius: '20px' }}>
                {[
                  { id: 1, label: '🟢 Dễ (Common)', color: '#10B981' },
                  { id: 3, label: '🟡 Vừa (Medium)', color: '#F59E0B' },
                  { id: 5, label: '🔴 Khó (Rare)', color: '#EF4444' }
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handleDifficultyChange(d.id)}
                    style={{
                      padding: '3px 10px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      borderRadius: '16px',
                      border: 'none',
                      cursor: 'pointer',
                      background: difficulty === d.id ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                      color: difficulty === d.id ? d.color : 'var(--text-muted)'
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => handlePickRandomSuggestion()}
                className="btn"
                style={{
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.25) 100%)',
                  color: '#F59E0B',
                  border: '1px solid rgba(245, 158, 11, 0.5)',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 10px rgba(245, 158, 11, 0.2)'
                }}
                title="Tự động tìm 1 từ vựng hay ngẫu nhiên theo độ khó chưa có trong Kho"
              >
                <Lightbulb size={15} /> 🎲 Gợi ý từ ngẫu nhiên theo trình độ
              </button>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Gợi ý từ nổi bật:</span>
                {suggestions.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => handlePickRandomSuggestion(w)}
                    className="btn btn-secondary"
                    style={{ padding: '3px 10px', fontSize: '0.76rem', borderRadius: '12px', borderColor: 'rgba(99, 102, 241, 0.3)', color: 'var(--accent-cyan)' }}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Case 2: Loading State */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--accent-cyan)' }}>
            <Sparkles size={28} className="animate-spin" />
            <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>🔍 Đang kết nối từ điển Oxford & Google Translate...</span>
          </div>
        )}

        {/* Case 3: Review & Edit Form Card */}
        {draft && !loading && (
          <form onSubmit={handleConfirmSave} className="animate-pop" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Header Word & Audio Test */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(99, 102, 241, 0.12)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99, 102, 241, 0.3)', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <input
                  type="text"
                  value={draft.word}
                  onChange={(e) => setDraft({ ...draft, word: e.target.value })}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px dashed var(--accent-primary)',
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: '#FFF',
                    outline: 'none',
                    width: '150px'
                  }}
                />
                <button
                  type="button"
                  onClick={() => playAudio(draft.word)}
                  className="btn btn-secondary"
                  style={{
                    padding: '6px',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: 'var(--accent-amber)',
                    cursor: 'pointer'
                  }}
                  title="Nghe phát âm chuẩn (Speech)"
                >
                  <Volume2 size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="text"
                  value={draft.phonetic}
                  onChange={(e) => setDraft({ ...draft, phonetic: e.target.value })}
                  placeholder="/phonetic/"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '5px 10px',
                    fontSize: '0.85rem',
                    color: 'var(--accent-cyan)',
                    width: '110px',
                    fontFamily: 'JetBrains Mono',
                    textAlign: 'center'
                  }}
                />
                <select
                  value={draft.pos}
                  onChange={(e) => setDraft({ ...draft, pos: e.target.value })}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '5px 8px',
                    fontSize: '0.8rem',
                    color: 'var(--accent-amber)',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <option value="noun">noun</option>
                  <option value="verb">verb</option>
                  <option value="adjective">adjective</option>
                  <option value="adverb">adverb</option>
                  <option value="phrase">phrase</option>
                </select>
              </div>
            </div>

            {/* Definition Field (Editable Translation) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--accent-primary)', fontWeight: 700, marginBottom: '4px' }}>
                📖 NGHĨA TIẾNG VIỆT (Tùy chỉnh nếu bản dịch chưa chuẩn):
              </label>
              <input
                ref={definitionInputRef}
                type="text"
                value={draft.definition}
                onChange={(e) => setDraft({ ...draft, definition: e.target.value })}
                placeholder="Nhập nghĩa tiếng Việt chuẩn xác..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--accent-primary)',
                  color: '#FFF',
                  outline: 'none'
                }}
              />
            </div>

            {/* Example Field */}
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '4px' }}>
                💬 CÂU VÍ DỤ MINH HỌA:
              </label>
              <textarea
                value={draft.example}
                onChange={(e) => setDraft({ ...draft, example: e.target.value })}
                rows={2}
                placeholder="Nhập câu ví dụ minh họa..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  outline: 'none',
                  resize: 'none'
                }}
              />
            </div>
          </form>
        )}
      </div>

      {/* Feedback Toast Banner */}
      {toastMessage && (
        <div
          style={{
            margin: '6px 0',
            padding: '6px 10px',
            borderRadius: '4px',
            background: toastMessage.isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            color: toastMessage.isError ? '#EF4444' : '#10B981',
            fontSize: '0.78rem',
            fontWeight: 600
          }}
        >
          {toastMessage.text}
        </div>
      )}

      {/* Bottom Action Bar - ONLY SHOWN WHEN DRAFT WORD IS READY */}
      {draft && (
        <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '6px' }}>
          <button
            type="button"
            onClick={handleClose}
            className="btn btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.82rem' }}
          >
            <X size={15} /> Hủy (ESC)
          </button>

          <button
            type="button"
            onClick={handleConfirmSave}
            className="btn btn-primary"
            style={{ flex: 1, justifyContent: 'center', padding: '8px 14px', fontSize: '0.88rem', fontWeight: 800, gap: '8px' }}
          >
            <Save size={16} /> 💾 XÁC NHẬN LƯU (Ctrl + Enter)
          </button>
        </div>
      )}

      {/* Footer Instructions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.72rem',
          color: 'var(--text-dim)',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '6px',
          marginTop: '6px'
        }}
      >
        <span>
          {draft
            ? '✏️ Bạn có thể tự do chỉnh sửa bản dịch ➔ Bấm Ctrl + Enter để Lưu'
            : '💡 Gõ từ tiếng Anh ➔ Bấm Enter để Tra từ từ điển'}
        </span>
        <span style={{ fontFamily: 'JetBrains Mono' }}>Alt + Q / ESC: Đóng</span>
      </div>
    </div>
  );
};
