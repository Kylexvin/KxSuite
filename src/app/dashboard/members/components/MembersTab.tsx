// app/dashboard/members/components/MembersTab.tsx

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/axios";
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
} from "lucide-react";
import styles from "../page.module.css";
import RoleModal from "./RoleModal";

type Role = {
  id: string;
  name: string;
  description: string;
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
  user: { firstName: string; lastName: string; email: string };
  roleId: string | null;
  role: Role | null;
  branches: Branch[];
  isActive: boolean;
  hasAllBranches: boolean;
  joinedAt: string;
};

type Props = {
  members: Member[];
  roles: Role[];
  branches: Branch[];
  permissions: any[];
  onRefresh: () => void;
  refreshRoles: () => void;
  refreshMembers: () => void;
  setToast: (toast: { type: "success" | "error"; message: string } | null) => void;
};

export default function MembersTab({
  members,
  roles,
  branches,
  permissions = [],
  onRefresh,
  refreshRoles,
  refreshMembers,
  setToast,
}: Props) {
  const { activeOrganization } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [saving, setSaving] = useState(false);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNestedRoleModal, setShowNestedRoleModal] = useState(false);
  const [showNestedRoleModalFromEdit, setShowNestedRoleModalFromEdit] = useState(false);

  const [inviteForm, setInviteForm] = useState({
    email: "",
    roleId: "",
    branchIds: [] as string[],
    message: "",
  });

  const [editForm, setEditForm] = useState({
    roleId: "",
    branchIds: [] as string[],
    isActive: true,
  });

  useEffect(() => {
    const handler = () => setShowInviteModal(true);
    document.addEventListener("open-invite", handler);
    return () => document.removeEventListener("open-invite", handler);
  }, []);

  const filteredMembers = members.filter((member) => {
    const name = `${member.user.firstName} ${member.user.lastName}`.toLowerCase();
    const email = member.user.email.toLowerCase();
    const search = searchQuery.toLowerCase();

    const matchesSearch = name.includes(search) || email.includes(search);
    const matchesRole = roleFilter === "ALL" || member.role?.name === roleFilter;
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && member.isActive) ||
      (statusFilter === "INACTIVE" && !member.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const isOwner = (member: Member) => {
    return member.role?.name === "Owner";
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrganization) return;

    setSaving(true);
    try {
      await api.post(`/api/v1/organizations/${activeOrganization.id}/invitations`, {
        email: inviteForm.email,
        roleId: inviteForm.roleId || undefined,
        branchIds: inviteForm.branchIds,
        message: inviteForm.message,
      });
      onRefresh();
      setToast({ type: "success", message: "Invitation sent successfully" });
      setShowInviteModal(false);
      setInviteForm({ email: "", roleId: "", branchIds: [], message: "" });
    } catch (err: any) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to send invitation",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrganization || !selectedMember) return;

    setSaving(true);
    try {
      const orgId = activeOrganization.id;

      if (selectedMember.role?.name === "Owner") {
        setToast({ type: "error", message: "Owner cannot be modified" });
        setSaving(false);
        return;
      }

      if (editForm.roleId !== selectedMember.roleId) {
        await api.patch(
          `/api/v1/organizations/${orgId}/members/${selectedMember.userId}/role`,
          { roleId: editForm.roleId || null }
        );
      }

      const currentBranchIds = selectedMember.branches.map((b) => b.id);
      const newBranchIds = editForm.branchIds;

      const toRemove = currentBranchIds.filter((id) => !newBranchIds.includes(id));
      const toAdd = newBranchIds.filter((id) => !currentBranchIds.includes(id));

      for (const branchId of toRemove) {
        try {
          await api.delete(
            `/api/v1/organizations/${orgId}/branches/${branchId}/assign`,
            { data: { memberId: selectedMember.userId } }
          );
        } catch (err) {
          console.error(`Failed to remove branch ${branchId}:`, err);
        }
      }

      for (const branchId of toAdd) {
        try {
          await api.post(
            `/api/v1/organizations/${orgId}/branches/${branchId}/assign`,
            { memberId: selectedMember.userId }
          );
        } catch (err) {
          console.error(`Failed to add branch ${branchId}:`, err);
        }
      }

      refreshMembers();
      setToast({ type: "success", message: "Member updated successfully" });
      setShowEditModal(false);
      setSelectedMember(null);
    } catch (err: any) {
      console.error("Update error:", err);
      setToast({
        type: "error",
        message:
          err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to update member",
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

      if (isOwner(selectedMember)) {
        setToast({ type: "error", message: "Owner cannot be removed" });
        setSaving(false);
        return;
      }

      for (const branch of selectedMember.branches) {
        await api.delete(
          `/api/v1/organizations/${orgId}/branches/${branch.id}/assign`,
          { data: { memberId: selectedMember.userId } }
        );
      }

      await api.delete(`/api/v1/organizations/${orgId}/members/${selectedMember.id}`);

      refreshMembers();
      setToast({ type: "success", message: "Member removed successfully" });
      setShowDeleteModal(false);
      setSelectedMember(null);
    } catch (err: any) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to remove member",
      });
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (member: Member) => {
    if (isOwner(member)) {
      setToast({ type: "error", message: "Owner cannot be modified" });
      return;
    }
    setSelectedMember(member);
    setEditForm({
      roleId: member.roleId || "",
      branchIds: member.branches.map((b) => b.id),
      isActive: member.isActive,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (member: Member) => {
    if (isOwner(member)) {
      setToast({ type: "error", message: "Owner cannot be removed" });
      return;
    }
    setSelectedMember(member);
    setShowDeleteModal(true);
  };

  return (
    <>
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
            {roles.map((role) => (
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

      <div className={styles.memberList}>
        <div className={styles.memberListHeader}>
          <span>Member</span>
          <span>Role</span>
          <span>Branches</span>
          <span>Status</span>
          <span>Joined</span>
          <span>Actions</span>
        </div>

        {filteredMembers.length === 0 ? (
          <div className={styles.emptyState}>
            <Users size={48} className={styles.emptyIcon} />
            <h3>No members found</h3>
            <p>Try adjusting your filters or invite a new member</p>
          </div>
        ) : (
          filteredMembers.map((member) => {
            const isOwnerMember = isOwner(member);

            return (
              <div key={member.id} className={styles.memberRow}>
                {/* Card Header */}
                <div className={styles.memberInfo}>
                  <div className={styles.memberAvatar}>
                    {member.user.firstName?.charAt(0) || "U"}
                  </div>
                  <div>
                    <div className={styles.memberName}>
                      {member.user.firstName} {member.user.lastName}
                      {isOwnerMember && (
                        <span className={styles.ownerBadge}>
                          <Crown size={12} />
                          Owner
                        </span>
                      )}
                      {member.hasAllBranches && !isOwnerMember && (
                        <span className={styles.allBranchesBadge}>All Branches</span>
                      )}
                    </div>
                    <div className={styles.memberEmail}>{member.user.email}</div>
                  </div>
                </div>

                {/* Desktop Fields (hidden on mobile) */}
                <div className={styles.memberRole}>
                  <span
                    className={`${styles.roleBadge} ${
                      member.role ? styles.roleActive : styles.roleInactive
                    }`}
                  >
                    {member.role?.name || "No Role"}
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
                      member.isActive ? styles.statusActive : styles.statusInactive
                    }`}
                  >
                    {member.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className={styles.memberJoined}>
                  {new Date(member.joinedAt).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </div>

                {/* Mobile Details Grid */}
                <div className={styles.memberDetails}>
                  <div className={styles.memberDetailItem}>
                    <span className={styles.memberDetailLabel}>Role</span>
                    <span className={styles.memberDetailValue}>
                      {member.role?.name || "No Role"}
                    </span>
                  </div>
                  <div className={styles.memberDetailItem}>
                    <span className={styles.memberDetailLabel}>Branches</span>
                    <span className={styles.memberDetailValue}>
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
                    </span>
                  </div>
                  <div className={styles.memberDetailItem}>
                    <span className={styles.memberDetailLabel}>Status</span>
                    <span className={styles.memberDetailValue}>
                      <span
                        className={`${styles.statusPill} ${
                          member.isActive ? styles.statusActive : styles.statusInactive
                        }`}
                      >
                        {member.isActive ? "Active" : "Inactive"}
                      </span>
                    </span>
                  </div>
                  <div className={styles.memberDetailItem}>
                    <span className={styles.memberDetailLabel}>Joined</span>
                    <span className={styles.memberDetailValue}>
                      {new Date(member.joinedAt).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className={styles.memberActions}>
                  {!isOwnerMember ? (
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
                    <span className={styles.ownerProtected}>Protected</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ===== INVITE MODAL ===== */}
      {showInviteModal && (
        <div className={styles.modalOverlay} onClick={() => setShowInviteModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <UserPlus size={20} />
                Invite Member
              </h2>
              <button className={styles.modalClose} onClick={() => setShowInviteModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleInvite} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Email Address</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Role</label>
                {roles.length === 0 ? (
                  <div className={styles.noRolesWarning}>
                    <span>No roles available.</span>
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
                    value={inviteForm.roleId}
                    onChange={(e) => setInviteForm({ ...inviteForm, roleId: e.target.value })}
                  >
                    <option value="">No role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Branch Access</label>
                <select
                  value={
                    inviteForm.branchIds.length === branches.length && branches.length > 0
                      ? "ALL"
                      : inviteForm.branchIds[0] || ""
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "ALL") {
                      setInviteForm({ ...inviteForm, branchIds: branches.map((b) => b.id) });
                    } else {
                      setInviteForm({ ...inviteForm, branchIds: [value] });
                    }
                  }}
                >
                  <option value="ALL">All Branches</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Personal Message (Optional)</label>
                <textarea
                  value={inviteForm.message}
                  onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
                  placeholder="Add a personal message..."
                  rows={3}
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelButton} onClick={() => setShowInviteModal(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitButton} disabled={saving}>
                  {saving ? <Loader2 size={16} className={styles.spinning} /> : <UserPlus size={16} />}
                  Send Invitation
                </button>
              </div>
            </form>

            {/* ===== NESTED ROLE MODAL FROM INVITE ===== */}
            {showNestedRoleModal && (
              <RoleModal
                role={null}
                permissions={permissions}
                branches={branches}
                onClose={() => setShowNestedRoleModal(false)}
                onSuccess={() => {
                  setShowNestedRoleModal(false);
                  refreshRoles();
                }}
                setToast={setToast}
              />
            )}
          </div>
        </div>
      )}

      {/* ===== EDIT MODAL ===== */}
      {showEditModal && selectedMember && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modalLarge} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <Edit2 size={20} />
                Edit Member — {selectedMember.user.firstName} {selectedMember.user.lastName}
              </h2>
              <button className={styles.modalClose} onClick={() => setShowEditModal(false)}>
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
                {roles.length === 0 ? (
                  <div className={styles.noRolesWarning}>
                    <span>No roles available.</span>
                    <button
                      type="button"
                      className={styles.createRoleLink}
                      onClick={() => setShowNestedRoleModalFromEdit(true)}
                    >
                      Create Role
                    </button>
                  </div>
                ) : (
                  <select
                    value={editForm.roleId}
                    onChange={(e) => setEditForm({ ...editForm, roleId: e.target.value })}
                  >
                    <option value="">No role</option>
                    {roles.map((role) => (
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
                  value={editForm.isActive ? "ACTIVE" : "INACTIVE"}
                  onChange={(e) =>
                    setEditForm({ ...editForm, isActive: e.target.value === "ACTIVE" })
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
                              branchIds: editForm.branchIds.filter((id) => id !== branch.id),
                            });
                          }
                        }}
                      />
                      {branch.name} {branch.isDefault && "(Default)"}
                    </label>
                  ))}
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

            {/* ===== NESTED ROLE MODAL FROM EDIT ===== */}
            {showNestedRoleModalFromEdit && (
              <RoleModal
                role={null}
                permissions={permissions}
                branches={branches}
                onClose={() => setShowNestedRoleModalFromEdit(false)}
                onSuccess={() => {
                  setShowNestedRoleModalFromEdit(false);
                  refreshRoles();
                  // Re-open edit modal after role creation
                  setShowEditModal(true);
                }}
                setToast={setToast}
              />
            )}
          </div>
        </div>
      )}

      {/* ===== DELETE MODAL ===== */}
      {showDeleteModal && selectedMember && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
          <div className={`${styles.modal} ${styles.modalDanger}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <Trash2 size={20} />
                Remove Member
              </h2>
              <button className={styles.modalClose} onClick={() => setShowDeleteModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.deleteContent}>
              <div className={styles.deleteIcon}>
                <AlertCircle size={48} />
              </div>
              <h3>Are you sure?</h3>
              <p>
                This will remove{" "}
                <strong>
                  {selectedMember.user.firstName} {selectedMember.user.lastName}
                </strong>{" "}
                from the organization. They will lose access to all branches and data.
              </p>
              <p className={styles.deleteWarning}>This action cannot be undone.</p>
            </div>

            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelButton} onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className={styles.deleteButton}
                onClick={handleRemoveMember}
                disabled={saving}
              >
                {saving ? <Loader2 size={16} className={styles.spinning} /> : <Trash2 size={16} />}
                Remove Member
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}