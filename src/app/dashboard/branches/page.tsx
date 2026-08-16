// app/dashboard/branches/page.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/axios";
import { AxiosError } from "axios";
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
  BarChart3,
  Activity,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import styles from "./page.module.css";

// ============================================================
// TYPES
// ============================================================

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
  members?: BranchMember[];
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

type BranchFormData = {
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
};

type ActivityItem = {
  branch: string;
  activity: number;
};

type ActivityData = {
  branchActivity: ActivityItem[];
};

type ChartDataItem = {
  name: string;
  value: number;
  color: string;
};

// ============================================================
// API ERROR TYPE
// ============================================================

type ApiErrorResponse = {
  message?: string;
  error?: string;
  [key: string]: unknown;
};

// ============================================================
// HELPER: Get error message from unknown error
// ============================================================

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse;
    return data?.message || data?.error || fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return fallback;
}


// ============================================================
// TOAST
// ============================================================

function Toast({ type, message, onClose }: { type: "success" | "error" | "info"; message: string; onClose: () => void }) {
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
// MAIN PAGE
// ============================================================

export default function BranchesPage() {
  const { activeOrganization, loadSuiteContext } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchMembers, setBranchMembers] = useState<BranchMember[]>([]);
  const [activityData, setActivityData] = useState<ActivityData | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // UI States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);

  // Form states
  const [formData, setFormData] = useState<BranchFormData>({
    name: "",
    code: "",
    address: "",
    phone: "",
    email: "",
  });

  // ============================================================
  // FETCH DATA
  // ============================================================

  const refreshData = useCallback(async () => {
    if (!activeOrganization) return;

    setLoading(true);
    try {
      const orgId = activeOrganization.id;

      const branchesRes = await api.get(`/api/v1/organizations/${orgId}/branches`);
      const branchesData = branchesRes.data.items || branchesRes.data.branches || [];
      
      const branchesWithMembers = await Promise.all(
        branchesData.map(async (branch: Branch) => {
          try {
            const membersRes = await api.get(
              `/api/v1/organizations/${orgId}/branches/${branch.id}/members`
            );
            return { ...branch, members: membersRes.data.members || [] };
          } catch {
            return { ...branch, members: [] };
          }
        })
      );
      setBranches(branchesWithMembers);
    } catch (err: unknown) {
      console.error("Failed to fetch branches:", err);
      setToast({ type: "error", message: "Failed to load branches. Please try again." });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setLoading(false);
    }
  }, [activeOrganization]);

  const fetchActivity = useCallback(async () => {
    if (!activeOrganization) return;
    setLoadingActivity(true);
    try {
      const res = await api.get(
        `/api/v1/organizations/${activeOrganization.id}/branches/activity?days=7`
      );
      setActivityData(res.data as ActivityData);
    } catch (err: unknown) {
      console.error("Failed to fetch activity:", err);
    } finally {
      setLoadingActivity(false);
    }
  }, [activeOrganization]);

  // ============================================================
  // EFFECT WITH ISMOUNTED FLAG
  // ============================================================

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!activeOrganization || !isMounted) return;

      setLoading(true);
      setLoadingActivity(true);
      
      try {
        const orgId = activeOrganization.id;

        // Fetch both in parallel for better performance
        const [branchesRes, activityRes] = await Promise.all([
          api.get(`/api/v1/organizations/${orgId}/branches`),
          api.get(`/api/v1/organizations/${orgId}/branches/activity?days=7`),
        ]);

        if (!isMounted) return;

        // Process branches
        const branchesData = branchesRes.data.items || branchesRes.data.branches || [];
        
        const branchesWithMembers = await Promise.all(
          branchesData.map(async (branch: Branch) => {
            try {
              const membersRes = await api.get(
                `/api/v1/organizations/${orgId}/branches/${branch.id}/members`
              );
              return { ...branch, members: membersRes.data.members || [] };
            } catch {
              return { ...branch, members: [] };
            }
          })
        );

        if (!isMounted) return;
        
        setBranches(branchesWithMembers);
        setActivityData(activityRes.data as ActivityData);
      } catch (err: unknown) {
        if (isMounted) {
          console.error("Failed to fetch data:", err);
          setToast({ type: "error", message: "Failed to load branches. Please try again." });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setLoadingActivity(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [activeOrganization]);

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrganization) return;

    setSaving(true);
    try {
      await api.post(`/api/v1/organizations/${activeOrganization.id}/branches`, formData);
      await loadSuiteContext(activeOrganization.id);
      await refreshData();
      await fetchActivity();
      setToast({ type: "success", message: "Branch created successfully" });
      setShowCreateModal(false);
      setFormData({ name: "", code: "", address: "", phone: "", email: "" });
      setTimeout(() => setToast(null), 3000);
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to create branch");
      setToast({
        type: "error",
        message,
      });
      setTimeout(() => setToast(null), 4000);
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
        formData
      );
      await refreshData();
      await fetchActivity();
      setToast({ type: "success", message: "Branch updated successfully" });
      setShowEditModal(false);
      setSelectedBranch(null);
      setFormData({ name: "", code: "", address: "", phone: "", email: "" });
      setTimeout(() => setToast(null), 3000);
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to update branch");
      setToast({
        type: "error",
        message,
      });
      setTimeout(() => setToast(null), 4000);
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
        { isActive: !selectedBranch.isActive }
      );
      await refreshData();
      await fetchActivity();
      setToast({
        type: "success",
        message: selectedBranch.isActive ? "Branch archived" : "Branch restored",
      });
      setShowArchiveModal(false);
      setSelectedBranch(null);
      setTimeout(() => setToast(null), 3000);
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to update branch status");
      setToast({
        type: "error",
        message,
      });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (branch: Branch) => {
    setSelectedBranch(branch);
    setFormData({
      name: branch.name,
      code: branch.code,
      address: branch.address || "",
      phone: branch.phone || "",
      email: branch.email || "",
    });
    setShowEditModal(true);
  };

  const openArchiveModal = (branch: Branch) => {
    setSelectedBranch(branch);
    setShowArchiveModal(true);
  };

  const openMembersModal = async (branch: Branch) => {
    if (!activeOrganization) return;
    
    setSelectedBranch(branch);
    setLoadingMembers(true);
    try {
      const membersRes = await api.get(
        `/api/v1/organizations/${activeOrganization.id}/branches/${branch.id}/members`
      );
      setBranchMembers(membersRes.data.members || []);
      setShowMembersModal(true);
    } catch {
      setToast({ type: "error", message: "Failed to load branch members" });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setLoadingMembers(false);
    }
  };

  // ============================================================
  // FILTERS
  // ============================================================

  const filteredBranches = branches.filter((branch) => {
    const matchesSearch = branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          branch.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" ||
                          (statusFilter === "ACTIVE" && branch.isActive) ||
                          (statusFilter === "INACTIVE" && !branch.isActive);
    return matchesSearch && matchesStatus;
  });

  // ============================================================
  // STATS
  // ============================================================

  const totalBranches = branches.length;
  const activeBranches = branches.filter(b => b.isActive).length;
  const inactiveBranches = branches.filter(b => !b.isActive).length;
  

  // Chart data
  const statusChartData: ChartDataItem[] = [
    { name: "Active", value: activeBranches, color: "#4caf82" },
    { name: "Archived", value: inactiveBranches, color: "#62636e" },
  ];

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <Loader2 size={32} className={styles.spinner} />
          <p>Loading branches...</p>
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
              Manage your organization&apos;s branches and locations
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

      {/* ===== CHARTS ROW (replaces stats) ===== */}
      <div className={styles.chartsRow}>
        {/* Bar Chart - Activity by Branch */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitle}>
              <BarChart3 size={16} />
              <span>Activity by Branch</span>
            </div>
            <span className={styles.chartBadge}>Last 7 days</span>
          </div>
          <div className={styles.chartBody}>
            {loadingActivity ? (
              <div className={styles.chartPlaceholder}>
                <Loader2 size={24} className={styles.spinner} />
                <span>Loading...</span>
              </div>
            ) : activityData && activityData.branchActivity.length > 0 ? (
              <div className={styles.barChart}>
                {activityData.branchActivity.map((item: ActivityItem) => {
                  const max = Math.max(...activityData.branchActivity.map((b: ActivityItem) => b.activity), 1);
                  const percent = (item.activity / max) * 100;
                  return (
                    <div key={item.branch} className={styles.barRow}>
                      <span className={styles.barLabel}>{item.branch}</span>
                      <div className={styles.barTrack}>
                        <div 
                          className={styles.barFill} 
                          style={{ width: `${Math.max(percent, 4)}%` }}
                        />
                      </div>
                      <span className={styles.barValue}>{item.activity}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.chartPlaceholder}>
                <Activity size={24} className={styles.chartPlaceholderIcon} />
                <span>No activity data</span>
              </div>
            )}
          </div>
        </div>

        {/* Donut Chart - Branch Status */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitle}>
              <PieChartIcon size={16} />
              <span>Branch Status</span>
            </div>
            <span className={styles.chartBadge}>
              {activeBranches} active
            </span>
          </div>
          <div className={styles.donutContainer}>
            {totalBranches > 0 ? (
              <>
                <div className={styles.donutWrapper}>
                  <ResponsiveContainer width={140} height={140}>
                    <PieChart>
                      <Pie 
                        data={statusChartData} 
                        dataKey="value" 
                        innerRadius={40} 
                        outerRadius={60} 
                        stroke="none"
                        paddingAngle={2}
                      >
                        {statusChartData.map((entry: ChartDataItem, index: number) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          background: "#1b1c23", 
                          border: "1px solid rgba(255,255,255,0.07)", 
                          borderRadius: "8px", 
                          fontSize: "12px" 
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className={styles.donutCenter}>
                    <span className={styles.donutValue}>{totalBranches}</span>
                    <span className={styles.donutLabel}>Total</span>
                  </div>
                </div>
                <div className={styles.donutLegend}>
                  {statusChartData.map((item: ChartDataItem) => (
                    <div key={item.name} className={styles.legendRow}>
                      <span className={styles.legendDot} style={{ background: item.color }} />
                      <span className={styles.legendName}>{item.name}</span>
                      <span className={styles.legendValue}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className={styles.chartPlaceholder}>
                <Building2 size={24} className={styles.chartPlaceholderIcon} />
                <span>No branches</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== FILTERS ===== */}
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
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Archived</option>
          </select>
        </div>
      </div>

      {/* ===== BRANCH GRID ===== */}
      <div className={styles.branchGrid}>
        {filteredBranches.length === 0 ? (
          <div className={styles.emptyState}>
            <Building2 size={48} className={styles.emptyIcon} />
            <h3>No branches found</h3>
            <p>Try adjusting your filters or add a new branch</p>
          </div>
        ) : (
          filteredBranches.map((branch) => (
            <div key={branch.id} className={styles.branchCard}>
              <div className={styles.branchCardHeader}>
                <div className={styles.branchCardTitle}>
                  <Building2 size={18} className={styles.branchIcon} />
                  <span className={styles.branchName}>{branch.name}</span>
                  {branch.isDefault && (
                    <span className={styles.defaultBadge}>Default</span>
                  )}
                </div>
                <span className={`${styles.statusPill} ${branch.isActive ? styles.statusActive : styles.statusInactive}`}>
                  {branch.isActive ? "Active" : "Archived"}
                </span>
              </div>

              <div className={styles.branchDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>
                    <MapPin size={14} />
                    Address
                  </span>
                  <span className={styles.detailValue}>{branch.address || "—"}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>
                    <Phone size={14} />
                    Phone
                  </span>
                  <span className={styles.detailValue}>{branch.phone || "—"}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>
                    <Mail size={14} />
                    Email
                  </span>
                  <span className={styles.detailValue}>{branch.email || "—"}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>
                    <Users size={14} />
                    Members
                  </span>
                  <span className={styles.detailValue}>{branch.members?.length || 0}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Code</span>
                  <span className={styles.detailValue}>{branch.code}</span>
                </div>
              </div>

              <div className={styles.branchActions}>
                <button
                  className={styles.actionButton}
                  onClick={() => openMembersModal(branch)}
                  title="View members"
                >
                  <Users size={14} />
                  Members
                </button>
                <button
                  className={styles.actionButton}
                  onClick={() => openEditModal(branch)}
                  title="Edit branch"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                  onClick={() => openArchiveModal(branch)}
                  title={branch.isActive ? "Archive branch" : "Restore branch"}
                >
                  {branch.isActive ? <Archive size={14} /> : <RefreshCw size={14} />}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ===== CREATE MODAL ===== */}
      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <Plus size={20} />
                Add Branch
              </h2>
              <button className={styles.modalClose} onClick={() => setShowCreateModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Branch Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter branch name"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Branch Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. KGL"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter address"
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Phone number"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Email address"
                  />
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelButton} onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitButton} disabled={saving}>
                  {saving ? <Loader2 size={16} className={styles.spinning} /> : <Check size={16} />}
                  Create Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== EDIT MODAL ===== */}
      {showEditModal && selectedBranch && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <Edit2 size={20} />
                Edit Branch
              </h2>
              <button className={styles.modalClose} onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateBranch} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Branch Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Branch Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelButton} onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitButton} disabled={saving}>
                  {saving ? <Loader2 size={16} className={styles.spinning} /> : <Check size={16} />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== ARCHIVE MODAL ===== */}
      {showArchiveModal && selectedBranch && (
        <div className={styles.modalOverlay} onClick={() => setShowArchiveModal(false)}>
          <div className={`${styles.modal} ${styles.modalDanger}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {selectedBranch.isActive ? <Archive size={20} /> : <RefreshCw size={20} />}
                {selectedBranch.isActive ? "Archive Branch" : "Restore Branch"}
              </h2>
              <button className={styles.modalClose} onClick={() => setShowArchiveModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.deleteContent}>
              <div className={styles.deleteIcon}>
                {selectedBranch.isActive ? <Archive size={48} /> : <RefreshCw size={48} />}
              </div>
              <h3>Are you sure?</h3>
              <p>
                {selectedBranch.isActive
                  ? `This will archive "${selectedBranch.name}". Members will lose access to this branch.`
                  : `This will restore "${selectedBranch.name}" and make it active again.`
                }
              </p>
            </div>

            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelButton} onClick={() => setShowArchiveModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className={selectedBranch.isActive ? styles.deleteButton : styles.restoreButton}
                onClick={handleToggleBranchStatus}
                disabled={saving}
              >
                {saving ? <Loader2 size={16} className={styles.spinning} /> : null}
                {selectedBranch.isActive ? "Archive Branch" : "Restore Branch"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MEMBERS MODAL ===== */}
      {showMembersModal && selectedBranch && (
        <div className={styles.modalOverlay} onClick={() => setShowMembersModal(false)}>
          <div className={styles.modalLarge} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <Users size={20} />
                Members - {selectedBranch.name}
              </h2>
              <button className={styles.modalClose} onClick={() => setShowMembersModal(false)}>
                <X size={20} />
              </button>
            </div>

            {loadingMembers ? (
              <div className={styles.loadingMembers}>
                <Loader2 size={24} className={styles.spinner} />
                <p>Loading members...</p>
              </div>
            ) : branchMembers.length === 0 ? (
              <div className={styles.emptyMemberState}>
                <Users size={48} className={styles.emptyIcon} />
                <h4>No members assigned</h4>
                <p>This branch has no members assigned yet.</p>
              </div>
            ) : (
              <div className={styles.membersList}>
                <div className={styles.membersListHeader}>
                  <span>Name</span>
                  <span>Email</span>
                  <span>Role</span>
                  <span>Status</span>
                </div>
                {branchMembers.map((member) => (
                  <div key={member.userId} className={styles.membersListItem}>
                    <div className={styles.memberInfo}>
                      <div className={styles.memberAvatarSmall}>
                        {member.user.firstName?.charAt(0) || "U"}
                      </div>
                      <span className={styles.memberName}>
                        {member.user.firstName} {member.user.lastName}
                      </span>
                    </div>
                    <span className={styles.memberEmail}>{member.user.email}</span>
                    <span className={styles.memberRole}>
                      {member.roleId ? "Assigned" : "No Role"}
                    </span>
                    <span className={styles.memberStatus}>
                      <span className={`${styles.statusPill} ${member.isActive ? styles.statusActive : styles.statusInactive}`}>
                        {member.isActive ? "Active" : "Inactive"}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelButton} onClick={() => setShowMembersModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}