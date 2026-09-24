// app/dashboard/settings/page.tsx

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import { api } from '@/lib/axios';
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
  Upload,
  Image as ImageIcon,
  Database,
  Lock,
  Shield,

} from 'lucide-react';
import styles from './page.module.css';

// ============================================================
// TYPES
// ============================================================

type Organization = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  logoPublicId: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  country: string;
  currency: string;
  timezone: string;
  auditLogRetention: number;
  isActive: boolean;
  isArchived: boolean;
};

const ALLOWED_RETENTION = [30, 45, 60, 90];

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
// SKELETON
// ============================================================

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`${styles.skeleton} ${className ?? ''}`} />;
}

function SettingsSkeleton() {
  return (
    <div className={styles.page} aria-busy="true" aria-live="polite">
      <span className={styles.srOnly}>Loading settings…</span>

      <div className={styles.orgHeader}>
        <SkeletonBlock className={styles.skeletonAvatar} />
        <div style={{ flex: 1 }}>
          <SkeletonBlock className={styles.skeletonTitle} />
          <SkeletonBlock className={styles.skeletonSubtitle} />
        </div>
      </div>

      {Array.from({ length: 2 }).map((_, s) => (
        <div key={`card-${s}`} className={styles.settingsCard}>
          <div className={styles.cardHeader}>
            <SkeletonBlock className={styles.skeletonCardTitle} />
            <SkeletonBlock className={styles.skeletonButton} />
          </div>
          {Array.from({ length: 4 }).map((_, r) => (
            <div key={`row-${r}`} className={styles.settingRow}>
              <SkeletonBlock className={styles.skeletonLine} />
              <SkeletonBlock className={styles.skeletonInput} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function SettingsPage() {
  const router = useRouter();
  const { activeOrganization, loadSuiteContext } = useAuth();
  const { isOwner, hasPermission, isReady } = usePermissions();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // ============================================================
  // PERMISSIONS
  // ============================================================

  const canView = isOwner || hasPermission('settings.view');
  const canManage = isOwner || hasPermission('settings.manage');

  const activeOrgId = activeOrganization?.id;

  // ============================================================
  // FETCH
  // ============================================================

  const fetchData = useCallback(async () => {
    if (!activeOrgId) return;

    setLoading(true);
    try {
      const orgRes = await api.get(`/api/v1/organizations/${activeOrgId}`);
      const org = orgRes.data.organization || orgRes.data;
      setOrganization(org);

      if (org.isArchived) {
        localStorage.removeItem('suiteContext');
        localStorage.removeItem('activeOrganization');
        localStorage.removeItem('activeOrganizationDetail');
        localStorage.removeItem('branches');
        localStorage.removeItem('activeBranch');
        router.push('/onboarding/select-organization');
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      setToast({
        type: 'error',
        message: 'Failed to load settings. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }, [activeOrgId, router]);

  useEffect(() => {
    if (!isReady) return;
    if (!canView) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const orgRes = await api.get(
          `/api/v1/organizations/${activeOrgId}`,
        );
        if (cancelled) return;
        const org = orgRes.data.organization || orgRes.data;
        setOrganization(org);

        if (org.isArchived) {
          localStorage.removeItem('suiteContext');
          localStorage.removeItem('activeOrganization');
          localStorage.removeItem('activeOrganizationDetail');
          localStorage.removeItem('branches');
          localStorage.removeItem('activeBranch');
          router.push('/onboarding/select-organization');
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load settings:', err);
          setToast({
            type: 'error',
            message: 'Failed to load settings. Please try again.',
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [activeOrgId, isReady, canView, router]);

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleUpdateOrg = async (data: Partial<Organization>) => {
    if (!activeOrgId || !organization) return;

    setSaving(true);
    try {
      await api.patch(`/api/v1/organizations/${activeOrgId}`, data);
      await fetchData();
      await loadSuiteContext(activeOrgId);
      setToast({
        type: 'success',
        message: 'Settings saved successfully',
      });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string; error?: string } } })
          ?.response?.data?.message ??
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ??
        (err instanceof Error ? err.message : String(err));
      setToast({
        type: 'error',
        message: message || 'Failed to save settings',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleArchiveOrganization = async () => {
    if (!activeOrgId || !organization) return;

    if (
      !window.confirm(
        `Archive "${organization.name}"? Members will lose access. This can be undone.`,
      )
    ) {
      return;
    }

    setSaving(true);
    try {
      await api.delete(`/api/v1/organizations/${activeOrgId}`);
      setToast({
        type: 'success',
        message: 'Organization archived',
      });

      localStorage.removeItem('suiteContext');
      localStorage.removeItem('activeOrganization');
      localStorage.removeItem('activeOrganizationDetail');
      localStorage.removeItem('branches');
      localStorage.removeItem('activeBranch');

      setTimeout(() => {
        router.push('/onboarding/select-organization');
      }, 1200);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string; error?: string } } })
          ?.response?.data?.message ??
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ??
        (err instanceof Error ? err.message : String(err));
      setToast({
        type: 'error',
        message: message || 'Failed to archive organization',
      });
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
// LOGO UPLOAD
// ============================================================

const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  // Reset input so selecting the same file again still fires change.
  e.target.value = '';
  if (!file || !activeOrgId || !organization) return;

  // ---- Client-side validation ----
  if (!ALLOWED_TYPES.includes(file.type)) {
    setToast({
      type: 'error',
      message: 'Please choose a PNG, JPG, or WebP image.',
    });
    return;
  }
  if (file.size > MAX_LOGO_BYTES) {
    setToast({
      type: 'error',
      message: 'Image is too large. Max 2 MB.',
    });
    return;
  }

  setUploadingLogo(true);
  const previousPublicId = organization.logoPublicId ?? null;

  try {
    // 1. Get signature
    const sigRes = await api.post(
      `/api/v1/organizations/${activeOrgId}/uploads/signature`,
      { kind: 'logo' },
    );
    const { signature, timestamp, apiKey, publicId, uploadUrl } = sigRes.data;

    // 2. Upload directly to Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', String(timestamp));
    formData.append('signature', signature);
    formData.append('public_id', publicId);

    const cloudRes = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!cloudRes.ok) {
      const errBody = await cloudRes.text().catch(() => '');
      console.error('Cloudinary upload failed:', cloudRes.status, errBody);
      throw new Error('Upload failed. Please try again.');
    }

    const { secure_url, public_id } = await cloudRes.json();

    // 3. Save URL + publicId on the org
    await api.patch(`/api/v1/organizations/${activeOrgId}`, {
      logo: secure_url,
      logoPublicId: public_id,
    });

    // 4. Clean up the previous asset (best-effort)
    if (previousPublicId && previousPublicId !== public_id) {
      try {
        await api.delete(`/api/v1/organizations/${activeOrgId}/uploads`, {
          data: { publicId: previousPublicId },
        });
      } catch (cleanupErr) {
        console.warn('Failed to delete previous logo:', cleanupErr);
      }
    }

    // 5. Update local state
    setOrganization({
      ...organization,
      logo: secure_url,
      logoPublicId: public_id,
    });
    await loadSuiteContext(activeOrgId);

    setToast({ type: 'success', message: 'Logo updated' });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to upload logo';
    setToast({ type: 'error', message });
  } finally {
    setUploadingLogo(false);
  }
};

const handleLogoRemove = async () => {
  if (!activeOrgId || !organization || !organization.logoPublicId) return;

  if (!window.confirm('Remove the current logo?')) return;

  setUploadingLogo(true);
  const publicId = organization.logoPublicId;

  try {
    await api.patch(`/api/v1/organizations/${activeOrgId}`, {
      logo: null,
      logoPublicId: null,
    });

    try {
      await api.delete(`/api/v1/organizations/${activeOrgId}/uploads`, {
        data: { publicId },
      });
    } catch (cleanupErr) {
      console.warn('Failed to delete logo asset:', cleanupErr);
    }

    setOrganization({ ...organization, logo: null, logoPublicId: null });
    await loadSuiteContext(activeOrgId);

    setToast({ type: 'success', message: 'Logo removed' });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to remove logo';
    setToast({ type: 'error', message });
  } finally {
    setUploadingLogo(false);
  }
};

  // ============================================================
  // GATES
  // ============================================================

  if (!isReady) return null;

  if (!canView) {
    return (
      <div className={styles.page}>
        <div className={styles.noAccess}>
          <Lock size={40} />
          <h2>Settings are restricted</h2>
          <p>
            Only members with the Settings permission can view this page. Ask
            your organization owner for access.
          </p>
        </div>
      </div>
    );
  }

  if (loading) return <SettingsSkeleton />;

  if (!organization) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyState}>
          <Building2 size={40} />
          <h3>Organization not found</h3>
          <p>Please select an organization first.</p>
        </div>
      </div>
    );
  }

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
      <div className={styles.orgHeader}>
        <div className={styles.orgIdentity}>
          <span className={styles.orgAvatar}>
            <Settings size={22} />
          </span>
          <div>
            <div className={styles.orgNameRow}>
              <h1 className={styles.orgName}>Settings</h1>
              <span className={styles.orgBadge}>{organization.name}</span>
            </div>
            <div className={styles.orgMeta}>
              Manage your organization and preferences
            </div>
          </div>
        </div>
      </div>

      {/* ===== READ-ONLY BANNER ===== */}
      {!canManage && (
        <div className={styles.readOnlyBanner}>
          <Shield size={14} />
          <span>
            You can view these settings, but only the organization owner can
            change them.
          </span>
        </div>
      )}

      {/* ===== ORGANIZATION ===== */}
      <section className={styles.settingsCard}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>
            <Building2 size={16} />
            Organization
          </h2>
          {canManage && (
            <button
              className={styles.saveButton}
              onClick={() =>
                handleUpdateOrg({
                  name: organization.name,
                  logo: organization.logo,
                  email: organization.email,
                  phone: organization.phone,
                  address: organization.address,
                  country: organization.country,
                  currency: organization.currency,
                  timezone: organization.timezone,
                })
              }
              disabled={saving}
            >
              {saving ? (
                <Loader2 size={14} className={styles.spinning} />
              ) : (
                <Save size={14} />
              )}
              {saving ? 'Saving…' : 'Save'}
            </button>
          )}
        </div>

        <div className={styles.settingGroup}>
          {/* Name */}
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <label>Organization name</label>
              <span className={styles.settingDescription}>
                Display name used across every product
              </span>
            </div>
            <input
              type="text"
              className={styles.settingInput}
              value={organization.name || ''}
              onChange={(e) =>
                setOrganization({ ...organization, name: e.target.value })
              }
              disabled={!canManage}
            />
          </div>

{/* Logo */}
<div className={styles.settingRow}>
  <div className={styles.settingInfo}>
    <label>
      <ImageIcon size={13} className={styles.labelIcon} />
      Logo
    </label>
    <span className={styles.settingDescription}>
      Square image, 512×512 recommended. PNG, JPG, or WebP up to 2 MB.
    </span>
  </div>
  <div className={styles.logoRow}>
    <div className={styles.logoPreview}>
      {organization.logo ? (
        <Image
          src={organization.logo}
          alt="Logo"
          width={48}
          height={48}
          className={styles.logoImage}
          unoptimized
        />
      ) : (
        <span className={styles.logoPlaceholder}>
          {organization.name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>

    <input
      ref={logoInputRef}
      type="file"
      accept="image/png,image/jpeg,image/webp"
      className={styles.hiddenFileInput}
      onChange={handleLogoUpload}
      disabled={!canManage || uploadingLogo}
    />

    <button
      type="button"
      className={styles.logoButton}
      onClick={() => logoInputRef.current?.click()}
      disabled={!canManage || uploadingLogo}
    >
      {uploadingLogo ? (
        <>
          <Loader2 size={13} className={styles.spinning} />
          Uploading…
        </>
      ) : (
        <>
          <Upload size={13} />
          {organization.logo ? 'Replace' : 'Upload'}
        </>
      )}
    </button>

    {organization.logo && canManage && !uploadingLogo && (
      <button
        type="button"
        className={styles.logoRemoveButton}
        onClick={handleLogoRemove}
        title="Remove logo"
      >
        <X size={13} />
      </button>
    )}
  </div>
</div>

          {/* Email */}
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <label>
                <Mail size={13} className={styles.labelIcon} />
                Email
              </label>
              <span className={styles.settingDescription}>
                Primary contact email
              </span>
            </div>
            <input
              type="email"
              className={styles.settingInput}
              value={organization.email || ''}
              onChange={(e) =>
                setOrganization({ ...organization, email: e.target.value })
              }
              disabled={!canManage}
            />
          </div>

          {/* Phone */}
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <label>
                <Phone size={13} className={styles.labelIcon} />
                Phone
              </label>
              <span className={styles.settingDescription}>
                Primary contact number
              </span>
            </div>
            <input
              type="tel"
              className={styles.settingInput}
              value={organization.phone || ''}
              onChange={(e) =>
                setOrganization({ ...organization, phone: e.target.value })
              }
              disabled={!canManage}
            />
          </div>

          {/* Address */}
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <label>
                <MapPin size={13} className={styles.labelIcon} />
                Address
              </label>
              <span className={styles.settingDescription}>
                Physical business address
              </span>
            </div>
            <input
              type="text"
              className={styles.settingInput}
              value={organization.address || ''}
              onChange={(e) =>
                setOrganization({ ...organization, address: e.target.value })
              }
              disabled={!canManage}
            />
          </div>
        </div>
      </section>

      {/* ===== PREFERENCES ===== */}
      <section className={styles.settingsCard}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>
            <Globe size={16} />
            Preferences
          </h2>
          {canManage && (
            <button
              className={styles.saveButton}
              onClick={() =>
                handleUpdateOrg({
                  country: organization.country,
                  currency: organization.currency,
                  timezone: organization.timezone,
                })
              }
              disabled={saving}
            >
              {saving ? (
                <Loader2 size={14} className={styles.spinning} />
              ) : (
                <Save size={14} />
              )}
              {saving ? 'Saving…' : 'Save'}
            </button>
          )}
        </div>

        <div className={styles.settingGroup}>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <label>Country</label>
              <span className={styles.settingDescription}>
                Used for tax and default settings
              </span>
            </div>
            <select
              className={styles.settingSelect}
              value={organization.country || 'KE'}
              onChange={(e) =>
                setOrganization({ ...organization, country: e.target.value })
              }
              disabled={!canManage}
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
              <span className={styles.settingDescription}>
                Applies to prices, receipts, and reports
              </span>
            </div>
            <select
              className={styles.settingSelect}
              value={organization.currency || 'KES'}
              onChange={(e) =>
                setOrganization({ ...organization, currency: e.target.value })
              }
              disabled={!canManage}
            >
              <option value="KES">KES — Kenyan Shilling</option>
              <option value="UGX">UGX — Ugandan Shilling</option>
              <option value="TZS">TZS — Tanzanian Shilling</option>
              <option value="RWF">RWF — Rwandan Franc</option>
              <option value="NGN">NGN — Nigerian Naira</option>
              <option value="ZAR">ZAR — South African Rand</option>
              <option value="USD">USD — US Dollar</option>
            </select>
          </div>

          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <label>Timezone</label>
              <span className={styles.settingDescription}>
                Used for reports and scheduled jobs
              </span>
            </div>
            <select
              className={styles.settingSelect}
              value={organization.timezone || 'Africa/Nairobi'}
              onChange={(e) =>
                setOrganization({ ...organization, timezone: e.target.value })
              }
              disabled={!canManage}
            >
              <option value="Africa/Nairobi">Africa/Nairobi</option>
              <option value="Africa/Kampala">Africa/Kampala</option>
              <option value="Africa/Dar_es_Salaam">
                Africa/Dar_es_Salaam
              </option>
              <option value="Africa/Kigali">Africa/Kigali</option>
              <option value="Africa/Lagos">Africa/Lagos</option>
              <option value="Africa/Johannesburg">Africa/Johannesburg</option>
            </select>
          </div>
        </div>
      </section>

      {/* ===== DATA RETENTION ===== */}
      <section className={styles.settingsCard}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>
            <Database size={16} />
            Data retention
          </h2>
          {canManage && (
            <button
              className={styles.saveButton}
              onClick={() =>
                handleUpdateOrg({
                  auditLogRetention: organization.auditLogRetention,
                })
              }
              disabled={saving}
            >
              {saving ? (
                <Loader2 size={14} className={styles.spinning} />
              ) : (
                <Save size={14} />
              )}
              {saving ? 'Saving…' : 'Save'}
            </button>
          )}
        </div>

        <div className={styles.settingGroup}>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <label>Audit log retention</label>
              <span className={styles.settingDescription}>
                How long audit events are kept. Older events are purged daily
                at 03:00.
              </span>
            </div>
            <select
              className={styles.settingSelect}
              value={organization.auditLogRetention ?? 45}
              onChange={(e) =>
                setOrganization({
                  ...organization,
                  auditLogRetention: Number(e.target.value),
                })
              }
              disabled={!canManage}
            >
              {ALLOWED_RETENTION.map((days) => (
                <option key={days} value={days}>
                  {days} days
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ===== DANGER ZONE ===== */}
      {canManage && (
        <section className={`${styles.settingsCard} ${styles.dangerCard}`}>
          <div className={styles.cardHeader}>
            <h2 className={`${styles.cardTitle} ${styles.dangerTitle}`}>
              <AlertTriangle size={16} />
              Danger zone
            </h2>
          </div>

          <div className={styles.dangerItem}>
            <div className={styles.dangerInfo}>
              <h3>Archive organization</h3>
              <p>
                Members will lose access. Data is preserved and can be
                restored.
              </p>
            </div>
            <button
              className={styles.dangerButton}
              onClick={handleArchiveOrganization}
              disabled={saving}
            >
              {saving ? (
                <Loader2 size={14} className={styles.spinning} />
              ) : (
                'Archive'
              )}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}