import React, { useState, useEffect } from 'react';
import { VocabularyWord, DeckType, CustomDeckCategory } from '../../types';
import { StorageService } from '../../services/storage';
import { DictionaryService } from '../../services/dictionary';
import { AudioButton } from '../Common/AudioButton';
import { SpeechMicButton } from '../Common/SpeechMicButton';
import { Badge } from '../Common/Badge';
import { SRSBadge } from '../Common/SRSBadge';
import { PresetLibraryModal } from './PresetLibraryModal';
import { Search, Plus, Trash2, Sparkles, Flame, Star, Edit3, FolderPlus, X, BookOpen, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';

export const DeckManager: React.FC = () => {
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [customDecks, setCustomDecks] = useState<CustomDeckCategory[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWord, setEditingWord] = useState<VocabularyWord | null>(null);
  const [showCreateDeckModal, setShowCreateDeckModal] = useState(false);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  
  const [isSearchingDict, setIsSearchingDict] = useState(false);
  const [dictError, setDictError] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  // Add word state
  const [newWord, setNewWord] = useState({
    word: '',
    phonetic: '',
    pos: 'noun',
    definition: '',
    example: '',
    deck: 'custom' as DeckType
  });

  const loadData = () => {
    const list = StorageService.getAllVocabulary();
    setWords(list);
    setFavoriteIds(StorageService.getFavoriteIds());
    setCustomDecks(StorageService.getCustomDeckCategories());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleFav = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    StorageService.toggleFavorite(id);
    setFavoriteIds(StorageService.getFavoriteIds());
  };

  const progressMap = StorageService.getProgressMap();

  const filteredWords = words.filter((w) => {
    let matchesDeck = true;
    if (selectedDeck === 'weak') {
      const p = progressMap[w.id];
      matchesDeck = !p || p.box <= 2;
    } else if (selectedDeck === 'fav') {
      matchesDeck = favoriteIds.includes(w.id);
    } else if (selectedDeck !== 'all') {
      matchesDeck = w.deck === selectedDeck;
    }

    const matchesSearch =
      w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.definition.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesDeck && matchesSearch;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDeck, pageSize]);

  const totalPages = Math.ceil(filteredWords.length / pageSize) || 1;
  const paginatedWords = filteredWords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleAutoLookup = async (isEdit: boolean) => {
    const targetWordStr = isEdit ? editingWord?.word : newWord.word;
    if (!targetWordStr || !targetWordStr.trim()) return;

    setIsSearchingDict(true);
    setDictError(null);

    const settings = StorageService.getSettings();
    const result = await DictionaryService.lookupWord(targetWordStr.trim(), settings.targetLanguage);

    setIsSearchingDict(false);

    if (result) {
      if (isEdit && editingWord) {
        setEditingWord({
          ...editingWord,
          phonetic: result.phonetic || editingWord.phonetic,
          pos: result.pos || editingWord.pos,
          definition: result.definition || editingWord.definition,
          example: result.example || editingWord.example
        });
      } else {
        setNewWord(prev => ({
          ...prev,
          word: result.word,
          phonetic: result.phonetic || prev.phonetic,
          pos: result.pos || prev.pos,
          definition: result.definition || prev.definition,
          example: result.example || prev.example
        }));
      }
    } else {
      setDictError('Không tìm thấy từ này trong từ điển');
    }
  };

  const handleRandomSuggestAddModal = async () => {
    setIsSearchingDict(true);
    setDictError(null);
    try {
      const suggested = await DictionaryService.fetchRandomOnlineWord();
      const settings = StorageService.getSettings();
      const result = await DictionaryService.lookupWord(suggested, settings.targetLanguage);

      if (result) {
        setNewWord(prev => ({
          ...prev,
          word: result.word,
          phonetic: result.phonetic || `/${result.word}/`,
          pos: result.pos || 'noun',
          definition: result.definition || '',
          example: result.example || ''
        }));
      }
    } catch {
      setDictError('Lỗi kết nối từ điển');
    } finally {
      setIsSearchingDict(false);
    }
  };

  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.word || !newWord.definition) return;

    const wordItem: VocabularyWord = {
      id: 'custom_' + Date.now(),
      word: newWord.word.trim(),
      phonetic: newWord.phonetic.trim() || `/${newWord.word.trim().toLowerCase()}/`,
      pos: newWord.pos,
      definition: newWord.definition.trim(),
      example: newWord.example.trim(),
      deck: newWord.deck
    };

    StorageService.saveCustomWord(wordItem);
    loadData();
    setShowAddModal(false);
    setNewWord({ word: '', phonetic: '', pos: 'noun', definition: '', example: '', deck: 'custom' });
  };

  const handleSaveEditWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWord || !editingWord.word || !editingWord.definition) return;

    StorageService.updateWord(editingWord);
    loadData();
    setEditingWord(null);
  };

  const handleCreateDeck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckName.trim()) return;

    const created = StorageService.addCustomDeckCategory(newDeckName.trim());
    loadData();
    setSelectedDeck(created.id);
    setNewDeckName('');
    setShowCreateDeckModal(false);
  };

  const handleDeleteWord = (id: string, wordStr: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa từ vựng "${wordStr}" khỏi hệ thống không?`)) {
      StorageService.deleteWord(id);
      loadData();
    }
  };

  const handleDeleteDeck = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Bạn có chắc chắn muốn xóa bộ từ "${name}" và tất cả các từ vựng trong bộ từ này không?`)) {
      StorageService.deleteDeck(id);
      loadData();
      if (selectedDeck === id) setSelectedDeck('all');
    }
  };

  return (
    <div style={{ padding: '32px', flex: 1, overflowY: 'auto' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FFF' }}>Kho Từ Vựng & Bộ Từ</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Tổng số: <strong style={{ color: 'var(--accent-cyan)' }}>{words.length} từ</strong> trong hệ thống
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => setShowPresetModal(true)} className="btn btn-secondary" style={{ gap: '6px', color: 'var(--accent-cyan)', borderColor: 'var(--accent-cyan)' }}>
            <BookOpen size={18} /> 📥 Thư viện bộ từ có sẵn
          </button>
          <button onClick={() => setShowCreateDeckModal(true)} className="btn btn-secondary" style={{ gap: '6px' }}>
            <FolderPlus size={18} /> + Tạo bộ từ mới
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary" style={{ gap: '6px' }}>
            <Plus size={18} /> Thêm từ mới
          </button>
        </div>
      </div>

      {/* Preset Library Modal */}
      {showPresetModal && (
        <PresetLibraryModal
          onClose={() => setShowPresetModal(false)}
          onImportSuccess={loadData}
        />
      )}

      {/* Filter & Search Toolbar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-dim)' }} />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: '42px' }}
            placeholder="Tìm kiếm từ tiếng Anh hoặc nghĩa tiếng Việt..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Dynamic Deck Tabs */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Permanent Filter Tabs */}
          {[
            { id: 'all', label: 'TẤT CẢ', activeBg: 'var(--accent-primary)', activeColor: '#FFF' },
            { id: 'fav', label: '⭐ YÊU THÍCH', activeBg: '#F59E0B', activeColor: '#0F172A' },
            { id: 'weak', label: '🔥 CẦN ÔN LẠI', activeBg: '#EF4444', activeColor: '#FFF' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedDeck(tab.id)}
              className="btn"
              style={{
                padding: '8px 14px',
                fontSize: '0.82rem',
                fontWeight: 800,
                background: selectedDeck === tab.id ? tab.activeBg : 'rgba(255, 255, 255, 0.04)',
                color: selectedDeck === tab.id ? tab.activeColor : 'var(--text-muted)',
                border: selectedDeck === tab.id ? `1px solid ${tab.activeBg}` : '1px solid var(--border-subtle)',
                borderRadius: '6px',
                boxShadow: selectedDeck === tab.id ? '0 4px 12px rgba(0,0,0,0.3)' : 'none'
              }}
            >
              {tab.label}
            </button>
          ))}

          <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.12)', margin: '0 6px' }} />

          {/* Category Decks */}
          {[
            { id: 'it', label: 'IT', canDelete: true },
            { id: 'toeic', label: 'TOEIC', canDelete: true },
            { id: 'ielts', label: 'IELTS', canDelete: true },
            { id: 'oxford', label: 'OXFORD', canDelete: true },
            { id: 'custom', label: 'CUSTOM', canDelete: true },
            ...customDecks.map(cd => ({ id: cd.id, label: cd.name, canDelete: true }))
          ]
          .filter(tab => !StorageService.getDeletedDeckIds().includes(tab.id))
          .map((tab) => (
            <div key={tab.id} style={{ display: 'inline-flex', alignItems: 'center' }}>
              <button
                onClick={() => setSelectedDeck(tab.id)}
                className="btn"
                style={{
                  padding: '8px 14px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  background: selectedDeck === tab.id ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.04)',
                  color: selectedDeck === tab.id ? '#FFF' : 'var(--text-muted)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: tab.canDelete ? '6px 0 0 6px' : '6px'
                }}
              >
                {tab.label}
              </button>
              {tab.canDelete && (
                <button
                  onClick={(e) => handleDeleteDeck(tab.id, tab.label, e)}
                  style={{
                    padding: '8px 6px',
                    fontSize: '0.8rem',
                    background: selectedDeck === tab.id ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.04)',
                    color: '#EF4444',
                    border: '1px solid var(--border-subtle)',
                    borderLeft: 'none',
                    borderRadius: '0 6px 6px 0',
                    cursor: 'pointer'
                  }}
                  title={`Xóa bộ từ ${tab.label}`}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Vocabulary Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {paginatedWords.map((item) => {
          const isFav = favoriteIds.includes(item.id);
          const customDeckMatch = customDecks.find(cd => cd.id === item.deck);
          const deckLabel = customDeckMatch ? customDeckMatch.name : item.deck;

          return (
            <div
              key={item.id}
              className="glass-card animate-pop"
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Badge type={item.deck} text={deckLabel} />
                    <button
                      onClick={(e) => handleToggleFav(item.id, e)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                      title={isFav ? 'Bỏ yêu thích' : 'Thêm vào Yêu thích'}
                    >
                      <Star size={16} fill={isFav ? '#F59E0B' : 'none'} color={isFav ? '#F59E0B' : 'var(--text-dim)'} />
                    </button>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>({item.pos})</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFF' }}>{item.word}</h3>
                  <AudioButton word={item.word} />
                  <SpeechMicButton targetWord={item.word} />
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', marginBottom: '12px', fontFamily: 'JetBrains Mono' }}>
                  {item.phonetic}
                </div>

                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
                  {item.definition}
                </div>

                {item.example && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', background: 'rgba(255, 255, 255, 0.03)', padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}>
                    "{item.example}"
                  </div>
                )}
              </div>

              {/* Card Footer: SRS Review Badge & Action Buttons */}
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                <SRSBadge wordId={item.id} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => setEditingWord(item)}
                    className="btn-icon"
                    style={{ color: 'var(--accent-cyan)', padding: '6px' }}
                    title="Chỉnh sửa từ vựng"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteWord(item.id, item.word)}
                    className="btn-icon"
                    style={{ color: '#EF4444', padding: '6px' }}
                    title="Xóa từ vựng này"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* High Performance Pagination Controller Bar */}
      {filteredWords.length > 0 && (
        <div
          style={{
            marginTop: '28px',
            padding: '16px 20px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          {/* Info */}
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Hiển thị <strong style={{ color: 'var(--accent-cyan)' }}>{(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredWords.length)}</strong> / <strong>{filteredWords.length}</strong> từ
          </div>

          {/* Page Selector & Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {/* Page Size Select */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <span>Hiển thị:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="input-field"
                style={{ padding: '4px 10px', fontSize: '0.82rem', width: 'auto' }}
              >
                <option value={24}>24 từ / trang</option>
                <option value={48}>48 từ / trang</option>
                <option value={96}>96 từ / trang</option>
                <option value={filteredWords.length}>Tất cả ({filteredWords.length})</option>
              </select>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.82rem', opacity: currentPage === 1 ? 0.5 : 1, gap: '4px' }}
                >
                  <ChevronLeft size={16} /> Trước
                </button>

                <span style={{ fontSize: '0.85rem', fontWeight: 700, padding: '0 8px', color: '#FFF' }}>
                  Trang {currentPage} / {totalPages}
                </span>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.82rem', opacity: currentPage === totalPages ? 0.5 : 1, gap: '4px' }}
                >
                  Sau <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Custom Word Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div className="glass-panel animate-pop" style={{ width: '480px', padding: '28px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '18px', color: '#FFF' }}>Thêm Từ Mới Cá Nhân</h2>
            <form onSubmit={handleAddWord} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Từ tiếng Anh *</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={handleRandomSuggestAddModal}
                      disabled={isSearchingDict}
                      className="btn"
                      style={{
                        fontSize: '0.75rem',
                        padding: '3px 8px',
                        background: 'rgba(245, 158, 11, 0.18)',
                        color: '#F59E0B',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        borderRadius: '6px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer'
                      }}
                      title="Tự động gợi ý 1 từ vựng ngẫu nhiên chưa có trong Kho"
                    >
                      <Lightbulb size={12} /> 🎲 Gợi ý từ
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAutoLookup(false)}
                      disabled={isSearchingDict || !newWord.word.trim()}
                      className="btn"
                      style={{
                        fontSize: '0.75rem',
                        padding: '3px 10px',
                        background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                        color: '#FFF',
                        fontWeight: 700,
                        borderRadius: '6px',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: isSearchingDict || !newWord.word.trim() ? 'not-allowed' : 'pointer',
                        opacity: isSearchingDict || !newWord.word.trim() ? 0.7 : 1,
                        boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)'
                      }}
                      title="Tra từ điển tự động điền IPA & nghĩa"
                    >
                      <Sparkles size={13} className={isSearchingDict ? 'animate-spin' : ''} />
                      {isSearchingDict ? 'Đang tra...' : '✨ Tra từ'}
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={newWord.word}
                  onChange={(e) => setNewWord({ ...newWord, word: e.target.value })}
                  placeholder="Ví dụ: Resilient"
                />
                {dictError && <div style={{ fontSize: '0.78rem', color: '#EF4444', marginTop: '4px' }}>❌ {dictError}</div>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Phiên âm IPA</label>
                  <input
                    type="text"
                    className="input-field"
                    value={newWord.phonetic}
                    onChange={(e) => setNewWord({ ...newWord, phonetic: e.target.value })}
                    placeholder="/rɪˈzɪliənt/"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Từ loại</label>
                  <select
                    className="input-field"
                    value={newWord.pos}
                    onChange={(e) => setNewWord({ ...newWord, pos: e.target.value })}
                  >
                    <option value="noun">Danh từ (noun)</option>
                    <option value="verb">Động từ (verb)</option>
                    <option value="adjective">Tính từ (adjective)</option>
                    <option value="adverb">Trạng từ (adverb)</option>
                    <option value="phrase">Cụm từ (phrase)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nghĩa Tiếng Việt *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={newWord.definition}
                  onChange={(e) => setNewWord({ ...newWord, definition: e.target.value })}
                  placeholder="Kiên cường, phục hồi nhanh"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Bộ từ (Deck)</label>
                <select
                  className="input-field"
                  value={newWord.deck}
                  onChange={(e) => setNewWord({ ...newWord, deck: e.target.value as DeckType })}
                >
                  <option value="custom">CUSTOM (Từ cá nhân)</option>
                  <option value="it">IT (Công nghệ)</option>
                  <option value="toeic">TOEIC</option>
                  <option value="ielts">IELTS</option>
                  <option value="oxford">OXFORD</option>
                  {customDecks.map(cd => (
                    <option key={cd.id} value={cd.id}>{cd.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Câu ví dụ</label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={newWord.example}
                  onChange={(e) => setNewWord({ ...newWord, example: e.target.value })}
                  placeholder="She is resilient in facing difficulties."
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Lưu từ mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Word Modal */}
      {editingWord && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div className="glass-panel animate-pop" style={{ width: '480px', padding: '28px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '18px', color: '#FFF' }}>✏️ Chỉnh Sửa Từ Vựng</h2>
            <form onSubmit={handleSaveEditWord} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Từ tiếng Anh *</label>
                  <button
                    type="button"
                    onClick={() => handleAutoLookup(true)}
                    disabled={isSearchingDict || !editingWord.word.trim()}
                    className="btn"
                    style={{
                      fontSize: '0.75rem',
                      padding: '3px 10px',
                      background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                      color: '#FFF',
                      fontWeight: 700,
                      borderRadius: '6px',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: isSearchingDict || !editingWord.word.trim() ? 'not-allowed' : 'pointer',
                      opacity: isSearchingDict || !editingWord.word.trim() ? 0.7 : 1,
                      boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)'
                    }}
                    title="Tra lại IPA, Nghĩa tiếng Việt & Câu ví dụ chuẩn xác từ từ điển"
                  >
                    <Sparkles size={13} className={isSearchingDict ? 'animate-spin' : ''} />
                    {isSearchingDict ? 'Đang tra...' : '✨ Tra từ'}
                  </button>
                </div>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={editingWord.word}
                  onChange={(e) => setEditingWord({ ...editingWord, word: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Phiên âm IPA</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editingWord.phonetic}
                    onChange={(e) => setEditingWord({ ...editingWord, phonetic: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Từ loại</label>
                  <select
                    className="input-field"
                    value={editingWord.pos}
                    onChange={(e) => setEditingWord({ ...editingWord, pos: e.target.value })}
                  >
                    <option value="noun">Danh từ (noun)</option>
                    <option value="verb">Động từ (verb)</option>
                    <option value="adjective">Tính từ (adjective)</option>
                    <option value="adverb">Trạng từ (adverb)</option>
                    <option value="phrase">Cụm từ (phrase)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nghĩa Tiếng Việt *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={editingWord.definition}
                  onChange={(e) => setEditingWord({ ...editingWord, definition: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Bộ từ (Deck)</label>
                <select
                  className="input-field"
                  value={editingWord.deck}
                  onChange={(e) => setEditingWord({ ...editingWord, deck: e.target.value as DeckType })}
                >
                  <option value="custom">CUSTOM (Từ cá nhân)</option>
                  <option value="it">IT (Công nghệ)</option>
                  <option value="toeic">TOEIC</option>
                  <option value="ielts">IELTS</option>
                  <option value="oxford">OXFORD</option>
                  {customDecks.map(cd => (
                    <option key={cd.id} value={cd.id}>{cd.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Câu ví dụ</label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={editingWord.example || ''}
                  onChange={(e) => setEditingWord({ ...editingWord, example: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setEditingWord(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create New Custom Deck Modal */}
      {showCreateDeckModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div className="glass-panel animate-pop" style={{ width: '400px', padding: '24px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '14px', color: '#FFF' }}>➕ Tạo Bộ Từ Mới</h2>
            <form onSubmit={handleCreateDeck} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Tên bộ từ *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="Ví dụ: Từ Vựng Du Lịch, Tiếng Anh Giao Tiếp..."
                  value={newDeckName}
                  onChange={(e) => setNewDeckName(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setShowCreateDeckModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Tạo bộ từ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
