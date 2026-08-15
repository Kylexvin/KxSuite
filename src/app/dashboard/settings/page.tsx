// app/dashboard/settings/page.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/axios";
import {
  Settings,
  Building2,
  Phone,
  Mail,
  MapPin,
  Globe,
  Save,
  AlertTriangle,
  Loader2,
  Check,
  X,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import styles from "./page.module.css";

// ============================================================
// TYPES
// ============================================================

type Organization = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  country: string;
  currency: string;
  timezone: string;
  isActive: boolean;
  isArchived: boolean;
};

// ============================================================
// TOAST
// ============================================================

function Toast({ type, message, onClose }: { type: "success" | "error" | "info"; message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <Check size={16} />,
    error: <AlertTriangle size={16} />,
    info: <AlertTriangle size={16} />,
  };

  const classes = {
    success: styles.toastSuccess,
    error: styles.toastError,
    info: styles.toastInfo,
  };

  return (
    <div className={`${styles.toast} ${classes[type]}`}>
      {icons[type]}
      <span>{message}</span>
      <button className={styles.toastClose} onClick={onClose}>
        <X size={14} />
      </button>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function SettingsPage() {
  const router = useRouter();
  const { activeOrganization, loadSuiteContext } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // ============================================================
  // FETCH DATA
  // ============================================================

  const fetchData = useCallback(async () => {
    if (!activeOrganization) return;

    setLoading(true);
    try {
      const orgId = activeOrganization.id;
      const orgRes = await api.get(`/api/v1/organizations/${orgId}`);
      const org = orgRes.data.organization || orgRes.data;
      setOrganization(org);

      // ✅ If organization is archived, redirect to onboarding immediately
      if (org.isArchived) {
        localStorage.removeItem("suiteContext");
        localStorage.removeItem("activeOrganization");
        localStorage.removeItem("activeOrganizationDetail");
        localStorage.removeItem("branches");
        localStorage.removeItem("activeBranch");
        window.location.href = "/onboarding/select-organization";
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
      setToast({ type: "error", message: "Failed to load settings. Please try again." });
    } finally {
      setLoading(false);
    }
  }, [activeOrganization]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleUpdateOrg = async (data: Partial<Organization>) => {
    if (!activeOrganization || !organization) return;

    setSaving(true);
    try {
      await api.patch(`/api/v1/organizations/${activeOrganization.id}`, data);
      await fetchData();
      await loadSuiteContext(activeOrganization.id);
      setToast({ type: "success", message: "Organization updated successfully" });
    } catch (err: any) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to update organization",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleArchiveOrganization = async () => {
    if (!activeOrganization || !organization) return;

    if (!confirm(`Are you sure you want to archive "${organization.name}"? This can be undone.`)) return;

    setSaving(true);
    try {
      await api.delete(`/api/v1/organizations/${activeOrganization.id}`);
      
      setToast({ type: "success", message: "Organization archived successfully" });
      
      // ✅ Clear state and redirect to onboarding
      localStorage.removeItem("suiteContext");
      localStorage.removeItem("activeOrganization");
      localStorage.removeItem("activeOrganizationDetail");
      localStorage.removeItem("branches");
      localStorage.removeItem("activeBranch");
      
      setTimeout(() => {
        window.location.href = "/onboarding/select-organization";
      }, 1500);
    } catch (err: any) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to archive organization",
      });
    } finally {
      setSaving(false);
    }
  };

  const goToSelectOrganization = () => {
    localStorage.removeItem("suiteContext");
    localStorage.removeItem("activeOrganization");
    localStorage.removeItem("activeOrganizationDetail");
    localStorage.removeItem("branches");
    localStorage.removeItem("activeBranch");
    window.location.href = "/onboarding/select-organization";
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <Loader2 size={32} className={styles.spinner} />
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyState}>
          <Building2 size={48} />
          <h3>Organization not found</h3>
          <p>Please select an organization first.</p>
          <button
            className={styles.backButton}
            onClick={goToSelectOrganization}
          >
            <ArrowLeft size={16} />
            Back to Organizations
          </button>
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

      {/* ===== HEADER ===== */}
      <div className={styles.orgHeader}>
        <div className={styles.orgIdentity}>
          <span className={styles.orgAvatar}>
            <Settings size={24} />
          </span>
          <div>
            <div className={styles.orgNameRow}>
              <h1 className={styles.orgName}>Settings</h1>
              <span className={styles.statusPill}>
                {organization.name}
              </span>
            </div>
            <div className={styles.orgMeta}>
              Manage your organization settings and preferences
            </div>
          </div>
        </div>
        <button
          className={styles.switchButton}
          onClick={goToSelectOrganization}
          title="Switch organization"
        >
          <ArrowLeft size={16} />
          Switch Organization
        </button>
      </div>

      {/* ===== GENERAL SETTINGS ===== */}
      <div className={styles.settingsCard}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>
            <Settings size={18} />
            General Settings
          </h2>
          <button
            className={styles.saveButton}
            onClick={() => {
              const data = {
                name: organization.name,
                email: organization.email,
                phone: organization.phone,
                address: organization.address,
                country: organization.country,
                currency: organization.currency,
                timezone: organization.timezone,
              };
              handleUpdateOrg(data);
            }}
            disabled={saving}
          >
            {saving ? <Loader2 size={16} className={styles.spinning} /> : <Save size={16} />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        <div className={styles.settingGroup}>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <label>Organization Name</label>
              <span className={styles.settingDescription}>Display name used across products</span>
            </div>
            <input
              type="text"
              className={styles.settingInput}
              value={organization.name || ""}
              onChange={(e) => setOrganization({ ...organization, name: e.target.value })}
            />
          </div>

          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <label>
                <Mail size={14} />
                Email
              </label>
              <span className={styles.settingDescription}>Primary contact email</span>
            </div>
            <input
              type="email"
              className={styles.settingInput}
              value={organization.email || ""}
              onChange={(e) => setOrganization({ ...organization, email: e.target.value })}
            />
          </div>

          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <label>
                <Phone size={14} />
                Phone
              </label>
              <span className={styles.settingDescription}>Primary contact number</span>
            </div>
            <input
              type="tel"
              className={styles.settingInput}
              value={organization.phone || ""}
              onChange={(e) => setOrganization({ ...organization, phone: e.target.value })}
            />
          </div>

          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <label>
                <MapPin size={14} />
                Address
              </label>
              <span className={styles.settingDescription}>Physical business address</span>
            </div>
            <input
              type="text"
              className={styles.settingInput}
              value={organization.address || ""}
              onChange={(e) => setOrganization({ ...organization, address: e.target.value })}
            />
          </div>

          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <label>
                <Globe size={14} />
                Country
              </label>
            </div>
            <select
              className={styles.settingSelect}
              value={organization.country || "KE"}
              onChange={(e) => setOrganization({ ...organization, country: e.target.value })}
            >
              <option value="KE">🇰🇪 Kenya</option>
              <option value="UG">🇺🇬 Uganda</option>
              <option value="TZ">🇹🇿 Tanzania</option>
              <option value="RW">🇷🇼 Rwanda</option>
              <option value="NG">🇳🇬 Nigeria</option>
              <option value="ZA">🇿🇦 South Africa</option>
            </select>
          </div>

          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <label>Currency</label>
            </div>
            <select
              className={styles.settingSelect}
              value={organization.currency || "KES"}
              onChange={(e) => setOrganization({ ...organization, currency: e.target.value })}
            >
              <option value="KES">KES - Kenyan Shilling</option>
              <option value="UGX">UGX - Ugandan Shilling</option>
              <option value="TZS">TZS - Tanzanian Shilling</option>
              <option value="RWF">RWF - Rwandan Franc</option>
              <option value="NGN">NGN - Nigerian Naira</option>
              <option value="ZAR">ZAR - South African Rand</option>
              <option value="USD">USD - US Dollar</option>
            </select>
          </div>

          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <label>Timezone</label>
            </div>
            <select
              className={styles.settingSelect}
              value={organization.timezone || "Africa/Nairobi"}
              onChange={(e) => setOrganization({ ...organization, timezone: e.target.value })}
            >
              <option value="Africa/Nairobi">Africa/Nairobi</option>
              <option value="Africa/Kampala">Africa/Kampala</option>
              <option value="Africa/Dar_es_Salaam">Africa/Dar_es_Salaam</option>
              <option value="Africa/Kigali">Africa/Kigali</option>
              <option value="Africa/Lagos">Africa/Lagos</option>
              <option value="Africa/Johannesburg">Africa/Johannesburg</option>
            </select>
          </div>
        </div>
      </div>

      {/* ===== DANGER ZONE ===== */}
      <div className={`${styles.settingsCard} ${styles.dangerCard}`}>
        <div className={styles.cardHeader}>
          <h2 className={`${styles.cardTitle} ${styles.dangerTitle}`}>
            <AlertTriangle size={18} />
            Danger Zone
          </h2>
        </div>

        <div className={styles.dangerItem}>
          <div className={styles.dangerInfo}>
            <h3>
              <AlertTriangle size={16} />
              Archive Organization
            </h3>
            <p>This will deactivate the organization. All members will lose access. This can be undone.</p>
          </div>
          <button
            className={styles.dangerButton}
            onClick={handleArchiveOrganization}
            disabled={saving}
          >
            {saving ? <Loader2 size={16} className={styles.spinning} /> : "Archive"}
          </button>
        </div>
      </div>
    </div>
  );
}