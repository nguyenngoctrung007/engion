import React, { useState } from 'react';
import { AppSettings, DeckType, TargetLanguage } from '../../types';
import { StorageService } from '../../services/storage';
import { Clock, Sliders, Volume2, ShieldAlert, Sparkles, Check, Power, Keyboard, Download, Upload, Moon, Globe, Target, Trash2, RotateCcw } from 'lucide-react';

interface SettingsPanelProps {
  onPracticeNow: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onPracticeNow }) => {
  const [settings, setSettings] = useState<AppSettings>(StorageService.getSettings());
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (updated: AppSettings) => {
    setSettings(updated);
    StorageService.saveSettings(updated);
    if ((window as any).electronAPI) {
      (window as any).electronAPI.updateSettings(updated);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const toggleDeck = (deckKey: DeckType) => {
    const current = [...settings.selectedDecks];
    const exists = current.includes(deckKey);
    const updatedDecks = exists ? current.filter((d) => d !== deckKey) : [...current, deckKey];
    if (updatedDecks.length === 0) return;
    handleSave({ ...settings, selectedDecks: updatedDecks });
  };

  const handleExport = () => {
    const dataStr = StorageService.exportData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `engion-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const csvContent = StorageService.exportCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `engion-anki-vocabulary-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = StorageService.importData(content);
        if (success) {
          setSettings(StorageService.getSettings());
          setSavedSuccess(true);
          setTimeout(() => setSavedSuccess(false), 2000);
        } else {
          alert('File sao lưu JSON không hợp lệ!');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ padding: '32px', flex: 1, overflowY: 'auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FFF' }}>Cài Đặt & Nâng Cao</h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Tùy chỉnh tần suất hiển thị popup, phím tắt, tự động chạy ngầm và sao lưu dữ liệu
        </p>
      </div>

      {savedSuccess && (
        <div
          className="animate-pop"
          style={{
            position: 'fixed',
            bottom: '28px',
            right: '32px',
            zIndex: 9999,
            padding: '12px 20px',
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)',
            borderRadius: 'var(--radius-lg)',
            color: '#FFF',
            fontWeight: 700,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            pointerEvents: 'none'
          }}
        >
          <Check size={18} /> Đã tự động lưu cài đặt!
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '720px' }}>
        {/* Test Popup Card */}
        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--accent-cyan)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} style={{ color: 'var(--accent-cyan)' }} /> Xem thử giao diện Popup
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Bấm nút để mở ngay cửa sổ Popup nổi ở góc dưới màn hình để trải nghiệm.
              </p>
            </div>
            <button onClick={onPracticeNow} className="btn btn-primary">
              Bật Popup ngay
            </button>
          </div>
        </div>

        {/* Global Hotkey Card */}
        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--accent-amber)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Keyboard size={18} style={{ color: 'var(--accent-amber)' }} /> Phím tắt toàn hệ thống (Global Hotkey)
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Nhấn tổ hợp phím bất kỳ lúc nào khi làm việc để gọi ngay cửa sổ học:
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ padding: '6px 12px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '6px', fontSize: '0.88rem', fontWeight: 800, color: 'var(--accent-amber)', fontFamily: 'monospace' }}>Alt + E</span>
              <span style={{ padding: '6px 12px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '6px', fontSize: '0.88rem', fontWeight: 800, color: 'var(--accent-amber)', fontFamily: 'monospace' }}>Ctrl + Shift + E</span>
            </div>
          </div>
        </div>

        {/* Auto Launch on Boot */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Power size={18} style={{ color: 'var(--accent-green)' }} /> Khởi động cùng Windows
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Tự động chạy ngầm Engion ở khay hệ thống khi bạn mở máy tính.
              </p>
            </div>
            <button
              onClick={() => handleSave({ ...settings, autoLaunch: !settings.autoLaunch })}
              className={`btn ${settings.autoLaunch ? 'btn-primary' : 'btn-secondary'}`}
              style={{ minWidth: '100px', justifyContent: 'center' }}
            >
              {settings.autoLaunch ? 'Đã bật' : 'Đang tắt'}
            </button>
          </div>
        </div>

        {/* Do Not Disturb (DND) Card */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Moon size={18} style={{ color: 'var(--accent-amber)' }} /> Chế Độ Không Làm Phiền (Do Not Disturb)
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Tạm dừng hoặc hẹn giờ im lặng chặn các popup tự động hiển thị:
              </p>
            </div>
            <button
              onClick={() => handleSave({ ...settings, dndEnabled: !settings.dndEnabled })}
              className={`btn ${settings.dndEnabled ? 'btn-primary' : 'btn-secondary'}`}
              style={{ minWidth: '130px', justifyContent: 'center' }}
            >
              {settings.dndEnabled ? '🌙 Khung giờ Bật' : '☀️ Khung giờ Tắt'}
            </button>
          </div>

          {/* Quick Pause Buttons */}
          <div style={{ marginBottom: '16px', padding: '14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFF', marginBottom: '10px' }}>
              ⚡ Tạm dừng Popup nhanh:
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {[
                { label: 'Tạm dừng 1 giờ', mins: 60 },
                { label: 'Tạm dừng 2 giờ', mins: 120 },
                { label: 'Tạm dừng đến 7:00 sáng mai', untilTomorrow: true }
              ].map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    let untilIso: string;
                    if (opt.untilTomorrow) {
                      const t = new Date();
                      t.setDate(t.getDate() + 1);
                      t.setHours(7, 0, 0, 0);
                      untilIso = t.toISOString();
                    } else {
                      untilIso = new Date(Date.now() + (opt.mins || 60) * 60 * 1000).toISOString();
                    }
                    handleSave({ ...settings, dndUntil: untilIso });
                  }}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.82rem', padding: '8px 14px' }}
                >
                  {opt.label}
                </button>
              ))}

              {settings.dndUntil && (
                <button
                  onClick={() => handleSave({ ...settings, dndUntil: null })}
                  className="btn"
                  style={{ fontSize: '0.82rem', padding: '8px 14px', background: 'rgba(239, 68, 68, 0.2)', color: '#FCA5A5', border: '1px solid rgba(239, 68, 68, 0.4)' }}
                >
                  🔔 Bật lại ngay (Hủy tạm dừng)
                </button>
              )}
            </div>
            {settings.dndUntil && (
              <div style={{ marginTop: '10px', fontSize: '0.8rem', color: 'var(--accent-amber)', fontWeight: 600 }}>
                ⏰ Đang tạm dừng popup tới: {new Date(settings.dndUntil).toLocaleString('vi-VN')}
              </div>
            )}
          </div>

          {/* Scheduled Quiet Hours Inputs */}
          {settings.dndEnabled && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFF' }}>🕒 Khung giờ im lặng đêm:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Bắt đầu:</span>
                <input
                  type="time"
                  value={settings.dndStart || '22:00'}
                  onChange={(e) => handleSave({ ...settings, dndStart: e.target.value })}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    color: '#FFF',
                    padding: '6px 10px',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Kết thúc:</span>
                <input
                  type="time"
                  value={settings.dndEnd || '07:00'}
                  onChange={(e) => handleSave({ ...settings, dndEnd: e.target.value })}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    color: '#FFF',
                    padding: '6px 10px',
                    fontSize: '0.88rem'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Daily Target Words Setting */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFF', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={18} style={{ color: '#10B981' }} /> Mục Tiêu Từ Vựng Mỗi Ngày (Daily Target)
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Số lượng từ vựng tối thiểu cần ôn luyện / hoàn thành mỗi ngày để duy trì thói quen:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
            {[
              { label: '5 từ / ngày', value: 5 },
              { label: '10 từ (Khuyên dùng)', value: 10 },
              { label: '15 từ / ngày', value: 15 },
              { label: '20 từ / ngày', value: 20 },
              { label: '30 từ / ngày', value: 30 }
            ].map((option) => {
              const isSelected = (settings.dailyTargetWords || 10) === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => handleSave({ ...settings, dailyTargetWords: option.value })}
                  className="btn"
                  style={{
                    padding: '12px',
                    fontSize: '0.88rem',
                    flexDirection: 'column',
                    background: isSelected ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'rgba(255, 255, 255, 0.04)',
                    color: isSelected ? '#FFF' : 'var(--text-muted)',
                    border: '1px solid var(--border-subtle)',
                    fontWeight: isSelected ? 700 : 500
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interval timing setting */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFF', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} style={{ color: 'var(--accent-primary)' }} /> Tần suất hiện Popup (Interval)
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Chọn khoảng thời gian giữa các lần hiển thị popup đếm ngầm:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
            {[
              { label: '10 giây (Test)', value: 0.16 },
              { label: '15 phút', value: 15 },
              { label: '30 phút (Khuyên dùng)', value: 30 },
              { label: '60 phút', value: 60 }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => handleSave({ ...settings, popupIntervalMinutes: option.value })}
                className="btn"
                style={{
                  padding: '12px',
                  fontSize: '0.88rem',
                  flexDirection: 'column',
                  background: settings.popupIntervalMinutes === option.value ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.04)',
                  color: settings.popupIntervalMinutes === option.value ? '#FFF' : 'var(--text-muted)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <span style={{ fontWeight: 700 }}>{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Auto Audio & Accent */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFF', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Volume2 size={18} style={{ color: 'var(--accent-cyan)' }} /> Tự động đọc phát âm (Audio Accent)
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Cấu hình âm thanh đọc từ vựng tiếng Anh khi hiển thị:
          </p>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button
              onClick={() => handleSave({ ...settings, autoAudio: !settings.autoAudio })}
              className={`btn ${settings.autoAudio ? 'btn-primary' : 'btn-secondary'}`}
            >
              {settings.autoAudio ? '🔊 Tự phát âm khi mở Popup' : '🔇 Tắt phát âm tự động'}
            </button>

            <div style={{ display: 'flex', gap: '6px' }}>
              {(['US', 'UK'] as const).map((acc) => (
                <button
                  key={acc}
                  onClick={() => handleSave({ ...settings, accent: acc })}
                  className="btn"
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.85rem',
                    background: (settings.accent || 'US') === acc ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.04)',
                    color: (settings.accent || 'US') === acc ? '#0F172A' : 'var(--text-muted)',
                    fontWeight: 700
                  }}
                >
                  Giọng {acc}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Target Translation Language */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFF', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={18} style={{ color: 'var(--accent-primary)' }} /> Ngôn ngữ dịch tự động (Target Language)
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Tùy chọn ngôn ngữ dịch khi sử dụng tính năng ⚡ Tra tự động từ vựng:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
            {[
              { id: 'vi', label: '🇻🇳 Tiếng Việt' },
              { id: 'ja', label: '🇯🇵 Tiếng Nhật' },
              { id: 'ko', label: '🇰🇷 Tiếng Hàn' },
              { id: 'zh', label: '🇨🇳 Tiếng Trung' },
              { id: 'fr', label: '🇫🇷 Tiếng Pháp' },
              { id: 'es', label: '🇪🇸 Tây Ban Nha' },
              { id: 'de', label: '🇩🇪 Tiếng Đức' }
            ].map((lang) => {
              const isSelected = (settings.targetLanguage || 'vi') === lang.id;
              return (
                <button
                  key={lang.id}
                  onClick={() => handleSave({ ...settings, targetLanguage: lang.id as TargetLanguage })}
                  className="btn"
                  style={{
                    padding: '10px 14px',
                    fontSize: '0.85rem',
                    background: isSelected ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.04)',
                    color: isSelected ? '#FFF' : 'var(--text-muted)',
                    border: '1px solid var(--border-subtle)',
                    justifyContent: 'center',
                    fontWeight: isSelected ? 700 : 500
                  }}
                >
                  {lang.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Decks Selection */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFF', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={18} style={{ color: 'var(--accent-amber)' }} /> Chọn Bộ Từ Vựng Học (Active Decks)
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Bật/Tắt các bộ từ bạn muốn hệ thống rút ngẫu nhiên ra để ôn luyện:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            {[
              { id: 'it', title: 'IT English', desc: 'Từ vựng chuyên ngành Dev & CNTT' },
              { id: 'toeic', title: 'TOEIC 600', desc: 'Từ vựng tiếng Anh văn phòng' },
              { id: 'ielts', title: 'IELTS Core 800', desc: 'Từ vựng học thuật Band 6.5+' },
              { id: 'oxford', title: 'Oxford 3000', desc: '3000 từ giao tiếp thông dụng' },
              { id: 'custom', title: 'CUSTOM Words', desc: 'Từ vựng cá nhân thêm thủ công' },
              ...StorageService.getCustomDeckCategories().map(cd => ({
                id: cd.id,
                title: cd.name,
                desc: 'Bộ từ tùy chỉnh do bạn tạo'
              }))
            ]
            .filter(deck => !StorageService.getDeletedDeckIds().includes(deck.id))
            .map((deck) => {
              const isChecked = settings.selectedDecks.includes(deck.id as DeckType);
              return (
                <div
                  key={deck.id}
                  onClick={() => toggleDeck(deck.id as DeckType)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: isChecked ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${isChecked ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFF' }}>{deck.title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{deck.desc}</div>
                  </div>
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      background: isChecked ? 'var(--accent-primary)' : 'transparent',
                      border: `1px solid ${isChecked ? 'var(--accent-primary)' : 'var(--text-dim)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFF'
                    }}
                  >
                    {isChecked && <Check size={14} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Export & Import Backup */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFF', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={18} style={{ color: 'var(--accent-green)' }} /> Sao Lưu & Phục Hồi Dữ Liệu (Backup & Restore)
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Xuất hoặc nhập dữ liệu cài đặt, từ vựng tự tạo và lịch sử học tập dạng file JSON:
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={handleExport} className="btn btn-secondary" style={{ gap: '8px' }}>
              <Download size={16} /> 📥 Xuất dữ liệu (JSON)
            </button>

            <button onClick={handleExportCSV} className="btn btn-secondary" style={{ gap: '8px', color: 'var(--accent-amber)' }}>
              📊 Xuất file CSV / Flashcard
            </button>

            <label className="btn btn-secondary" style={{ cursor: 'pointer', gap: '8px' }}>
              <Upload size={16} /> 📤 Nhập dữ liệu từ file
              <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        {/* Reset All Data Card */}
        <div className="glass-card" style={{ padding: '24px', borderLeft: '4px solid #EF4444' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FCA5A5', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trash2 size={18} style={{ color: '#EF4444' }} /> Tùy Chọn Khôi Phục & Làm Sạch Dữ Liệu (Data Reset & Purge)
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Chọn 1 trong 2 chế độ reset tùy theo nhu cầu học tập của bạn:
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                if (confirm('🔄 BẠN CÓ CHẮC CHẮN MUỐN RESET VỀ BỘ TỪ MẶC ĐỊNH KHÔNG?\n\nTất cả từ nạp từ Anki/Custom sẽ bị xóa, khôi phục lại các bộ từ gốc IT, TOEIC, IELTS, Oxford.')) {
                  StorageService.resetToDefaultPresets();
                  alert('🎉 Đã khôi phục thành công các bộ từ vựng mặc định ban đầu!');
                  window.location.reload();
                }
              }}
              className="btn"
              style={{
                padding: '10px 18px',
                background: 'rgba(59, 130, 246, 0.2)',
                color: '#93C5FD',
                border: '1px solid rgba(59, 130, 246, 0.5)',
                fontWeight: 700,
                gap: '8px'
              }}
            >
              <RotateCcw size={16} /> 🔄 1. Reset Về Bộ Từ Mặc Định (IT, TOEIC, IELTS, Oxford)
            </button>

            <button
              onClick={() => {
                if (confirm('⚠️ BẠN CÓ CHẮC CHẮN MUỐN XÓA SẠCH TRẮNG 100% DỮ LIỆU KHÔNG?\n\nTất cả các từ vựng và bộ từ (kể cả bộ từ mặc định) sẽ bị xóa hoàn toàn. Danh sách từ vựng sẽ về 0 từ.')) {
                  StorageService.cleanEverythingCompletely();
                  alert('🧹 Đã làm sạch trắng 100% dữ liệu! Ứng dụng hiện tại có 0 từ vựng.');
                  window.location.reload();
                }
              }}
              className="btn"
              style={{
                padding: '10px 18px',
                background: 'rgba(239, 68, 68, 0.25)',
                color: '#FCA5A5',
                border: '1px solid rgba(239, 68, 68, 0.6)',
                fontWeight: 700,
                gap: '8px'
              }}
            >
              <Trash2 size={16} /> 🧹 2. Xóa Sạch Trắng 100% Dữ Liệu (Clean Everything)
            </button>
          </div>
        </div>
      </div>

      {/* App Version Info Footer */}
      <div style={{ marginTop: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', opacity: 0.8 }}>
        Engion Tray Learner • Phiên bản <strong>v1.0.0</strong> (Official Release)
      </div>
    </div>
  );
};
