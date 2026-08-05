import React, { useState } from 'react';
import { PRESET_CATALOG, PresetCatalogItem } from '../../data/presetVocabulary';
import { StorageService } from '../../services/storage';
import { PackageParserService } from '../../services/packageParser';
import { VocabularyWord } from '../../types';
import { X, Download, Check, Sparkles, BookOpen, Globe, Loader2 } from 'lucide-react';

interface PresetLibraryModalProps {
  onClose: () => void;
  onImportSuccess: () => void;
}

export const PresetLibraryModal: React.FC<PresetLibraryModalProps> = ({ onClose, onImportSuccess }) => {
  const [importedDecks, setImportedDecks] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [customUrl, setCustomUrl] = useState('');
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);

  const [previewApkgData, setPreviewApkgData] = useState<{ fileName: string; words: VocabularyWord[] } | null>(null);
  const [targetDeckName, setTargetDeckName] = useState('');

  const handleImportDeck = (preset: PresetCatalogItem) => {
    const count = StorageService.importPresetWords(preset.words);

    setImportedDecks(prev => [...prev, preset.id]);

    if (count > 0) {
      setToastMessage(`🎉 Đã nạp thành công +${count} từ vựng từ bộ "${preset.title}"!`);
    } else {
      setToastMessage(`ℹ️ Bạn đã nạp tất cả các từ trong bộ "${preset.title}" trước đó rồi.`);
    }

    onImportSuccess();

    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleApkgFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoadingUrl(true);

    try {
      const buffer = await file.arrayBuffer();
      let wordList = await PackageParserService.parseApkgBuffer(buffer);

      if (wordList.length === 0 && (file as any).path && (window as any).electronAPI?.parseApkgFile) {
        wordList = await (window as any).electronAPI.parseApkgFile((file as any).path);
      }

      if (wordList && wordList.length > 0) {
        const cleanName = file.name.replace(/\.apkg$/i, '');
        setPreviewApkgData({
          fileName: cleanName,
          words: wordList
        });
        setTargetDeckName(cleanName);
      } else {
        alert('Không tìm thấy dữ liệu từ vựng tương thích trong file .apkg này.');
      }
    } catch (err: any) {
      alert(`Lỗi bóc tách file Anki: ${err.message || 'File .apkg không đúng định dạng'}`);
    } finally {
      setIsLoadingUrl(false);
      e.target.value = '';
    }
  };

  const handleConfirmImportPreview = () => {
    if (!previewApkgData) return;

    let deckId = 'custom';
    if (targetDeckName.trim()) {
      const newDeck = StorageService.addCustomDeckCategory(targetDeckName.trim());
      deckId = newDeck.id;
    }

    const wordsToImport = previewApkgData.words.map(w => ({
      ...w,
      deck: deckId
    }));

    const count = StorageService.importPresetWords(wordsToImport);
    setToastMessage(`🎉 Đã nạp thành công +${count} từ vựng vào bộ "${targetDeckName || 'Custom'}"!`);
    setPreviewApkgData(null);
    onImportSuccess();
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleNativeApkgSelect = async () => {
    setIsLoadingUrl(true);
    try {
      if ((window as any).electronAPI?.selectAndParseApkg) {
        const res = await (window as any).electronAPI.selectAndParseApkg();
        if (res && res.canceled) {
          setIsLoadingUrl(false);
          return;
        }

        if (res && res.success && res.words && res.words.length > 0) {
          const count = StorageService.importPresetWords(res.words);
          setToastMessage(`🎉 Đã nạp thành công +${count} từ vựng từ file Anki "${res.fileName || 'Anki Deck'}"!`);
          onImportSuccess();
          setTimeout(() => setToastMessage(null), 4000);
        } else {
          alert(res?.error || 'Không tìm thấy dữ liệu từ vựng tương thích trong file .apkg này.');
        }
      }
    } catch (err: any) {
      alert(`Lỗi bóc tách file Anki: ${err.message || 'File .apkg không đúng định dạng'}`);
    } finally {
      setIsLoadingUrl(false);
    }
  };

  const handleImportFromUrl = async () => {
    if (!customUrl.trim()) return;

    setIsLoadingUrl(true);
    try {
      const res = await fetch(customUrl.trim());
      if (!res.ok) throw new Error('Không thể tải file từ đường dẫn này');

      const data = await res.json();
      let wordList: VocabularyWord[] = [];

      if (Array.isArray(data)) {
        wordList = data.map((item, idx) => ({
          id: `online_${Date.now()}_${idx}`,
          word: typeof item === 'string' ? item : item.word || item.term || 'Word',
          phonetic: item.phonetic || `/${(typeof item === 'string' ? item : item.word || '').toLowerCase()}/`,
          pos: item.pos || 'noun',
          definition: item.definition || item.meaning || item.translation || 'Nghĩa tiếng Việt',
          example: item.example || '',
          deck: 'custom'
        }));
      } else if (typeof data === 'object') {
        const keys = Object.keys(data);
        wordList = keys.slice(0, 500).map((key, idx) => ({
          id: `online_${Date.now()}_${idx}`,
          word: key,
          phonetic: `/${key.toLowerCase()}/`,
          pos: 'noun',
          definition: typeof data[key] === 'string' ? data[key] : 'Nghĩa tiếng Việt',
          example: '',
          deck: 'custom'
        }));
      }

      if (wordList.length === 0) {
        alert('File JSON không đúng định dạng từ vựng.');
        setIsLoadingUrl(false);
        return;
      }

      const count = StorageService.importPresetWords(wordList);
      setIsLoadingUrl(false);
      setCustomUrl('');

      setToastMessage(`🎉 Đã nạp thành công +${count} từ vựng từ nguồn Online!`);
      onImportSuccess();

      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      setIsLoadingUrl(false);
      alert(`Lỗi tải dữ liệu từ URL: ${err.message || 'Kiểm tra lại link JSON'}`);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      {toastMessage && (
        <div
          className="animate-pop"
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            zIndex: 10000,
            padding: '14px 20px',
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: '#FFF',
            fontWeight: 700,
            fontSize: '0.9rem',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
            pointerEvents: 'none'
          }}
        >
          {toastMessage}
        </div>
      )}

      <div
        className="glass-panel animate-pop"
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '28px',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BookOpen size={24} style={{ color: 'var(--accent-cyan)' }} /> Thư Viện Bộ Từ Vựng Có Sẵn & Nguồn Online
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Nạp nhanh các bộ từ vựng chuẩn hóa hoặc tải thêm hàng ngàn từ từ các đường dẫn Link JSON / GitHub.
            </p>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Catalog Grid */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px', paddingRight: '4px' }}>
          {PRESET_CATALOG.map((preset) => {
            const isImported = importedDecks.includes(preset.id);
            return (
              <div
                key={preset.id}
                className="glass-card animate-pop"
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '1.8rem' }}>{preset.icon}</span>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        background: 'rgba(99, 102, 241, 0.15)',
                        color: 'var(--accent-primary)',
                        fontSize: '0.78rem',
                        fontWeight: 800
                      }}
                    >
                      {preset.words.length} Từ Vựng
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFF', marginBottom: '8px' }}>
                    {preset.title}
                  </h3>

                  <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.45', marginBottom: '16px' }}>
                    {preset.description}
                  </p>
                </div>

                <button
                  onClick={() => handleImportDeck(preset)}
                  className={`btn ${isImported ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ width: '100%', justifyContent: 'center', padding: '10px', gap: '8px' }}
                >
                  {isImported ? (
                    <>
                      <Check size={16} style={{ color: '#10B981' }} /> Đã nạp (Bấm để nạp thêm)
                    </>
                  ) : (
                    <>
                      <Download size={16} /> 📥 Nạp bộ từ này (+{preset.words.length} từ)
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Online URL / Community Shared Deck Import Section */}
        <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Anki File Import Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent-amber)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} /> 🎴 Nhập Trực Tiếp File Anki Package (*.apkg) Từ Máy Tính
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Tải bất kỳ file bộ từ Anki nào (.apkg) trên AnkiWeb về máy và chọn để nhập tự động vào Engion.
              </p>
            </div>

            <label
              className="btn btn-primary"
              style={{ cursor: 'pointer', padding: '10px 18px', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', gap: '8px' }}
            >
              {isLoadingUrl ? <Loader2 size={16} className="animate-spin" /> : <><Download size={16} /> 🎴 Chọn File Anki (*.apkg)</>}
              <input type="file" accept=".apkg" onChange={handleApkgFileInput} style={{ display: 'none' }} />
            </label>
          </div>

          <div style={{ height: '1px', background: 'var(--border-subtle)' }} />

          {/* Online Link Import Row */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Globe size={16} /> 🌐 Tải Bộ Từ Từ Nguồn Link Online / GitHub / Share JSON
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
              Dán đường dẫn Link JSON chứa danh sách từ vựng online (hoặc chọn nguồn gợi ý dưới đây):
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="url"
                className="input-field"
                placeholder="Dán link JSON (Ví dụ: https://raw.githubusercontent.com/.../words.json)"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                onClick={handleImportFromUrl}
                disabled={isLoadingUrl || !customUrl.trim()}
                className="btn btn-primary"
                style={{ padding: '10px 18px', whiteSpace: 'nowrap' }}
              >
                {isLoadingUrl ? <Loader2 size={16} className="animate-spin" /> : '📥 Tải & Nạp Ngay'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-primary" style={{ padding: '10px 24px' }}>
            Xong & Đóng
          </button>
        </div>
      </div>

      {/* APKG Import Preview Modal Overlay */}
      {previewApkgData && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(6px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            className="glass-panel animate-pop"
            style={{
              width: '760px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              padding: '26px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} /> 🎴 Xem Trước Dữ Liệu File Package
              </h3>
              <button onClick={() => setPreviewApkgData(null)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Tìm thấy <strong style={{ color: 'var(--accent-cyan)' }}>+{previewApkgData.words.length} từ vựng</strong> sẵn sàng nạp. Dưới đây là mẫu 6 từ vựng đại diện được bóc tách từ file:
            </p>

            {/* Target Custom Deck Name Input */}
            <div style={{ marginBottom: '16px', background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '6px', color: 'var(--accent-cyan)' }}>
                📁 Đặt tên Bộ Từ (Deck) để lưu nhóm từ này:
              </label>
              <input
                type="text"
                className="input-field"
                value={targetDeckName}
                onChange={(e) => setTargetDeckName(e.target.value)}
                placeholder="Nhập tên bộ từ (Ví dụ: 4000 Essential English Words 2)..."
                style={{ width: '100%' }}
              />
            </div>

            {/* Sample Words Grid (First 6 Words) */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '12px', marginBottom: '18px', paddingRight: '4px' }}>
              {previewApkgData.words.slice(0, 6).map((item, idx) => (
                <div key={idx} className="glass-card" style={{ padding: '12px', background: 'rgba(255,255,255,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 800, color: 'var(--accent-cyan)', fontSize: '1rem' }}>{item.word}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', textTransform: 'uppercase', fontWeight: 700 }}>{item.pos}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px', fontFamily: 'monospace' }}>{item.phonetic}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', fontWeight: 600, marginBottom: '6px' }}>{item.definition}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '4px' }}>
                    "{item.example}"
                  </div>
                </div>
              ))}
            </div>

            {/* Confirm & Cancel Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                📊 Tổng cộng: <strong style={{ color: '#FFF' }}>{previewApkgData.words.length} từ vựng</strong>
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setPreviewApkgData(null)} className="btn btn-secondary" style={{ padding: '10px 18px' }}>
                  ❌ Hủy Bỏ
                </button>
                <button
                  onClick={handleConfirmImportPreview}
                  className="btn btn-primary"
                  style={{ padding: '10px 22px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', fontWeight: 700 }}
                >
                  🎉 Xác Nhận Nạp +{previewApkgData.words.length} Từ Vựng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
