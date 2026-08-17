/**
 * GoogleDriveService — Manages Google Drive sync for Engion.
 *
 * Architecture:
 *  - Auth flow is handled by Electron main process (OAuth2 PKCE via ipcMain)
 *  - This service runs in the renderer and calls electronAPI IPC bridges
 *  - Data is synced to Google Drive "appDataFolder" (hidden, app-private space)
 *  - Conflict resolution: the payload with newer `syncedAt` always wins
 */

import { CloudSyncPayload, GoogleAuthInfo, SyncStatus } from '../types';
import { StorageService } from './storage';

const SYNC_FILE_NAME = 'engion_sync_v1.json';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';
const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';

// ─── IPC Bridge helpers ─────────────────────────────────────────────────────

function ipc() {
  return (window as any).electronAPI as any;
}

// ─── Main Service ────────────────────────────────────────────────────────────

const WEB_TOKEN_KEY = 'engion_google_web_token';
const WEB_USER_KEY = 'engion_google_user_info';
const GOOGLE_CLIENT_ID = '969701944799-7rgihm7vea7ebcmk8tvb32jv883jbud1.apps.googleusercontent.com';

export const GoogleDriveService = {

  /** Check if the user is currently logged in (has stored token). */
  async isLoggedIn(): Promise<boolean> {
    if (ipc()?.googleAuthStatus) {
      try {
        const result = await ipc().googleAuthStatus();
        if (result?.loggedIn) return true;
      } catch {}
    }
    const token = await this.getAccessToken();
    return !!token;
  },

  /** Get cached user info (name, email, avatar) — null if not logged in. */
  async getUserInfo(): Promise<GoogleAuthInfo | null> {
    if (ipc()?.googleAuthStatus) {
      try {
        const result = await ipc().googleAuthStatus();
        if (result?.loggedIn && result?.userInfo) return result.userInfo as GoogleAuthInfo;
      } catch {}
    }
    const raw = localStorage.getItem(WEB_USER_KEY);
    if (raw) {
      try { return JSON.parse(raw); } catch {}
    }
    return null;
  },

  /** Trigger the Google OAuth2 login flow (Native Electron or Web Popup). */
  async login(): Promise<{ success: boolean; userInfo?: GoogleAuthInfo; error?: string }> {
    // 1. Try Native Electron IPC if running inside Electron
    if (ipc()?.googleAuthStart) {
      try {
        const result = await ipc().googleAuthStart();
        if (result && result.success) return result;
        if (result && result.error) return result;
      } catch (e: any) {
        console.warn('[GoogleDrive] Native IPC login error:', e);
      }
    }

    // 2. Web Browser Fallback (OAuth2 Implicit Popup)
    return new Promise((resolve) => {
      const redirectUri = window.location.origin + window.location.pathname;
      const scopes = 'https://www.googleapis.com/auth/drive.appdata openid email profile';
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scopes)}&prompt=consent`;

      const popup = window.open(authUrl, 'google_login', 'width=550,height=650,top=100,left=100');
      
      if (!popup) {
        resolve({ success: false, error: 'Cửa sổ popup bị chặn bởi trình duyệt. Vui lòng cho phép popup.' });
        return;
      }

      const timer = setInterval(() => {
        try {
          if (popup.closed) {
            clearInterval(timer);
            resolve({ success: false, error: 'Đăng nhập bị hủy' });
            return;
          }

          const href = popup.location.href;
          if (href && href.includes('access_token=')) {
            clearInterval(timer);
            const params = new URLSearchParams(href.split('#')[1]);
            const accessToken = params.get('access_token');
            const expiresIn = parseInt(params.get('expires_in') || '3600', 10);
            popup.close();

            if (accessToken) {
              const expiry = Date.now() + expiresIn * 1000;
              localStorage.setItem(WEB_TOKEN_KEY, JSON.stringify({ token: accessToken, expiry }));

              // Fetch User Info
              fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` }
              })
                .then(res => res.json())
                .then(userInfo => {
                  const info: GoogleAuthInfo = {
                    email: userInfo.email,
                    name: userInfo.name,
                    picture: userInfo.picture
                  };
                  localStorage.setItem(WEB_USER_KEY, JSON.stringify(info));
                  resolve({ success: true, userInfo: info });
                })
                .catch(() => {
                  resolve({ success: true });
                });
            } else {
              resolve({ success: false, error: 'Không lấy được access token từ Google' });
            }
          }
        } catch {
          // Cross-origin check throws error until popup redirects back to redirectUri — this is expected
        }
      }, 500);
    });
  },

  /** Log out and clear stored tokens. */
  async logout(): Promise<void> {
    if (ipc()?.googleAuthLogout) {
      try { await ipc().googleAuthLogout(); } catch {}
    }
    localStorage.removeItem(WEB_TOKEN_KEY);
    localStorage.removeItem(WEB_USER_KEY);
  },

  /** Get a fresh access token (auto-refreshes if expired). */
  async getAccessToken(): Promise<string | null> {
    if (ipc()?.googleGetToken) {
      try {
        const result = await ipc().googleGetToken();
        if (result?.accessToken) return result.accessToken;
      } catch {}
    }
    const raw = localStorage.getItem(WEB_TOKEN_KEY);
    if (raw) {
      try {
        const data = JSON.parse(raw);
        if (data.expiry && Date.now() < data.expiry) {
          return data.token;
        }
      } catch {}
    }
    return null;
  },

  // ─── Data Packaging ───────────────────────────────────────────────────────

  /** Pack all localStorage data into a CloudSyncPayload. */
  packLocalData(): CloudSyncPayload {
    return {
      version: '1.1.1',
      syncedAt: new Date().toISOString(),
      customWords:    localStorage.getItem('engion_custom_words')   ?? '[]',
      progressMap:    localStorage.getItem('engion_word_progress')  ?? '{}',
      favorites:      localStorage.getItem('engion_favorite_words') ?? '[]',
      customDecks:    localStorage.getItem('engion_custom_decks')   ?? '[]',
      deletedWordIds: localStorage.getItem('engion_deleted_words')  ?? '[]',
      deletedDeckIds: localStorage.getItem('engion_deleted_decks')  ?? '[]',
      settings:       localStorage.getItem('engion_app_settings')   ?? '{}',
    };
  },

  /** Restore all localStorage keys from a CloudSyncPayload. */
  unpackCloudData(payload: CloudSyncPayload): void {
    localStorage.setItem('engion_custom_words',    payload.customWords);
    localStorage.setItem('engion_word_progress',   payload.progressMap);
    localStorage.setItem('engion_favorite_words',  payload.favorites);
    localStorage.setItem('engion_custom_decks',    payload.customDecks);
    localStorage.setItem('engion_deleted_words',   payload.deletedWordIds);
    localStorage.setItem('engion_deleted_decks',   payload.deletedDeckIds);
    localStorage.setItem('engion_app_settings',    payload.settings);
  },

  // ─── Drive API calls ──────────────────────────────────────────────────────

  /** Find the sync file on Drive. Returns { id, syncedAt } or null. */
  async findSyncFile(token: string): Promise<{ id: string; syncedAt: string } | null> {
    try {
      const params = new URLSearchParams({
        spaces: 'appDataFolder',
        q: `name = '${SYNC_FILE_NAME}'`,
        fields: 'files(id, name, modifiedTime)',
        pageSize: '1',
      });
      const res = await fetch(`${DRIVE_FILES_URL}?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      const data = await res.json();
      const file = data.files?.[0];
      if (!file) return null;
      return { id: file.id, syncedAt: file.modifiedTime };
    } catch {
      return null;
    }
  },

  /** Download the sync file content from Drive. */
  async downloadFromCloud(token: string): Promise<CloudSyncPayload | null> {
    try {
      const found = await this.findSyncFile(token);
      if (!found) return null;

      const res = await fetch(`${DRIVE_FILES_URL}/${found.id}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      return await res.json() as CloudSyncPayload;
    } catch {
      return null;
    }
  },

  /** Upload local data to Drive (creates or updates the sync file). */
  async uploadToCloud(token: string, payload: CloudSyncPayload): Promise<boolean> {
    try {
      const jsonBlob = new Blob([JSON.stringify(payload)], { type: 'application/json' });

      // Check if file already exists (to PATCH vs POST)
      const found = await this.findSyncFile(token);

      if (found) {
        // Update existing file
        const res = await fetch(`${DRIVE_UPLOAD_URL}/${found.id}?uploadType=media`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: jsonBlob,
        });
        return res.ok;
      } else {
        // Create new file in appDataFolder
        const metadata = {
          name: SYNC_FILE_NAME,
          parents: ['appDataFolder'],
        };
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', jsonBlob);

        const res = await fetch(`${DRIVE_UPLOAD_URL}?uploadType=multipart`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        return res.ok;
      }
    } catch {
      return false;
    }
  },

  // ─── High-level Sync Flows ────────────────────────────────────────────────

  /**
   * Upload local data to Drive.
   * Returns a SyncStatus reflecting the result.
   */
  async syncToCloud(): Promise<SyncStatus> {
    const token = await this.getAccessToken();
    if (!token) return { state: 'error', lastSyncedAt: null, errorMessage: 'Chưa đăng nhập Google' };

    const payload = this.packLocalData();
    const ok = await this.uploadToCloud(token, payload);
    if (!ok) return { state: 'error', lastSyncedAt: null, errorMessage: 'Lỗi khi đồng bộ lên Drive' };

    const syncedAt = payload.syncedAt;
    this.saveLastSyncedAt(syncedAt);
    return { state: 'success', lastSyncedAt: syncedAt };
  },

  /**
   * Download data from Drive and restore into localStorage.
   * Overwrites local data regardless of timestamps.
   * Use for "Khôi phục từ Cloud" button.
   */
  async restoreFromCloud(): Promise<SyncStatus> {
    const token = await this.getAccessToken();
    if (!token) return { state: 'error', lastSyncedAt: null, errorMessage: 'Chưa đăng nhập Google' };

    const cloud = await this.downloadFromCloud(token);
    if (!cloud) return { state: 'error', lastSyncedAt: null, errorMessage: 'Không tìm thấy dữ liệu trên Drive' };

    this.unpackCloudData(cloud);
    this.saveLastSyncedAt(cloud.syncedAt);
    return { state: 'success', lastSyncedAt: cloud.syncedAt };
  },

  /**
   * Smart sync: compare timestamps, upload if local is newer, download if cloud is newer.
   */
  async smartSync(): Promise<SyncStatus & { direction?: 'upload' | 'download' | 'same' }> {
    const token = await this.getAccessToken();
    if (!token) return { state: 'error', lastSyncedAt: null, errorMessage: 'Chưa đăng nhập Google' };

    const cloud = await this.downloadFromCloud(token);

    if (!cloud) {
      // No cloud data yet — first time: upload local
      const payload = this.packLocalData();
      const ok = await this.uploadToCloud(token, payload);
      if (!ok) return { state: 'error', lastSyncedAt: null, errorMessage: 'Lỗi khi đồng bộ lên Drive' };
      this.saveLastSyncedAt(payload.syncedAt);
      return { state: 'success', lastSyncedAt: payload.syncedAt, direction: 'upload' };
    }

    // Compare timestamps
    const cloudTime = new Date(cloud.syncedAt).getTime();
    const localLastSync = this.getLastSyncedAt();
    const localTime = localLastSync ? new Date(localLastSync).getTime() : 0;

    if (cloudTime > localTime) {
      // Cloud is newer — restore
      this.unpackCloudData(cloud);
      this.saveLastSyncedAt(cloud.syncedAt);
      return { state: 'success', lastSyncedAt: cloud.syncedAt, direction: 'download' };
    } else {
      // Local is newer (or same) — upload
      const payload = this.packLocalData();
      const ok = await this.uploadToCloud(token, payload);
      if (!ok) return { state: 'error', lastSyncedAt: null, errorMessage: 'Lỗi khi đồng bộ lên Drive' };
      this.saveLastSyncedAt(payload.syncedAt);
      return { state: 'success', lastSyncedAt: payload.syncedAt, direction: cloudTime === localTime ? 'same' : 'upload' };
    }
  },

  // ─── Last Synced Timestamp ────────────────────────────────────────────────

  saveLastSyncedAt(iso: string): void {
    localStorage.setItem('engion_last_synced_at', iso);
  },

  getLastSyncedAt(): string | null {
    return localStorage.getItem('engion_last_synced_at');
  },
};
