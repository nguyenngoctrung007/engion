import React, { useState, useMemo } from 'react';
import { VocabularyWord } from '../../types';
import { Badge } from '../Common/Badge';
import { SRSBadge } from '../Common/SRSBadge';
import { AudioButton } from '../Common/AudioButton';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { speakWord } from '../../services/audio';

interface MultipleChoiceQuizProps {
  word: VocabularyWord;
  allWords: VocabularyWord[];
  onAnswer: (rating: 'hard' | 'good' | 'easy', keepGoing?: boolean) => void;
}

export const MultipleChoiceQuiz: React.FC<MultipleChoiceQuizProps> = ({ word, allWords, onAnswer }) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Generate 4 randomized options (1 correct + 3 distractor definitions)
  const options = useMemo(() => {
    const distractors = allWords
      .filter(w => w.id !== word.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(w => w.definition);

    const list = [word.definition, ...distractors];
    return list.sort(() => 0.5 - Math.random());
  }, [word, allWords]);

  const correctIdx = options.indexOf(word.definition);

  const handleSelect = (idx: number) => {
    if (submitted) return;
    setSelectedIdx(idx);
    setSubmitted(true);
    speakWord(word.word);
  };

  const isCorrect = selectedIdx === correctIdx;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Badge text={word.deck} type={word.deck} />
            <span style={{ fontSize: '0.74rem', color: 'var(--accent-amber)', fontWeight: 600 }}>Trắc nghiệm</span>
          </div>
          <SRSBadge wordId={word.id} compact />
        </div>

        {/* Word header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>{word.word}</h2>
          <AudioButton word={word.word} size={18} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>({word.pos})</span>
        </div>
        <div style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px' }}>
          {word.phonetic}
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
          Chọn nghĩa đúng của từ trên:
        </div>

        {/* Options grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
          {options.map((opt, idx) => {
            let styleBg = 'rgba(255, 255, 255, 0.04)';
            let styleBorder = '1px solid var(--border-subtle)';
            let styleColor = 'var(--text-main)';

            if (submitted) {
              if (idx === correctIdx) {
                styleBg = 'rgba(16, 185, 129, 0.2)';
                styleBorder = '1px solid var(--accent-green)';
                styleColor = '#6EE7B7';
              } else if (idx === selectedIdx && idx !== correctIdx) {
                styleBg = 'rgba(244, 63, 94, 0.2)';
                styleBorder = '1px solid var(--accent-rose)';
                styleColor = '#FDA4AF';
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  background: styleBg,
                  border: styleBorder,
                  color: styleColor,
                  textAlign: 'left',
                  cursor: submitted ? 'default' : 'pointer',
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <span
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.72rem',
                    flexShrink: 0
                  }}
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                <span style={{ flex: 1 }}>{opt}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Navigation */}
      {submitted && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexShrink: 0 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAnswer(isCorrect ? 'easy' : 'hard', true);
            }}
            className="btn btn-primary"
            style={{ flex: 1, justifyContent: 'center', padding: '10px', cursor: 'pointer' }}
          >
            {isCorrect ? 'Từ tiếp theo' : 'Học từ khác'} <ArrowRight size={16} />
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
            style={{ justifyContent: 'center', padding: '10px 14px', flexShrink: 0, cursor: 'pointer' }}
          >
            Xong & Đóng ✕
          </button>
        </div>
      )}
    </div>
  );
};
