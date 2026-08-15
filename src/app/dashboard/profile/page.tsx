"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/axios";
import {
  User,
  Mail,
  Lock,
  LogOut,
  Smartphone,
  Monitor,
  AlertCircle,
  Check,
  Loader2,
  Eye,
  EyeOff,
  ChevronRight,
} from "lucide-react";
import styles from "./page.module.css";

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

type UserProfile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isEmailVerified: boolean;
  isActive: boolean;
};

// ============================================================
// TOAST
// ============================================================

function Toast({ type, message, onClose }: { type: "success" | "error" | "info"; message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`${styles.toast} ${styles[`toast${type.charAt(0).toUpperCase() + type.slice(1)}`]}`}>
      <span>{message}</span>
      <button className={styles.toastClose} onClick={onClose}>×</button>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Profile form
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  // Password form
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ============================================================
  // FETCH DATA
  // ============================================================

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      setLoading(true);
      try {
        // Get user profile
        const meRes = await api.get("/api/v1/auth/me");
        const userData = meRes.data;
        setProfileData({
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          email: userData.email || "",
        });

        // Get sessions
        const sessionsRes = await api.get("/api/v1/auth/sessions");
        setSessions(sessionsRes.data.sessions || []);
      } catch (err) {
        console.error("Failed to load profile:", err);
        setToast({ type: "error", message: "Failed to load profile data" });
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
    setSaving(true);
    try {
      await api.patch("/api/v1/auth/me", {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
      });
      setToast({ type: "success", message: "Profile updated successfully" });
      // Refresh user context
      await api.get("/api/v1/auth/me");
    } catch (err: any) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to update profile",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setToast({ type: "error", message: "New passwords do not match" });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setToast({ type: "error", message: "New password must be at least 8 characters" });
      return;
    }

    setSaving(true);
    try {
      await api.post("/api/v1/auth/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setToast({ type: "success", message: "Password changed successfully" });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to change password",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoutSession = async (sessionId: string) => {
    try {
      await api.post(`/api/v1/auth/sessions/${sessionId}/revoke`);
      setSessions(sessions.filter((s) => s.id !== sessionId));
      setToast({ type: "success", message: "Session logged out" });
    } catch (err: any) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to logout session",
      });
    }
  };

  const handleLogoutAllDevices = async () => {
    if (!confirm("Logout all other devices? You will be logged out everywhere except this device.")) return;

    try {
      await api.post("/api/v1/auth/logout-all");
      setToast({ type: "success", message: "Logged out all devices" });
      // Refresh sessions
      const res = await api.get("/api/v1/auth/sessions");
      setSessions(res.data.sessions || []);
    } catch (err: any) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to logout all devices",
      });
    }
  };

  const handleDeactivateAccount = async () => {
    if (!confirm("Are you sure you want to deactivate your account? This can be reversed by contacting support.")) return;

    try {
      await api.patch("/api/v1/auth/deactivate");
      setToast({ type: "success", message: "Account deactivated" });
      setTimeout(() => {
        logout();
        router.push("/login");
      }, 1500);
    } catch (err: any) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to deactivate account",
      });
    }
  };

  // ============================================================
  // HELPERS
  // ============================================================

  const getDeviceIcon = (userAgent: string | null) => {
    if (!userAgent) return <Monitor size={16} />;
    const ua = userAgent.toLowerCase();
    if (ua.includes("mobile") || ua.includes("android") || ua.includes("ios")) {
      return <Smartphone size={16} />;
    }
    return <Monitor size={16} />;
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60));

    if (diff < 1) return "Now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return d.toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" });
  };

  const isCurrentSession = (session: Session) => {
    // Current session is the one created most recently (or we can track via cookie)
    // For simplicity, assume the most recent session is current
    return sessions.length > 0 && session.id === sessions[0]?.id;
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <Loader2 size={32} className={styles.spinner} />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className={styles.page}>
      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.avatarLarge}>
            {profileData.firstName?.charAt(0) || "U"}
          </div>
          <div>
            <h1 className={styles.title}>
              {profileData.firstName} {profileData.lastName}
            </h1>
            <p className={styles.subtitle}>{profileData.email}</p>
            <div className={styles.badgeRow}>
              <span className={`${styles.badge} ${styles.badgeVerified}`}>
                {user?.isEmailVerified ? "✓ Verified" : "Unverified"}
              </span>
              <span className={`${styles.badge} ${user?.isActive ? styles.badgeActive : styles.badgeInactive}`}>
                {user?.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        {/* ===== PROFILE FORM ===== */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <User size={18} />
            <h2>Personal Information</h2>
          </div>

          <form onSubmit={handleUpdateProfile} className={styles.form}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>First Name</label>
                <input
                  type="text"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Last Name</label>
                <input
                  type="text"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Email</label>
              <div className={styles.emailDisplay}>
                <Mail size={16} />
                <span>{profileData.email}</span>
               
              </div>
            </div>

            <button type="submit" className={styles.submitButton} disabled={saving}>
              {saving ? <Loader2 size={16} className={styles.spinning} /> : <Check size={16} />}
              Save Changes
            </button>
          </form>
        </div>

        {/* ===== CHANGE PASSWORD ===== */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Lock size={18} />
            <h2>Change Password</h2>
          </div>

          <form onSubmit={handleChangePassword} className={styles.form}>
            <div className={styles.formGroup}>
              <label>Current Password</label>
              <div className={styles.passwordInput}>
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>New Password</label>
              <div className={styles.passwordInput}>
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Confirm New Password</label>
              <div className={styles.passwordInput}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className={styles.submitButton} disabled={saving}>
              {saving ? <Loader2 size={16} className={styles.spinning} /> : <Lock size={16} />}
              Update Password
            </button>
          </form>
        </div>

        {/* ===== SESSIONS ===== */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Monitor size={18} />
            <h2>Active Sessions</h2>
            <span className={styles.sessionCount}>{sessions.length}</span>
          </div>

          {sessions.length === 0 ? (
            <p className={styles.emptyText}>No active sessions</p>
          ) : (
            <div className={styles.sessionList}>
              {sessions.map((session, index) => (
                <div
                  key={session.id}
                  className={`${styles.sessionItem} ${index === 0 ? styles.sessionCurrent : ""}`}
                >
                  <div className={styles.sessionIcon}>
                    {getDeviceIcon(session.userAgent)}
                  </div>
                  <div className={styles.sessionInfo}>
                    <div className={styles.sessionDevice}>
                      {session.userAgent || "Unknown Device"}
                      {index === 0 && <span className={styles.currentBadge}>Current</span>}
                    </div>
                    <div className={styles.sessionMeta}>
                      {session.ipAddress || "Unknown IP"} • {formatDate(session.createdAt)}
                    </div>
                  </div>
                  {index !== 0 && (
                    <button
                      className={styles.sessionLogout}
                      onClick={() => handleLogoutSession(session.id)}
                    >
                      <LogOut size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {sessions.length > 1 && (
            <button
              className={styles.logoutAllButton}
              onClick={handleLogoutAllDevices}
            >
              <LogOut size={14} />
              Logout All Other Devices
            </button>
          )}
        </div>


      </div>
    </div>
  );
}