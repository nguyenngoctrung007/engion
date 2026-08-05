import React, { useState, useEffect } from 'react';
import { VocabularyWord, UserWordProgress } from '../../types';
import { StorageService } from '../../services/storage';
import { AudioButton } from '../Common/AudioButton';
import { SpeechMicButton } from '../Common/SpeechMicButton';
import { X, Check, Award, ArrowRight, Sparkles } from 'lucide-react';

interface QuickReviewModalProps {
  onClose: () => void;
  onCompleted?: () => void;
}

export const QuickReviewModal: React.FC<QuickReviewModalProps> = ({ onClose, onCompleted }) => {
  const [sessionWords, setSessionWords] = useState<VocabularyWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  useEffect(() => {
    const allWords = StorageService.getAllVocabulary();
    // Shuffle and pick 10 words
    const shuffled = [...allWords].sort(() => 0.5 - Math.random()).slice(0, 10);
    setSessionWords(shuffled);
  }, []);

  const currentWord = sessionWords[currentIndex];

  useEffect(() => {
    if (!currentWord) return;
    const allDefs = StorageService.getAllVocabulary().map(w => w.definition);
    const correctDef = currentWord.definition;
    const dists = allDefs.filter(d => d !== correctDef).sort(() => 0.5 - Math.random()).slice(0, 3);
    const opts = [correctDef, ...dists].sort(() => 0.5 - Math.random());
    setOptions(opts);
    setSelectedOption(null);
    setIsCorrect(null);
  }, [currentIndex, currentWord]);

  const handleSelectOption = (opt: string) => {
    if (selectedOption !== null) return;
    setSelectedOption(opt);
    const correct = opt === currentWord.definition;
    setIsCorrect(correct);

    if (correct) {
      setScore(prev => prev + 1);
    }

    // Save SRS progress
    const progressMap = StorageService.getProgressMap();
    const existing = progressMap[currentWord.id] || {
      wordId: currentWord.id,
      box: 1,
      easeFactor: 2.5,
      interval: 1,
      reviewsCount: 0,
      correctCount: 0,
      lastReviewed: new Date().toISOString(),
      nextReview: new Date().toISOString()
    };

    const updated: UserWordProgress = {
      ...existing,
      reviewsCount: existing.reviewsCount + 1,
      correctCount: existing.correctCount + (correct ? 1 : 0),
      box: correct ? Math.min(5, existing.box + 1) : 1,
      lastReviewed: new Date().toISOString()
    };
    StorageService.saveWordProgress(updated);
  };

  const handleNext = () => {
    if (currentIndex + 1 < sessionWords.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
      if (onCompleted) onCompleted();
    }
  };

  if (sessionWords.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        className="glass-card animate-pop"
        style={{
          width: '100%',
          maxWidth: '560px',
          padding: '28px',
          position: 'relative',
          border: '1px solid var(--border-subtle)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="btn-icon"
          style={{ position: 'absolute', top: '22px', right: '22px', color: 'var(--text-muted)' }}
        >
          <X size={18} />
        </button>

        {!isFinished ? (
          <div>
            {/* Header progress */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingRight: '36px' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={18} /> Phiên Ôn Siêu Tốc (10 Từ)
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                Câu {currentIndex + 1} / {sessionWords.length}
              </span>
            </div>

            {/* Word Header */}
            <div style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFF' }}>{currentWord.word}</h2>
                <AudioButton word={currentWord.word} size={20} />
                <SpeechMicButton targetWord={currentWord.word} size={20} />
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
                {currentWord.phonetic} {currentWord.pos && `(${currentWord.pos})`}
              </div>
              {currentWord.example && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontStyle: 'italic', marginTop: '10px' }}>
                  "{currentWord.example.replace(/&nbsp;/gi, ' ')}"
                </div>
              )}
            </div>

            {/* Multiple Choice Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {options.map((opt, idx) => {
                const isSelected = selectedOption === opt;
                let bg = 'rgba(255, 255, 255, 0.04)';
                let border = 'var(--border-subtle)';
                let textColor = 'var(--text-main)';

                if (selectedOption !== null) {
                  if (opt === currentWord.definition) {
                    bg = 'rgba(16, 185, 129, 0.2)';
                    border = '#10B981';
                    textColor = '#10B981';
                  } else if (isSelected && !isCorrect) {
                    bg = 'rgba(239, 68, 68, 0.2)';
                    border = '#EF4444';
                    textColor = '#EF4444';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(opt)}
                    className="btn"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      justifyContent: 'flex-start',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      background: bg,
                      border: `1px solid ${border}`,
                      color: textColor
                    }}
                  >
                    <span style={{ opacity: 0.5, marginRight: '10px' }}>{String.fromCharCode(65 + idx)}.</span>
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            {selectedOption !== null && (
              <button onClick={handleNext} className="btn btn-primary animate-pop" style={{ width: '100%', padding: '14px', justifyContent: 'center' }}>
                Từ tiếp theo <ArrowRight size={18} />
              </button>
            )}
          </div>
        ) : (
          /* Finished State */
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#FFF'
              }}
            >
              <Award size={36} />
            </div>

            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFF', marginBottom: '8px' }}>
              Hoàn Thành Phiên Ôn Siêu Tốc!
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Bạn đã trả lời đúng <strong style={{ color: '#10B981', fontSize: '1.2rem' }}>{score} / 10</strong> câu hỏi.
            </p>

            <button onClick={onClose} className="btn btn-primary" style={{ minWidth: '160px', justifyContent: 'center', margin: '0 auto' }}>
              Xong & Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
