import { app, BrowserWindow, Tray, Menu, ipcMain, screen, Notification, nativeImage, NativeImage, globalShortcut, session, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dashboardWindow: BrowserWindow | null = null;
let popupWindow: BrowserWindow | null = null;
let quickAddWindow: BrowserWindow | null = null;
let quickAddReviewWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let quizTimer: NodeJS.Timeout | null = null;
let countdownTicker: NodeJS.Timeout | null = null;
let currentIntervalMinutes = 30;
let nextPopupTimestamp = Date.now() + 30 * 60 * 1000;
let dndUntilTimestamp: number | null = null;
let dndEnabled: boolean = false;
let dndStart: string = '22:00';
let dndEnd: string = '07:00';

function isDndActiveNow(): boolean {
  const now = Date.now();
  if (dndUntilTimestamp && now < dndUntilTimestamp) {
    return true;
  }
  if (dndEnabled) {
    const currentDate = new Date();
    const curMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();
    const [sh, sm] = (dndStart || '22:00').split(':').map(Number);
    const [eh, em] = (dndEnd || '07:00').split(':').map(Number);
    const startM = (sh || 0) * 60 + (sm || 0);
    const endM = (eh || 0) * 60 + (em || 0);
    if (startM <= endM) {
      if (curMinutes >= startM && curMinutes < endM) return true;
    } else {
      if (curMinutes >= startM || curMinutes < endM) return true;
    }
  }
  return false;
}

function formatRemainingTime(seconds: number): string {
  if (seconds <= 0) return 'Đang bật...';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function updateCountdownTick() {
  const now = Date.now();
  const diffSec = Math.max(0, Math.ceil((nextPopupTimestamp - now) / 1000));
  const activeDnd = isDndActiveNow();

  if (tray) {
    if (activeDnd) {
      let statusStr = '🌙 Chế độ Không làm phiền đang bật';
      if (dndUntilTimestamp && now < dndUntilTimestamp) {
        const remDndSec = Math.ceil((dndUntilTimestamp - now) / 1000);
        statusStr = `🌙 Tạm dừng DND (${formatRemainingTime(remDndSec)})`;
      }
      tray.setToolTip(`Engion - ${statusStr}`);
    } else {
      tray.setToolTip(`Engion - Popup tiếp theo sau: ${formatRemainingTime(diffSec)}`);
    }
    updateContextMenu();
  }

  if (dashboardWindow && !dashboardWindow.isDestroyed()) {
    dashboardWindow.webContents.send('timer-tick', {
      remainingSeconds: diffSec,
      formattedText: formatRemainingTime(diffSec),
      intervalMinutes: currentIntervalMinutes,
      isDndActive: activeDnd
    });
  }
}

function getIconPath(): string {
  const candidatePaths = [
    path.join(__dirname, 'icon.png'),
    path.join(__dirname, '../public/icon.png'),
    path.join(process.cwd(), 'public/icon.png')
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) return p;
  }
  return candidatePaths[0];
}

function createTrayIcon(): NativeImage {
  const iconPath = getIconPath();
  if (fs.existsSync(iconPath)) {
    const img = nativeImage.createFromPath(iconPath);
    if (!img.isEmpty()) {
      return img;
    }
  }

  // Backup inline PNG base64
  return nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABLSURBVFhH7c0xEQAACADAwL95VnBwOaDgm2TmfXdvwNl7WDzA0QNUPEDFA1Q8QMUDVDxAxQNUPEDFA1Q8QMUDVDxAxQPUPEDFA/z2Hj1lE2F6r+7UAAAAAElEQVR42mNkYAAAAAYAAjCB0C8AAAAASUV5ErkJggg=='
  );
}

function showOrCreateDashboard() {
  if (!dashboardWindow || dashboardWindow.isDestroyed()) {
    createDashboardWindow();
  } else {
    try {
      if (dashboardWindow.isMinimized()) dashboardWindow.restore();
      dashboardWindow.show();
      dashboardWindow.focus();
    } catch {
      createDashboardWindow();
    }
  }
}

function createDashboardWindow() {
  if (dashboardWindow && !dashboardWindow.isDestroyed()) {
    showOrCreateDashboard();
    return;
  }

  dashboardWindow = new BrowserWindow({
    width: 1080,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    title: 'Engion - English Tray Learner',
    icon: createTrayIcon(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    autoHideMenuBar: true,
    backgroundColor: '#0F172A'
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    dashboardWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    dashboardWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  dashboardWindow.on('minimize' as any, (e: any) => {
    e.preventDefault();
    dashboardWindow?.hide();
  });

  dashboardWindow.on('close', (e) => {
    if (!(app as any).isQuitting) {
      e.preventDefault();
      dashboardWindow?.hide();
    }
  });

  dashboardWindow.on('closed', () => {
    dashboardWindow = null;
  });
}

function createPopupWindow() {
  if (popupWindow && !popupWindow.isDestroyed()) {
    try {
      if (popupWindow.isMinimized()) popupWindow.restore();
      popupWindow.show();
      popupWindow.focus();
    } catch {}
    return;
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  const popupWidth = 440;
  const popupHeight = 500;
  const margin = 20;

  const x = screenWidth - popupWidth - margin;
  const y = screenHeight - popupHeight - margin;

  popupWindow = new BrowserWindow({
    width: popupWidth,
    height: popupHeight,
    x,
    y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    icon: createTrayIcon(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    backgroundColor: '#00000000'
  });

  const baseUrl = process.env.VITE_DEV_SERVER_URL 
    ? process.env.VITE_DEV_SERVER_URL 
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const popupUrl = `${cleanBase}?mode=popup#popup`;

  popupWindow.loadURL(popupUrl);

  popupWindow.on('closed', () => {
    popupWindow = null;
  });
}

function createQuickAddWindow() {
  if (quickAddWindow && !quickAddWindow.isDestroyed()) {
    try {
      if (quickAddWindow.isMinimized()) quickAddWindow.restore();
      quickAddWindow.show();
      quickAddWindow.focus();
    } catch {}
    return;
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  const winWidth = 500;
  const winHeight = 440;

  const x = Math.round((screenWidth - winWidth) / 2);
  const y = Math.round((screenHeight - winHeight) / 2 - 30);

  quickAddWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x,
    y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    icon: createTrayIcon(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    backgroundColor: '#00000000'
  });

  const baseUrl = process.env.VITE_DEV_SERVER_URL 
    ? process.env.VITE_DEV_SERVER_URL 
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const quickAddUrl = `${cleanBase}?mode=quick-add#quick-add`;

  quickAddWindow.loadURL(quickAddUrl);

  quickAddWindow.on('closed', () => {
    quickAddWindow = null;
  });
}

function createQuickAddReviewWindow(wordToLookup: string) {
  if (quickAddWindow && !quickAddWindow.isDestroyed()) {
    try { quickAddWindow.destroy(); } catch {}
    quickAddWindow = null;
  }

  if (quickAddReviewWindow && !quickAddReviewWindow.isDestroyed()) {
    try { quickAddReviewWindow.destroy(); } catch {}
    quickAddReviewWindow = null;
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  const winWidth = 510;
  const winHeight = 460;

  const x = Math.round((screenWidth - winWidth) / 2);
  const y = Math.round((screenHeight - winHeight) / 2 - 30);

  quickAddReviewWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x,
    y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    icon: createTrayIcon(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    backgroundColor: '#00000000'
  });

  const baseUrl = process.env.VITE_DEV_SERVER_URL 
    ? process.env.VITE_DEV_SERVER_URL 
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const reviewUrl = `${cleanBase}?mode=quick-add-review&word=${encodeURIComponent(wordToLookup)}#quick-add-review`;

  quickAddReviewWindow.loadURL(reviewUrl);

  quickAddReviewWindow.on('closed', () => {
    quickAddReviewWindow = null;
  });
}

function updateContextMenu() {
  if (!tray) return;

  const intervalText = currentIntervalMinutes <= 0.2 ? '10 giây' : `${currentIntervalMinutes} phút`;
  const isDndOn = isDndActiveNow();

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '📖 Mở Engion Dashboard (Alt+D)',
      click: () => {
        showOrCreateDashboard();
      }
    },
    {
      label: '⚡ Thêm từ vựng nhanh (Alt+N)',
      click: () => {
        createQuickAddWindow();
      }
    },
    {
      label: '⚡ Học / Luyện từ ngay (Alt+E)',
      click: () => {
        triggerQuizPopup(true);
      }
    },
    { type: 'separator' },
    {
      label: `🌙 Không làm phiền (${isDndOn ? 'Đang Bật 🔇' : 'Tắt 🔔'})`,
      submenu: [
        {
          label: '🔔 Bật lại Popup (Tắt DND)',
          click: () => {
            dndUntilTimestamp = null;
            updateCountdownTick();
          }
        },
        { type: 'separator' },
        {
          label: '⏱️ Tạm dừng trong 1 giờ',
          click: () => {
            dndUntilTimestamp = Date.now() + 60 * 60 * 1000;
            updateCountdownTick();
          }
        },
        {
          label: '⏱️ Tạm dừng trong 2 giờ',
          click: () => {
            dndUntilTimestamp = Date.now() + 2 * 60 * 60 * 1000;
            updateCountdownTick();
          }
        },
        {
          label: '🌙 Tạm dừng đến 7:00 sáng mai',
          click: () => {
            const tomorrow7AM = new Date();
            tomorrow7AM.setDate(tomorrow7AM.getDate() + 1);
            tomorrow7AM.setHours(7, 0, 0, 0);
            dndUntilTimestamp = tomorrow7AM.getTime();
            updateCountdownTick();
          }
        }
      ]
    },
    {
      label: `⏱️ Tần suất lặp lại (Hiện tại: ${intervalText})`,
      submenu: [
        {
          label: '10 giây (Test thử)',
          type: 'radio',
          checked: currentIntervalMinutes <= 0.2,
          click: () => setQuizInterval(0.16)
        },
        {
          label: '15 phút',
          type: 'radio',
          checked: Math.abs(currentIntervalMinutes - 15) < 0.5,
          click: () => setQuizInterval(15)
        },
        {
          label: '30 phút',
          type: 'radio',
          checked: Math.abs(currentIntervalMinutes - 30) < 0.5,
          click: () => setQuizInterval(30)
        },
        {
          label: '60 phút',
          type: 'radio',
          checked: Math.abs(currentIntervalMinutes - 60) < 0.5,
          click: () => setQuizInterval(60)
        }
      ]
    },
    { type: 'separator' },
    {
      label: '❌ Thoát Engion',
      click: () => {
        (app as any).isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

function setupTray() {
  const icon = createTrayIcon();
  tray = new Tray(icon);
  tray.setToolTip('Engion - English Tray Learner');

  updateContextMenu();

  tray.on('double-click', () => {
    showOrCreateDashboard();
  });
}

function triggerQuizPopup(force: boolean = false) {
  // If not forced and DND is active, suppress automatic popup
  if (!force && isDndActiveNow()) {
    console.log('[ENGION] Do Not Disturb (DND) is active. Automatic popup suppressed.');
    return;
  }

  // If test mode (10s interval <= 0.2m), ALWAYS trigger popups even if dashboard is visible so user can verify timer working!
  if (!force && currentIntervalMinutes > 0.2 && dashboardWindow && !dashboardWindow.isDestroyed() && dashboardWindow.isVisible() && !dashboardWindow.isMinimized()) {
    console.log('[ENGION] Dashboard is open and visible. Suppressing automatic tray popup.');
    return;
  }

  createPopupWindow();
  if (popupWindow && !popupWindow.isDestroyed()) {
    try {
      popupWindow.show();
      popupWindow.focus();
    } catch {}
  }

  setTimeout(() => {
    if (popupWindow && !popupWindow.isDestroyed()) {
      popupWindow.webContents.send('open-popup-quiz', { timestamp: Date.now() });
    }
  }, 300);
}

function setQuizInterval(minutes: number, notifyRenderer: boolean = true) {
  currentIntervalMinutes = minutes;
  if (quizTimer) clearInterval(quizTimer);
  if (countdownTicker) clearInterval(countdownTicker);

  const ms = minutes <= 0.2 ? 10000 : Math.round(minutes * 60 * 1000);
  nextPopupTimestamp = Date.now() + ms;

  quizTimer = setInterval(() => {
    nextPopupTimestamp = Date.now() + ms;
    triggerQuizPopup(false);
  }, ms);

  countdownTicker = setInterval(() => {
    updateCountdownTick();
  }, 1000);

  updateCountdownTick();
  updateContextMenu();

  if (notifyRenderer && dashboardWindow && !dashboardWindow.isDestroyed()) {
    try {
      dashboardWindow.webContents.send('settings-updated-from-tray', { popupIntervalMinutes: minutes });
    } catch {}
  }
}

app.whenReady().then(() => {
  // Grant microphone & media permissions in Electron
  session.defaultSession.setPermissionRequestHandler((_webContents: any, _permission: any, callback: (granted: boolean) => void) => {
    callback(true);
  });
  session.defaultSession.setPermissionCheckHandler(() => true);

  setupTray();
  createDashboardWindow();
  setQuizInterval(30);

  // Register Global Hotkeys (Alt+Q: Close, Alt+D: Dashboard, Alt+E: Quiz, Alt+N: Quick Add)
  try {
    globalShortcut.register('Alt+Q', () => {
      const focusedWin = BrowserWindow.getFocusedWindow();
      if (focusedWin && !focusedWin.isDestroyed()) {
        if (focusedWin === dashboardWindow) {
          focusedWin.hide();
        } else {
          try { focusedWin.destroy(); } catch {}
          if (focusedWin === popupWindow) popupWindow = null;
          if (focusedWin === quickAddWindow) quickAddWindow = null;
          if (focusedWin === quickAddReviewWindow) quickAddReviewWindow = null;
        }
      }
    });
    globalShortcut.register('Alt+D', () => {
      showOrCreateDashboard();
    });
    globalShortcut.register('CommandOrControl+Shift+D', () => {
      showOrCreateDashboard();
    });
    globalShortcut.register('Alt+E', () => {
      triggerQuizPopup(true);
    });
    globalShortcut.register('CommandOrControl+Shift+E', () => {
      triggerQuizPopup(true);
    });
    globalShortcut.register('Alt+N', () => {
      createQuickAddWindow();
    });
    globalShortcut.register('CommandOrControl+Shift+N', () => {
      createQuickAddWindow();
    });
  } catch (err) {
    console.log('[ENGION] Failed to register global shortcuts:', err);
  }

  ipcMain.on('open-quick-add-window', () => {
    if (popupWindow && !popupWindow.isDestroyed()) {
      try { popupWindow.destroy(); } catch {}
      popupWindow = null;
    }
    createQuickAddWindow();
  });

  ipcMain.on('open-quick-add-review-window', (_event, wordToLookup: string) => {
    createQuickAddReviewWindow(wordToLookup);
  });

  ipcMain.on('open-dashboard-window', () => {
    if (popupWindow && !popupWindow.isDestroyed()) {
      try { popupWindow.destroy(); } catch {}
      popupWindow = null;
    }
    showOrCreateDashboard();
  });

  ipcMain.on('close-quick-add-window', (event) => {
    const sender = BrowserWindow.fromWebContents(event.sender);
    if (sender && sender !== dashboardWindow) {
      try { sender.destroy(); } catch {}
      if (sender === quickAddWindow) quickAddWindow = null;
      if (sender === quickAddReviewWindow) quickAddReviewWindow = null;
    } else {
      if (quickAddWindow && !quickAddWindow.isDestroyed()) {
        try { quickAddWindow.destroy(); } catch {}
        quickAddWindow = null;
      }
      if (quickAddReviewWindow && !quickAddReviewWindow.isDestroyed()) {
        try { quickAddReviewWindow.destroy(); } catch {}
        quickAddReviewWindow = null;
      }
    }
  });

  ipcMain.on('resize-quick-add-window', (event, expanded: boolean) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

      const targetWidth = expanded ? 480 : 440;
      const targetHeight = expanded ? 480 : 115;
      const targetX = screenWidth - targetWidth - 24;
      const targetY = screenHeight - targetHeight - 24;

      try {
        win.setResizable(true);
        // Move y position UPWARDS first so window expands upwards on Windows OS
        win.setPosition(targetX, targetY, false);
        win.setSize(targetWidth, targetHeight, false);
        win.setBounds({ x: targetX, y: targetY, width: targetWidth, height: targetHeight }, false);
      } catch (err) {
        console.error('[ENGION] Resize quick add window failed:', err);
      }
    }
  });

  ipcMain.on('set-auto-launch', (_event, enable: boolean) => {
    app.setLoginItemSettings({
      openAtLogin: enable,
      path: process.execPath
    });
  });

  ipcMain.on('close-popup-window', (event) => {
    const sender = BrowserWindow.fromWebContents(event.sender);
    // Never close or destroy dashboardWindow from close-popup-window IPC
    if (sender && sender !== dashboardWindow) {
      try {
        sender.destroy();
      } catch {}
      if (sender === popupWindow) popupWindow = null;
    } else if (popupWindow && !popupWindow.isDestroyed() && popupWindow !== dashboardWindow) {
      try {
        popupWindow.destroy();
      } catch {}
      popupWindow = null;
    }
  });

  ipcMain.on('get-timer-status', () => {
    updateCountdownTick();
  });

  ipcMain.on('trigger-practice-now', () => {
    triggerQuizPopup(true);
  });

  ipcMain.on('update-timer-settings', (_event, settings) => {
    if (settings.popupIntervalMinutes !== undefined) {
      setQuizInterval(settings.popupIntervalMinutes, false);
    }
    if (settings.autoLaunch !== undefined) {
      app.setLoginItemSettings({
        openAtLogin: settings.autoLaunch,
        path: process.execPath
      });
    }
    if (settings.dndUntil !== undefined) {
      dndUntilTimestamp = settings.dndUntil ? new Date(settings.dndUntil).getTime() : null;
    }
    if (settings.dndEnabled !== undefined) {
      dndEnabled = settings.dndEnabled;
    }
    if (settings.dndStart !== undefined) {
      dndStart = settings.dndStart;
    }
    if (settings.dndEnd !== undefined) {
      dndEnd = settings.dndEnd;
    }
    updateCountdownTick();
  });

  ipcMain.on('send-native-notification', (_event, { title, body }) => {
    if (Notification.isSupported()) {
      new Notification({ title, body, icon: createTrayIcon() }).show();
    }
  });

  ipcMain.handle('select-and-parse-apkg', async (_event) => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Chọn file Anki Package (.apkg)',
        filters: [{ name: 'Anki Package (*.apkg)', extensions: ['apkg'] }],
        properties: ['openFile']
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, words: [], canceled: true };
      }

      const filePath = result.filePaths[0];
      const { execFile } = await import('child_process');
      const scriptPath = path.join(app.getAppPath(), 'scripts', 'parse_anki.py');

      const words: any[] = await new Promise((resolve) => {
        execFile('python', [scriptPath, filePath], { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }, (err, stdout) => {
          if (err) {
            console.error('Failed to parse APKG via python:', err);
            resolve([]);
            return;
          }
          try {
            const data = JSON.parse(stdout);
            resolve(data);
          } catch {
            resolve([]);
          }
        });
      });

      return { success: true, words, fileName: path.basename(filePath) };
    } catch (e: any) {
      console.error('APKG IPC error:', e);
      return { success: false, words: [], error: e.message };
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  // Keep background tray running
});
