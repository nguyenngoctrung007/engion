import React, { useState } from 'react';
import { VocabularyWord } from '../../types';
import { Badge } from '../Common/Badge';
import { SRSBadge } from '../Common/SRSBadge';
import { AudioButton } from '../Common/AudioButton';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { speakWord } from '../../services/audio';

interface FillInBlankQuizProps {
  word: VocabularyWord;
  onAnswer: (rating: 'hard' | 'good' | 'easy', keepGoing?: boolean) => void;
}

export const FillInBlankQuiz: React.FC<FillInBlankQuizProps> = ({ word, onAnswer }) => {
  const [inputVal, setInputVal] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Mask word in sentence
  const renderMaskedSentence = () => {
    if (!word.example) return null;
    const regex = new RegExp(`(${word.word})`, 'gi');
    return word.example.replace(regex, '________');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const correct = inputVal.trim().toLowerCase() === word.word.toLowerCase();
    setIsCorrect(correct);
    setSubmitted(true);
    speakWord(word.word);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Badge text={word.deck} type={word.deck} />
            <span style={{ fontSize: '0.74rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>Điền từ</span>
          </div>
          <SRSBadge wordId={word.id} compact />
        </div>

        {/* Meaning hint */}
        <div style={{ padding: '10px 14px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: 'var(--radius-md)', marginBottom: '12px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 700 }}>GỢI Ý NGHĨA TIẾNG VIỆT</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#FFF' }}>{word.definition}</div>
        </div>

        {/* Masked sentence */}
        <div style={{ fontSize: '0.92rem', color: 'var(--text-main)', lineHeight: '1.5', marginBottom: '14px', fontStyle: 'italic' }}>
          "{renderMaskedSentence()}"
        </div>

        {/* Form Input */}
        {!submitted ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Nhập từ tiếng Anh còn thiếu..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              autoFocus
            />
            <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>
              Kiểm tra
            </button>
          </form>
        ) : (
          <div className="animate-pop" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                background: isCorrect ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                border: `1px solid ${isCorrect ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)'}`
              }}
            >
              {isCorrect ? <CheckCircle2 size={24} style={{ color: 'var(--accent-green)' }} /> : <XCircle size={24} style={{ color: 'var(--accent-rose)' }} />}
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isCorrect ? 'var(--accent-green)' : 'var(--accent-rose)' }}>
                  {isCorrect ? 'Chính xác 100%! Tuyệt vời!' : 'Rất tiếc! Chưa chính xác.'}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#FFF', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Đáp án chuẩn: <span style={{ color: 'var(--accent-cyan)' }}>{word.word}</span> {word.phonetic} <AudioButton word={word.word} size={16} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      {submitted && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexShrink: 0 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAnswer(isCorrect ? 'easy' : 'hard', true);
            }}
            className="btn btn-primary"
            style={{ flex: 1, justifyContent: 'center', cursor: 'pointer' }}
          >
            Từ tiếp theo <ArrowRight size={16} />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAnswer(isCorrect ? 'easy' : 'hard', false);
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAnswer(isCorrect ? 'easy' : 'hard', false);
            }}
            className="btn btn-secondary"
            style={{ justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}
          >
            Xong & Đóng ✕
          </button>
        </div>
      )}
    </div>
  );
};
