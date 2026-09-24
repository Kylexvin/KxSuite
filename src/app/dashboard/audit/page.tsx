// app/dashboard/audit/page.tsx

'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/axios';
import {
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  User,
  Building2,
  Package,
  ShoppingBag,
  Users,
  CreditCard,
  Settings,
  LogIn,
  LogOut,
  Key,
  Mail,
  RefreshCw,
  Clock,
  Calendar,
  FileText,
  Briefcase,
  Store,
  Lock,
  Shield,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';
import styles from './page.module.css';

// ============================================================
// TYPES
// ============================================================

type AuditEvent = {
  id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  userId: string | null;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
  organizationId: string;
  organization: {
    id: string;
    name: string;
    slug: string;
  } | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

type AuditStats = {
  total: number;
  thisWeek: number;
  today: number;
  activeUsers: number;
};

type FilterState = {
  userId: string;
  startDate: string;
  endDate: string;
};

type UserOption = {
  id: string;
  name: string;
};

type IconComponent = React.ComponentType<{ size?: number; className?: string }>;

// ============================================================
// ACTION LABELS — user-facing copy
// ============================================================

const ACTION_LABELS: Record<string, string> = {
  // Organization
  'organization_created': 'Created the organization',
  'organization_updated': 'Updated organization settings',
  'organization_archived': 'Archived the organization',
  // Members
  'member_joined': 'Joined the organization',
  'member_removed': 'Removed a member',
  'member_updated': 'Updated a member',
  'invitation_sent': 'Sent an invitation',
  'invitation_accepted': 'Accepted an invitation',
  'invitation_rejected': 'Declined an invitation',
  // Roles
  'role_created': 'Created a role',
  'role_updated': 'Updated a role',
  'role_deleted': 'Deleted a role',
  'permission_assigned': 'Granted a permission',
  'permission_removed': 'Revoked a permission',
  'role_assigned': 'Assigned a role to a member',
  // Products
  'product_activated': 'Activated a product',
  'product_deactivated': 'Deactivated a product',
  // Subscriptions & payments
  'subscription_created': 'Started a subscription',
  'subscription_cancelled': 'Cancelled a subscription',
  'subscription_renewed': 'Renewed a subscription',
  'subscription_payment_initiated': 'Started a payment',
  'subscription_payment_success': 'Payment completed',
  // Branches
  'branch_created': 'Added a branch',
  'branch_updated': 'Updated a branch',
  'branch_deleted': 'Removed a branch',
  'branch_assigned': 'Assigned a member to a branch',
  'branch_unassigned': 'Removed a member from a branch',
  // Payments
  'payment_configured': 'Configured payment settings',
  'payment_ipn_registered': 'Registered a payment IPN',
  'payment_initiated': 'Started a payment',
  'payment_ipn_received': 'Received a payment confirmation',
  // KxTill
  'kxtill_product_created': 'Added a product',
  'kxtill_product_updated': 'Updated a product',
  'kxtill_product_deleted': 'Removed a product',
  'kxtill_sale_created': 'Recorded a sale',
  'kxtill_sale_refunded': 'Refunded a sale',
  'kxtill_settings_updated': 'Updated store settings',
  // Auth
  'user_login': 'Signed in',
  'user_logout': 'Signed out',
  'user_registered': 'Created an account',
  'password_changed': 'Changed their password',
  'password_reset_requested': 'Requested a password reset',
  'password_reset_completed': 'Reset their password',
  'email_verified': 'Verified their email',
  'logout_all_devices': 'Signed out of all devices',
};

// ============================================================
// ACTION ICONS
// ============================================================

const ACTION_ICONS: Record<string, IconComponent> = {
  'organization': Building2,
  'member': Users,
  'invitation': Mail,
  'role': Briefcase,
  'permission': Key,
  'product': Package,
  'subscription': CreditCard,
  'payment': CreditCard,
  'branch': Store,
  'kxtill_product': Package,
  'kxtill_sale': ShoppingBag,
  'kxtill_settings': Settings,
  'user': User,
  'login': LogIn,
  'logout': LogOut,
  'password': Key,
  'email': Mail,
};

function getActionIcon(action: string): IconComponent {
  for (const [key, icon] of Object.entries(ACTION_ICONS)) {
    if (action.includes(key) || action.startsWith(key)) return icon;
  }
  return FileText;
}

// ============================================================
// TIME HELPERS
// ============================================================

function formatClock(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-KE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function dayKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dayLabel(key: string): string {
  const today = new Date();
  const todayKey = dayKey(today.toISOString());

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = dayKey(yesterday.toISOString());

  if (key === todayKey) return 'Today';
  if (key === yesterdayKey) return 'Yesterday';

  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-KE', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function actionLabel(action: string): string {
  return (
    ACTION_LABELS[action] ||
    action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toLowerCase())
  );
}

// ============================================================
// TOAST
// ============================================================

function Toast({
  type,
  message,
  onClose,
}: {
  type: 'success' | 'error' | 'info';
  message: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <FileText size={16} />,
    error: <AlertTriangle size={16} />,
    info: <FileText size={16} />,
  };

  const classes = {
    success: styles.toastSuccess,
    error: styles.toastError,
    info: styles.toastInfo,
  };

  return (
    <div className={`${styles.toast} ${classes[type]}`}>
      {icons[type]}
      <span>{message}</span>
      <button className={styles.toastClose} onClick={onClose}>
        ×
      </button>
    </div>
  );
}

// ============================================================
// SKELETON
// ============================================================

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`${styles.skeleton} ${className ?? ''}`} />;
}

function AuditSkeleton() {
  return (
    <div className={styles.page} aria-busy="true" aria-live="polite">
      <span className={styles.srOnly}>Loading audit log…</span>

      <div className={styles.headerCard}>
        <div className={styles.headerLeft}>
          <SkeletonBlock className={styles.skeletonAvatar} />
          <div style={{ flex: 1 }}>
            <SkeletonBlock className={styles.skeletonTitle} />
            <SkeletonBlock className={styles.skeletonSubtitle} />
          </div>
        </div>
        <SkeletonBlock className={styles.skeletonButton} />
      </div>

      <div className={styles.statsGrid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={`s-${i}`} className={styles.statCard}>
            <SkeletonBlock className={styles.skeletonStat} />
            <SkeletonBlock className={styles.skeletonStatLabel} />
          </div>
        ))}
      </div>

      <SkeletonBlock className={styles.skeletonFilterBar} />

      <div className={styles.timeline}>
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonBlock key={`e-${i}`} className={styles.skeletonEvent} />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// STATS CARD
// ============================================================

const StatsCard = React.memo(function StatsCard({
  value,
  label,
  hint,
  icon: Icon,
}: {
  value: number;
  label: string;
  hint: string;
  icon: IconComponent;
}) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon}>
        <Icon size={16} />
      </div>
      <div className={styles.statValue}>{value.toLocaleString()}</div>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statHint}>{hint}</div>
    </div>
  );
});

// ============================================================
// MAIN PAGE
// ============================================================

export default function AuditPage() {
  const { activeOrganization, suiteContext } = useAuth();

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [stats, setStats] = useState<AuditStats>({
    total: 0,
    thisWeek: 0,
    today: 0,
    activeUsers: 0,
  });
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    userId: '',
    startDate: '',
    endDate: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const isMounted = useRef(true);
  const hasFetched = useRef(false);

  // ============================================================
  // PERMISSIONS
  // ============================================================

  const permissions = suiteContext?.permissions ?? [];
  const hasAuditPermission =
    permissions.includes('*') || permissions.includes('audit.logs.view');
  const hasExportPermission =
    permissions.includes('*') || permissions.includes('audit.logs.export');

  // ============================================================
  // FETCH
  // ============================================================

  const fetchUsers = useCallback(async () => {
    if (!activeOrganization || !isMounted.current) return;
    try {
      const res = await api.get(
        `/api/v1/organizations/${activeOrganization.id}/members`,
      );
      const members = res.data.members || [];
      if (!isMounted.current) return;
      setUsers(
        members.map(
          (m: {
            userId: string;
            user: { firstName: string; lastName: string };
          }) => ({
            id: m.userId,
            name: `${m.user.firstName} ${m.user.lastName}`.trim() || 'Unknown',
          }),
        ),
      );
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  }, [activeOrganization]);

  const fetchAuditLogs = useCallback(async () => {
    if (!activeOrganization || !hasAuditPermission || !isMounted.current) return;

    setLoading(true);
    try {
      const orgId = activeOrganization.id;

      const statsRes = await api.get(
        `/api/v1/organizations/${orgId}/audit-logs/stats`,
      );
      if (isMounted.current) setStats(statsRes.data);

      const params = new URLSearchParams();
      params.set('limit', String(limit));
      params.set('offset', String(offset));
      if (filters.userId) params.set('userId', filters.userId);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);

      const res = await api.get(
        `/api/v1/organizations/${orgId}/audit-logs?${params.toString()}`,
      );

      if (isMounted.current) {
        setEvents(res.data.items || []);
        setTotal(res.data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      if (isMounted.current) {
        setToast({ type: 'error', message: 'Failed to load audit log' });
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [activeOrganization, hasAuditPermission, limit, offset, filters]);

  // ============================================================
  // EFFECTS
  // ============================================================

  useEffect(() => {
    isMounted.current = true;
    hasFetched.current = false;

    const loadData = async () => {
      if (!activeOrganization || !isMounted.current) return;
      if (hasFetched.current) return;
      hasFetched.current = true;
      await Promise.all([fetchAuditLogs(), fetchUsers()]);
    };

    loadData();
    return () => {
      isMounted.current = false;
    };
  }, [activeOrganization, fetchAuditLogs, fetchUsers]);

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleFilterChange = useCallback(
    (key: keyof FilterState, value: string) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setOffset(0);
    },
    [],
  );

  const handleClearFilters = useCallback(() => {
    setFilters({ userId: '', startDate: '', endDate: '' });
    setOffset(0);
  }, []);

  const handleExport = useCallback(async () => {
    if (!activeOrganization || !hasExportPermission) return;
    setExporting(true);
    try {
      const orgId = activeOrganization.id;
      const params = new URLSearchParams();
      if (filters.userId) params.set('userId', filters.userId);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);

      const res = await api.get(
        `/api/v1/organizations/${orgId}/audit-logs/export?${params.toString()}`,
        { responseType: 'blob' },
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `audit-logs-${new Date().toISOString().split('T')[0]}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setToast({ type: 'success', message: 'Export started' });
    } catch (error) {
      console.error('Failed to export audit logs:', error);
      setToast({ type: 'error', message: 'Failed to export' });
    } finally {
      setExporting(false);
    }
  }, [activeOrganization, hasExportPermission, filters]);

  // ============================================================
  // DERIVED
  // ============================================================

  const totalPages = useMemo(
    () => Math.ceil(total / limit),
    [total, limit],
  );

  const paginationInfo = useMemo(
    () => ({
      start: total === 0 ? 0 : offset + 1,
      end: Math.min(offset + limit, total),
      currentPage: Math.floor(offset / limit) + 1,
    }),
    [offset, limit, total],
  );

  // Group events by day
  const groupedEvents = useMemo(() => {
    const groups: { key: string; label: string; events: AuditEvent[] }[] = [];
    const map = new Map<string, AuditEvent[]>();

    for (const ev of events) {
      const k = dayKey(ev.createdAt);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(ev);
    }

    for (const [key, list] of map.entries()) {
      groups.push({ key, label: dayLabel(key), events: list });
    }

    return groups;
  }, [events]);

  // ============================================================
  // NO PERMISSION
  // ============================================================

  if (!hasAuditPermission) {
    return (
      <div className={styles.page}>
        <div className={styles.noAccess}>
          <Lock size={48} />
          <h2>You don&apos;t have access</h2>
          <p>
            Only members with the Audit Logs permission can view this page.
            Ask your organization owner for access.
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading && events.length === 0) return <AuditSkeleton />;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className={styles.page}>
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* ===== HEADER ===== */}
      <div className={styles.headerCard}>
        <div className={styles.headerLeft}>
          <div className={styles.headerAvatar}>
            <Shield size={20} />
          </div>
          <div className={styles.headerInfo}>
            <h1 className={styles.headerTitle}>Audit Log</h1>
            <p className={styles.headerSubtitle}>
              Everything that happens in your organization, in order.
            </p>
          </div>
        </div>
        {hasExportPermission && (
          <button
            className={styles.exportButton}
            onClick={handleExport}
            disabled={exporting || total === 0}
            title="Download as CSV"
          >
            <Download size={14} />
            {exporting ? 'Exporting…' : 'Export'}
          </button>
        )}
      </div>

      {/* ===== STATS ===== */}
      <div className={styles.statsGrid}>
        <StatsCard
          value={stats.today}
          label="Today"
          hint="Events in the last 24 hours"
          icon={Clock}
        />
        <StatsCard
          value={stats.thisWeek}
          label="This week"
          hint="Events in the last 7 days"
          icon={Calendar}
        />
        <StatsCard
          value={stats.activeUsers}
          label="Active users"
          hint="Members with activity this week"
          icon={UserCheck}
        />
        <StatsCard
          value={stats.total}
          label="All time"
          hint="Every event on record"
          icon={FileText}
        />
      </div>

      {/* ===== FILTER BAR ===== */}
      <div className={styles.filtersBar}>
        <button
          className={`${styles.filterToggle} ${
            showFilters ? styles.filterToggleActive : ''
          }`}
          onClick={() => setShowFilters((v) => !v)}
        >
          <Filter size={14} />
          Filters
          {(filters.userId || filters.startDate || filters.endDate) && (
            <span className={styles.filterDot} />
          )}
        </button>
        <button
          className={styles.refreshButton}
          onClick={fetchAuditLogs}
          title="Refresh"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* ===== FILTER PANEL ===== */}
      {showFilters && (
        <div className={styles.filterPanel}>
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label>Who</label>
              <select
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
              >
                <option value="">Everyone</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>From</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  handleFilterChange('startDate', e.target.value)
                }
              />
            </div>

            <div className={styles.filterGroup}>
              <label>To</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>

            <button
              className={styles.clearFilters}
              onClick={handleClearFilters}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ===== TIMELINE ===== */}
      <div className={styles.timeline}>
        {loading && events.length === 0 ? (
          <div className={styles.loadingInline}>
            <RefreshCw size={16} className={styles.spin} />
            <span>Loading…</span>
          </div>
        ) : events.length === 0 ? (
          <div className={styles.emptyState}>
            <FileText size={40} className={styles.emptyIcon} />
            <h3>No activity yet</h3>
            <p>
              {filters.userId || filters.startDate || filters.endDate
                ? 'No events match your filters.'
                : 'Events will appear here as your team uses the platform.'}
            </p>
            {(filters.userId || filters.startDate || filters.endDate) && (
              <button
                className={styles.clearFiltersInline}
                onClick={handleClearFilters}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          groupedEvents.map((group) => (
            <div key={group.key} className={styles.dayGroup}>
              <div className={styles.dayHeader}>
                <span className={styles.dayLabel}>{group.label}</span>
                <span className={styles.dayCount}>
                  {group.events.length}{' '}
                  {group.events.length === 1 ? 'event' : 'events'}
                </span>
              </div>
              <ul className={styles.dayEvents}>
                {group.events.map((event) => {
                  const Icon = getActionIcon(event.action);
                  const userName = event.user
                    ? `${event.user.firstName} ${event.user.lastName}`.trim() ||
                      'System'
                    : 'System';
                  const initials = userName.charAt(0).toUpperCase();

                  return (
                    <li key={event.id} className={styles.eventRow}>
                      <span className={styles.eventTime}>
                        {formatClock(event.createdAt)}
                      </span>

                      <span className={styles.eventIconWrap}>
                        <Icon size={13} />
                      </span>

                      <div className={styles.eventBody}>
                        <div className={styles.eventText}>
                          <strong className={styles.eventActor}>
                            {userName}
                          </strong>
                          <span className={styles.eventAction}>
                            {actionLabel(event.action)}
                          </span>
                        </div>
                        {event.resource && (
                          <div className={styles.eventMeta}>
                            <Building2 size={11} />
                            <span>{event.resource}</span>
                          </div>
                        )}
                      </div>

                      <div className={styles.eventAvatar} title={userName}>
                        {initials}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </div>

      {/* ===== PAGINATION ===== */}
      {total > limit && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            Showing {paginationInfo.start}–{paginationInfo.end} of{' '}
            {total.toLocaleString()}
          </div>
          <div className={styles.paginationControls}>
            <button
              className={styles.paginationButton}
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - limit))}
            >
              <ChevronLeft size={16} />
            </button>
            <span className={styles.paginationPage}>
              Page {paginationInfo.currentPage} of {totalPages}
            </span>
            <button
              className={styles.paginationButton}
              disabled={offset + limit >= total}
              onClick={() => setOffset(Math.min(total - limit, offset + limit))}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}