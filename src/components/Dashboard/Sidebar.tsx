import React from 'react';
import { BookOpen, BarChart3, Settings, PlayCircle, Zap } from 'lucide-react';
import { APP_VERSION } from '../../config/version';

interface SidebarProps {
  activeTab: 'decks' | 'stats' | 'settings';
  setActiveTab: (tab: 'decks' | 'stats' | 'settings') => void;
  onPracticeNow: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onPracticeNow }) => {
  const handleQuickAdd = () => {
    if ((window as any).electronAPI?.openQuickAdd) {
      (window as any).electronAPI.openQuickAdd();
    } else {
      window.location.hash = '#quick-add';
    }
  };

  return (
    <div
      style={{
        width: '240px',
        background: 'rgba(15, 23, 42, 0.9)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 16px'
      }}
    >
      <div>
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', paddingLeft: '8px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF',
              fontWeight: 800,
              fontSize: '1.2rem',
              boxShadow: 'var(--shadow-glow)'
            }}
          >
            E
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#FFF', letterSpacing: '-0.02em' }}>Engion</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>Tray Micro-Learner • v{APP_VERSION}</div>
          </div>
        </div>

        {/* Nav Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button
            onClick={() => setActiveTab('decks')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.92rem',
              transition: 'all 0.2s ease',
              background: activeTab === 'decks' ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
              color: activeTab === 'decks' ? '#FFF' : 'var(--text-muted)'
            }}
          >
            <BookOpen size={18} style={{ color: activeTab === 'decks' ? 'var(--accent-primary)' : undefined }} />
            Kho từ vựng
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.92rem',
              transition: 'all 0.2s ease',
              background: activeTab === 'stats' ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
              color: activeTab === 'stats' ? '#FFF' : 'var(--text-muted)'
            }}
          >
            <BarChart3 size={18} style={{ color: activeTab === 'stats' ? 'var(--accent-cyan)' : undefined }} />
            Thống kê tiến độ
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.92rem',
              transition: 'all 0.2s ease',
              background: activeTab === 'settings' ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
              color: activeTab === 'settings' ? '#FFF' : 'var(--text-muted)'
            }}
          >
            <Settings size={18} style={{ color: activeTab === 'settings' ? 'var(--accent-amber)' : undefined }} />
            Cài đặt & Hạn giờ
          </button>
        </div>
      </div>

      {/* Smart Status Card & Quick Action */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          onClick={handleQuickAdd}
          className="btn btn-secondary"
          style={{ width: '100%', justifyContent: 'center', gap: '8px', padding: '10px', fontSize: '0.85rem', color: 'var(--accent-amber)' }}
        >
          <Zap size={16} /> ⚡ Thêm từ nhanh (Alt+N)
        </button>

        <button
          onClick={onPracticeNow}
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', gap: '8px', padding: '11px' }}
        >
          <PlayCircle size={18} /> Học từ ngay
        </button>
      </div>
    </div>
  );
};
