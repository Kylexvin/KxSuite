// app/dashboard/members/components/MembersTab.tsx

'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/axios';
import { AxiosError } from 'axios';
import {
  Users,
  Search,
  Edit2,
  Trash2,
  Crown,
  X,
  Check,
  Loader2,
  UserPlus,
  AlertCircle,
  Clock,
  RefreshCw,
} from 'lucide-react';
import styles from '../page.module.css';
import RoleModal from './RoleModal';
import { isOwnerMember } from '../page';
import type { Role, Branch, Member, Permission, Invitation } from '../page';

// ============================================================
// PROPS
// ============================================================

type Props = {
  members: Member[];
  assignableRoles: Role[];
  branches: Branch[];
  permissions: Permission[];
  currentUserId: string | undefined;
  pendingInvitations?: Invitation[];
  onOpenInvite: () => void;
  refreshMembers: () => void;
  refreshInvitations: () => void;
  setToast: (toast: { type: 'success' | 'error'; message: string } | null) => void;
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
// COMPONENT
// ============================================================

export default function MembersTab({
  members,
  assignableRoles,
  branches,
  permissions,
  currentUserId,
  pendingInvitations = [],
  onOpenInvite,
  refreshMembers,
  refreshInvitations,
  setToast,
}: Props) {
  const { activeOrganization } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [saving, setSaving] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNestedRoleModal, setShowNestedRoleModal] = useState(false);

  const [editForm, setEditForm] = useState({
    roleId: '',
    branchIds: [] as string[],
    isActive: true,
  });

  // ============================================================
  // FILTERING
  // ============================================================

  const filteredMembers = useMemo(() => {
    const search = searchQuery.toLowerCase();
    return members.filter((member) => {
      const name =
        `${member.user.firstName} ${member.user.lastName}`.toLowerCase();
      const email = member.user.email.toLowerCase();
      const matchesSearch = name.includes(search) || email.includes(search);
      const matchesRole =
        roleFilter === 'ALL' || member.role?.name === roleFilter;
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && member.isActive) ||
        (statusFilter === 'INACTIVE' && !member.isActive);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [members, searchQuery, roleFilter, statusFilter]);

  const orderedMembers = useMemo(() => {
    const owners = filteredMembers.filter((m) =>
      isOwnerMember(m, currentUserId),
    );
    const rest = filteredMembers.filter(
      (m) => !isOwnerMember(m, currentUserId),
    );
    return [...owners, ...rest];
  }, [filteredMembers, currentUserId]);

  // ============================================================
  // HELPERS
  // ============================================================

  const daysUntil = (iso: string): number => {
    const now = new Date();
    const ms = new Date(iso).getTime() - now.getTime();
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  };

  // ============================================================
  // ACTIONS
  // ============================================================

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrganization || !selectedMember) return;

    if (editForm.branchIds.length === 0) {
      setToast({
        type: 'error',
        message: 'Please assign at least one branch.',
      });
      return;
    }

    setSaving(true);
    try {
      const orgId = activeOrganization.id;

      if (editForm.roleId !== selectedMember.roleId) {
        await api.patch(
          `/api/v1/organizations/${orgId}/members/${selectedMember.userId}/role`,
          { roleId: editForm.roleId || null },
        );
      }

      const current = selectedMember.branches.map((b) => b.id);
      const next = editForm.branchIds;
      const toRemove = current.filter((id) => !next.includes(id));
      const toAdd = next.filter((id) => !current.includes(id));

      for (const branchId of toRemove) {
        try {
          await api.delete(
            `/api/v1/organizations/${orgId}/branches/${branchId}/assign`,
            { data: { memberId: selectedMember.userId } },
          );
        } catch (err) {
          console.error(`Failed to remove branch ${branchId}:`, err);
        }
      }
      for (const branchId of toAdd) {
        try {
          await api.post(
            `/api/v1/organizations/${orgId}/branches/${branchId}/assign`,
            { memberId: selectedMember.userId },
          );
        } catch (err) {
          console.error(`Failed to add branch ${branchId}:`, err);
        }
      }

      refreshMembers();
      setToast({ type: 'success', message: 'Member updated successfully' });
      setShowEditModal(false);
      setSelectedMember(null);
    } catch (err: unknown) {
      setToast({
        type: 'error',
        message: getErrorMessage(err, 'Failed to update member'),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!activeOrganization || !selectedMember) return;

    setSaving(true);
    try {
      const orgId = activeOrganization.id;

      for (const branch of selectedMember.branches) {
        try {
          await api.delete(
            `/api/v1/organizations/${orgId}/branches/${branch.id}/assign`,
            { data: { memberId: selectedMember.userId } },
          );
        } catch (err) {
          console.error(`Failed to unassign branch ${branch.id}:`, err);
        }
      }

      await api.delete(
         `/api/v1/organizations/${orgId}/members/${selectedMember.userId}`,
      );

      refreshMembers();
      setToast({ type: 'success', message: 'Member removed successfully' });
      setShowDeleteModal(false);
      setSelectedMember(null);
    } catch (err: unknown) {
      setToast({
        type: 'error',
        message: getErrorMessage(err, 'Failed to remove member'),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    if (!activeOrganization) return;
    try {
      await api.post(
        `/api/v1/organizations/${activeOrganization.id}/invitations/${invitationId}/resend`,
      );
      await refreshInvitations();
      setToast({ type: 'success', message: 'Invitation resent' });
    } catch (err: unknown) {
      setToast({
        type: 'error',
        message: getErrorMessage(err, 'Failed to resend invitation'),
      });
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!activeOrganization) return;
    if (
      !window.confirm(
        'Revoke this invitation? The recipient will no longer be able to join with the link.',
      )
    ) {
      return;
    }
    try {
      await api.delete(
        `/api/v1/organizations/${activeOrganization.id}/invitations/${invitationId}`,
      );
      await refreshInvitations();
      setToast({ type: 'success', message: 'Invitation revoked' });
    } catch (err: unknown) {
      setToast({
        type: 'error',
        message: getErrorMessage(err, 'Failed to revoke invitation'),
      });
    }
  };

  const openEditModal = (member: Member) => {
    if (isOwnerMember(member, currentUserId)) return;
    setSelectedMember(member);
    setEditForm({
      roleId: member.roleId ?? '',
      branchIds: member.branches.map((b) => b.id),
      isActive: member.isActive,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (member: Member) => {
    if (isOwnerMember(member, currentUserId)) return;
    setSelectedMember(member);
    setShowDeleteModal(true);
  };

  // ============================================================
  // RENDER
  // ============================================================

  const hasOnlyOwner =
    members.length === 1 && isOwnerMember(members[0], currentUserId);

  return (
    <>
      {/* ===== FILTERS ===== */}
      {members.length > 0 && (
        <div className={styles.filtersBar}>
          <div className={styles.searchWrap}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className={styles.filterGroup}>
            <select
              className={styles.filterSelect}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="ALL">All Roles</option>
              {assignableRoles.map((role) => (
                <option key={role.id} value={role.name}>
                  {role.name}
                </option>
              ))}
            </select>
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      )}

      {/* ===== PENDING INVITATIONS ===== */}
      {pendingInvitations.length > 0 && (
        <div className={styles.pendingSection}>
          <div className={styles.pendingHeader}>
            <h3 className={styles.pendingTitle}>
              <Clock size={14} />
              Pending invitations
              <span className={styles.pendingCount}>
                {pendingInvitations.length}
              </span>
            </h3>
          </div>
          <div className={styles.pendingList}>
            {pendingInvitations.map((inv) => {
              const role = assignableRoles.find((r) => r.id === inv.roleId);
              const days = daysUntil(inv.expiresAt);
              return (
                <div key={inv.id} className={styles.pendingRow}>
                  <div className={styles.pendingInfo}>
                    <div className={styles.pendingEmail}>{inv.email}</div>
                    <div className={styles.pendingMeta}>
                      {role?.name && (
                        <span className={styles.pendingRoleBadge}>
                          {role.name}
                        </span>
                      )}
                      <span className={styles.pendingTime}>
                        Expires in {days} day{days === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>
                  <div className={styles.pendingActions}>
                    <button
                      className={styles.pendingAction}
                      onClick={() => handleResendInvitation(inv.id)}
                      title="Resend invitation email"
                    >
                      <RefreshCw size={13} />
                      Resend
                    </button>
                    <button
                      className={`${styles.pendingAction} ${styles.pendingActionDanger}`}
                      onClick={() => handleRevokeInvitation(inv.id)}
                      title="Revoke invitation"
                    >
                      <X size={13} />
                      Revoke
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== EMPTY: ONLY OWNER ===== */}
      {hasOnlyOwner && (
        <div className={styles.friendlyEmpty}>
          <div className={styles.friendlyEmptyIcon}>
            <UserPlus size={28} />
          </div>
          <h3>You&apos;re the only member</h3>
          <p>
            Invite your team to collaborate. You can assign roles and branch
            access now, or adjust them later.
          </p>
          <button className={styles.primaryButton} onClick={onOpenInvite}>
            <UserPlus size={16} />
            Invite your first member
          </button>
        </div>
      )}

      {/* ===== LIST ===== */}
      {!hasOnlyOwner && (
        <div className={styles.memberList}>
          <div className={styles.memberListHeader}>
            <span>Member</span>
            <span>Role</span>
            <span>Branches</span>
            <span>Status</span>
            <span>Joined</span>
            <span>Actions</span>
          </div>

          {orderedMembers.length === 0 ? (
            <div className={styles.emptyState}>
              <Users size={48} className={styles.emptyIcon} />
              <h3>No members match your filters</h3>
              <p>Try adjusting your search or filters.</p>
            </div>
          ) : (
            orderedMembers.map((member) => {
              const isOwner = isOwnerMember(member, currentUserId);

              return (
                <div key={member.id} className={styles.memberRow}>
                  <div className={styles.memberInfo}>
                    <div className={styles.memberAvatar}>
                      {member.user.firstName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className={styles.memberName}>
                        {member.user.firstName} {member.user.lastName}
                        {isOwner && (
                          <span className={styles.ownerBadge}>
                            <Crown size={12} />
                            Owner
                          </span>
                        )}
                        {member.hasAllBranches && !isOwner && (
                          <span className={styles.allBranchesBadge}>
                            All Branches
                          </span>
                        )}
                      </div>
                      <div className={styles.memberEmail}>
                        {member.user.email}
                      </div>
                    </div>
                  </div>

                  <div className={styles.memberRole}>
                    <span
                      className={`${styles.roleBadge} ${
                        member.role ? styles.roleActive : styles.roleInactive
                      }`}
                    >
                      {member.role?.name || 'No Role'}
                    </span>
                  </div>

                  <div className={styles.memberBranches}>
                    {member.branches.length > 0 ? (
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

                  <div className={styles.memberStatus}>
                    <span
                      className={`${styles.statusPill} ${
                        member.isActive
                          ? styles.statusActive
                          : styles.statusInactive
                      }`}
                    >
                      {member.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className={styles.memberJoined}>
                    {new Date(member.joinedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>

                  <div className={styles.memberDetails}>
                    <div className={styles.memberDetailItem}>
                      <span className={styles.memberDetailLabel}>Role</span>
                      <span className={styles.memberDetailValue}>
                        {member.role?.name || 'No Role'}
                      </span>
                    </div>
                    <div className={styles.memberDetailItem}>
                      <span className={styles.memberDetailLabel}>
                        Branches
                      </span>
                      <span className={styles.memberDetailValue}>
                        {member.branches.length > 0
                          ? member.branches.map((b) => b.code).join(', ')
                          : '—'}
                      </span>
                    </div>
                    <div className={styles.memberDetailItem}>
                      <span className={styles.memberDetailLabel}>Status</span>
                      <span className={styles.memberDetailValue}>
                        {member.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className={styles.memberDetailItem}>
                      <span className={styles.memberDetailLabel}>Joined</span>
                      <span className={styles.memberDetailValue}>
                        {new Date(member.joinedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className={styles.memberActions}>
                    {!isOwner ? (
                      <>
                        <button
                          className={styles.actionButton}
                          onClick={() => openEditModal(member)}
                          title="Edit member"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                          onClick={() => openDeleteModal(member)}
                          title="Remove member"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    ) : (
                      <span
                        className={styles.ownerProtected}
                        title="The organization owner cannot be edited or removed"
                      >
                        <Crown size={12} />
                        Protected
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ===== EDIT MODAL ===== */}
      {showEditModal && selectedMember && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowEditModal(false)}
        >
          <div
            className={styles.modalLarge}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <Edit2 size={20} />
                Edit Member — {selectedMember.user.firstName}{' '}
                {selectedMember.user.lastName}
              </h2>
              <button
                className={styles.modalClose}
                onClick={() => setShowEditModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateMember} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Email</label>
                <input
                  type="email"
                  value={selectedMember.user.email}
                  disabled
                  className={styles.inputDisabled}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Role</label>
                {assignableRoles.length === 0 ? (
                  <div className={styles.noRolesWarning}>
                    <span>No assignable roles yet.</span>
                    <button
                      type="button"
                      className={styles.createRoleLink}
                      onClick={() => setShowNestedRoleModal(true)}
                    >
                      Create Role
                    </button>
                  </div>
                ) : (
                  <select
                    value={editForm.roleId}
                    onChange={(e) =>
                      setEditForm({ ...editForm, roleId: e.target.value })
                    }
                  >
                    <option value="">No role</option>
                    {assignableRoles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Status</label>
                <select
                  value={editForm.isActive ? 'ACTIVE' : 'INACTIVE'}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      isActive: e.target.value === 'ACTIVE',
                    })
                  }
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Branch Access</label>
                <div className={styles.branchCheckboxes}>
                  {branches.map((branch) => (
                    <label key={branch.id} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={editForm.branchIds.includes(branch.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditForm({
                              ...editForm,
                              branchIds: [...editForm.branchIds, branch.id],
                            });
                          } else {
                            setEditForm({
                              ...editForm,
                              branchIds: editForm.branchIds.filter(
                                (id) => id !== branch.id,
                              ),
                            });
                          }
                        }}
                      />
                      {branch.name} {branch.isDefault && '(Default)'}
                    </label>
                  ))}
                </div>
                {editForm.branchIds.length === 0 && (
                  <span className={styles.inlineError}>
                    At least one branch is required.
                  </span>
                )}
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

            {showNestedRoleModal && (
              <RoleModal
                role={null}
                permissions={permissions}
                branches={branches}
                onClose={() => setShowNestedRoleModal(false)}
                onSuccess={() => setShowNestedRoleModal(false)}
                setToast={setToast}
              />
            )}
          </div>
        </div>
      )}

      {/* ===== DELETE MODAL ===== */}
      {showDeleteModal && selectedMember && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className={`${styles.modal} ${styles.modalDanger}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <Trash2 size={20} />
                Remove Member
              </h2>
              <button
                className={styles.modalClose}
                onClick={() => setShowDeleteModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.deleteContent}>
              <div className={styles.deleteIcon}>
                <AlertCircle size={48} />
              </div>
              <h3>Are you sure?</h3>
              <p>
                This will remove{' '}
                <strong>
                  {selectedMember.user.firstName}{' '}
                  {selectedMember.user.lastName}
                </strong>{' '}
                from the organization. They will lose access to all branches
                and data.
              </p>
              <p className={styles.deleteWarning}>
                This action cannot be undone.
              </p>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.deleteButton}
                onClick={handleRemoveMember}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 size={16} className={styles.spinning} />
                ) : (
                  <Trash2 size={16} />
                )}
                Remove Member
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}