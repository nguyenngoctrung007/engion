import React, { useState, useEffect } from 'react';
import { PopupContainer } from './components/Popup/PopupContainer';
import { QuickAddModal } from './components/Dashboard/QuickAddModal';
import { QuickAddReviewModal } from './components/Dashboard/QuickAddReviewModal';
import { Sidebar } from './components/Dashboard/Sidebar';
import { DeckManager } from './components/Dashboard/DeckManager';
import { StatsOverview } from './components/Dashboard/StatsOverview';
import { SettingsPanel } from './components/Dashboard/SettingsPanel';

import { StorageService } from './services/storage';

export const App: React.FC = () => {
  const checkModeState = () => {
    const isQuickAddReview = window.location.hash.includes('quick-add-review') || window.location.search.includes('mode=quick-add-review');
    const isQuickAdd = window.location.hash.includes('quick-add') || window.location.search.includes('mode=quick-add');
    const isPopup = !isQuickAdd && !isQuickAddReview && (window.location.hash.includes('popup') || window.location.search.includes('mode=popup') || (window.innerWidth <= 550 && window.innerHeight <= 600));
    return { isQuickAddReview, isQuickAdd, isPopup };
  };

  const [mode, setMode] = useState(checkModeState);
  const [activeTab, setActiveTab] = useState<'decks' | 'stats' | 'settings'>('decks');

  useEffect(() => {
    // Initial sync settings to Electron main on app startup
    if ((window as any).electronAPI?.updateSettings) {
      try {
        const savedSettings = StorageService.getSettings();
        (window as any).electronAPI.updateSettings(savedSettings);
      } catch (err) {
        console.error('[ENGION] Initial settings sync error:', err);
      }
    }
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      setMode(checkModeState());
    };

    handleUpdate();
    window.addEventListener('hashchange', handleUpdate);
    window.addEventListener('resize', handleUpdate);
    return () => {
      window.removeEventListener('hashchange', handleUpdate);
      window.removeEventListener('resize', handleUpdate);
    };
  }, []);

  const handlePracticeNow = () => {
    if ((window as any).electronAPI) {
      (window as any).electronAPI.triggerPracticeNow();
    } else {
      window.location.hash = '#popup';
    }
  };

  if (mode.isQuickAddReview) {
    return <QuickAddReviewModal />;
  }

  if (mode.isQuickAdd) {
    return <QuickAddModal />;
  }

  if (mode.isPopup) {
    return <PopupContainer />;
  }

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)', overflow: 'hidden' }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onPracticeNow={handlePracticeNow} />
      {activeTab === 'decks' && <DeckManager />}
      {activeTab === 'stats' && <StatsOverview />}
      {activeTab === 'settings' && <SettingsPanel onPracticeNow={handlePracticeNow} />}
    </div>
  );
};

export default App;
