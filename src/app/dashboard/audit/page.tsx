"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/axios";

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
} from "lucide-react";
import styles from "./page.module.css";

// ============================================================
// TYPES
// ============================================================

type AuditEvent = {
  id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  metadata: Record<string, unknown> | null; // ✅ Fixed: changed 'any' to 'unknown'
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



// ============================================================
// ACTION LABELS - Memoized constants
// ============================================================

const ACTION_LABELS: Record<string, string> = {
  'organization_created': 'Created organization',
  'organization_updated': 'Updated settings',
  'organization_archived': 'Archived organization',
  'member_joined': 'Joined organization',
  'member_removed': 'Removed member',
  'member_updated': 'Updated member',
  'invitation_sent': 'Sent invitation',
  'invitation_accepted': 'Accepted invitation',
  'invitation_rejected': 'Rejected invitation',
  'role_created': 'Created role',
  'role_updated': 'Updated role',
  'role_deleted': 'Deleted role',
  'permission_assigned': 'Assigned permission',
  'permission_removed': 'Removed permission',
  'role_assigned': 'Assigned role to member',
  'product_activated': 'Activated product',
  'product_deactivated': 'Deactivated product',
  'subscription_created': 'Started subscription',
  'subscription_cancelled': 'Cancelled subscription',
  'subscription_renewed': 'Renewed subscription',
  'subscription_payment_initiated': 'Payment initiated',
  'subscription_payment_success': 'Payment successful',
  'branch_created': 'Added branch',
  'branch_updated': 'Updated branch',
  'branch_deleted': 'Removed branch',
  'branch_assigned': 'Assigned branch to member',
  'branch_unassigned': 'Removed branch from member',
  'payment_configured': 'Configured payment',
  'payment_ipn_registered': 'Registered IPN',
  'payment_initiated': 'Payment initiated',
  'payment_ipn_received': 'Payment IPN received',
  'kxtill_product_created': 'Added product',
  'kxtill_product_updated': 'Updated product',
  'kxtill_product_deleted': 'Removed product',
  'kxtill_sale_created': 'Created sale',
  'kxtill_sale_refunded': 'Refunded sale',
  'kxtill_settings_updated': 'Updated store settings',
  'user_login': 'Logged in',
  'user_logout': 'Logged out',
  'user_registered': 'Registered',
  'password_changed': 'Changed password',
  'password_reset_requested': 'Requested password reset',
  'password_reset_completed': 'Reset password',
  'email_verified': 'Verified email',
  'logout_all_devices': 'Logged out all devices',
};

// ============================================================
// ACTION ICONS - Memoized with proper types
// ============================================================

type IconComponent = React.ComponentType<{ size?: number; className?: string }>;

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

// ============================================================
// HELPERS - Memoized functions
// ============================================================

function getActionIcon(action: string): IconComponent {
  for (const [key, icon] of Object.entries(ACTION_ICONS)) {
    if (action.includes(key) || action.startsWith(key)) {
      return icon;
    }
  }
  return FileText;
}

function getResourceIcon(resource: string): IconComponent {
  const icons: Record<string, IconComponent> = {
    'organization': Building2,
    'membership': Users,
    'user': User,
    'invitation': Mail,
    'role': Briefcase,
    'permission': Key,
    'product': Package,
    'subscription': CreditCard,
    'payment': CreditCard,
    'branch': Store,
    'sale': ShoppingBag,
    'settings': Settings,
  };
  return icons[resource] || FileText;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date >= today) {
    return `Today ${date.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}`;
  } else if (date >= yesterday) {
    return `Yesterday ${date.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    return date.toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}

// ============================================================
// STATS CARD - Memoized
// ============================================================

const StatsCard = React.memo(function StatsCard({ 
  value, 
  label, 
  icon: Icon 
}: { 
  value: number; 
  label: string; 
  icon: IconComponent;
}) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon}>
        <Icon size={16} />
      </div>
      <div className={styles.statValue}>{value.toLocaleString()}</div>
      <div className={styles.statLabel}>{label}</div>
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
  const [stats, setStats] = useState<AuditStats>({ total: 0, thisWeek: 0, today: 0, activeUsers: 0 });
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

  // ============================================================
  // REFS
  // ============================================================

  const isMounted = useRef(true);
  const hasFetched = useRef(false);

  // ============================================================
  // PERMISSIONS
  // ============================================================

  const permissions = suiteContext?.permissions ?? [];
  const hasAuditPermission = permissions.includes('*') || permissions.includes('audit.logs.view');
  const hasExportPermission = permissions.includes('*') || permissions.includes('audit.logs.export');

  // ============================================================
  // FETCH DATA
  // ============================================================

  const fetchUsers = useCallback(async () => {
    if (!activeOrganization || !isMounted.current) return;
    try {
      const res = await api.get(`/api/v1/organizations/${activeOrganization.id}/members`);
      const members = res.data.members || [];
      
      if (!isMounted.current) return;
      
      setUsers(members.map((m: { userId: string; user: { firstName: string; lastName: string } }) => ({
        id: m.userId,
        name: `${m.user.firstName} ${m.user.lastName}`,
      })));
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  }, [activeOrganization]);

  const fetchAuditLogs = useCallback(async () => {
    if (!activeOrganization || !hasAuditPermission || !isMounted.current) return;

    setLoading(true);
    try {
      const orgId = activeOrganization.id;

      const statsRes = await api.get(`/api/v1/organizations/${orgId}/audit-logs/stats`);
      if (isMounted.current) {
        setStats(statsRes.data);
      }

      const params = new URLSearchParams();
      params.set('limit', String(limit));
      params.set('offset', String(offset));
      if (filters.userId) params.set('userId', filters.userId);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);

      const res = await api.get(`/api/v1/organizations/${orgId}/audit-logs?${params.toString()}`);
      
      if (isMounted.current) {
        setEvents(res.data.items || []);
        setTotal(res.data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [activeOrganization, hasAuditPermission, limit, offset, filters]);

  // ============================================================
  // EFFECTS - FIXED with isMounted and async wrapper
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
  // HANDLERS - Memoized
  // ============================================================

  const handleFilterChange = useCallback((key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setOffset(0);
  }, []);

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
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export audit logs:', error);
    } finally {
      setExporting(false);
    }
  }, [activeOrganization, hasExportPermission, filters]);

  // ============================================================
  // MEMOIZED COMPUTATIONS
  // ============================================================

  const totalPages = useMemo(() => Math.ceil(total / limit), [total, limit]);

  const paginationInfo = useMemo(() => ({
    start: offset + 1,
    end: Math.min(offset + limit, total),
    currentPage: Math.floor(offset / limit) + 1,
  }), [offset, limit, total]);

  // ============================================================
  // PERMISSION CHECK
  // ============================================================

  if (!hasAuditPermission) {
    return (
      <div className={styles.page}>
        <div className={styles.noAccess}>
          <Lock size={48} />
          <h2>Access Denied</h2>
          <p>You do not have permission to view audit logs.</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className={styles.page}>
      {/* ===== HEADER CARD ===== */}
      <div className={styles.headerCard}>
        <div className={styles.headerLeft}>
          <div className={styles.headerAvatar}>
            <FileText size={20} />
          </div>
          <div className={styles.headerInfo}>
            <h1 className={styles.headerTitle}>Audit Logs</h1>
            <p className={styles.headerSubtitle}>View all activity across your organization</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.exportButton}
            onClick={handleExport}
            disabled={exporting || total === 0}
          >
            <Download size={14} />
            {exporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>

      {/* ===== STATS ===== */}
      <div className={styles.statsGrid}>
        <StatsCard value={stats.total} label="Total Events" icon={FileText} />
        <StatsCard value={stats.thisWeek} label="This Week" icon={Calendar} />
        <StatsCard value={stats.today} label="Today" icon={Clock} />
        <StatsCard value={stats.activeUsers} label="Active Users" icon={Users} />
      </div>

      {/* ===== FILTERS ===== */}
      <div className={styles.filtersBar}>
        <div className={styles.filterActions}>
          <button
            className={`${styles.filterToggle} ${showFilters ? styles.filterToggleActive : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={14} />
            Filters
          </button>
          <button className={styles.refreshButton} onClick={fetchAuditLogs}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* ===== FILTER PANEL ===== */}
      {showFilters && (
        <div className={styles.filterPanel}>
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label>User</label>
              <select
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
              >
                <option value="">All Users</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Date From</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            <div className={styles.filterGroup}>
              <label>Date To</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>

            <button className={styles.clearFilters} onClick={handleClearFilters}>
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* ===== TABLE ===== */}
      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <p>Loading audit logs...</p>
          </div>
        ) : events.length === 0 ? (
          <div className={styles.emptyState}>
            <FileText size={48} className={styles.emptyIcon} />
            <h3>No audit logs found</h3>
            <p>Try adjusting your filters</p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Resource</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const Icon = getActionIcon(event.action);
                  const ResourceIcon = getResourceIcon(event.resource);
                  const label = ACTION_LABELS[event.action] || event.action.replace(/_/g, ' ').toLowerCase();
                  const userName = event.user
                    ? `${event.user.firstName} ${event.user.lastName}`
                    : 'System';

                  return (
                    <tr key={event.id} className={styles.tableRow}>
                      <td className={styles.timeCell}>
                        <span className={styles.timeText}>{formatTime(event.createdAt)}</span>
                      </td>
                      <td className={styles.userCell}>
                        <div className={styles.userAvatar}>
                          {userName.charAt(0)}
                        </div>
                        <span className={styles.userName}>{userName}</span>
                      </td>
                      <td className={styles.actionCell}>
                        <div className={styles.actionBadge}>
                          <Icon size={12} />
                          <span>{label}</span>
                        </div>
                      </td>
                      <td className={styles.resourceCell}>
                        <div className={styles.resourceBadge}>
                          <ResourceIcon size={12} />
                          <span>{event.resource}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== PAGINATION ===== */}
      {total > limit && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            Showing {paginationInfo.start} - {paginationInfo.end} of {total}
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