import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { speakWord } from '../../services/audio';

interface AudioButtonProps {
  word: string;
  size?: number;
  className?: string;
}

export const AudioButton: React.FC<AudioButtonProps> = ({ word, size = 18, className = '' }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(true);
    speakWord(word);
    setTimeout(() => setIsPlaying(false), 1000);
  };

  return (
    <button
      onClick={handlePlay}
      title="Nghe phát âm"
      className={`btn-icon ${isPlaying ? 'pulse-speaker' : ''} ${className}`}
      style={{
        color: isPlaying ? 'var(--accent-cyan)' : undefined,
        borderColor: isPlaying ? 'var(--accent-cyan)' : undefined
      }}
    >
      <Volume2 size={size} />
    </button>
  );
};
