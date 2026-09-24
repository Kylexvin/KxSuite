// app/dashboard/members/components/RoleModal.tsx

'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/axios';
import { AxiosError } from 'axios';
import {
  X,
  Check,
  Loader2,
  Shield,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import styles from '../page.module.css';
import { isAdminRole } from '../page';
import type { Role, Branch, Permission, RawPermission } from '../page';

type Props = {
  role: Role | null;
  permissions: Permission[];
  branches: Branch[];
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
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

function getInitialPermissionKeys(role: Role | null): string[] {
  if (!role) return [];
  const first = role.permissions?.[0];
  if (first && 'permission' in first) {
    return (role.permissions as RawPermission[]).map((rp) => rp.permission.key);
  }
  return (role.permissions as Permission[]).map((p) => p.key);
}

export default function RoleModal({
  role,
  permissions = [],
  onClose,
  onSuccess,
  setToast,
}: Props) {
  const { activeOrganization } = useAuth();
  const isEditing = role !== null;

  // Initialize state hooks before any conditional returns
  const [name, setName] = useState(role?.name ?? '');
  const [description, setDescription] = useState(role?.description ?? '');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    () => getInitialPermissionKeys(role),
  );
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Defense-in-depth: never allow editing the admin role
  if (role && isAdminRole(role)) {
    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>
              <Shield size={20} />
              System Role
            </h2>
            <button className={styles.modalClose} onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          <div className={styles.deleteContent}>
            <div className={styles.deleteIcon}>
              <AlertCircle size={48} />
            </div>
            <h3>This role cannot be edited</h3>
            <p>
              <strong>{role.name}</strong> is a system role that manages the
              organization owner. It cannot be modified or deleted.
            </p>
          </div>
          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filter out the wildcard `*` — it's reserved for the Owner role.
  const safePermissions = permissions.filter((p) => p.key !== '*');
  const groupedPermissions = safePermissions.reduce(
    (acc, perm) => {
      const key = perm.productKey || 'other';
      if (!acc[key]) acc[key] = [];
      acc[key].push(perm);
      return acc;
    },
    {} as Record<string, Permission[]>,
  );

  const togglePermission = (key: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const toggleAll = (productKey: string, checked: boolean) => {
    const productPerms = groupedPermissions[productKey] ?? [];
    const keys = productPerms.map((p) => p.key);
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
      setToast({ type: 'error', message: 'Role name is required' });
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

      if (isEditing && role) {
        await api.patch(
          `/api/v1/organizations/${orgId}/roles/${role.id}`,
          payload,
        );
      } else {
        await api.post(`/api/v1/organizations/${orgId}/roles`, payload);
      }

      await onSuccess();
    } catch (err: unknown) {
      setToast({
        type: 'error',
        message: getErrorMessage(err, 'Failed to save role'),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activeOrganization || !role) return;

    if (role.memberCount > 0) {
      setToast({
        type: 'error',
        message: `Cannot delete. This role is assigned to ${role.memberCount} member${role.memberCount === 1 ? '' : 's'}.`,
      });
      setShowDeleteConfirm(false);
      return;
    }

    try {
      await api.delete(
        `/api/v1/organizations/${activeOrganization.id}/roles/${role.id}`,
      );
      await onSuccess();
      setToast({ type: 'success', message: 'Role deleted successfully' });
      setShowDeleteConfirm(false);
    } catch (err: unknown) {
      setToast({
        type: 'error',
        message: getErrorMessage(err, 'Failed to delete role'),
      });
    }
  };

  const productKeys = Object.keys(groupedPermissions);
  const canDelete = isEditing && role && role.memberCount === 0;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalLarge} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <Shield size={20} />
            {isEditing ? `Edit Role: ${role?.name}` : 'Create Role'}
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
                  <p>
                    No permissions available. Activate a product first to see
                    its permissions.
                  </p>
                </div>
              ) : (
                productKeys.map((productKey) => {
                  const productPerms = groupedPermissions[productKey] ?? [];
                  const allSelected = productPerms.every((p) =>
                    selectedPermissions.includes(p.key),
                  );
                  const someSelected = productPerms.some((p) =>
                    selectedPermissions.includes(p.key),
                  );

                  return (
                    <div key={productKey} className={styles.permissionGroup}>
                      <div className={styles.permissionGroupHeader}>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={allSelected}
                            ref={(el) => {
                              if (el)
                                el.indeterminate =
                                  someSelected && !allSelected;
                            }}
                            onChange={(e) =>
                              toggleAll(productKey, e.target.checked)
                            }
                          />
                          <span className={styles.productName}>
                            {productKey === 'admin' ? 'Platform' : productKey}
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
            {isEditing && role && (
              <button
                type="button"
                className={styles.deleteButton}
                onClick={() => setShowDeleteConfirm(true)}
                disabled={!canDelete}
                title={
                  role.memberCount > 0
                    ? `In use by ${role.memberCount} member${role.memberCount === 1 ? '' : 's'}`
                    : 'Delete this role'
                }
              >
                <Trash2 size={16} />
                {role.memberCount > 0
                  ? `In use by ${role.memberCount}`
                  : 'Delete Role'}
              </button>
            )}
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
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
              {isEditing ? 'Update Role' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>

      {showDeleteConfirm && role && (
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
                This will permanently delete <strong>{role.name}</strong>.
              </p>
              <p className={styles.deleteWarning}>
                This action cannot be undone.
              </p>
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