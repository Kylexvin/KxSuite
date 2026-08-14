// app/dashboard/members/components/RolesTab.tsx

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/axios";
import { Shield, Edit2, Trash2, X, Loader2, AlertCircle, Plus } from "lucide-react";
import styles from "../page.module.css";
import RoleModal from "./RoleModal";

type Permission = {
  id: string;
  key: string;
  name: string;
  productKey: string;
  description?: string;
};

type Branch = {
  id: string;
  name: string;
  code: string;
  isDefault: boolean;
};

type Role = {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  memberCount: number;
  createdAt: string;
};

type Props = {
  roles: Role[];
  permissions: Permission[];
  branches: Branch[];
  onRefresh: () => void;
  setToast: (toast: { type: "success" | "error"; message: string } | null) => void;
};

export default function RolesTab({ roles, permissions = [], branches = [], onRefresh, setToast }: Props) {
  const { activeOrganization } = useAuth();

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handler = () => setShowRoleModal(true);
    document.addEventListener("open-create-role", handler);
    return () => document.removeEventListener("open-create-role", handler);
  }, []);

  const handleDeleteRole = async () => {
    if (!activeOrganization || !showDeleteConfirm) return;

    if (showDeleteConfirm.name === "Owner") {
      setToast({ type: "error", message: "Owner role cannot be deleted" });
      return;
    }

    if (showDeleteConfirm.memberCount > 0) {
      setToast({ type: "error", message: "Cannot delete role that has members assigned" });
      return;
    }

    setSaving(true);
    try {
      await api.delete(`/api/v1/organizations/${activeOrganization.id}/roles/${showDeleteConfirm.id}`);
      onRefresh();
      setToast({ type: "success", message: "Role deleted successfully" });
      setShowDeleteConfirm(null);
    } catch (err: any) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to delete role",
      });
    } finally {
      setSaving(false);
    }
  };

  const isOwner = (role: Role) => role.name === "Owner";

  return (
    <>
      <div className={styles.tabHeader}>
        <div className={styles.tabHeaderLeft}>
          <span className={styles.tabSubtitle}>
            {roles.length} roles · Manage permissions and access
          </span>
        </div>
        <button
          className={styles.primaryButton}
          onClick={() => {
            setEditingRole(null);
            setShowRoleModal(true);
          }}
        >
          <Plus size={16} />
          Create Role
        </button>
      </div>

      <div className={styles.memberList}>
        <div className={styles.memberListHeader}>
          <span>Role</span>
          <span>Description</span>
          <span>Permissions</span>
          <span>Members</span>
          <span>Actions</span>
        </div>

        {roles.length === 0 ? (
          <div className={styles.emptyState}>
            <Shield size={48} className={styles.emptyIcon} />
            <h3>No roles created yet</h3>
            <p>Create your first role to start managing permissions</p>
          </div>
        ) : (
          roles.map((role) => {
            const isOwnerRole = isOwner(role);

            return (
              <div key={role.id} className={styles.memberRow}>
                <div className={styles.memberInfo}>
                  <div className={styles.memberAvatar} style={{ background: "rgba(255,106,43,0.15)" }}>
                    <Shield size={18} color="#ff6a2b" />
                  </div>
                  <div>
                    <div className={styles.memberName}>
                      {role.name}
                      {isOwnerRole && (
                        <span className={styles.ownerBadge}>
                          <AlertCircle size={12} />
                          Protected
                        </span>
                      )}
                    </div>
                    <div className={styles.memberEmail}>{role.description || "No description"}</div>
                  </div>
                </div>

                <div className={styles.memberDescription}>
                  {role.description || "—"}
                </div>

                <div className={styles.memberPermissions}>
                  <span className={styles.permissionBadge}>
                    {role.permissions.length} permissions
                  </span>
                </div>

                <div className={styles.memberMembers}>
                  <span className={styles.memberCountBadge}>
                    {role.memberCount}
                  </span>
                </div>

                <div className={styles.memberActions}>
                  <button
                    className={styles.actionButton}
                    onClick={() => {
                      setEditingRole(role);
                      setShowRoleModal(true);
                    }}
                    title="Edit role"
                    disabled={isOwnerRole}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                    onClick={() => setShowDeleteConfirm(role)}
                    title="Delete role"
                    disabled={isOwnerRole || role.memberCount > 0}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showRoleModal && (
        <RoleModal
          role={editingRole}
          permissions={permissions}
          branches={branches}
          onClose={() => {
            setShowRoleModal(false);
            setEditingRole(null);
          }}
          onSuccess={() => {
            onRefresh();
            setShowRoleModal(false);
            setEditingRole(null);
            setToast({ type: "success", message: editingRole ? "Role updated" : "Role created" });
          }}
          setToast={setToast}
        />
      )}

      {showDeleteConfirm && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteConfirm(null)}>
          <div className={`${styles.modal} ${styles.modalDanger}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <Trash2 size={20} />
                Delete Role
              </h2>
              <button className={styles.modalClose} onClick={() => setShowDeleteConfirm(null)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.deleteContent}>
              <div className={styles.deleteIcon}>
                <AlertCircle size={48} />
              </div>
              <h3>Are you sure?</h3>
              <p>
                This will delete <strong>{showDeleteConfirm.name}</strong>.
                {showDeleteConfirm.memberCount > 0 && (
                  <span className={styles.deleteWarning}>
                    {" "}This role is assigned to {showDeleteConfirm.memberCount} members.
                  </span>
                )}
                {showDeleteConfirm.name === "Owner" && (
                  <span className={styles.deleteWarning}> The Owner role cannot be deleted.</span>
                )}
              </p>
              <p className={styles.deleteWarning}>This action cannot be undone.</p>
            </div>

            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelButton} onClick={() => setShowDeleteConfirm(null)}>
                Cancel
              </button>
              <button
                type="button"
                className={styles.deleteButton}
                onClick={handleDeleteRole}
                disabled={saving || showDeleteConfirm.name === "Owner" || showDeleteConfirm.memberCount > 0}
              >
                {saving ? <Loader2 size={16} className={styles.spinning} /> : <Trash2 size={16} />}
                Delete Role
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}