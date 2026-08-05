import React, { useState } from 'react';
import { VocabularyWord, UserWordProgress } from '../../types';
import { AudioButton } from '../Common/AudioButton';
import { SpeechMicButton } from '../Common/SpeechMicButton';
import { Badge } from '../Common/Badge';
import { Sparkles, ArrowRight } from 'lucide-react';

interface FlashcardViewProps {
  word: VocabularyWord;
  progress?: UserWordProgress;
  onAnswer: (rating: 'hard' | 'good' | 'easy', keepGoing?: boolean) => void;
}

export const FlashcardView: React.FC<FlashcardViewProps> = ({ word, onAnswer }) => {
  const [showAnswer, setShowAnswer] = useState(false);

  const renderExample = () => {
    if (!word.example) return '';
    return word.example;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      {/* Flashcard Body */}
      <div className="glass-card" style={{ padding: '16px', position: 'relative' }}>
        {/* Header Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <Badge type={word.deck} text={word.deck} />
            {word.pos && <span className="badge badge-custom">{word.pos}</span>}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Thẻ từ vựng</span>
        </div>

        {/* Word Title & IPA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            {word.word}
          </h2>
          <AudioButton word={word.word} size={18} />
          <SpeechMicButton targetWord={word.word} size={18} />
        </div>
        <div style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '10px' }}>
          {word.phonetic}
        </div>

        {/* Revealable Answer or Definition */}
        {!showAnswer ? (
          <button
            onClick={() => setShowAnswer(true)}
            className="btn btn-secondary"
            style={{
              width: '100%',
              padding: '12px',
              borderStyle: 'dashed',
              justifyContent: 'center',
              color: 'var(--text-muted)'
            }}
          >
            <Sparkles size={16} style={{ color: 'var(--accent-amber)' }} />
            Bấm vào để xem nghĩa & câu ví dụ
          </button>
        ) : (
          <div className="animate-pop" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div
              style={{
                padding: '10px 12px',
                background: 'rgba(99, 102, 241, 0.1)',
                borderRadius: 'var(--radius-md)',
                borderLeft: '4px solid var(--accent-primary)'
              }}
            >
              <div style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', fontWeight: 700, marginBottom: '2px' }}>
                NGHĨA TIẾNG VIỆT
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#FFF' }}>
                {word.definition}
              </div>
            </div>

            <div
              style={{
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.84rem',
                color: 'var(--text-muted)',
                lineHeight: '1.4'
              }}
            >
              "{renderExample()}"
            </div>
          </div>
        )}
      </div>

      {/* SRS Rating Actions */}
      <div style={{ marginTop: '10px', flexShrink: 0 }}>
        {showAnswer ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAnswer('hard', true);
                }}
                className="btn btn-srs-hard"
                style={{ flexDirection: 'column', padding: '8px 4px', cursor: 'pointer' }}
              >
                <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>Khó ➔</span>
                <span style={{ fontSize: '0.66rem', opacity: 0.85 }}>Học lại sớm</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAnswer('good', true);
                }}
                className="btn btn-srs-good"
                style={{ flexDirection: 'column', padding: '8px 4px', cursor: 'pointer' }}
              >
                <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>Nhớ được ➔</span>
                <span style={{ fontSize: '0.66rem', opacity: 0.85 }}>Ôn lại sau</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAnswer('easy', true);
                }}
                className="btn btn-srs-easy"
                style={{ flexDirection: 'column', padding: '8px 4px', cursor: 'pointer' }}
              >
                <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>Thuộc ➔</span>
                <span style={{ fontSize: '0.66rem', opacity: 0.85 }}>Khoảng cách xa</span>
              </button>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAnswer('good', false);
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAnswer('good', false);
              }}
              className="btn btn-secondary"
              style={{ padding: '6px', fontSize: '0.78rem', justifyContent: 'center', color: 'var(--text-dim)', cursor: 'pointer' }}
            >
              Xong & Đóng cửa sổ ✕
            </button>
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAnswer(true);
            }}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', cursor: 'pointer' }}
          >
            Hiện đáp án <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
