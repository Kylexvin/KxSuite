// app/kx/kxtill/staff/page.tsx

"use client";

import { useState, useEffect, useCallback} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/axios";
import {
  Users,
  Search,
  Shield,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  Crown,
} from "lucide-react";
import styles from "./page.module.css";

// ===== TYPES =====
type Permission = {
  id: string;
  key: string;
  name: string;
  productKey: string;
};

type Branch = {
  id: string;
  name: string;
  code: string;
  isDefault: boolean;
};

type StaffMember = {
  userId: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  isActive: boolean;
  hasAllBranches: boolean;
  joinedAt: string;
  role: {
    id: string;
    name: string;
  } | null;
  permissions: Permission[];
  branches: Branch[];
};

type StaffStats = {
  total: number;
  active: number;
  inactive: number;
  owners: number;
  managers: number;
  staff: number;
};

type StaffResponse = {
  staff: StaffMember[];
  stats: StaffStats;
};

// ============================================================
// COMPONENTS
// ============================================================
function PermissionBadge({ permission }: { permission: string }) {
  const colors: Record<string, string> = {
    'view': styles.permissionView,
    'create': styles.permissionCreate,
    'update': styles.permissionUpdate,
    'delete': styles.permissionDelete,
    'approve': styles.permissionApprove,
    'export': styles.permissionExport,
    'refund': styles.permissionRefund,
    'manage': styles.permissionManage,
  };

  const color = colors[permission] || styles.permissionDefault;
  return <span className={`${styles.permissionBadge} ${color}`}>{permission}</span>;
}

function StaffStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={`${styles.statusPill} ${isActive ? styles.statusActive : styles.statusInactive}`}>
      {isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function KxTillStaffPage() {
  const { activeOrganization, suiteContext } = useAuth();
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [stats, setStats] = useState<StaffStats>({
    total: 0,
    active: 0,
    inactive: 0,
    owners: 0,
    managers: 0,
    staff: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const permissions = suiteContext?.permissions ?? [];
  const isOwner = permissions.includes("*");
  const canViewStaff = isOwner || permissions.includes("kxtill.staff.view");

  const orgId = activeOrganization?.id || "";

  // ============================================================
  // FETCH STAFF
  // ============================================================


  useEffect(() => {
    let isMounted = true;

    const loadStaff = async () => {
      if (!orgId) {
        if (isMounted) setLoading(false);
        return;
      }

      if (isMounted) {
        setLoading(true);
        setError(null);
      }

      try {
        const response = await api.get<StaffResponse>(
          `/api/v1/organizations/${orgId}/kxtill/staff`
        );

        if (!isMounted) return;

        setStaff(response.data.staff || []);
        setStats(response.data.stats || {
          total: 0,
          active: 0,
          inactive: 0,
          owners: 0,
          managers: 0,
          staff: 0,
        });
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to fetch KxTill staff:", err);
        setError("Failed to load staff data. Please try again.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadStaff();

    return () => {
      isMounted = false;
    };
  }, [orgId, refreshKey]);

  // ============================================================
  // FILTER STAFF
  // ============================================================

  const filteredStaff = staff.filter((member) => {
    const query = searchQuery.toLowerCase();
    const name = `${member.user.firstName} ${member.user.lastName}`.toLowerCase();
    const email = member.user.email.toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  // ============================================================
  // RENDER
  // ============================================================

  if (!canViewStaff) {
    return (
      <div className={styles.page}>
        <div className={styles.noAccess}>
          <Shield size={48} className={styles.noAccessIcon} />
          <h2>Access Denied</h2>
          <p>You don&apos;t have permission to view KxTill staff.</p>
          <p className={styles.noAccessSub}>Contact your organization owner for access.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loaderWrapper}>
          <div className={styles.loader} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.errorState}>
          <AlertCircle size={32} className={styles.errorIcon} />
          <p className={styles.errorText}>{error}</p>
          <button className={styles.retryBtn} onClick={() => setRefreshKey(prev => prev + 1)}>
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const contextName = activeOrganization?.name || "Organization";

  return (
    <div className={styles.page}>
      {/* ===== HEADER ===== */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <Users size={24} />
          </div>
          <div>
            <h1 className={styles.title}>KxTill Staff</h1>
            <p className={styles.subtitle}>
              View users with access to KxTill • {contextName}
            </p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.refreshBtn} onClick={() => setRefreshKey(prev => prev + 1)}>
            <RefreshCw size={16} />
          </button>
          <a href="/dashboard/members" className={styles.manageLink}>
            <Users size={14} />
            Manage Staff
          </a>
        </div>
      </div>

      {/* ===== STATS ===== */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.total}</div>
          <div className={styles.statLabel}>Total Staff</div>
        </div>
        <div className={`${styles.statCard} ${styles.statCardActive}`}>
          <div className={styles.statValue}>{stats.active}</div>
          <div className={styles.statLabel}>Active</div>
        </div>
        <div className={`${styles.statCard} ${styles.statCardInactive}`}>
          <div className={styles.statValue}>{stats.inactive}</div>
          <div className={styles.statLabel}>Inactive</div>
        </div>
        <div className={`${styles.statCard} ${styles.statCardOwner}`}>
          <div className={styles.statValue}>{stats.owners}</div>
          <div className={styles.statLabel}>Owners</div>
        </div>
        <div className={`${styles.statCard} ${styles.statCardManager}`}>
          <div className={styles.statValue}>{stats.managers}</div>
          <div className={styles.statLabel}>Managers</div>
        </div>
        <div className={`${styles.statCard} ${styles.statCardStaff}`}>
          <div className={styles.statValue}>{stats.staff}</div>
          <div className={styles.statLabel}>Staff</div>
        </div>
      </div>

      {/* ===== SEARCH ===== */}
      <div className={styles.filtersBar}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search staff by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ===== STAFF LIST ===== */}
      <div className={styles.staffCard}>
        <div className={styles.staffList}>
          <div className={styles.staffHeaders}>
            <span>Staff</span>
            <span>Role</span>
            <span>Branches</span>
            <span>Permissions</span>
            <span>Status</span>
          </div>

          {filteredStaff.length === 0 ? (
            <div className={styles.emptyState}>
              <Users size={48} className={styles.emptyIcon} />
              <h3>No staff found</h3>
              <p>
                {searchQuery
                  ? "Try adjusting your search"
                  : "No users have access to KxTill yet."}
              </p>
            </div>
          ) : (
            filteredStaff.map((member) => {
              const isOwnerStaff = member.permissions.some(p => p.key === "*");
              const hasManagePermissions = member.permissions.some(
                p => p.key.includes("manage") || p.key.includes("approve")
              );
              const hasAllBranches = member.hasAllBranches;
              const roleName = member.role?.name ||
                (isOwnerStaff ? "Owner" :
                hasManagePermissions ? "Manager" : "Staff");

              return (
                <div key={member.userId} className={styles.staffRow}>
                  <div className={styles.staffInfo}>
                    <div className={styles.staffAvatar}>
                      {member.user.firstName?.charAt(0) || "U"}
                    </div>
                    <div>
                      <div className={styles.staffName}>
                        {member.user.firstName} {member.user.lastName}
                        {isOwnerStaff && (
                          <span className={styles.ownerBadge}>
                            <Crown size={12} />
                            Owner
                          </span>
                        )}
                        {hasAllBranches && !isOwnerStaff && (
                          <span className={styles.allBranchesBadge}>All Branches</span>
                        )}
                      </div>
                      <div className={styles.staffEmail}>{member.user.email}</div>
                    </div>
                  </div>

                  <div className={styles.staffRole}>
                    <span className={`${styles.roleBadge} ${isOwnerStaff ? styles.roleOwner : hasManagePermissions ? styles.roleManager : styles.roleStaff}`}>
                      {roleName}
                    </span>
                  </div>

                  <div className={styles.staffBranches}>
                    {member.branches && member.branches.length > 0 ? (
                      <div className={styles.branchTags}>
                        {member.branches.slice(0, 2).map((branch) => (
                          <span key={branch.id} className={styles.branchTag}>
                            {branch.code}
                          </span>
                        ))}
                        {member.branches.length > 2 && (
                          <span className={styles.branchTagMore}>
                            +{member.branches.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className={styles.noBranches}>—</span>
                    )}
                  </div>

                  <div className={styles.staffPermissions}>
                    {member.permissions.slice(0, 4).map((p) => {
                      const permKey = p.key.split('.').pop() || '';
                      return <PermissionBadge key={p.id} permission={permKey} />;
                    })}
                    {member.permissions.length > 4 && (
                      <span className={styles.permissionMore}>
                        +{member.permissions.length - 4}
                      </span>
                    )}
                  </div>

                  <div className={styles.staffStatus}>
                    <StaffStatusBadge isActive={member.isActive} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <div className={styles.footer}>
        <span className={styles.footerText}>
          Staff management is handled at the organization level.
        </span>
        <a href="/dashboard/members" className={styles.footerLink}>
          Go to Members & Roles →
        </a>
      </div>
    </div>
  );
}