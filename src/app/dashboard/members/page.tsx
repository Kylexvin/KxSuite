// app/dashboard/members/page.tsx

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/axios';
import {
  Users,
  Shield,
  UserPlus,
  Loader2,
} from 'lucide-react';
import styles from './page.module.css';
import MembersTab from './components/MembersTab';
import RolesTab from './components/RolesTab';
import InviteModal from './components/InviteModal';
import RoleModal from './components/RoleModal';

// ============================================================
// TYPES
// ============================================================

export type Permission = {
  id: string;
  key: string;
  name: string;
  productKey: string;
  description?: string;
};

export type RawPermission = {
  permission: Permission;
  roleId: string;
  permissionId: string;
};

export type Role = {
  id: string;
  name: string;
  key?: string;
  description: string;
  permissions: Permission[] | RawPermission[];
  memberCount: number;
  createdAt: string;
};

export type Branch = {
  id: string;
  name: string;
  code: string;
  isDefault: boolean;
};

export type Member = {
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

export type Invitation = {
  id: string;
  email: string;
  organizationId: string;
  invitedById: string;
  roleId: string | null;
  token: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
  invitedBy: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
};

// ============================================================
// API SHAPES
// ============================================================

type MembersApiResponse = { members: Member[] };
type RolesApiResponse = { roles: Role[] };
type BranchesApiResponse = { items: Branch[] };
type PermissionsApiResponse = { permissions: Permission[] };
type MemberBranchesApiResponse = { branches: Branch[] };
type InvitationsApiResponse = { invitations: Invitation[] };

// ============================================================
// SHARED HELPERS
// ============================================================

export function flattenRolePermissions(
  role: Role | null | undefined,
): Permission[] {
  if (!role) return [];
  const first = role.permissions?.[0];
  if (first && 'permission' in first) {
    return (role.permissions as RawPermission[]).map((rp) => rp.permission);
  }
  return role.permissions as Permission[];
}

export function isAdminRole(role: Role | null | undefined): boolean {
  if (!role) return false;
  if (role.name === 'Owner') return true;
  if (role.key === 'admin') return true;
  return flattenRolePermissions(role).some((p) => p.key === '*');
}

export function isOwnerMember(
  member: Member | null | undefined,
  currentUserId: string | undefined,
): boolean {
  if (!member) return false;
  if (currentUserId && member.userId === currentUserId) return true;
  return isAdminRole(member.role);
}

// ============================================================
// SKELETON
// ============================================================

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`${styles.skeleton} ${className ?? ''}`} />;
}

function MembersSkeleton() {
  return (
    <div className={styles.page} aria-busy="true" aria-live="polite">
      <span className={styles.srOnly}>Loading members…</span>

      {/* Header */}
      <div className={styles.orgHeader}>
        <div className={styles.orgIdentity}>
          <SkeletonBlock className={styles.skeletonAvatarLg} />
          <div style={{ flex: 1 }}>
            <SkeletonBlock className={styles.skeletonTitle} />
            <SkeletonBlock className={styles.skeletonSubtitle} />
          </div>
        </div>
        <div className={styles.headerActions}>
          <SkeletonBlock className={styles.skeletonButton} />
          <SkeletonBlock className={styles.skeletonButton} />
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={`s-${i}`} className={styles.statCard}>
            <SkeletonBlock className={styles.skeletonStatValue} />
            <SkeletonBlock className={styles.skeletonStatLabel} />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <SkeletonBlock className={styles.skeletonTab} />
        <SkeletonBlock className={styles.skeletonTab} />
      </div>

      {/* Filters */}
      <div className={styles.filtersBar}>
        <SkeletonBlock className={styles.skeletonSearch} />
        <SkeletonBlock className={styles.skeletonFilter} />
        <SkeletonBlock className={styles.skeletonFilter} />
      </div>

      {/* Member rows */}
      <div className={styles.memberList}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={`r-${i}`} className={styles.skeletonMemberRow}>
            <SkeletonBlock className={styles.skeletonAvatar} />
            <div style={{ flex: 1 }}>
              <SkeletonBlock className={styles.skeletonLine} />
              <SkeletonBlock className={styles.skeletonLineShort} />
            </div>
            <SkeletonBlock className={styles.skeletonPill} />
            <SkeletonBlock className={styles.skeletonPill} />
            <SkeletonBlock className={styles.skeletonIcon} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function MembersPage() {
  const { activeOrganization, suiteContext } = useAuth();
  const currentUserId = suiteContext?.user?.id;

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'members' | 'roles'>('members');

  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);

  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [createRoleOpen, setCreateRoleOpen] = useState(false);

  // ============================================================
  // FETCH
  // ============================================================

  const fetchData = useCallback(async () => {
    if (!activeOrganization) return;

    setLoading(true);
    try {
      const orgId = activeOrganization.id;

      const [
        membersRes,
        rolesRes,
        branchesRes,
        permissionsRes,
        invitationsRes,
      ] = await Promise.all([
        api.get(`/api/v1/organizations/${orgId}/members`),
        api.get(`/api/v1/organizations/${orgId}/roles`),
        api.get(`/api/v1/organizations/${orgId}/branches`),
        api.get(`/api/v1/permissions`),
        api.get(`/api/v1/organizations/${orgId}/invitations`),
      ]);

      const membersData = (membersRes.data as MembersApiResponse).members ?? [];
      const rolesData = (rolesRes.data as RolesApiResponse).roles ?? [];
      const branchesData =
        (branchesRes.data as BranchesApiResponse).items ?? [];
      const permissionsData =
        (permissionsRes.data as PermissionsApiResponse).permissions ?? [];
      const invitationsData =
        (invitationsRes.data as InvitationsApiResponse).invitations ?? [];

      setBranches(branchesData);
      setPermissions(permissionsData);
      setInvitations(invitationsData);

      const membersWithBranches = await Promise.all(
        membersData.map(async (member) => {
          const role = rolesData.find((r) => r.id === member.roleId) ?? null;
          try {
            const branchRes = await api.get(
              `/api/v1/organizations/${orgId}/branches/members/${member.userId}/branches`,
            );
            return {
              ...member,
              role,
              branches:
                (branchRes.data as MemberBranchesApiResponse).branches ?? [],
            };
          } catch {
            return { ...member, role, branches: [] };
          }
        }),
      );

      setMembers(membersWithBranches);

      const rolesWithCount = rolesData.map((role) => ({
        ...role,
        memberCount: membersData.filter((m) => m.roleId === role.id).length,
      }));
      setRoles(rolesWithCount);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setToast({ type: 'error', message: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  }, [activeOrganization]);

  const refreshRoles = useCallback(async () => {
    if (!activeOrganization) return;
    try {
      const orgId = activeOrganization.id;
      const rolesRes = await api.get(`/api/v1/organizations/${orgId}/roles`);
      const rolesData = (rolesRes.data as RolesApiResponse).roles ?? [];
      const rolesWithCount = rolesData.map((role) => ({
        ...role,
        memberCount: members.filter((m) => m.roleId === role.id).length,
      }));
      setRoles(rolesWithCount);
    } catch (err) {
      console.error('Failed to refresh roles:', err);
    }
  }, [activeOrganization, members]);

  const refreshMembers = useCallback(async () => {
    if (!activeOrganization) return;
    try {
      const orgId = activeOrganization.id;
      const membersRes = await api.get(
        `/api/v1/organizations/${orgId}/members`,
      );
      const membersData = (membersRes.data as MembersApiResponse).members ?? [];

      const membersWithBranches = await Promise.all(
        membersData.map(async (member) => {
          const role = roles.find((r) => r.id === member.roleId) ?? null;
          try {
            const branchRes = await api.get(
              `/api/v1/organizations/${orgId}/branches/members/${member.userId}/branches`,
            );
            return {
              ...member,
              role,
              branches:
                (branchRes.data as MemberBranchesApiResponse).branches ?? [],
            };
          } catch {
            return { ...member, role, branches: [] };
          }
        }),
      );
      setMembers(membersWithBranches);
    } catch (err) {
      console.error('Failed to refresh members:', err);
    }
  }, [activeOrganization, roles]);

  const refreshInvitations = useCallback(async () => {
    if (!activeOrganization) return;
    try {
      const orgId = activeOrganization.id;
      const res = await api.get(
        `/api/v1/organizations/${orgId}/invitations`,
      );
      const data = (res.data as InvitationsApiResponse).invitations ?? [];
      setInvitations(data);
    } catch (err) {
      console.error('Failed to refresh invitations:', err);
    }
  }, [activeOrganization]);

  // ============================================================
  // EFFECT
  // ============================================================

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!activeOrganization) return;
      setLoading(true);
      try {
        const orgId = activeOrganization.id;

        const [
          membersRes,
          rolesRes,
          branchesRes,
          permissionsRes,
          invitationsRes,
        ] = await Promise.all([
          api.get(`/api/v1/organizations/${orgId}/members`),
          api.get(`/api/v1/organizations/${orgId}/roles`),
          api.get(`/api/v1/organizations/${orgId}/branches`),
          api.get(`/api/v1/permissions`),
          api.get(`/api/v1/organizations/${orgId}/invitations`),
        ]);

        if (!isMounted) return;

        const membersData =
          (membersRes.data as MembersApiResponse).members ?? [];
        const rolesData = (rolesRes.data as RolesApiResponse).roles ?? [];
        const branchesData =
          (branchesRes.data as BranchesApiResponse).items ?? [];
        const permissionsData =
          (permissionsRes.data as PermissionsApiResponse).permissions ?? [];
        const invitationsData =
          (invitationsRes.data as InvitationsApiResponse).invitations ?? [];

        setBranches(branchesData);
        setPermissions(permissionsData);
        setInvitations(invitationsData);

        const membersWithBranches = await Promise.all(
          membersData.map(async (member) => {
            const role = rolesData.find((r) => r.id === member.roleId) ?? null;
            try {
              const branchRes = await api.get(
                `/api/v1/organizations/${orgId}/branches/members/${member.userId}/branches`,
              );
              return {
                ...member,
                role,
                branches:
                  (branchRes.data as MemberBranchesApiResponse).branches ?? [],
              };
            } catch {
              return { ...member, role, branches: [] };
            }
          }),
        );

        if (!isMounted) return;
        setMembers(membersWithBranches);

        const rolesWithCount = rolesData.map((role) => ({
          ...role,
          memberCount: membersData.filter((m) => m.roleId === role.id).length,
        }));
        setRoles(rolesWithCount);
      } catch (err) {
        if (isMounted) {
          console.error('Failed to fetch data:', err);
          setToast({ type: 'error', message: 'Failed to load data' });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [activeOrganization]);

  // ============================================================
  // DERIVED
  // ============================================================

  const totalMembers = members.length;
  const totalRoles = roles.length;
  const assignableRoles = roles.filter((r) => !isAdminRole(r));

  const pendingInvitations = useMemo(
    () =>
      invitations.filter(
        (inv) =>
          inv.status === 'PENDING' && new Date(inv.expiresAt) > new Date(),
      ),
    [invitations],
  );

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) return <MembersSkeleton />;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className={styles.page}>
      {toast && (
        <div
          className={`${styles.toast} ${
            toast.type === 'success' ? styles.toastSuccess : styles.toastError
          }`}
        >
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)}>×</button>
        </div>
      )}

      {/* ===== HEADER ===== */}
      <div className={styles.orgHeader}>
        <div className={styles.orgIdentity}>
          <span className={styles.orgAvatar}>
            <Users size={24} />
          </span>
          <div>
            <div className={styles.orgNameRow}>
              <h1 className={styles.orgName}>Members & Roles</h1>
              <span className={`${styles.statusPill} ${styles.statusActive}`}>
                {totalMembers} member{totalMembers === 1 ? '' : 's'}
              </span>
            </div>
            <div className={styles.orgMeta}>
              Manage who has access and what they can do
            </div>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            className={styles.secondaryButton}
            onClick={() => setCreateRoleOpen(true)}
          >
            <Shield size={16} />
            Create Role
          </button>
          <button
            className={styles.primaryButton}
            onClick={() => setInviteOpen(true)}
          >
            <UserPlus size={16} />
            Invite Member
          </button>
        </div>
      </div>

      {/* ===== STATS ===== */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{totalMembers}</div>
          <div className={styles.statLabel}>Total Members</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {members.filter((m) => m.isActive).length}
          </div>
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

      {/* ===== TABS ===== */}
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tabButton} ${
            activeTab === 'members' ? styles.tabActive : ''
          }`}
          onClick={() => setActiveTab('members')}
        >
          <Users size={16} />
          Members
          <span className={styles.tabBadge}>{totalMembers}</span>
        </button>
        <button
          className={`${styles.tabButton} ${
            activeTab === 'roles' ? styles.tabActive : ''
          }`}
          onClick={() => setActiveTab('roles')}
        >
          <Shield size={16} />
          Roles
          <span className={styles.tabBadge}>{totalRoles}</span>
        </button>
      </div>

      {/* ===== TAB CONTENT ===== */}
      {activeTab === 'members' ? (
<MembersTab
  members={members}
  assignableRoles={assignableRoles}
  branches={branches}
  permissions={permissions}
  currentUserId={currentUserId}
  pendingInvitations={pendingInvitations}
  onOpenInvite={() => setInviteOpen(true)}
  refreshMembers={refreshMembers}
  refreshInvitations={refreshInvitations}
  setToast={setToast}
/>
      ) : (
        <RolesTab
          roles={roles}
          permissions={permissions}
          branches={branches}
          onOpenCreate={() => setCreateRoleOpen(true)}
          onRefresh={fetchData}
          setToast={setToast}
        />
      )}

      {/* ===== PAGE-LEVEL MODALS ===== */}
      {inviteOpen && (
        <InviteModal
          branches={branches}
          assignableRoles={assignableRoles}
          permissions={permissions}
          onClose={() => setInviteOpen(false)}
          onSuccess={async () => {
            setInviteOpen(false);
            await refreshMembers();
            await refreshRoles();
            await refreshInvitations();
          }}
          setToast={setToast}
        />
      )}

      {createRoleOpen && (
        <RoleModal
          role={null}
          permissions={permissions}
          branches={branches}
          onClose={() => setCreateRoleOpen(false)}
          onSuccess={async () => {
            setCreateRoleOpen(false);
            await refreshRoles();
          }}
          setToast={setToast}
        />
      )}
    </div>
  );
}