// app/dashboard/members/components/RoleModal.tsx

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/axios";
import { X, Check, Loader2, Shield, Trash2, AlertCircle } from "lucide-react";
import styles from "../page.module.css";

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

type RawPermission = {
  permission: Permission;
  roleId: string;
  permissionId: string;
};

type Role = {
  id: string;
  name: string;
  description: string;
  permissions: Permission[] | RawPermission[];
  memberCount: number;
};

type Props = {
  role: Role | null;
  permissions: Permission[];
  branches: Branch[];
  onClose: () => void;
  onSuccess: () => void;
  setToast: (toast: { type: "success" | "error"; message: string } | null) => void;
};

export default function RoleModal({
  role,
  permissions = [],
  branches = [],
  onClose,
  onSuccess,
  setToast,
}: Props) {
  const { activeOrganization } = useAuth();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const safePermissions = permissions || [];
  const isEditing = !!role;

  const groupedPermissions = safePermissions.reduce((acc, perm) => {
    const key = perm.productKey || "other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  // ============================================================
  // FLATTEN PERMISSIONS WHEN EDITING
  // ============================================================

  useEffect(() => {
    if (role) {
      setName(role.name);
      setDescription(role.description || "");

      // Check if permissions are nested or flat
      const firstPerm = role.permissions?.[0];
      let flatPermissions: Permission[] = [];

      if (firstPerm && "permission" in firstPerm) {
        // Nested: { permission: { key, name, ... } }
        flatPermissions = (role.permissions as RawPermission[]).map((rp) => rp.permission);
      } else {
        // Already flat
        flatPermissions = role.permissions as Permission[];
      }

      setSelectedPermissions(flatPermissions.map((p) => p.key));
    } else {
      setName("");
      setDescription("");
      setSelectedPermissions([]);
    }
  }, [role]);

  const togglePermission = (key: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleAllPermissions = (productKey: string, checked: boolean) => {
    const productPermissions = groupedPermissions[productKey] || [];
    const keys = productPermissions.map((p) => p.key);
    if (checked) {
      setSelectedPermissions((prev) => [...new Set([...prev, ...keys])]);
    } else {
      setSelectedPermissions((prev) => prev.filter((k) => !keys.includes(k)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrganization) return;

    if (!name.trim()) {
      setToast({ type: "error", message: "Role name is required" });
      return;
    }

    setSaving(true);
    try {
      const orgId = activeOrganization.id;
      const payload = {
        name: name.trim(),
        description: description.trim(),
        permissionKeys: selectedPermissions,
      };

      if (isEditing) {
        await api.patch(`/api/v1/organizations/${orgId}/roles/${role.id}`, payload);
      } else {
        await api.post(`/api/v1/organizations/${orgId}/roles`, payload);
      }

      onSuccess();
    } catch (err: any) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to save role",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activeOrganization || !role) return;

    if (role.name === "Owner") {
      setToast({ type: "error", message: "Owner role cannot be deleted" });
      setShowDeleteConfirm(false);
      return;
    }

    if (role.memberCount > 0) {
      setToast({
        type: "error",
        message: `Cannot delete role. It is assigned to ${role.memberCount} members.`,
      });
      setShowDeleteConfirm(false);
      return;
    }

    try {
      await api.delete(`/api/v1/organizations/${activeOrganization.id}/roles/${role.id}`);
      onSuccess();
      setToast({ type: "success", message: "Role deleted successfully" });
      setShowDeleteConfirm(false);
    } catch (err: any) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to delete role",
      });
    }
  };

  const productKeys = Object.keys(groupedPermissions);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalLarge} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <Shield size={20} />
            {isEditing ? `Edit Role: ${role.name}` : "Create Role"}
          </h2>
          <button className={styles.modalClose} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label>Role Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Branch Manager"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this role"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Permissions</label>
            <div className={styles.permissionsContainer}>
              {productKeys.length === 0 ? (
                <div className={styles.noPermissions}>
                  <p>No permissions available. Install a product to see permissions.</p>
                </div>
              ) : (
                productKeys.map((productKey) => {
                  const productPerms = groupedPermissions[productKey] || [];
                  const allSelected = productPerms.every((p) =>
                    selectedPermissions.includes(p.key)
                  );
                  const someSelected = productPerms.some((p) =>
                    selectedPermissions.includes(p.key)
                  );

                  return (
                    <div key={productKey} className={styles.permissionGroup}>
                      <div className={styles.permissionGroupHeader}>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={allSelected}
                            ref={(el) => {
                              if (el) el.indeterminate = someSelected && !allSelected;
                            }}
                            onChange={(e) =>
                              toggleAllPermissions(productKey, e.target.checked)
                            }
                          />
                          <span className={styles.productName}>
                            {productKey === "admin" ? "Platform" : productKey}
                          </span>
                        </label>
                        <span className={styles.permissionCount}>
                          {productPerms.length} permissions
                        </span>
                      </div>
                      <div className={styles.permissionItems}>
                        {productPerms.map((perm) => (
                          <label key={perm.key} className={styles.checkboxLabel}>
                            <input
                              type="checkbox"
                              checked={selectedPermissions.includes(perm.key)}
                              onChange={() => togglePermission(perm.key)}
                            />
                            {perm.name}
                            {perm.description && (
                              <span className={styles.permissionDesc}>
                                {perm.description}
                              </span>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className={styles.modalActions}>
            {isEditing && (
              <button
                type="button"
                className={styles.deleteButton}
                onClick={() => setShowDeleteConfirm(true)}
                disabled={role.name === "Owner" || role.memberCount > 0}
                title={
                  role.name === "Owner"
                    ? "Owner role cannot be deleted"
                    : role.memberCount > 0
                    ? `Cannot delete: assigned to ${role.memberCount} members`
                    : ""
                }
              >
                <Trash2 size={16} />
                Delete Role
              </button>
            )}
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.submitButton} disabled={saving}>
              {saving ? <Loader2 size={16} className={styles.spinning} /> : <Check size={16} />}
              {isEditing ? "Update Role" : "Create Role"}
            </button>
          </div>
        </form>
      </div>

      {showDeleteConfirm && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className={`${styles.modal} ${styles.modalDanger}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <Trash2 size={20} />
                Delete Role
              </h2>
              <button
                className={styles.modalClose}
                onClick={() => setShowDeleteConfirm(false)}
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
                This will permanently delete <strong>{role?.name}</strong>.
                {role?.memberCount && role.memberCount > 0 && (
                  <span className={styles.deleteWarning}>
                    {" "}It is assigned to {role.memberCount} members.
                  </span>
                )}
              </p>
              <p className={styles.deleteWarning}>This action cannot be undone.</p>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.deleteButton}
                onClick={handleDelete}
              >
                <Trash2 size={16} />
                Delete Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}