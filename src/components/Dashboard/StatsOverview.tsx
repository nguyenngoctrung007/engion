import React, { useState, useEffect } from 'react';
import { LearningStats } from '../../types';
import { StorageService } from '../../services/storage';
import { QuickReviewModal } from './QuickReviewModal';
import { Flame, CheckCircle2, BookOpen, Target, Award, Zap } from 'lucide-react';

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

  const [showQuickReview, setShowQuickReview] = useState(false);

  const refreshStats = () => {
    setStats(StorageService.getStats());
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

      {/* SRS Box distribution details */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFF', marginBottom: '16px' }}>
          Phân bố thuật toán Lặp lại ngắt quãng (SRS Memory Boxes)
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
          Mỗi lần bạn bấm <strong>"Dễ / Thuộc"</strong>, từ sẽ được thăng cấp lên Box cao hơn và giảm tần suất lặp lại.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>
              <span style={{ color: 'var(--accent-rose)' }}>Box 1: Mới học / Hay quên (Lặp mỗi 1 ngày)</span>
              <span>{Math.round((stats.learningCount / (stats.totalLearned || 1)) * 100)}%</span>
            </div>
            <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.round((stats.learningCount / (stats.totalLearned || 1)) * 100)}%`, height: '100%', background: 'var(--accent-rose)' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>
              <span style={{ color: 'var(--accent-green)' }}>Box 4 & 5: Thuộc lòng (Lặp lại sau 15-30 ngày)</span>
              <span>{Math.round((stats.masteredCount / (stats.totalLearned || 1)) * 100)}%</span>
            </div>
            <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.round((stats.masteredCount / (stats.totalLearned || 1)) * 100)}%`, height: '100%', background: 'var(--accent-green)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Gamification Badges Section */}
      <div className="glass-card" style={{ padding: '24px', marginTop: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFF', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={20} style={{ color: 'var(--accent-amber)' }} /> Bảng Huy Hiệu & Thành Tích (Gamification)
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          {[
            {
              title: '🔥 Streak 7 Ngày',
              desc: 'Duy trì học liên tục 7 ngày',
              unlocked: stats.streakDays >= 7
            },
            {
              title: '🧠 Bậc Thầy Từ Vựng',
              desc: 'Master thành công 10 từ vựng',
              unlocked: stats.masteredCount >= 10
            },
            {
              title: '⚡ Học Giả Chăm Chỉ',
              desc: 'Ôn tập 20 từ vựng trở lên',
              unlocked: stats.totalLearned >= 20
            },
            {
              title: '🎯 Sát Thủ Tiếng Anh',
              desc: 'Tỷ lệ chính xác trên 80%',
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
              <div style={{ marginTop: '8px', fontSize: '0.72rem', fontWeight: 700, color: badge.unlocked ? '#10B981' : 'var(--text-muted)' }}>
                {badge.unlocked ? '✓ ĐÃ MỞ KHÓA' : '🔒 CHƯA ĐẠT'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
