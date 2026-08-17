import React, { useState, useEffect } from 'react';
import { VocabularyWord, UserWordProgress } from '../../types';
import { StorageService } from '../../services/storage';
import { DictionaryService } from '../../services/dictionary';
import { calculateSRS, pickSmartNextWord } from '../../services/srs';
import { FlashcardView } from './FlashcardView';
import { FillInBlankQuiz } from './FillInBlankQuiz';
import { MultipleChoiceQuiz } from './MultipleChoiceQuiz';
import { X, Layers, HelpCircle, CheckSquare, Sparkles, Edit3, Trash2, Save, Star } from 'lucide-react';

export const PopupContainer: React.FC = () => {
  const [currentWord, setCurrentWord] = useState<VocabularyWord | null>(null);
  const [allWords, setAllWords] = useState<VocabularyWord[]>([]);
  const [quizMode, setQuizMode] = useState<'flashcard' | 'fill' | 'choice'>('flashcard');
  const [sessionCount, setSessionCount] = useState<number>(0);
  const [editingWord, setEditingWord] = useState<VocabularyWord | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isSearchingDict, setIsSearchingDict] = useState<boolean>(false);
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);

  const pickNextWord = (overrideWords?: typeof allWords) => {
    const words = overrideWords ?? StorageService.getAllVocabulary();
    const next = pickSmartNextWord(words, currentWord?.id);
    setCurrentWord(next);
  };

  useEffect(() => {
    const words = StorageService.getAllVocabulary();
    setAllWords(words);
    setFavoriteIds(StorageService.getFavoriteIds());

    const settings = StorageService.getSettings();
    if (settings.quizMode && settings.quizMode !== 'random') {
      setQuizMode(settings.quizMode as any);
    } else {
      const modes: ('flashcard' | 'fill' | 'choice')[] = ['flashcard', 'fill', 'choice'];
      setQuizMode(modes[Math.floor(Math.random() * modes.length)]);
    }

    // Use smart SRS picker on first load
    const next = pickSmartNextWord(words, undefined);
    setCurrentWord(next);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || (e.altKey && e.key.toLowerCase() === 'q')) {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (currentWord) {
      const settings = StorageService.getSettings();
      if (settings.autoAudio && 'speechSynthesis' in window) {
        try {
          const utterance = new SpeechSynthesisUtterance(currentWord.word);
          utterance.lang = settings.accent === 'UK' ? 'en-GB' : 'en-US';
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utterance);
        } catch {}
      }
    }
  }, [currentWord]);

  const handleClose = () => {
    // If running under Electron, always close/destroy the popup window
    if ((window as any).electronAPI?.closePopup) {
      (window as any).electronAPI.closePopup();
      return;
    }

    // Fallback for browser preview mode
    if (window.location.hash === '#popup') {
      window.location.hash = '';
    } else {
      try {
        window.close();
      } catch {}
    }
  };

  const handleAnswer = (rating: 'hard' | 'good' | 'easy', keepGoing: boolean = false) => {
    if (currentWord) {
      const progressMap = StorageService.getProgressMap();
      const currentProgress = progressMap[currentWord.id];
      const updated = calculateSRS(currentProgress, currentWord.id, rating);
      StorageService.saveWordProgress(updated);
      setSessionCount(prev => prev + 1);
    }

    if (keepGoing) {
      pickNextWord();
    } else {
      handleClose();
    }
  };

  const handleDeleteCurrentWord = () => {
    if (!currentWord) return;
    if (confirm(`Bạn có chắc chắn muốn xóa từ vựng "${currentWord.word}" khỏi hệ thống không?`)) {
      StorageService.deleteWord(currentWord.id);
      pickNextWord();
    }
  };

  const handleToggleFavorite = () => {
    if (!currentWord) return;
    StorageService.toggleFavorite(currentWord.id);
    setFavoriteIds(StorageService.getFavoriteIds());
  };

  const handleAutoLookupEditWord = async () => {
    if (!editingWord || !editingWord.word.trim()) return;
    setIsSearchingDict(true);
    setLookupMessage(null);
    try {
      const settings = StorageService.getSettings();
      const dictData = await DictionaryService.lookupWord(editingWord.word.trim(), settings.targetLanguage);
      if (dictData) {
        setEditingWord(prev => prev ? {
          ...prev,
          phonetic: dictData.phonetic || prev.phonetic,
          definition: dictData.definition || prev.definition,
          example: dictData.example || prev.example,
          pos: dictData.pos || prev.pos
        } : null);
        setLookupMessage('✨ Đã tự động cập nhật IPA, nghĩa & ví dụ!');
      } else {
        setLookupMessage('⚠️ Không tìm thấy từ này trong từ điển.');
      }
    } catch {
      setLookupMessage('⚠️ Lỗi kết nối từ điển.');
    } finally {
      setIsSearchingDict(false);
      setTimeout(() => setLookupMessage(null), 3000);
    }
  };

  const handleSaveEditWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWord || !editingWord.word || !editingWord.definition) return;

    StorageService.updateWord(editingWord);
    setCurrentWord(editingWord);
    setEditingWord(null);
  };

  if (!currentWord) {
    const handleAction = (type: 'quick-add' | 'dashboard' | 'close') => {
      if (type === 'quick-add') {
        if ((window as any).electronAPI?.openQuickAdd) {
          (window as any).electronAPI.openQuickAdd();
        } else {
          window.location.hash = '#quick-add';
        }
      } else if (type === 'dashboard') {
        if ((window as any).electronAPI?.openDashboard) {
          (window as any).electronAPI.openDashboard();
        } else {
          window.location.hash = '';
        }
      } else {
        handleClose();
      }
    };

    return (
      <div
        className="glass-panel animate-pop"
        style={{
          width: '100vw',
          height: '100vh',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.98)',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85)',
          color: '#FFF',
          overflow: 'hidden'
        }}
      >
        {/* Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ padding: '3px 8px', borderRadius: '6px', background: 'var(--accent-amber)', color: '#000', fontWeight: 800, fontSize: '0.72rem' }}>
              ENGION
            </div>
            <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>Kho Từ Vựng Trống</span>
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClose();
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClose();
            }}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '50%' }}
            title="Đóng (ESC)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Empty State Body */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '12px' }}>
          <div style={{ padding: '14px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-cyan)' }}>
            <Sparkles size={32} />
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#FFF', marginBottom: '6px' }}>
              Kho từ vựng của bạn hiện đang trống!
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '320px', lineHeight: 1.4 }}>
              Bạn có thể thêm từ vựng mới bằng phím tắt <b style={{ color: 'var(--accent-amber)' }}>Alt + N</b> hoặc chọn các bộ từ vựng sẵn có trong Bảng Điều Khiển (<b style={{ color: 'var(--accent-amber)' }}>Alt + D</b>).
            </div>
          </div>
        </div>

        {/* Action buttons with onMouseDown & onClick Win32 protection */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleAction('quick-add');
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleAction('quick-add');
            }}
            className="btn btn-primary"
            style={{ flex: 1, justifyContent: 'center', padding: '8px 12px', fontSize: '0.82rem', fontWeight: 700, gap: '6px' }}
          >
            <Sparkles size={14} /> ⚡ Thêm từ (Alt+N)
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleAction('dashboard');
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleAction('dashboard');
            }}
            className="btn btn-secondary"
            style={{ padding: '8px 12px', fontSize: '0.82rem' }}
          >
            📊 Bảng điều khiển (Alt+D)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="glass-panel animate-pop"
      style={{
        width: '100vw',
        height: '100vh',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-popup)',
        background: 'rgba(15, 23, 42, 0.96)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        overflow: 'hidden'
      }}
    >
      {/* Top Header / Mode selector & Action buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexShrink: 0, gap: '4px' }}>
        <div style={{ display: 'flex', gap: '2px', background: 'rgba(255, 255, 255, 0.06)', padding: '2px', borderRadius: '8px', flexShrink: 0 }}>
          <button
            onClick={() => setQuizMode('flashcard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 7px',
              fontSize: '0.72rem',
              fontWeight: 700,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              background: quizMode === 'flashcard' ? 'var(--accent-primary)' : 'transparent',
              color: quizMode === 'flashcard' ? '#FFF' : 'var(--text-muted)'
            }}
          >
            <Layers size={12} /> Thẻ từ
          </button>

          <button
            onClick={() => setQuizMode('fill')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 7px',
              fontSize: '0.72rem',
              fontWeight: 700,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              background: quizMode === 'fill' ? 'var(--accent-primary)' : 'transparent',
              color: quizMode === 'fill' ? '#FFF' : 'var(--text-muted)'
            }}
          >
            <HelpCircle size={12} /> Điền từ
          </button>

          <button
            onClick={() => setQuizMode('choice')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 7px',
              fontSize: '0.72rem',
              fontWeight: 700,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              background: quizMode === 'choice' ? 'var(--accent-primary)' : 'transparent',
              color: quizMode === 'choice' ? '#FFF' : 'var(--text-muted)'
            }}
          >
            <CheckSquare size={12} /> Trắc nghiệm
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
          {currentWord && (
            <>
              <button
                onClick={handleToggleFavorite}
                className="btn-icon"
                style={{
                  color: favoriteIds.includes(currentWord.id) ? '#F59E0B' : 'var(--text-muted)',
                  width: '26px',
                  height: '26px',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px'
                }}
                title={favoriteIds.includes(currentWord.id) ? 'Bỏ đánh dấu yêu thích' : 'Đánh dấu yêu thích'}
              >
                <Star size={14} fill={favoriteIds.includes(currentWord.id) ? '#F59E0B' : 'none'} />
              </button>

              <button
                onClick={() => setEditingWord({ ...currentWord })}
                className="btn-icon"
                style={{
                  color: 'var(--accent-cyan)',
                  width: '26px',
                  height: '26px',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px'
                }}
                title="Chỉnh sửa từ vựng này"
              >
                <Edit3 size={14} />
              </button>

              <button
                onClick={handleDeleteCurrentWord}
                className="btn-icon"
                style={{
                  color: '#EF4444',
                  width: '26px',
                  height: '26px',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px'
                }}
                title="Xóa từ vựng này"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}

          {sessionCount > 0 && (
            <span style={{ fontSize: '0.7rem', color: 'var(--accent-amber)', fontWeight: 700, padding: '0 2px' }}>
              🔥{sessionCount}
            </span>
          )}

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClose();
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClose();
            }}
            className="btn-icon"
            style={{
              width: '26px',
              height: '26px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
            title="Đóng (ESC)"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Main Mode Body */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {quizMode === 'flashcard' && <FlashcardView key={currentWord.id} word={currentWord} onAnswer={handleAnswer} />}
        {quizMode === 'fill' && <FillInBlankQuiz key={currentWord.id} word={currentWord} onAnswer={handleAnswer} />}
        {quizMode === 'choice' && <MultipleChoiceQuiz key={currentWord.id} word={currentWord} allWords={allWords} onAnswer={handleAnswer} />}
      </div>

      {/* Quick Edit Word Modal Overlay */}
      {editingWord && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <form
            onSubmit={handleSaveEditWord}
            className="glass-panel animate-pop"
            style={{ width: '100%', maxWidth: '380px', padding: '18px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Edit3 size={16} /> Chỉnh Sửa Nhanh Từ Vựng
              </h4>
              <button type="button" onClick={() => setEditingWord(null)} className="btn-icon">
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Từ tiếng Anh:</label>
                  <button
                    type="button"
                    onClick={handleAutoLookupEditWord}
                    disabled={isSearchingDict || !editingWord.word.trim()}
                    className="btn"
                    style={{
                      fontSize: '0.75rem',
                      padding: '3px 10px',
                      background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                      color: '#FFF',
                      fontWeight: 700,
                      borderRadius: '6px',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: isSearchingDict || !editingWord.word.trim() ? 'not-allowed' : 'pointer',
                      opacity: isSearchingDict || !editingWord.word.trim() ? 0.7 : 1,
                      boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)'
                    }}
                    title="Tra lại IPA, Nghĩa tiếng Việt & Câu ví dụ chuẩn xác từ từ điển"
                  >
                    <Sparkles size={13} className={isSearchingDict ? 'animate-spin' : ''} />
                    {isSearchingDict ? 'Đang tra...' : '✨ Tra từ'}
                  </button>
                </div>
                <input
                  type="text"
                  className="input-field"
                  value={editingWord.word}
                  onChange={(e) => setEditingWord({ ...editingWord, word: e.target.value })}
                  required
                />
              </div>

              {lookupMessage && (
                <div style={{
                  fontSize: '0.75rem',
                  color: lookupMessage.startsWith('✨') ? 'var(--accent-cyan)' : '#EF4444',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  textAlign: 'center'
                }}>
                  {lookupMessage}
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Phiên âm IPA:</label>
                <input
                  type="text"
                  className="input-field"
                  value={editingWord.phonetic}
                  onChange={(e) => setEditingWord({ ...editingWord, phonetic: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Nghĩa tiếng Việt:</label>
                <input
                  type="text"
                  className="input-field"
                  value={editingWord.definition}
                  onChange={(e) => setEditingWord({ ...editingWord, definition: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Câu ví dụ:</label>
                <textarea
                  className="input-field"
                  value={editingWord.example}
                  onChange={(e) => setEditingWord({ ...editingWord, example: e.target.value })}
                  rows={2}
                  style={{ resize: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" onClick={() => setEditingWord(null)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                Hủy
              </button>
              <button type="submit" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem', gap: '4px' }}>
                <Save size={14} /> Lưu Thay Đổi
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
