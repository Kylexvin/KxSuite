// app/dashboard/members/components/RolesTab.tsx

'use client';

import { useState, useMemo } from 'react';
import {
  Shield,
  Plus,
  Edit2,
  Crown,
  Users,
  Lock,
} from 'lucide-react';
import styles from '../page.module.css';
import RoleModal from './RoleModal';
import { isAdminRole } from '../page';
import type { Role, Branch, Permission } from '../page';

type Props = {
  roles: Role[];
  permissions: Permission[];
  branches: Branch[];
  onOpenCreate: () => void;
  onRefresh: () => void;
  setToast: (toast: { type: 'success' | 'error'; message: string } | null) => void;
};

export default function RolesTab({
  roles,
  permissions,
  branches,
  onOpenCreate,
  onRefresh,
  setToast,
}: Props) {
  const [editRole, setEditRole] = useState<Role | null>(null);

  const orderedRoles = useMemo(() => {
    const admins = roles.filter(isAdminRole);
    const rest = roles
      .filter((r) => !isAdminRole(r))
      .sort((a, b) => a.name.localeCompare(b.name));
    return [...admins, ...rest];
  }, [roles]);

  const openEdit = (role: Role) => {
    if (isAdminRole(role)) return;
    setEditRole(role);
  };

  const closeEdit = () => setEditRole(null);

  return (
    <>
      {orderedRoles.length === 0 ? (
        <div className={styles.friendlyEmpty}>
          <div className={styles.friendlyEmptyIcon}>
            <Shield size={28} />
          </div>
          <h3>No roles yet</h3>
          <p>
            Roles group permissions and control what members can do. Starter
            roles are created automatically when you invite your first member.
          </p>
          <button className={styles.primaryButton} onClick={onOpenCreate}>
            <Plus size={16} />
            Create a role
          </button>
        </div>
      ) : (
        <div className={styles.roleGrid}>
          {orderedRoles.map((role) => {
            const admin = isAdminRole(role);

            return (
              <div
                key={role.id}
                className={`${styles.roleCard} ${
                  admin ? styles.roleCardAdmin : ''
                }`}
              >
                <div className={styles.roleCardHeader}>
                  <div className={styles.roleCardTitleRow}>
                    <span
                      className={`${styles.roleCardIcon} ${
                        admin ? styles.roleCardIconAdmin : ''
                      }`}
                    >
                      {admin ? <Crown size={16} /> : <Shield size={16} />}
                    </span>
                    <div className={styles.roleCardTitleText}>
                      <div className={styles.roleCardName}>{role.name}</div>
                      {admin && (
                        <span className={styles.roleLockedBadge}>
                          <Lock size={10} />
                          System role
                        </span>
                      )}
                    </div>
                  </div>

                  {!admin && (
                    <button
                      className={styles.actionButton}
                      onClick={() => openEdit(role)}
                      title="Edit role"
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                </div>

                {role.description && (
                  <p className={styles.roleCardDescription}>
                    {role.description}
                  </p>
                )}

                <div className={styles.roleCardMeta}>
                  <span className={styles.roleMetaChip}>
                    <Shield size={11} />
                    {admin
                      ? 'All permissions'
                      : `${role.permissions.length} permission${
                          role.permissions.length === 1 ? '' : 's'
                        }`}
                  </span>
                  <span className={styles.roleMetaChip}>
                    <Users size={11} />
                    {role.memberCount} member
                    {role.memberCount === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editRole && (
        <RoleModal
          role={editRole}
          permissions={permissions}
          branches={branches}
          onClose={closeEdit}
          onSuccess={async () => {
            closeEdit();
            onRefresh();
          }}
          setToast={setToast}
        />
      )}
    </>
  );
}