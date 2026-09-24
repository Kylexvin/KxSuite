// app/dashboard/members/components/InviteModal.tsx

'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/axios';
import { AxiosError } from 'axios';
import {
  X,
  UserPlus,
  Loader2,
  Mail,
  Shield,
  Building2,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import styles from '../page.module.css';
import type { Role, Branch, Permission } from '../page';
import {
  STARTER_ROLES,
  DEFAULT_STARTER_ROLE,
  type StarterRoleKey,
} from '@/constants/starterRoles';

// ============================================================
// PROPS
// ============================================================

type Props = {
  branches: Branch[];
  assignableRoles: Role[];
  permissions: Permission[];
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

// ============================================================
// EMAIL VALIDATION
// ============================================================

function parseEmails(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map((e) => e.trim())
    .filter((e) => e.length > 0);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function invalidEmails(emails: string[]): string[] {
  return emails.filter((e) => !EMAIL_RE.test(e));
}

// ============================================================
// COMPONENT
// ============================================================

export default function InviteModal({
  branches,
  assignableRoles,
  permissions,
  onClose,
  onSuccess,
  setToast,
}: Props) {
  const { activeOrganization } = useAuth();

  // When the org has no custom roles, offer the starter set.
  const usingStarters = assignableRoles.length === 0;

  const [emailsRaw, setEmailsRaw] = useState('');
  const [roleChoice, setRoleChoice] = useState<string>(() => {
    if (usingStarters) return `starter:${DEFAULT_STARTER_ROLE}`;
    return assignableRoles[0]?.id ?? '';
  });
  const [branchIds, setBranchIds] = useState<string[]>(() =>
    // Preselect: default branch if one exists, else all branches.
    branches.length > 0
      ? [branches.find((b) => b.isDefault)?.id ?? branches[0].id]
      : [],
  );
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  // Filter starter role permission keys to only those the org has.
  const availableKeys = useMemo(
    () => new Set(permissions.map((p) => p.key)),
    [permissions],
  );

  const emails = useMemo(() => parseEmails(emailsRaw), [emailsRaw]);
  const badEmails = useMemo(() => invalidEmails(emails), [emails]);
  const hasNoBranches = branchIds.length === 0;
  const hasNoEmails = emails.length === 0;

  // ============================================================
  // SUBMIT
  // ============================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    if (!activeOrganization) return;

    if (hasNoEmails) {
      setToast({ type: 'error', message: 'Add at least one email address.' });
      return;
    }
    if (badEmails.length > 0) {
      setToast({
        type: 'error',
        message: `Invalid email: ${badEmails[0]}`,
      });
      return;
    }
    if (hasNoBranches) {
      setToast({
        type: 'error',
        message: 'Assign at least one branch.',
      });
      return;
    }

    setSaving(true);
    try {
      const orgId = activeOrganization.id;

      // ---- Resolve role ID, creating a starter role if needed ----
      let roleId: string | null = null;

      if (roleChoice.startsWith('starter:')) {
        const starterKey = roleChoice.slice('starter:'.length) as StarterRoleKey;
        const starter = STARTER_ROLES.find((r) => r.key === starterKey);

        if (!starter) {
          setToast({ type: 'error', message: 'Invalid role selection.' });
          setSaving(false);
          return;
        }

        // Try to find an existing role with the same name (idempotency).
        const existing = assignableRoles.find(
          (r) => r.name.toLowerCase() === starter.name.toLowerCase(),
        );

        if (existing) {
          roleId = existing.id;
        } else {
          // Filter starter permission keys to only those the org actually has.
          const validKeys = starter.permissionKeys.filter((k) =>
            availableKeys.has(k),
          );

          const createRes = await api.post(
            `/api/v1/organizations/${orgId}/roles`,
            {
              name: starter.name,
              description: starter.description,
              permissionKeys: validKeys,
            },
          );

          // Response shape may differ — try common fields.
          const createdRole =
            createRes.data?.role ??
            createRes.data?.data?.role ??
            createRes.data;
          roleId = createdRole?.id ?? null;

          if (!roleId) {
            setToast({
              type: 'error',
              message: 'Could not create starter role.',
            });
            setSaving(false);
            return;
          }
        }
      } else {
        roleId = roleChoice || null;
      }

      if (!roleId) {
        setToast({ type: 'error', message: 'Please select a role.' });
        setSaving(false);
        return;
      }

      // ---- Send each invitation (bulk) ----
      // The API contract from your snippet takes one email at a time.
      // Sequential sends with per-email error collection.
      const succeeded: string[] = [];
      const failed: { email: string; reason: string }[] = [];

      for (const email of emails) {
        try {
          await api.post(
            `/api/v1/organizations/${orgId}/invitations`,
            {
              email,
              roleId,
              branchIds,
              message: message.trim() || undefined,
            },
          );
          succeeded.push(email);
        } catch (err: unknown) {
          failed.push({
            email,
            reason: getErrorMessage(err, 'Failed'),
          });
        }
      }

      // ---- Report ----
      if (failed.length === 0) {
        setToast({
          type: 'success',
          message:
            succeeded.length === 1
              ? `Invitation sent to ${succeeded[0]}.`
              : `${succeeded.length} invitations sent.`,
        });
      } else if (succeeded.length === 0) {
        setToast({
          type: 'error',
          message: failed[0].reason,
        });
      } else {
        setToast({
          type: 'error',
          message: `${succeeded.length} sent · ${failed.length} failed`,
        });
      }

      if (succeeded.length > 0) {
        await onSuccess();
      }
    } catch (err: unknown) {
      setToast({
        type: 'error',
        message: getErrorMessage(err, 'Failed to send invitation'),
      });
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // HELPERS
  // ============================================================

  const toggleBranch = (id: string) => {
    setBranchIds((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id],
    );
  };

  const showBranchError = touched && hasNoBranches;
  const showEmailError = touched && badEmails.length > 0;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <UserPlus size={20} />
            Invite Member
          </h2>
          <button className={styles.modalClose} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          {/* ==== EMAIL ==== */}
          <div className={styles.formGroup}>
            <label>
              <Mail size={13} className={styles.labelIcon} />
              Email {emails.length > 1 && `(${emails.length})`}
            </label>
            <input
              type="text"
              value={emailsRaw}
              onChange={(e) => setEmailsRaw(e.target.value)}
              placeholder="teammate@company.co.ke (or comma-separated)"
              autoFocus
            />
            {showEmailError && (
              <span className={styles.inlineError}>
                Invalid: {badEmails.join(', ')}
              </span>
            )}
            {emails.length > 1 && !showEmailError && (
              <span className={styles.inlineHint}>
                {emails.length} emails queued
              </span>
            )}
          </div>

          {/* ==== ROLE ==== */}
          <div className={styles.formGroup}>
            <label>
              <Shield size={13} className={styles.labelIcon} />
              Role
            </label>
            <select
              value={roleChoice}
              onChange={(e) => setRoleChoice(e.target.value)}
            >
              {usingStarters ? (
                <>
                  {STARTER_ROLES.map((r) => (
                    <option key={r.key} value={`starter:${r.key}`}>
                      {r.name}
                      {r.key === DEFAULT_STARTER_ROLE ? ' (recommended)' : ''}
                    </option>
                  ))}
                </>
              ) : (
                <>
                  {assignableRoles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </>
              )}
            </select>
            {usingStarters && (
              <span className={styles.inlineHint}>
                <Sparkles size={11} className={styles.hintIcon} />
                Starter roles created automatically. You can edit them
                anytime from the Roles tab.
              </span>
            )}
          </div>

          {/* ==== BRANCHES ==== */}
          <div className={styles.formGroup}>
            <label>
              <Building2 size={13} className={styles.labelIcon} />
              Branch access
            </label>
            <div className={styles.branchCheckboxes}>
              {branches.length === 0 ? (
                <span className={styles.noBranches}>
                  No branches yet. Create one first.
                </span>
              ) : (
                branches.map((branch) => (
                  <label
                    key={branch.id}
                    className={styles.checkboxLabel}
                  >
                    <input
                      type="checkbox"
                      checked={branchIds.includes(branch.id)}
                      onChange={() => toggleBranch(branch.id)}
                    />
                    {branch.name}
                    {branch.isDefault && (
                      <span className={styles.branchDefaultTag}>Default</span>
                    )}
                  </label>
                ))
              )}
            </div>
            {showBranchError && (
              <span className={styles.inlineError}>
                Select at least one branch.
              </span>
            )}
          </div>

          {/* ==== MESSAGE ==== */}
          <div className={styles.formGroup}>
            <label>
              <MessageSquare size={13} className={styles.labelIcon} />
              Personal message (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a note to the invitation email…"
              rows={3}
            />
          </div>

          {/* ==== ACTIONS ==== */}
          <div className={styles.modalActions}>
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
                <UserPlus size={16} />
              )}
              {emails.length > 1
                ? `Send ${emails.length} invitations`
                : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}