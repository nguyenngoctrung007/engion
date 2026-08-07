import React, { useState, useEffect } from 'react';
import { LearningStats, VocabularyWord, UserWordProgress } from '../../types';
import { StorageService } from '../../services/storage';
import { QuickReviewModal } from './QuickReviewModal';
import { AudioButton } from '../Common/AudioButton';
import { Flame, CheckCircle2, BookOpen, Target, Award, Zap, AlertTriangle } from 'lucide-react';

export const StatsOverview: React.FC = () => {
  const [stats, setStats] = useState<LearningStats>({
    totalLearned: 0,
    masteredCount: 0,
    learningCount: 0,
    streakDays: 1,
    lastActiveDate: '',
    accuracyRate: 100,
    todayLearnedCount: 0
  });

  const [weakWords, setWeakWords] = useState<Array<{ word: VocabularyWord; progress: UserWordProgress; accuracy: number }>>([]);
  const [showQuickReview, setShowQuickReview] = useState(false);

  const refreshStats = () => {
    setStats(StorageService.getStats());
    setWeakWords(StorageService.getTopWeakWords(5));
  };

  useEffect(() => {
    refreshStats();
  }, []);

  return (
    <div style={{ padding: '32px', flex: 1, overflowY: 'auto' }}>
      {showQuickReview && (
        <QuickReviewModal
          onClose={() => {
            setShowQuickReview(false);
            refreshStats();
          }}
          onCompleted={() => {
            refreshStats();
          }}
        />
      )}

      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FFF' }}>Thống Kê Tiến Độ Học</h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Theo dõi khả năng ghi nhớ ngắt quãng (Spaced Repetition System) của bạn
        </p>
      </div>

      {/* Stats KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--accent-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Đã ôn tập</span>
            <BookOpen size={20} style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#FFF' }}>{stats.totalLearned}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>từ vựng được ghi nhận</div>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--accent-green)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Đã thuộc lòng</span>
            <Award size={20} style={{ color: 'var(--accent-green)' }} />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#FFF' }}>{stats.masteredCount}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--accent-green)', marginTop: '4px' }}>Cấp độ Box 4 & Box 5</div>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--accent-cyan)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tỷ lệ chính xác</span>
            <Target size={20} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#FFF' }}>{stats.accuracyRate}%</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>trên tổng số câu hỏi</div>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--accent-amber)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Chuỗi học (Streak)</span>
            <Flame size={20} style={{ color: 'var(--accent-amber)' }} />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#FFF' }}>{stats.streakDays} ngày</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--accent-amber)', marginTop: '4px' }}>Duy trì học thụ động liên tục</div>
        </div>
      </div>

      {/* Daily Target Progress Card */}
      {(() => {
        const settings = StorageService.getSettings();
        const target = settings.dailyTargetWords || 10;
        const current = stats.todayLearnedCount || 0;
        const percent = Math.min(100, Math.round((current / target) * 100));
        const isCompleted = current >= target;

        return (
          <div className="glass-card" style={{ padding: '24px', marginBottom: '24px', borderLeft: `4px solid ${isCompleted ? '#10B981' : 'var(--accent-primary)'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Target size={20} style={{ color: isCompleted ? '#10B981' : 'var(--accent-primary)' }} />
                  🎯 Chỉ Tiêu Học Hôm Nay (Daily Target)
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {isCompleted
                    ? '🎉 Xuất sắc! Bạn đã hoàn thành 100% mục tiêu học từ vựng hôm nay!'
                    : `Hãy hoàn thành thêm ${target - current} từ vựng nữa để đạt chỉ tiêu hôm nay.`}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                  onClick={() => setShowQuickReview(true)}
                  className="btn btn-primary"
                  style={{ padding: '10px 16px', fontSize: '0.88rem', gap: '6px' }}
                >
                  <Zap size={16} /> Ôn 10 từ siêu tốc
                </button>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 900, color: isCompleted ? '#10B981' : '#FFF' }}>
                    {current} / {target}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '6px' }}>từ ({percent}%)</span>
                </div>
              </div>
            </div>

            <div style={{ height: '12px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '6px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${percent}%`,
                  height: '100%',
                  background: isCompleted ? 'linear-gradient(90deg, #10B981 0%, #34D399 100%)' : 'linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-cyan) 100%)',
                  borderRadius: '6px',
                  transition: 'width 0.4s ease-in-out'
                }}
              />
            </div>
          </div>
        );
      })()}

      {/* Top Weakest / Most Frequently Failed Words Card */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px', borderLeft: '4px solid var(--accent-rose)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={20} style={{ color: 'var(--accent-rose)' }} />
              🔥 Danh Sách Các Từ vựng Hay Sai Nhất (Cần Chú Ý)
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Thống kê từ vựng bạn bị đánh dấu Khó (`Hard`) nhiều lần hoặc có tỷ lệ trả lời đúng thấp:
            </p>
          </div>

          <button
            onClick={() => setShowQuickReview(true)}
            className="btn btn-primary"
            style={{ padding: '8px 14px', fontSize: '0.82rem', gap: '6px' }}
          >
            <Zap size={14} /> ⚡ Ôn 10 từ siêu tốc
          </button>
        </div>

        {weakWords.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {weakWords.map(({ word, progress, accuracy }) => (
              <div
                key={word.id}
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <AudioButton word={word.word} size={14} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {word.word}
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 400 }}>{word.phonetic}</span>
                      <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)', color: 'var(--accent-amber)' }}>{word.pos}</span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {word.definition}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {progress.consecutiveHard > 0 && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 8px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                      ❌ Khó {progress.consecutiveHard} lần liên tiếp
                    </span>
                  )}
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: accuracy < 50 ? '#EF4444' : 'var(--accent-amber)' }}>
                    Chính xác: {accuracy}% ({progress.correctCount}/{progress.reviewsCount})
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            ✨ Tuyệt vời! Bạn không có từ vựng nào bị trả lời sai nhiều hoặc gặp khó khăn.
          </div>
        )}
      </div>

      {/* SRS Box distribution details */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFF', marginBottom: '16px' }}>
          Phân bố thuật toán Lặp lại ngắt quãng (SRS Memory Boxes 1 - 5)
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
          Mỗi lần bạn chọn <strong>"Dễ / Thuộc"</strong>, từ vựng sẽ được thăng cấp lên Box cao hơn và giảm tần suất lặp lại.
        </p>

        {(() => {
          const total = stats.totalLearned || 1;
          const b1 = stats.box1Count || (stats.totalLearned - stats.masteredCount);
          const b2 = stats.box2Count || 0;
          const b3 = stats.box3Count || 0;
          const b45 = stats.masteredCount || (stats.box4Count || 0) + (stats.box5Count || 0);

          const p1 = Math.round((b1 / total) * 100);
          const p2 = Math.round((b2 / total) * 100);
          const p3 = Math.round((b3 / total) * 100);
          const p45 = Math.round((b45 / total) * 100);

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>
                  <span style={{ color: '#EF4444' }}>Box 1: Mới học / Hay quên ({b1} từ — Lặp mỗi 1 ngày)</span>
                  <span>{p1}%</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${p1}%`, height: '100%', background: '#EF4444', transition: 'width 0.3s' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>
                  <span style={{ color: '#F59E0B' }}>Box 2: Đang ghi nhớ ({b2} từ — Lặp sau 4 ngày)</span>
                  <span>{p2}%</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${p2}%`, height: '100%', background: '#F59E0B', transition: 'width 0.3s' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>
                  <span style={{ color: '#6366F1' }}>Box 3: Khá vững ({b3} từ — Lặp sau 7–10 ngày)</span>
                  <span>{p3}%</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${p3}%`, height: '100%', background: '#6366F1', transition: 'width 0.3s' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>
                  <span style={{ color: '#10B981' }}>Box 4 & 5: Thuộc lòng ({b45} từ — Lặp sau 15–30 ngày)</span>
                  <span>{p45}%</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${p45}%`, height: '100%', background: '#10B981', transition: 'width 0.3s' }} />
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Gamification Badges Section */}
      <div className="glass-card" style={{ padding: '24px', marginTop: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFF', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={20} style={{ color: 'var(--accent-amber)' }} /> 🏆 Bảng Huy Hiệu Vinh Danh & Thành Tích
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px', marginBottom: '24px' }}>
          {[
            {
              title: '🔥 Streak 7 Ngày',
              desc: 'Duy trì học liên tục 7 ngày',
              unlocked: stats.streakDays >= 7
            },
            {
              title: '🧠 Bậc Thầy Từ Vựng',
              desc: 'Master thành công 10 từ vựng (Box 4 & 5)',
              unlocked: stats.masteredCount >= 10
            },
            {
              title: '⚡ Học Giả Chăm Chỉ',
              desc: 'Ôn tập 20 từ vựng trở lên trong Kho',
              unlocked: stats.totalLearned >= 20
            },
            {
              title: '🎯 Sát Thủ Tiếng Anh',
              desc: 'Tỷ lệ chính xác trên 80% khi ôn luyện',
              unlocked: stats.accuracyRate >= 80 && stats.totalLearned > 5
            }
          ].map((badge, idx) => (
            <div
              key={idx}
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                background: badge.unlocked ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${badge.unlocked ? 'var(--accent-amber)' : 'var(--border-subtle)'}`,
                opacity: badge.unlocked ? 1 : 0.5
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '1rem', color: badge.unlocked ? 'var(--accent-amber)' : 'var(--text-muted)', marginBottom: '4px' }}>
                {badge.title}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{badge.desc}</div>
              <div style={{ marginTop: '8px', fontSize: '0.72rem', fontWeight: 800, color: badge.unlocked ? '#10B981' : 'var(--text-muted)' }}>
                {badge.unlocked ? '✓ ĐÃ MỞ KHÓA' : '🔒 CHƯA ĐẠT'}
              </div>
            </div>
          ))}
        </div>

        {/* Provocative / Roast Badges Section */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#EF4444', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} style={{ color: '#EF4444' }} /> 😈 Bảng Huy Hiệu "Khích Tướng" (Troll & Roast Badges)
          </h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Huy hiệu này sẽ tự động gắn cho bạn nếu phát hiện thói quen hay quên hoặc lười biếng!
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
            {[
              {
                title: '😴 Trùm Làm Biếng',
                desc: 'Hôm nay chưa học từ nào hoặc Streak = 1',
                roast: 'Hôm nay bạn chưa nạp từ nào! Đừng lười nữa, dậy học ngay!',
                active: stats.todayLearnedCount === 0 || stats.streakDays <= 1,
                color: '#F59E0B'
              },
              {
                title: '❌ Trùm Sai Vặt',
                desc: 'Đánh dấu Khó / Sai từ 3 lần trở lên',
                roast: 'Sai liên tục vài từ quen thuộc! Cần chú ý ôn lại ngay!',
                active: (stats.totalWrong || 0) >= 3,
                color: '#EF4444'
              },
              {
                title: '🎲 Chuyên Gia Chọn Lụi',
                desc: 'Tỷ lệ chính xác dưới 50% khi làm quiz',
                roast: 'Tỷ lệ chính xác dưới 50%! Đừng đánh lụi bừa nữa nhé!',
                active: stats.accuracyRate < 50 && (stats.totalReviews || 0) >= 5,
                color: '#EC4899'
              },
              {
                title: '🌀 Thánh Quên Từ',
                desc: 'Có từ dính ở Box 1 chưa thăng cấp được',
                roast: 'Có từ bị dính ở Box 1 lặp đi lặp lại chưa thuộc!',
                active: (stats.box1Count || 0) >= 2,
                color: '#A855F7'
              }
            ].map((badge, idx) => (
              <div
                key={idx}
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: badge.active ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${badge.active ? badge.color : 'var(--border-subtle)'}`,
                  opacity: badge.active ? 1 : 0.45
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: badge.active ? badge.color : 'var(--text-muted)', marginBottom: '4px' }}>
                  {badge.title}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '6px' }}>{badge.desc}</div>
                <div style={{ fontSize: '0.74rem', fontStyle: 'italic', color: badge.active ? '#FFF' : 'var(--text-dim)', background: badge.active ? 'rgba(0,0,0,0.3)' : 'transparent', padding: badge.active ? '4px 8px' : '0', borderRadius: '4px' }}>
                  {badge.active ? `🔥 "${badge.roast}"` : '✨ Chưa dính danh hiệu này'}
                </div>
                <div style={{ marginTop: '8px', fontSize: '0.72rem', fontWeight: 800, color: badge.active ? badge.color : 'var(--text-muted)' }}>
                  {badge.active ? '⚠️ ĐANG DÍNH DẠNG NÀY' : '🛡️ AN TOÀN'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
