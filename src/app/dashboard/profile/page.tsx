// app/dashboard/profile/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/axios';
import { AxiosError } from 'axios';
import {
  User as UserIcon,
  Mail,
  Lock,
  LogOut,
  Smartphone,
  Monitor,
  Shield,
  Check,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';
import styles from './page.module.css';

// ============================================================
// TYPES
// ============================================================

type Session = {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
  isRevoked: boolean;
};

type ApiErrorResponse = {
  message?: string;
  error?: string;
  [key: string]: unknown;
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse;
    return data?.message || data?.error || fallback;
  }
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return fallback;
}

// ============================================================
// TOAST
// ============================================================

function Toast({
  type,
  message,
  onClose,
}: {
  type: 'success' | 'error' | 'info';
  message: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`${styles.toast} ${styles[`toast${type.charAt(0).toUpperCase() + type.slice(1)}`]}`}>
      <span>{message}</span>
      <button className={styles.toastClose} onClick={onClose}>
        ×
      </button>
    </div>
  );
}

// ============================================================
// SKELETON
// ============================================================

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`${styles.skeleton} ${className ?? ''}`} />;
}

function ProfileSkeleton() {
  return (
    <div className={styles.page} aria-busy="true" aria-live="polite">
      <span className={styles.srOnly}>Loading profile…</span>

      <div className={styles.header}>
        <SkeletonBlock className={styles.skeletonAvatar} />
        <div style={{ flex: 1 }}>
          <SkeletonBlock className={styles.skeletonTitle} />
          <SkeletonBlock className={styles.skeletonSubtitle} />
          <SkeletonBlock className={styles.skeletonBadges} />
        </div>
      </div>

      {Array.from({ length: 2 }).map((_, i) => (
        <div key={`c-${i}`} className={styles.card}>
          <div className={styles.cardHeader}>
            <SkeletonBlock className={styles.skeletonCardTitle} />
          </div>
          <SkeletonBlock className={styles.skeletonRow} />
          <SkeletonBlock className={styles.skeletonRow} />
        </div>
      ))}
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================

function getDeviceIcon(userAgent: string | null) {
  if (!userAgent) return <Monitor size={16} />;
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('ios')) {
    return <Smartphone size={16} />;
  }
  return <Monitor size={16} />;
}

function formatSessionDate(date: string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - d.getTime()) / (1000 * 60));

  if (diffMin < 1) return 'Active now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
  return d.toLocaleDateString('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatMemberSince(date: string | undefined): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-KE', {
    month: 'short',
    year: 'numeric',
  });
}

function shortenUserAgent(ua: string | null): string {
  if (!ua) return 'Unknown device';
  // Best-effort parse. Falls back to raw UA if nothing matches.
  const browser =
    ua.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/)?.[1] ?? 'Browser';
  const os =
    ua.match(/\(([^)]+)\)/)?.[1]?.split(';')[0]?.trim() ?? 'Unknown OS';
  return `${browser} · ${os}`;
}

// ============================================================
// MAIN
// ============================================================

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ============================================================
  // FETCH
  // ============================================================

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const [meRes, sessionsRes] = await Promise.all([
          api.get('/api/v1/auth/me'),
          api.get('/api/v1/auth/sessions'),
        ]);
        setProfileData({
          firstName: meRes.data.firstName || '',
          lastName: meRes.data.lastName || '',
          email: meRes.data.email || '',
        });
        setSessions(sessionsRes.data.sessions || []);
      } catch (err) {
        console.error('Failed to load profile:', err);
        setToast({ type: 'error', message: 'Failed to load profile' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingProfile) return;
    setSavingProfile(true);
    try {
      await api.patch('/api/v1/auth/me', {
        firstName: profileData.firstName.trim(),
        lastName: profileData.lastName.trim(),
      });
      await refreshUser?.();
      setToast({ type: 'success', message: 'Profile updated' });
    } catch (err) {
      setToast({
        type: 'error',
        message: getErrorMessage(err, 'Failed to update profile'),
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingPassword) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setToast({ type: 'error', message: 'New passwords do not match' });
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setToast({
        type: 'error',
        message: 'New password must be at least 8 characters',
      });
      return;
    }

    setSavingPassword(true);
    try {
      await api.post('/api/v1/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setToast({ type: 'success', message: 'Password updated' });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setToast({
        type: 'error',
        message: getErrorMessage(err, 'Failed to change password'),
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogoutSession = async (sessionId: string) => {
    try {
      await api.post(`/api/v1/auth/sessions/${sessionId}/revoke`);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setToast({ type: 'success', message: 'Session signed out' });
    } catch (err) {
      setToast({
        type: 'error',
        message: getErrorMessage(err, 'Failed to sign out session'),
      });
    }
  };

  const handleLogoutAllDevices = async () => {
    if (
      !window.confirm(
        'Sign out of all other devices? You will stay signed in on this one.',
      )
    ) {
      return;
    }
    try {
      await api.post('/api/v1/auth/logout-all');
      const res = await api.get('/api/v1/auth/sessions');
      setSessions(res.data.sessions || []);
      setToast({ type: 'success', message: 'Signed out of all other devices' });
    } catch (err) {
      setToast({
        type: 'error',
        message: getErrorMessage(err, 'Failed to sign out'),
      });
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) return <ProfileSkeleton />;

  const initials =
    `${profileData.firstName?.[0] ?? ''}${profileData.lastName?.[0] ?? ''}`.toUpperCase() ||
    'U';

  const memberSince = formatMemberSince(user?.createdAt);

  const isVerified = user?.isEmailVerified;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className={styles.page}>
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* ===== HEADER ===== */}
      <div className={styles.header}>
        <div className={styles.avatarLarge}>{initials}</div>
        <div className={styles.headerText}>
          <h1 className={styles.title}>
            {profileData.firstName} {profileData.lastName}
          </h1>
          <p className={styles.subtitle}>{profileData.email}</p>
          <div className={styles.badgeRow}>
            <span
              className={`${styles.badge} ${
                isVerified ? styles.badgeVerified : styles.badgePending
              }`}
            >
              {isVerified ? <Check size={11} /> : null}
              {isVerified ? 'Verified' : 'Unverified'}
            </span>
            {memberSince && (
              <span className={styles.badgeNeutral}>
                Member since {memberSince}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ===== ACCOUNT ===== */}
      <section className={styles.card}>
        <header className={styles.cardHeader}>
          <span className={styles.cardIcon}>
            <UserIcon size={16} />
          </span>
          <div className={styles.cardHeaderText}>
            <h2 className={styles.cardTitle}>Account</h2>
            <p className={styles.cardDesc}>
              Your name appears across every product. Email is managed by your
              organization.
            </p>
          </div>
        </header>

        <form onSubmit={handleUpdateProfile} className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>First name</label>
              <input
                type="text"
                value={profileData.firstName}
                onChange={(e) =>
                  setProfileData({ ...profileData, firstName: e.target.value })
                }
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Last name</label>
              <input
                type="text"
                value={profileData.lastName}
                onChange={(e) =>
                  setProfileData({ ...profileData, lastName: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Email</label>
            <div className={styles.readOnlyField}>
              <Mail size={14} />
              <span>{profileData.email}</span>
            </div>
          </div>

          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={savingProfile}
            >
              {savingProfile ? (
                <Loader2 size={15} className={styles.spinning} />
              ) : (
                <Check size={15} />
              )}
              {savingProfile ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </section>

      {/* ===== PASSWORD ===== */}
      <section className={styles.card}>
        <header className={styles.cardHeader}>
          <span className={styles.cardIcon}>
            <Lock size={16} />
          </span>
          <div className={styles.cardHeaderText}>
            <h2 className={styles.cardTitle}>Password</h2>
            <p className={styles.cardDesc}>
              Use at least 8 characters. You&apos;ll stay signed in on this
              device.
            </p>
          </div>
        </header>

        <form onSubmit={handleChangePassword} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Current password</label>
            <div className={styles.passwordInput}>
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    currentPassword: e.target.value,
                  })
                }
                required
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowCurrentPassword((v) => !v)}
              >
                {showCurrentPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>New password</label>
              <div className={styles.passwordInput}>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() => setShowNewPassword((v) => !v)}
                >
                  {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Confirm new password</label>
              <div className={styles.passwordInput}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  required
                />
                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() => setShowConfirmPassword((v) => !v)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={15} />
                  ) : (
                    <Eye size={15} />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={savingPassword}
            >
              {savingPassword ? (
                <Loader2 size={15} className={styles.spinning} />
              ) : (
                <Lock size={15} />
              )}
              {savingPassword ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>
      </section>

      {/* ===== SESSIONS ===== */}
      <section className={styles.card}>
        <header className={styles.cardHeader}>
          <span className={styles.cardIcon}>
            <Shield size={16} />
          </span>
          <div className={styles.cardHeaderText}>
            <h2 className={styles.cardTitle}>
              Active sessions
              <span className={styles.sessionCount}>{sessions.length}</span>
            </h2>
            <p className={styles.cardDesc}>
              Devices currently signed in to your account.
            </p>
          </div>
        </header>

        {sessions.length === 0 ? (
          <p className={styles.emptyText}>No active sessions</p>
        ) : (
          <div className={styles.sessionList}>
            {sessions.map((session, index) => {
              const isCurrent = index === 0;
              return (
                <div
                  key={session.id}
                  className={`${styles.sessionItem} ${
                    isCurrent ? styles.sessionCurrent : ''
                  }`}
                >
                  <div className={styles.sessionIcon}>
                    {getDeviceIcon(session.userAgent)}
                  </div>
                  <div className={styles.sessionInfo}>
                    <div className={styles.sessionDevice}>
                      {shortenUserAgent(session.userAgent)}
                      {isCurrent && (
                        <span className={styles.currentBadge}>This device</span>
                      )}
                    </div>
                    <div className={styles.sessionMeta}>
                      {session.ipAddress || 'Unknown IP'} ·{' '}
                      {formatSessionDate(session.createdAt)}
                    </div>
                  </div>
                  {!isCurrent && (
                    <button
                      className={styles.sessionLogout}
                      onClick={() => handleLogoutSession(session.id)}
                      title="Sign out this device"
                    >
                      <LogOut size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {sessions.length > 1 && (
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleLogoutAllDevices}
            >
              <LogOut size={14} />
              Sign out of all other devices
            </button>
          </div>
        )}
      </section>
    </div>
  );
}