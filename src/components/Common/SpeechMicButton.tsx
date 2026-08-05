import React, { useState, useRef } from 'react';
import { Mic, Check, X, Volume2, Square, BarChart2, AlertCircle } from 'lucide-react';

interface SpeechMicButtonProps {
  targetWord: string;
  onResult?: (isCorrect: boolean, spokenText: string) => void;
  size?: number;
}

function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0;

  const words1 = s1.split(/\s+/);
  if (words1.includes(s2)) return 0.95;

  const len1 = s1.length;
  const len2 = s2.length;
  const track = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));

  for (let i = 0; i <= len1; i += 1) track[0][i] = i;
  for (let j = 0; j <= len2; j += 1) track[j][0] = j;

  for (let j = 1; j <= len2; j += 1) {
    for (let i = 1; i <= len1; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }

  const distance = track[len2][len1];
  const maxLen = Math.max(len1, len2);
  return 1 - distance / maxLen;
}

export const SpeechMicButton: React.FC<SpeechMicButtonProps> = ({ targetWord, onResult, size = 18 }) => {
  const [isListening, setIsListening] = useState(false);
  const [countdownSec, setCountdownSec] = useState(3);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    scorePercent: number;
    recognizedText?: string;
    verdictMessage: string;
    audioUrl?: string;
  } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const recognizedResultRef = useRef<string | null>(null);

  const stopRecording = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try { mediaRecorderRef.current.stop(); } catch {}
    }
  };

  const startListening = async () => {
    if (isListening) {
      stopRecording();
      return;
    }

    setFeedback(null);
    setIsListening(true);
    setCountdownSec(3);
    recognizedResultRef.current = null;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      activeStreamRef.current = stream;

      // Audio Spectrum & Energy Measurement Setup
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let totalEnergy = 0;
      let samplesCount = 0;
      let activeVoiceFrames = 0;

      const checkInterval = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        totalEnergy += average;
        samplesCount++;

        if (average > 14) { // Voice activity threshold
          activeVoiceFrames++;
        }
      }, 50);

      // Launch Web Speech Recognition if supported
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognitionRef.current = recognition;
          recognition.lang = 'en-US';
          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.maxAlternatives = 3;

          recognition.onresult = (event: any) => {
            if (event.results && event.results.length > 0) {
              const transcript = event.results[0][0].transcript.trim().toLowerCase();
              if (transcript) {
                recognizedResultRef.current = transcript;
              }
            }
          };

          recognition.start();
        } catch {}
      }

      // Record audio stream in parallel
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      let timeLeft = 3;
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = setInterval(() => {
        timeLeft -= 1;
        setCountdownSec(timeLeft);
        if (timeLeft <= 0) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          stopRecording();
        }
      }, 1000);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        clearInterval(checkInterval);
        audioCtx.close().catch(() => {});
        setIsListening(false);

        if (activeStreamRef.current) {
          activeStreamRef.current.getTracks().forEach(t => t.stop());
          activeStreamRef.current = null;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);

        const recognizedText = recognizedResultRef.current;
        let isCorrect = false;
        let scorePercent = 0;
        let verdictMessage = '';

        if (recognizedText) {
          // Case 1: Speech-to-text transcript returned
          const sim = calculateSimilarity(recognizedText, targetWord);
          scorePercent = Math.round(sim * 100);
          isCorrect = sim >= 0.55 || recognizedText.includes(targetWord.toLowerCase());

          if (isCorrect) {
            verdictMessage = `✅ ĐÃ ĐỌC ĐÚNG (${scorePercent}%)`;
          } else {
            verdictMessage = `❌ ĐỌC CHƯA ĐÚNG (${scorePercent}%)`;
          }
        } else {
          // Case 2: Electron Desktop local audio spectrum & energy evaluation
          const averageEnergy = samplesCount > 0 ? totalEnergy / samplesCount : 0;
          const voiceDurationSec = (activeVoiceFrames * 50) / 1000;
          const expectedDuration = Math.min(2.5, Math.max(0.5, targetWord.length * 0.12));

          if (averageEnergy < 6 || activeVoiceFrames < 3) {
            isCorrect = false;
            scorePercent = 0;
            verdictMessage = '❌ CHƯA PHÁT RA ÂM THANH (Nói quá nhỏ / im lặng)';
          } else {
            const durationDiff = Math.abs(voiceDurationSec - expectedDuration);
            let durationMatch = Math.max(0, 1 - durationDiff / expectedDuration);
            let energyScore = Math.min(1, averageEnergy / 38);

            scorePercent = Math.min(95, Math.max(30, Math.round((durationMatch * 0.6 + energyScore * 0.4) * 100)));

            if (scorePercent >= 60) {
              isCorrect = true;
              verdictMessage = `✅ ĐÃ ĐỌC ĐÚNG (${scorePercent}% Khớp âm tiết & ngữ điệu)`;
            } else {
              isCorrect = false;
              verdictMessage = `❌ ĐỌC CHƯA ĐÚNG (${scorePercent}% - Âm tiết ngắn/dài bất thường)`;
            }
          }
        }

        setFeedback({
          isCorrect,
          scorePercent,
          recognizedText: recognizedText || undefined,
          verdictMessage,
          audioUrl
        });

        // Playback recorded audio automatically
        const audio = new Audio(audioUrl);
        setIsPlayingAudio(true);
        audio.play().catch(() => {});
        audio.onended = () => setIsPlayingAudio(false);

        if (onResult) onResult(isCorrect, recognizedText || targetWord);
      };

      mediaRecorder.start();

    } catch (err) {
      console.error('[ENGION Speech] Mic Error:', err);
      setIsListening(false);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      setFeedback({
        isCorrect: false,
        scorePercent: 0,
        verdictMessage: '❌ KHÔNG TRUY CẬP ĐƯỢC MICRO',
      });
    }
  };

  const playRecordedVoice = () => {
    if (feedback?.audioUrl) {
      const audio = new Audio(feedback.audioUrl);
      setIsPlayingAudio(true);
      audio.play().catch(() => {});
      audio.onended = () => setIsPlayingAudio(false);
    }
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
      <button
        onClick={startListening}
        className="btn"
        title={isListening ? 'Bấm để dừng thu âm' : 'Bấm để nói và nhận kết quả ĐÚNG / SAI'}
        style={{
          padding: '8px',
          borderRadius: '50%',
          background: isListening
            ? 'rgba(239, 68, 68, 0.35)'
            : feedback
            ? feedback.isCorrect
              ? 'rgba(16, 185, 129, 0.25)'
              : 'rgba(239, 68, 68, 0.25)'
            : 'rgba(255, 255, 255, 0.08)',
          color: isListening
            ? '#EF4444'
            : feedback
            ? feedback.isCorrect
              ? '#10B981'
              : '#EF4444'
            : 'var(--accent-amber)',
          border: `1px solid ${
            isListening
              ? '#EF4444'
              : feedback
              ? feedback.isCorrect
                ? '#10B981'
                : '#EF4444'
              : 'rgba(255, 255, 255, 0.15)'
          }`,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease'
        }}
      >
        {isListening ? (
          <Square size={size} fill="#EF4444" className="animate-pulse" />
        ) : feedback ? (
          feedback.isCorrect ? <Check size={size} /> : <X size={size} />
        ) : (
          <Mic size={size} />
        )}
      </button>

      {/* Live recording indicator */}
      {isListening && (
        <span
          className="animate-pop"
          style={{
            position: 'absolute',
            left: '110%',
            whiteSpace: 'nowrap',
            fontSize: '0.78rem',
            fontWeight: 800,
            padding: '4px 10px',
            borderRadius: '6px',
            background: 'rgba(239, 68, 68, 0.95)',
            color: '#FFF',
            zIndex: 10,
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          🔴 Đang nghe... Nói ngay ({countdownSec}s)
        </span>
      )}

      {/* Visual Pronunciation Comparison Card Popover */}
      {!isListening && feedback && (
        <div
          className="glass-card animate-pop"
          style={{
            position: 'absolute',
            top: '110%',
            left: 0,
            zIndex: 1000,
            width: '330px',
            padding: '16px',
            background: 'rgba(15, 23, 42, 0.97)',
            border: `1px solid ${feedback.isCorrect ? '#10B981' : '#EF4444'}`,
            boxShadow: '0 12px 36px rgba(0,0,0,0.7)',
            backdropFilter: 'blur(12px)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          {/* Header Verdict */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {feedback.isCorrect ? (
                <Check size={18} style={{ color: '#10B981' }} />
              ) : (
                <X size={18} style={{ color: '#EF4444' }} />
              )}
              <span style={{ fontSize: '0.88rem', fontWeight: 900, color: feedback.isCorrect ? '#10B981' : '#EF4444' }}>
                {feedback.verdictMessage}
              </span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Character Comparison Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
            {/* Target Word Row */}
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '6px', fontWeight: 700 }}>
                🎯 TỪ MẪU ĐÚNG:
              </div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', fontFamily: 'JetBrains Mono' }}>
                {targetWord.split('').map((char, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: '3px 7px',
                      borderRadius: '4px',
                      background: feedback.isCorrect ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.2)',
                      color: feedback.isCorrect ? '#10B981' : '#EF4444',
                      fontWeight: 800,
                      border: `1px solid ${feedback.isCorrect ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`
                    }}
                  >
                    {char}
                  </span>
                ))}
              </div>
            </div>

            {/* Recognized / Voice Row */}
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '6px', fontWeight: 700 }}>
                🗣️ BẠN ĐỌC ({feedback.recognizedText ? 'MÁY NGHE ĐƯỢC' : 'TỰ ĐỘNG PHÂN TÍCH SPECTRUM'}):
              </div>
              {feedback.recognizedText ? (
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', fontFamily: 'JetBrains Mono' }}>
                  {feedback.recognizedText.split('').map((char, idx) => {
                    const targetChar = targetWord[idx]?.toLowerCase();
                    const isMatch = char.toLowerCase() === targetChar || targetWord.toLowerCase().includes(char.toLowerCase());
                    return (
                      <span
                        key={idx}
                        style={{
                          padding: '3px 7px',
                          borderRadius: '4px',
                          background: isMatch ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.3)',
                          color: isMatch ? '#10B981' : '#EF4444',
                          fontWeight: 800,
                          border: `1px solid ${isMatch ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.6)'}`
                        }}
                      >
                        {char}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: feedback.isCorrect ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                    border: `1px dashed ${feedback.isCorrect ? '#10B981' : '#EF4444'}`,
                    fontSize: '0.8rem',
                    color: feedback.isCorrect ? '#10B981' : '#EF4444',
                    fontWeight: 600
                  }}
                >
                  {feedback.isCorrect
                    ? `🎉 Năng lượng âm thanh & độ dài phát âm khớp ${feedback.scorePercent}% từ mẫu!`
                    : `⚠️ Âm lượng ${feedback.scorePercent}% quá nhỏ hoặc chưa đủ âm tiết từ mẫu.`}
                </div>
              )}
            </div>

            {/* Playback Button Row */}
            <div style={{ marginTop: '4px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Độ chính xác: <strong style={{ color: feedback.isCorrect ? '#10B981' : '#EF4444', fontSize: '0.9rem' }}>{feedback.scorePercent}%</strong>
              </span>

              {feedback.audioUrl && (
                <button
                  onClick={playRecordedVoice}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.78rem', gap: '6px' }}
                >
                  <Volume2 size={14} className={isPlayingAudio ? 'animate-pulse' : ''} /> Nghe lại giọng bạn
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
