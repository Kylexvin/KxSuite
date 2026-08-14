// app/dashboard/members/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/axios";
import {
  Users,
  Shield,
  UserPlus,
  Loader2,
} from "lucide-react";
import styles from "./page.module.css";

// ============================================================
// TYPES
// ============================================================

type Permission = {
  id: string;
  key: string;
  name: string;
  productKey: string;
  description?: string;
};

type Role = {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  memberCount: number;
  createdAt: string;
};

type Branch = {
  id: string;
  name: string;
  code: string;
  isDefault: boolean;
};

type Member = {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  roleId: string | null;
  role: Role | null;
  branches: Branch[];
  isActive: boolean;
  hasAllBranches: boolean;
  joinedAt: string;
};

// ============================================================
// COMPONENTS
// ============================================================

import MembersTab from "./components/MembersTab";
import RolesTab from "./components/RolesTab";

// ============================================================
// MAIN PAGE
// ============================================================

export default function MembersPage() {
  const { activeOrganization } = useAuth();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"members" | "roles">("members");

  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // ============================================================
  // FETCH DATA
  // ============================================================

  const fetchData = async () => {
    if (!activeOrganization) return;

    setLoading(true);
    try {
      const orgId = activeOrganization.id;

      const [membersRes, rolesRes, branchesRes, permissionsRes] = await Promise.all([
        api.get(`/api/v1/organizations/${orgId}/members`),
        api.get(`/api/v1/organizations/${orgId}/roles`),
        api.get(`/api/v1/organizations/${orgId}/branches`),
        api.get(`/api/v1/permissions`),
      ]);

      const membersData = membersRes.data.members || [];
      const rolesData = rolesRes.data.roles || [];
      const branchesData = branchesRes.data.items || [];
      const permissionsData = permissionsRes.data.permissions || [];

      setBranches(branchesData);
      setPermissions(permissionsData);

      // Fetch branch assignments for each member
      const membersWithBranches = await Promise.all(
        membersData.map(async (member: any) => {
          try {
            const branchRes = await api.get(
              `/api/v1/organizations/${orgId}/branches/members/${member.userId}/branches`
            );
            const role = rolesData.find((r: Role) => r.id === member.roleId) || null;
            return {
              ...member,
              role: role,
              branches: branchRes.data.branches || [],
            };
          } catch {
            return {
              ...member,
              role: null,
              branches: [],
            };
          }
        })
      );

      setMembers(membersWithBranches);

      const rolesWithCount = rolesData.map((role: Role) => ({
        ...role,
        memberCount: membersData.filter((m: any) => m.roleId === role.id).length,
      }));
      setRoles(rolesWithCount);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setToast({ type: "error", message: "Failed to load data" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeOrganization]);

  // ============================================================
  // STATS
  // ============================================================

  const totalMembers = members.length;
  const activeMembers = members.filter((m) => m.isActive).length;
  const totalRoles = roles.length;

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <Loader2 size={32} className={styles.spinner} />
          <p>Loading members...</p>
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
        <div className={`${styles.toast} ${toast.type === "success" ? styles.toastSuccess : styles.toastError}`}>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)}>×</button>
        </div>
      )}

      <div className={styles.orgHeader}>
        <div className={styles.orgIdentity}>
          <span className={styles.orgAvatar}>
            <Users size={24} />
          </span>
          <div>
            <div className={styles.orgNameRow}>
              <h1 className={styles.orgName}>Members & Roles</h1>
              <span className={`${styles.statusPill} ${styles.statusActive}`}>
                {totalMembers} members
              </span>
            </div>
            <div className={styles.orgMeta}>Manage organization members, roles, and branch access</div>
          </div>
        </div>
        <button
          className={styles.primaryButton}
          onClick={() => {
            if (activeTab === "members") {
              document.dispatchEvent(new CustomEvent("open-invite"));
            } else {
              document.dispatchEvent(new CustomEvent("open-create-role"));
            }
          }}
        >
          <UserPlus size={16} />
          {activeTab === "members" ? "Invite Member" : "Create Role"}
        </button>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{totalMembers}</div>
          <div className={styles.statLabel}>Total Members</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{activeMembers}</div>
          <div className={styles.statLabel}>Active</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{totalRoles}</div>
          <div className={styles.statLabel}>Roles</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{branches.length}</div>
          <div className={styles.statLabel}>Branches</div>
        </div>
      </div>

      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tabButton} ${activeTab === "members" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("members")}
        >
          <Users size={16} />
          Members
          <span className={styles.tabBadge}>{totalMembers}</span>
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === "roles" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("roles")}
        >
          <Shield size={16} />
          Roles
          <span className={styles.tabBadge}>{totalRoles}</span>
        </button>
      </div>

      {activeTab === "members" ? (
        <MembersTab members={members} roles={roles} branches={branches} onRefresh={fetchData} setToast={setToast} />
      ) : (
        <RolesTab roles={roles} permissions={permissions} branches={branches} onRefresh={fetchData} setToast={setToast} />
      )}
    </div>
  );
}