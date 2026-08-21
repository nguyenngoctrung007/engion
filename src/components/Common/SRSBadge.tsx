import React from 'react';
import { UserWordProgress } from '../../types';
import { StorageService } from '../../services/storage';

interface SRSBadgeProps {
  wordId?: string;
  progress?: UserWordProgress;
  compact?: boolean;
}

export const SRSBadge: React.FC<SRSBadgeProps> = ({ wordId, progress, compact = false }) => {
  const p = progress || (wordId ? StorageService.getProgressMap()[wordId] : undefined);
  const reviewsCount = p?.reviewsCount || 0;
  const box = p?.box || 0;
  const correctCount = p?.correctCount || 0;
  const accuracy = reviewsCount > 0 ? Math.round((correctCount / reviewsCount) * 100) : 0;

  if (reviewsCount === 0) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: compact ? '2px 6px' : '3px 8px',
          borderRadius: '6px',
          background: 'rgba(148, 163, 184, 0.08)',
          border: '1px solid rgba(148, 163, 184, 0.18)',
          color: 'var(--text-muted)',
          fontSize: compact ? '0.7rem' : '0.74rem',
          fontWeight: 600,
          cursor: 'default',
          userSelect: 'none'
        }}
        title="Từ mới thêm vào kho • Chưa ôn tập lần nào"
      >
        <span style={{ fontSize: '0.7rem' }}>✨</span>
        <span>Mới • 0 lượt</span>
      </div>
    );
  }

  let boxColor = '#818CF8';
  let boxBg = 'rgba(129, 140, 248, 0.12)';
  let boxBorder = 'rgba(129, 140, 248, 0.3)';
  let boxLabel = `Box ${box}`;

  if (box === 1) {
    boxColor = '#F87171';
    boxBg = 'rgba(239, 68, 68, 0.12)';
    boxBorder = 'rgba(239, 68, 68, 0.3)';
  } else if (box === 2) {
    boxColor = '#FBBF24';
    boxBg = 'rgba(245, 158, 11, 0.12)';
    boxBorder = 'rgba(245, 158, 11, 0.3)';
  } else if (box === 4) {
    boxColor = '#38BDF8';
    boxBg = 'rgba(56, 189, 248, 0.12)';
    boxBorder = 'rgba(56, 189, 248, 0.3)';
  } else if (box >= 5) {
    boxColor = '#34D399';
    boxBg = 'rgba(16, 185, 129, 0.12)';
    boxBorder = 'rgba(16, 185, 129, 0.3)';
    boxLabel = 'Thuộc lòng';
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: compact ? '2px 6px' : '3px 8px',
        borderRadius: '6px',
        background: boxBg,
        border: `1px solid ${boxBorder}`,
        color: boxColor,
        fontSize: compact ? '0.7rem' : '0.74rem',
        fontWeight: 700,
        cursor: 'default',
        userSelect: 'none',
        transition: 'all 0.2s ease'
      }}
      title={`Đã ôn: ${reviewsCount} lượt • Trả lời đúng: ${correctCount}/${reviewsCount} (${accuracy}%) • Cấp độ ghi nhớ: ${boxLabel}`}
    >
      <span style={{ fontSize: '0.7rem' }}>{box >= 5 ? '🌟' : '🔄'}</span>
      <span>{reviewsCount} lượt</span>
      <span style={{ opacity: 0.4 }}>•</span>
      <span>{boxLabel}</span>
    </div>
  );
};
