import React, { useState, useEffect, useCallback } from 'react';
import { Cloud, CloudOff, LogIn, LogOut, RefreshCw, Download, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { GoogleDriveService } from '../../services/googleDriveService';
import { GoogleAuthInfo, SyncState } from '../../types';

interface SyncStatusUI {
  state: SyncState;
  lastSyncedAt: string | null;
  errorMessage?: string;
  direction?: 'upload' | 'download' | 'same';
}

function formatSyncTime(iso: string | null): string {
  if (!iso) return 'Chưa đồng bộ';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} giờ trước`;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export const GoogleDriveSyncCard: React.FC = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<GoogleAuthInfo | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatusUI>({
    state: 'idle',
    lastSyncedAt: GoogleDriveService.getLastSyncedAt(),
  });
  const [loading, setLoading] = useState(true);

  const checkAuthStatus = useCallback(async () => {
    setLoading(true);
    const isIn = await GoogleDriveService.isLoggedIn();
    setLoggedIn(isIn);
    if (isIn) {
      const info = await GoogleDriveService.getUserInfo();
      setUserInfo(info);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const handleLogin = async () => {
    setSyncStatus(prev => ({ ...prev, state: 'syncing' }));
    console.log('[GoogleDrive] Starting login...', { electronAPI: (window as any).electronAPI });

    const result = await GoogleDriveService.login();
    console.log('[GoogleDrive] Login result:', result);

    if (result.success) {
      setLoggedIn(true);
      setUserInfo(result.userInfo ?? null);
      // After login, smart sync immediately
      const syncResult = await GoogleDriveService.smartSync();
      setSyncStatus({ ...syncResult, direction: (syncResult as any).direction });
    } else {
      setSyncStatus({ state: 'error', lastSyncedAt: null, errorMessage: result.error ?? 'Đăng nhập thất bại' });
    }
  };

  const handleLogout = async () => {
    await GoogleDriveService.logout();
    setLoggedIn(false);
    setUserInfo(null);
    setSyncStatus({ state: 'idle', lastSyncedAt: null });
  };

  const handleSyncNow = async () => {
    setSyncStatus(prev => ({ ...prev, state: 'syncing' }));
    const result = await GoogleDriveService.syncToCloud();
    setSyncStatus({ ...result, direction: undefined });
  };

  const handleRestoreFromCloud = async () => {
    if (!window.confirm('Khôi phục từ Cloud sẽ ghi đè dữ liệu hiện tại trên máy này. Tiếp tục?')) return;
    setSyncStatus(prev => ({ ...prev, state: 'syncing' }));
    const result = await GoogleDriveService.restoreFromCloud();
    setSyncStatus({ ...result, direction: 'download' });
    if (result.state === 'success') {
      // Reload page so restored data takes effect
      setTimeout(() => window.location.reload(), 800);
    }
  };

  const isSyncing = syncStatus.state === 'syncing' || loading;

  // ─── Card Style ─────────────────────────────────────────────────────────────
  const cardBorder = loggedIn
    ? '4px solid #10B981'
    : '4px solid #6366F1';

  return (
    <div className="glass-card" style={{ padding: '20px', borderLeft: cardBorder }}>
      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '10px',
            background: loggedIn ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {loggedIn
              ? <Cloud size={18} style={{ color: '#10B981' }} />
              : <CloudOff size={18} style={{ color: '#6366F1' }} />}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#FFF' }}>
              ☁️ Google Drive Sync
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              Đồng bộ tiến trình học sang thiết bị khác
            </div>
          </div>
        </div>

        {/* Sync Status Badge */}
        {loggedIn && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {syncStatus.state === 'syncing' && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#6366F1' }}>
                <Loader2 size={13} className="animate-spin" /> Đang đồng bộ...
              </span>
            )}
            {syncStatus.state === 'success' && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#10B981' }}>
                <CheckCircle size={13} /> {formatSyncTime(syncStatus.lastSyncedAt)}
              </span>
            )}
            {syncStatus.state === 'error' && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#EF4444' }}>
                <AlertCircle size={13} /> Lỗi đồng bộ
              </span>
            )}
          </div>
        )}
      </div>

      {/* Not Logged In State */}
      {!loggedIn && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
            Đăng nhập Google để đồng bộ từ vựng, tiến trình SRS, streak và cài đặt của bạn — hoạt động trên mọi thiết bị, hoàn toàn <strong style={{ color: '#10B981' }}>miễn phí</strong>.
          </p>

          {/* Error message from failed login attempt */}
          {syncStatus.state === 'error' && syncStatus.errorMessage && (
            <div style={{
              padding: '8px 12px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '8px',
              fontSize: '0.8rem',
              color: '#EF4444'
            }}>
              ❌ {syncStatus.errorMessage}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={isSyncing}
            className="btn"
            style={{
              padding: '10px 18px',
              fontWeight: 700,
              fontSize: '0.88rem',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              color: '#FFF',
              border: 'none',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
              alignSelf: 'flex-start',
            }}
          >
            {isSyncing
              ? <><Loader2 size={15} className="animate-spin" /> Đang kết nối...</>
              : <><LogIn size={15} /> Đăng nhập Google Drive</>}
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <Loader2 size={14} className="animate-spin" /> Đang kiểm tra trạng thái...
        </div>
      )}

      {/* Logged In State */}
      {loggedIn && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Account Info */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 14px',
            background: 'rgba(16, 185, 129, 0.08)',
            borderRadius: '10px',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            {userInfo?.picture && (
              <img
                src={userInfo.picture}
                alt="avatar"
                style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
              />
            )}
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFF' }}>{userInfo?.name ?? 'Google Account'}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{userInfo?.email}</div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <span style={{
                fontSize: '0.7rem', fontWeight: 700,
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#10B981',
                padding: '3px 8px', borderRadius: '20px'
              }}>🟢 Đã kết nối</span>
            </div>
          </div>

          {/* Error message */}
          {syncStatus.state === 'error' && syncStatus.errorMessage && (
            <div style={{
              padding: '8px 12px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              fontSize: '0.8rem',
              color: '#EF4444'
            }}>
              ❌ {syncStatus.errorMessage}
            </div>
          )}

          {/* Sync direction info */}
          {syncStatus.state === 'success' && syncStatus.direction === 'download' && (
            <div style={{
              padding: '8px 12px',
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '8px',
              fontSize: '0.8rem',
              color: '#818CF8'
            }}>
              ⬇️ Đã khôi phục dữ liệu từ Cloud (bản mới hơn)
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="btn"
              style={{
                padding: '8px 14px',
                fontSize: '0.8rem',
                fontWeight: 700,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFF',
                border: 'none',
                cursor: isSyncing ? 'not-allowed' : 'pointer',
                opacity: isSyncing ? 0.7 : 1,
                display: 'flex', alignItems: 'center', gap: '6px',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)'
              }}
              title="Đẩy dữ liệu hiện tại của máy này lên Google Drive"
            >
              {isSyncing
                ? <><Loader2 size={13} className="animate-spin" /> Đang đồng bộ...</>
                : <><RefreshCw size={13} /> ☁️ Đồng bộ ngay</>}
            </button>

            <button
              onClick={handleRestoreFromCloud}
              disabled={isSyncing}
              className="btn"
              style={{
                padding: '8px 14px',
                fontSize: '0.8rem',
                fontWeight: 700,
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#818CF8',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                cursor: isSyncing ? 'not-allowed' : 'pointer',
                opacity: isSyncing ? 0.7 : 1,
                display: 'flex', alignItems: 'center', gap: '6px',
              }}
              title="Khôi phục toàn bộ dữ liệu từ Google Drive về máy này"
            >
              <Download size={13} /> ⬇️ Khôi phục từ Cloud
            </button>

            <button
              onClick={handleLogout}
              disabled={isSyncing}
              className="btn"
              style={{
                padding: '8px 12px',
                fontSize: '0.8rem',
                fontWeight: 600,
                borderRadius: '8px',
                background: 'transparent',
                color: 'var(--text-muted)',
                border: '1px solid rgba(255,255,255,0.1)',
                cursor: isSyncing ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}
              title="Đăng xuất khỏi Google Drive"
            >
              <LogOut size={13} /> Đăng xuất
            </button>
          </div>

          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>
            💡 Dữ liệu lưu riêng tư trong Google Drive của bạn — Engion không có quyền truy cập Drive thông thường.
          </div>
        </div>
      )}
    </div>
  );
};
