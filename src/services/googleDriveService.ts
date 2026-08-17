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

export const GoogleDriveService = {

  /** Check if the user is currently logged in (has stored token). */
  async isLoggedIn(): Promise<boolean> {
    try {
      const result = await ipc()?.googleAuthStatus?.();
      return result?.loggedIn === true;
    } catch {
      return false;
    }
  },

  /** Get cached user info (name, email, avatar) — null if not logged in. */
  async getUserInfo(): Promise<GoogleAuthInfo | null> {
    try {
      const result = await ipc()?.googleAuthStatus?.();
      if (result?.loggedIn && result?.userInfo) return result.userInfo as GoogleAuthInfo;
      return null;
    } catch {
      return null;
    }
  },

  /** Trigger the Google OAuth2 login flow (opens browser). */
  async login(): Promise<{ success: boolean; userInfo?: GoogleAuthInfo; error?: string }> {
    try {
      const result = await ipc()?.googleAuthStart?.();
      return result ?? { success: false, error: 'electronAPI not available' };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  /** Log out and clear stored tokens. */
  async logout(): Promise<void> {
    try {
      await ipc()?.googleAuthLogout?.();
    } catch {}
  },

  /** Get a fresh access token (auto-refreshes if expired). */
  async getAccessToken(): Promise<string | null> {
    try {
      const result = await ipc()?.googleGetToken?.();
      return result?.accessToken ?? null;
    } catch {
      return null;
    }
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
