import React, { useState, useEffect } from 'react';
import { PopupContainer } from './components/Popup/PopupContainer';
import { Sidebar } from './components/Dashboard/Sidebar';
import { DeckManager } from './components/Dashboard/DeckManager';
import { StatsOverview } from './components/Dashboard/StatsOverview';
import { SettingsPanel } from './components/Dashboard/SettingsPanel';

export const App: React.FC = () => {
  const checkPopupState = () => {
    return (
      window.location.hash.includes('popup') ||
      window.location.search.includes('popup') ||
      (window.innerWidth <= 550 && window.innerHeight <= 600)
    );
  };

  const [isPopupMode, setIsPopupMode] = useState(checkPopupState);
  const [activeTab, setActiveTab] = useState<'decks' | 'stats' | 'settings'>('decks');

  useEffect(() => {
    const handleUpdate = () => {
      setIsPopupMode(checkPopupState());
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

  if (isPopupMode) {
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
