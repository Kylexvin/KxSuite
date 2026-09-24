// app/dashboard/branches/page.tsx

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/axios';
import { AxiosError } from 'axios';
import {
  Building2,
  Plus,
  X,
  Edit2,
  Check,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  Users,
  Search,
  Archive,
  RefreshCw,
  Loader2,
  Crown,
} from 'lucide-react';
import styles from './page.module.css';

// ============================================================
// TYPES
// ============================================================

type Role = {
  id: string;
  name: string;
  description?: string;
};

type BranchMember = {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  roleId: string | null;
  isActive: boolean;
  joinedAt: string;
};

type Assignment = {
  id: string;
  membershipId: string;
  branchId: string;
  createdAt: string;
  updatedAt: string;
  membership: {
    id: string;
    userId: string;
    organizationId: string;
    roleId: string | null;
    isActive: boolean;
    joinedAt: string;
    hasAllBranches: boolean;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
    };
  };
};

type Branch = {
  id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  assignments: Assignment[];
  _count: {
    assignments: number;
  };
};

type BranchFormData = {
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
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
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <Check size={16} />,
    error: <AlertCircle size={16} />,
    info: <AlertCircle size={16} />,
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

function BranchesSkeleton() {
  return (
    <div className={styles.page} aria-busy="true" aria-live="polite">
      <span className={styles.srOnly}>Loading branches…</span>

      <div className={styles.orgHeader}>
        <div className={styles.orgIdentity}>
          <SkeletonBlock className={styles.skeletonAvatarLg} />
          <div style={{ flex: 1 }}>
            <SkeletonBlock className={styles.skeletonTitle} />
            <SkeletonBlock className={styles.skeletonSubtitle} />
          </div>
        </div>
        <SkeletonBlock className={styles.skeletonButton} />
      </div>

      <div className={styles.coverageCard}>
        <div className={styles.coverageHeader}>
          <SkeletonBlock className={styles.skeletonLabel} />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBlock key={`c-${i}`} className={styles.skeletonCoverageRow} />
        ))}
      </div>

      <div className={styles.filtersBar}>
        <SkeletonBlock className={styles.skeletonSearch} />
        <SkeletonBlock className={styles.skeletonFilter} />
      </div>

      <div className={styles.branchGrid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={`b-${i}`} className={styles.skeletonCard}>
            <SkeletonBlock className={styles.skeletonLine} />
            <SkeletonBlock className={styles.skeletonLineShort} />
            <SkeletonBlock className={styles.skeletonCardBody} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function BranchesPage() {
  const { activeOrganization, loadSuiteContext } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'ACTIVE' | 'INACTIVE'
  >('ALL');
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);

  const [formData, setFormData] = useState<BranchFormData>({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
  });

  // ============================================================
  // FETCH
  // ============================================================

  const refreshData = useCallback(async () => {
    if (!activeOrganization) return;
    try {
      const orgId = activeOrganization.id;
      const res = await api.get(`/api/v1/organizations/${orgId}/branches`);
      const items = res.data.items ?? res.data.branches ?? [];
      setBranches(items);
    } catch (err) {
      console.error('Failed to fetch branches:', err);
      setToast({ type: 'error', message: 'Failed to load branches' });
    }
  }, [activeOrganization]);

  const refreshRoles = useCallback(async () => {
    if (!activeOrganization) return;
    try {
      const orgId = activeOrganization.id;
      const res = await api.get(`/api/v1/organizations/${orgId}/roles`);
      setRoles(res.data.roles ?? []);
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    }
  }, [activeOrganization]);

  // ============================================================
  // EFFECT
  // ============================================================

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!activeOrganization) return;
      setLoading(true);
      try {
        const orgId = activeOrganization.id;
        const [branchesRes, rolesRes] = await Promise.all([
          api.get(`/api/v1/organizations/${orgId}/branches`),
          api.get(`/api/v1/organizations/${orgId}/roles`),
        ]);
        if (!isMounted) return;
        const items =
          branchesRes.data.items ?? branchesRes.data.branches ?? [];
        setBranches(items);
        setRoles(rolesRes.data.roles ?? []);
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load branches:', err);
          setToast({ type: 'error', message: 'Failed to load branches' });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [activeOrganization]);

  // ============================================================
  // DERIVED
  // ============================================================

  const totalBranches = branches.length;
  const activeBranches = branches.filter((b) => b.isActive).length;
  const totalAssigned = branches.reduce(
    (sum, b) => sum + (b._count?.assignments ?? 0),
    0,
  );
  const unassignedBranches = branches.filter(
    (b) => b.isActive && (b._count?.assignments ?? 0) === 0,
  ).length;

  // Team coverage: only active branches with members, sorted desc.
  const coverage = useMemo(() => {
    return branches
      .filter((b) => b.isActive)
      .map((b) => ({
        id: b.id,
        name: b.name,
        code: b.code,
        members: b._count?.assignments ?? 0,
      }))
      .sort((a, b) => b.members - a.members);
  }, [branches]);

  const maxMembers = Math.max(1, ...coverage.map((c) => c.members));

  const filteredBranches = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return branches.filter((branch) => {
      const matchesSearch =
        branch.name.toLowerCase().includes(q) ||
        branch.code.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && branch.isActive) ||
        (statusFilter === 'INACTIVE' && !branch.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [branches, searchQuery, statusFilter]);

  const roleById = useMemo(() => {
    const map = new Map<string, Role>();
    roles.forEach((r) => map.set(r.id, r));
    return map;
  }, [roles]);

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrganization) return;
    setSaving(true);
    try {
      await api.post(
        `/api/v1/organizations/${activeOrganization.id}/branches`,
        formData,
      );
      await loadSuiteContext(activeOrganization.id);
      await refreshData();
      setToast({ type: 'success', message: 'Branch created' });
      setShowCreateModal(false);
      setFormData({ name: '', code: '', address: '', phone: '', email: '' });
    } catch (err) {
      setToast({
        type: 'error',
        message: getErrorMessage(err, 'Failed to create branch'),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrganization || !selectedBranch) return;
    setSaving(true);
    try {
      await api.patch(
        `/api/v1/organizations/${activeOrganization.id}/branches/${selectedBranch.id}`,
        formData,
      );
      await refreshData();
      setToast({ type: 'success', message: 'Branch updated' });
      setShowEditModal(false);
      setSelectedBranch(null);
      setFormData({ name: '', code: '', address: '', phone: '', email: '' });
    } catch (err) {
      setToast({
        type: 'error',
        message: getErrorMessage(err, 'Failed to update branch'),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBranchStatus = async () => {
    if (!activeOrganization || !selectedBranch) return;
    setSaving(true);
    try {
      await api.patch(
        `/api/v1/organizations/${activeOrganization.id}/branches/${selectedBranch.id}`,
        { isActive: !selectedBranch.isActive },
      );
      await refreshData();
      setToast({
        type: 'success',
        message: selectedBranch.isActive ? 'Branch archived' : 'Branch restored',
      });
      setShowArchiveModal(false);
      setSelectedBranch(null);
    } catch (err) {
      setToast({
        type: 'error',
        message: getErrorMessage(err, 'Failed to update branch'),
      });
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (branch: Branch) => {
    setSelectedBranch(branch);
    setFormData({
      name: branch.name,
      code: branch.code,
      address: branch.address ?? '',
      phone: branch.phone ?? '',
      email: branch.email ?? '',
    });
    setShowEditModal(true);
  };

  const openArchiveModal = (branch: Branch) => {
    if (branch.isDefault) {
      setToast({
        type: 'error',
        message: 'The default branch cannot be archived',
      });
      return;
    }
    setSelectedBranch(branch);
    setShowArchiveModal(true);
  };

  const openMembersModal = (branch: Branch) => {
    setSelectedBranch(branch);
    setShowMembersModal(true);
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) return <BranchesSkeleton />;

  const hasZeroBranches = totalBranches === 0;
  const hasOneBranch = totalBranches === 1;

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
            <Building2 size={24} />
          </span>
          <div>
            <div className={styles.orgNameRow}>
              <h1 className={styles.orgName}>Branches</h1>
              <span className={`${styles.statusPill} ${styles.statusActive}`}>
                {totalBranches} total
              </span>
            </div>
            <div className={styles.orgMeta}>
              Locations where your organization operates
            </div>
          </div>
        </div>
        <button
          className={styles.primaryButton}
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={16} />
          Add Branch
        </button>
      </div>

      {/* ===== METRICS ===== */}
      {!hasZeroBranches && (
        <div className={styles.metricsRow}>
          <div className={styles.metricCard}>
            <span className={styles.metricValue}>{totalBranches}</span>
            <span className={styles.metricLabel}>Branches</span>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricValue}>{activeBranches}</span>
            <span className={styles.metricLabel}>Active</span>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricValue}>{totalAssigned}</span>
            <span className={styles.metricLabel}>Team members assigned</span>
          </div>
          <div
            className={`${styles.metricCard} ${
              unassignedBranches > 0 ? styles.metricCardWarn : ''
            }`}
          >
            <span className={styles.metricValue}>{unassignedBranches}</span>
            <span className={styles.metricLabel}>Unassigned branches</span>
          </div>
        </div>
      )}

      {/* ===== TEAM COVERAGE ===== */}
      {coverage.length > 0 && (
        <div className={styles.coverageCard}>
          <div className={styles.coverageHeader}>
            <div className={styles.coverageTitle}>
              <Users size={15} />
              <span>Team coverage</span>
            </div>
            <span className={styles.coverageMeta}>
              Members per active branch
            </span>
          </div>
          <div className={styles.coverageList}>
            {coverage.map((c) => {
              const percent = (c.members / maxMembers) * 100;
              return (
                <div key={c.id} className={styles.coverageRow}>
                  <span className={styles.coverageName}>{c.name}</span>
                  <div className={styles.coverageTrack}>
                    <div
                      className={styles.coverageFill}
                      style={{ width: `${Math.max(percent, 3)}%` }}
                    />
                  </div>
                  <span className={styles.coverageValue}>
                    {c.members} member{c.members === 1 ? '' : 's'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== EMPTY: ZERO BRANCHES ===== */}
      {hasZeroBranches && (
        <div className={styles.friendlyEmpty}>
          <div className={styles.friendlyEmptyIcon}>
            <Building2 size={28} />
          </div>
          <h3>No branches yet</h3>
          <p>
            Add your first branch to organize where your team operates. Every
            organization needs at least one.
          </p>
          <button
            className={styles.primaryButton}
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={16} />
            Add your first branch
          </button>
        </div>
      )}

      {/* ===== ONE BRANCH BANNER ===== */}
      {hasOneBranch && (
        <div className={styles.softBanner}>
          <span>
            You&apos;re running a single branch. Add more as you grow.
          </span>
          <button
            className={styles.bannerLink}
            onClick={() => setShowCreateModal(true)}
          >
            Add branch →
          </button>
        </div>
      )}

      {/* ===== FILTERS ===== */}
      {!hasZeroBranches && (
        <div className={styles.filtersBar}>
          <div className={styles.searchWrap}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search branches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className={styles.filterGroup}>
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as typeof statusFilter)
              }
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Archived</option>
            </select>
          </div>
        </div>
      )}

      {/* ===== BRANCH GRID ===== */}
      {!hasZeroBranches && (
        <div className={styles.branchGrid}>
          {filteredBranches.length === 0 ? (
            <div className={styles.emptyState}>
              <Building2 size={48} className={styles.emptyIcon} />
              <h3>No branches match your filters</h3>
              <p>Try adjusting your search or filters.</p>
            </div>
          ) : (
            filteredBranches.map((branch) => {
              const memberCount = branch._count?.assignments ?? 0;
              return (
                <article
                  key={branch.id}
                  className={`${styles.branchCard} ${
                    !branch.isActive ? styles.branchCardArchived : ''
                  }`}
                >
                  {/* Top: name + status */}
                  <div className={styles.branchCardTop}>
                    <div className={styles.branchCardTitleRow}>
                      <span className={styles.branchName}>{branch.name}</span>
                      {branch.isDefault && (
                        <span className={styles.defaultBadge}>
                          <Crown size={10} />
                          Default
                        </span>
                      )}
                    </div>
                    <span
                      className={`${styles.statusPill} ${
                        branch.isActive
                          ? styles.statusActive
                          : styles.statusInactive
                      }`}
                    >
                      {branch.isActive ? 'Active' : 'Archived'}
                    </span>
                  </div>

                  {/* Code */}
                  <div className={styles.branchCode}>{branch.code}</div>

                  {/* Members */}
                  <div className={styles.branchMembers}>
                    <Users size={13} />
                    <span>
                      {memberCount} member{memberCount === 1 ? '' : 's'}
                    </span>
                    {memberCount === 0 && (
                      <span className={styles.noMembersPill}>
                        No one assigned
                      </span>
                    )}
                  </div>

                  {/* Address (only if present) */}
                  {branch.address && (
                    <div className={styles.branchAddress}>
                      <MapPin size={12} />
                      <span>{branch.address}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className={styles.branchActions}>
                    <button
                      className={styles.actionButtonPrimary}
                      onClick={() => openMembersModal(branch)}
                    >
                      <Users size={13} />
                      View members
                    </button>
                    <button
                      className={styles.actionButtonIcon}
                      onClick={() => openEditModal(branch)}
                      title="Edit branch"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      className={`${styles.actionButtonIcon} ${
                        branch.isActive
                          ? styles.actionButtonDanger
                          : styles.actionButtonRestore
                      }`}
                      onClick={() => openArchiveModal(branch)}
                      disabled={branch.isDefault}
                      title={
                        branch.isDefault
                          ? 'The default branch cannot be archived'
                          : branch.isActive
                          ? 'Archive branch'
                          : 'Restore branch'
                      }
                    >
                      {branch.isActive ? (
                        <Archive size={14} />
                      ) : (
                        <RefreshCw size={14} />
                      )}
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}

      {/* ===== CREATE MODAL ===== */}
      {showCreateModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowCreateModal(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <Plus size={20} />
                Add Branch
              </h2>
              <button
                className={styles.modalClose}
                onClick={() => setShowCreateModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Branch name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Nairobi CBD"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Branch code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder="e.g. NBO"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Street, city"
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+254..."
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="branch@company.com"
                  />
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 size={16} className={styles.spinning} />
                  ) : (
                    <Check size={16} />
                  )}
                  Create Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== EDIT MODAL ===== */}
      {showEditModal && selectedBranch && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowEditModal(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <Edit2 size={20} />
                Edit Branch
              </h2>
              <button
                className={styles.modalClose}
                onClick={() => setShowEditModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateBranch} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Branch name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Branch code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 size={16} className={styles.spinning} />
                  ) : (
                    <Check size={16} />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== ARCHIVE MODAL ===== */}
      {showArchiveModal && selectedBranch && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowArchiveModal(false)}
        >
          <div
            className={`${styles.modal} ${styles.modalDanger}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {selectedBranch.isActive ? (
                  <Archive size={20} />
                ) : (
                  <RefreshCw size={20} />
                )}
                {selectedBranch.isActive ? 'Archive Branch' : 'Restore Branch'}
              </h2>
              <button
                className={styles.modalClose}
                onClick={() => setShowArchiveModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.deleteContent}>
              <div className={styles.deleteIcon}>
                {selectedBranch.isActive ? (
                  <Archive size={48} />
                ) : (
                  <RefreshCw size={48} />
                )}
              </div>
              <h3>Are you sure?</h3>
              <p>
                {selectedBranch.isActive
                  ? `This will archive "${selectedBranch.name}". Members will lose access to this branch.`
                  : `This will restore "${selectedBranch.name}" and make it active again.`}
              </p>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setShowArchiveModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={
                  selectedBranch.isActive
                    ? styles.deleteButton
                    : styles.restoreButton
                }
                onClick={handleToggleBranchStatus}
                disabled={saving}
              >
                {saving && <Loader2 size={16} className={styles.spinning} />}
                {selectedBranch.isActive ? 'Archive Branch' : 'Restore Branch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MEMBERS MODAL ===== */}
      {showMembersModal && selectedBranch && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowMembersModal(false)}
        >
          <div
            className={styles.modalLarge}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <Users size={20} />
                Members — {selectedBranch.name}
              </h2>
              <button
                className={styles.modalClose}
                onClick={() => setShowMembersModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            {selectedBranch.assignments.length === 0 ? (
              <div className={styles.emptyMemberState}>
                <Users size={48} className={styles.emptyIcon} />
                <h4>No members assigned</h4>
                <p>
                  Assign members to this branch from the Members page.
                </p>
              </div>
            ) : (
              <div className={styles.membersList}>
                <div className={styles.membersListHeader}>
                  <span>Name</span>
                  <span>Role</span>
                  <span>Status</span>
                </div>
                {selectedBranch.assignments.map((a) => {
                  const m = a.membership;
                  const role = m.roleId ? roleById.get(m.roleId) : null;
                  return (
                    <div key={a.id} className={styles.membersListItem}>
                      <div className={styles.memberInfo}>
                        <div className={styles.memberAvatarSmall}>
                          {m.user.firstName?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className={styles.memberName}>
                            {m.user.firstName} {m.user.lastName}
                          </div>
                          <div className={styles.memberEmail}>
                            {m.user.email}
                          </div>
                        </div>
                      </div>
                      <span className={styles.memberRole}>
                        {role?.name ?? (m.hasAllBranches ? 'Owner' : 'No Role')}
                      </span>
                      <span className={styles.memberStatus}>
                        <span
                          className={`${styles.statusPill} ${
                            m.isActive
                              ? styles.statusActive
                              : styles.statusInactive
                          }`}
                        >
                          {m.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setShowMembersModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}