import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  onOpenPopup: (callback: (data: any) => void) => {
    ipcRenderer.on('open-popup-quiz', (_event, data) => callback(data));
  },
  onTimerTick: (callback: (data: any) => void) => {
    ipcRenderer.on('timer-tick', (_event, data) => callback(data));
  },
  getTimerStatus: () => {
    ipcRenderer.send('get-timer-status');
  },
  closePopup: () => {
    ipcRenderer.send('close-popup-window');
  },
  triggerPracticeNow: () => {
    ipcRenderer.send('trigger-practice-now');
  },
  openDashboard: () => {
    ipcRenderer.send('open-dashboard-window');
  },
  updateSettings: (settings: any) => {
    ipcRenderer.send('update-timer-settings', settings);
  },
  sendNotification: (title: string, body: string) => {
    ipcRenderer.send('send-native-notification', { title, body });
  },
  selectAndParseApkg: () => {
    return ipcRenderer.invoke('select-and-parse-apkg');
  }
});
