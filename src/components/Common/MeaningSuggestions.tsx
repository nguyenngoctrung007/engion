import React, { useState } from 'react';
import { MeaningGroup } from '../../services/dictionary';

/** Alternative meanings remembered together with the word they were looked up for. */
export interface MeaningSuggestionSet {
  word: string;
  groups: MeaningGroup[];
}

interface MeaningSuggestionsProps {
  suggestions: MeaningSuggestionSet | null;
  /** Word currently in the form — chips are hidden once it no longer matches the looked-up word. */
  word: string;
  definition: string;
  onChange: (definition: string) => void;
}

const COLLAPSED_PER_POS = 4;
const SEPARATOR = '; ';

const splitMeanings = (definition: string): string[] =>
  definition.split(';').map(m => m.trim()).filter(Boolean);

/**
 * Clickable chips for other meanings of a word, grouped by part of speech.
 * Clicking a chip appends it to the definition ("chơi; trò chơi"); clicking again removes it.
 */
export const MeaningSuggestions: React.FC<MeaningSuggestionsProps> = ({ suggestions, word, definition, onChange }) => {
  const [expanded, setExpanded] = useState(false);

  if (!suggestions || suggestions.groups.length === 0) return null;
  if (suggestions.word.trim().toLowerCase() !== word.trim().toLowerCase()) return null;

  const current = splitMeanings(definition);
  const isSelected = (meaning: string) => current.some(m => m.toLowerCase() === meaning.toLowerCase());

  const toggle = (meaning: string) => {
    const next = isSelected(meaning)
      ? current.filter(m => m.toLowerCase() !== meaning.toLowerCase())
      : [...current, meaning];
    onChange(next.join(SEPARATOR));
  };

  const hiddenCount = suggestions.groups.reduce((sum, g) => sum + Math.max(0, g.meanings.length - COLLAPSED_PER_POS), 0);

  return (
    <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600 }}>
        Nghĩa khác (bấm để thêm/bỏ):
      </div>
      {suggestions.groups.map(group => (
        <div key={group.pos} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--accent-amber)', fontWeight: 700, minWidth: '62px' }}>
            {group.pos}:
          </span>
          {(expanded ? group.meanings : group.meanings.slice(0, COLLAPSED_PER_POS)).map(meaning => {
            const selected = isSelected(meaning);
            return (
              <button
                key={meaning}
                type="button"
                onClick={() => toggle(meaning)}
                title={selected ? 'Bỏ nghĩa này' : 'Thêm nghĩa này'}
                style={{
                  padding: '2px 8px',
                  fontSize: '0.74rem',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  border: selected ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  background: selected ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.04)',
                  color: selected ? '#FFF' : 'var(--text-muted)'
                }}
              >
                {selected ? '✓ ' : ''}{meaning}
              </button>
            );
          })}
        </div>
      ))}
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          style={{ alignSelf: 'flex-start', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '0.72rem', color: 'var(--accent-primary)', fontWeight: 600 }}
        >
          {expanded ? 'Thu gọn' : `Xem thêm ${hiddenCount} nghĩa`}
        </button>
      )}
    </div>
  );
};
