import React, { useState, useEffect, useRef } from 'react';
import { StorageService } from '../../services/storage';
import { DictionaryService } from '../../services/dictionary';
import { Sparkles, X, CheckCircle2, Zap, Volume2, Save, ArrowLeft } from 'lucide-react';
import { DeckType } from '../../types';

export const QuickAddReviewModal: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const [draft, setDraft] = useState({
    word: '',
    phonetic: '',
    pos: 'noun',
    definition: '',
    example: '',
    deck: 'custom' as DeckType
  });

  const definitionInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let targetWord = new URLSearchParams(window.location.search).get('word');
    if (!targetWord && window.location.hash.includes('word=')) {
      const parts = window.location.hash.split('word=');
      if (parts[1]) targetWord = decodeURIComponent(parts[1].split('&')[0]);
    }
    if (!targetWord) targetWord = 'word';

    const fetchDict = async () => {
      setLoading(true);
      try {
        const dictData = await DictionaryService.lookupWord(targetWord);
        const parsed = {
          word: targetWord,
          phonetic: dictData?.phonetic || `/${targetWord}/`,
          pos: dictData?.pos || 'noun',
          definition: dictData?.definition || 'Từ mới vừa thêm',
          example: dictData?.example || `Example sentence for ${targetWord}.`,
          deck: 'custom' as DeckType
        };
        setDraft(parsed);
        playAudio(targetWord);
      } catch (err) {
        console.error('[QuickAddReview] Error:', err);
        setDraft({
          word: targetWord,
          phonetic: `/${targetWord}/`,
          pos: 'noun',
          definition: '',
          example: `Example sentence for ${targetWord}.`,
          deck: 'custom' as DeckType
        });
      } finally {
        setLoading(false);
        if (definitionInputRef.current) {
          definitionInputRef.current.focus();
        }
      }
    };

    fetchDict();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleClose = () => {
    if ((window as any).electronAPI?.closeQuickAdd) {
      (window as any).electronAPI.closeQuickAdd();
    } else {
      window.close();
    }
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

    if (!draft.word.trim()) {
      setToastMessage({ text: '⚠️ Từ tiếng Anh không được để trống.', isError: true });
      return;
    }

    if (!draft.definition.trim()) {
      setToastMessage({ text: '⚠️ Vui lòng nhập nghĩa tiếng Việt trước khi lưu.', isError: true });
      return;
    }

    const finalWord = {
      id: 'custom-' + Date.now(),
      word: draft.word.trim(),
      phonetic: draft.phonetic.trim() || `/${draft.word.trim()}/`,
      pos: draft.pos || 'noun',
      definition: draft.definition.trim(),
      example: draft.example.trim() || `Example sentence for ${draft.word.trim()}.`,
      deck: draft.deck || 'custom'
    };

    StorageService.saveCustomWord(finalWord);

    // Close review window upon successful save
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
            <Zap size={12} /> XÁC NHẬN
          </div>
          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFF' }}>
            Xem Trước & Kiểm Tra Thông Tin Từ Vựng
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
          title="Đóng (ESC)"
        >
          <X size={18} />
        </button>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)', fontWeight: 700, gap: '8px' }}>
          <span className="animate-pulse">🔍 Đang tự động kết nối từ điển & tạo dữ liệu...</span>
        </div>
      ) : (
        <form onSubmit={handleConfirmSave} className="animate-pop" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Header Word & Audio Test */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(99, 102, 241, 0.12)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                  width: '180px'
                }}
              />
              <button
                type="button"
                onClick={() => playAudio(draft.word)}
                className="btn btn-secondary"
                style={{ padding: '5px 10px', fontSize: '0.78rem', gap: '5px' }}
              >
                <Volume2 size={14} style={{ color: 'var(--accent-amber)' }} /> Nghe thử
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="text"
                value={draft.phonetic}
                onChange={(e) => setDraft({ ...draft, phonetic: e.target.value })}
                placeholder="/phonetic/"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '0.82rem',
                  color: 'var(--text-muted)',
                  width: '110px',
                  fontFamily: 'JetBrains Mono'
                }}
              />
              <select
                value={draft.pos}
                onChange={(e) => setDraft({ ...draft, pos: e.target.value })}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '0.8rem',
                  color: 'var(--accent-amber)',
                  fontWeight: 700
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
            <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--accent-primary)', fontWeight: 700, marginBottom: '6px' }}>
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
                padding: '10px 14px',
                fontSize: '1rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1.5px solid var(--accent-primary)',
                color: '#FFF',
                outline: 'none',
                boxShadow: '0 0 10px rgba(99, 102, 241, 0.15)'
              }}
            />
          </div>

          {/* Example Field */}
          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '6px' }}>
              💬 CÂU VÍ DỤ MINH HỌA:
            </label>
            <textarea
              value={draft.example}
              onChange={(e) => setDraft({ ...draft, example: e.target.value })}
              rows={2}
              placeholder="Nhập câu ví dụ minh họa..."
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '0.88rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                outline: 'none',
                resize: 'none'
              }}
            />
          </div>

          {/* Feedback Toast Banner */}
          {toastMessage && (
            <div
              style={{
                padding: '6px 10px',
                borderRadius: '4px',
                background: toastMessage.isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                color: toastMessage.isError ? '#EF4444' : '#10B981',
                fontSize: '0.8rem',
                fontWeight: 600
              }}
            >
              {toastMessage.text}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '6px' }}>
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-secondary"
              style={{ padding: '10px 16px', fontSize: '0.85rem' }}
            >
              <X size={15} /> Hủy (ESC)
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: 'center', padding: '10px 16px', fontSize: '0.92rem', fontWeight: 800, gap: '8px' }}
            >
              <Save size={18} /> 💾 XÁC NHẬN LƯU (Enter)
            </button>
          </div>
        </form>
      )}

      {/* Footer Instructions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.74rem',
          color: 'var(--text-dim)',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '8px'
        }}
      >
        <span>✏️ Kiểm tra & tự do tùy chỉnh bản dịch trước khi lưu</span>
        <span style={{ fontFamily: 'JetBrains Mono' }}>Bấm Enter để Lưu</span>
      </div>
    </div>
  );
};
