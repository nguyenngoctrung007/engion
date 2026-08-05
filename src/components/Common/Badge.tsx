import React from 'react';
import { DeckType } from '../../types';

interface BadgeProps {
  text: string;
  type?: DeckType | 'level' | 'box';
  variant?: 'cyan' | 'indigo' | 'green' | 'amber' | 'rose';
}

export const Badge: React.FC<BadgeProps> = ({ text, type, variant = 'indigo' }) => {
  let bgColor = 'rgba(99, 102, 241, 0.15)';
  let textColor = '#A5B4FC';
  let borderColor = 'rgba(99, 102, 241, 0.3)';

  if (type === 'it' || variant === 'cyan') {
    bgColor = 'rgba(6, 182, 212, 0.15)';
    textColor = '#67E8F9';
    borderColor = 'rgba(6, 182, 212, 0.3)';
  } else if (type === 'toeic' || variant === 'green') {
    bgColor = 'rgba(16, 185, 129, 0.15)';
    textColor = '#6EE7B7';
    borderColor = 'rgba(16, 185, 129, 0.3)';
  } else if (type === 'ielts' || variant === 'amber') {
    bgColor = 'rgba(245, 158, 11, 0.15)';
    textColor = '#FDE68A';
    borderColor = 'rgba(245, 158, 11, 0.3)';
  } else if (type === 'oxford' || variant === 'rose') {
    bgColor = 'rgba(244, 63, 94, 0.15)';
    textColor = '#FDA4AF';
    borderColor = 'rgba(244, 63, 94, 0.3)';
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        backgroundColor: bgColor,
        color: textColor,
        border: `1px solid ${borderColor}`,
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}
    >
      {text}
    </span>
  );
};
