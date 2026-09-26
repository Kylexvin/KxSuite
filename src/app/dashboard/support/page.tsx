// app/dashboard/support/page.tsx

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import { api } from '@/lib/axios';
import { AxiosError } from 'axios';
import {
  LifeBuoy,
  Plus,
  Search,
  X,
  Check,
  AlertTriangle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Send,
  Lock,
  MessageSquare,
  Clock,
  Tag,
  Filter,
  BookOpen,
  ExternalLink,
  Inbox,
  ChevronDown,
  ArrowUpDown,
} from 'lucide-react';
import styles from './page.module.css';

// ============================================================
// TYPES
// ============================================================

type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
};

type TicketUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

type TicketMessage = {
  id: string;
  ticketId: string;
  userId: string;
  user: TicketUser;
  message: string;
  isInternal: boolean;
  createdAt: string;
};

type TicketListItem = {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  productKey: string | null;
  category: Category;
  user: TicketUser;
  organization?: { id: string; name: string };
  _count?: { messages: number };
  createdAt: string;
  updatedAt: string;
};

type TicketDetail = TicketListItem & {
  messages: TicketMessage[];
};

type Guide = {
  id: string;
  title: string;
  summary: string;
  category: string;
  productKey: string | null;
  url: string | null;
  updatedAt: string;
};

type ApiErrorResponse = {
  message?: string;
  error?: string;
  [key: string]: unknown;
};

type SortOrder = 'recent' | 'oldest' | 'priority';

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
// FORMATTING
// ============================================================

function formatRelative(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatAbsolute(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-KE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function userName(u: TicketUser | null | undefined): string {
  if (!u) return 'Unknown';
  return `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email;
}

function initials(u: TicketUser | null | undefined): string {
  if (!u) return '?';
  const f = u.firstName?.[0] ?? '';
  const l = u.lastName?.[0] ?? '';
  return (f + l || u.email[0] || '?').toUpperCase();
}

const PRIORITY_WEIGHT: Record<TicketPriority, number> = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

// ============================================================
// TOAST
// ============================================================

function Toast({
  type,
  message,
  onClose,
}: {
  type: 'success' | 'error';
  message: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`${styles.toast} ${
        type === 'success' ? styles.toastSuccess : styles.toastError
      }`}
    >
      {type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
      <span>{message}</span>
      <button className={styles.toastClose} onClick={onClose}>
        <X size={14} />
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

function PageSkeleton() {
  return (
    <div className={styles.page} aria-busy="true" aria-live="polite">
      <span className={styles.srOnly}>Loading support…</span>

      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <SkeletonBlock className={styles.skeletonAvatar} />
          <div style={{ flex: 1 }}>
            <SkeletonBlock className={styles.skeletonTitle} />
            <SkeletonBlock className={styles.skeletonSubtitle} />
          </div>
        </div>
        <SkeletonBlock className={styles.skeletonButton} />
      </div>

      <div className={styles.inboxGrid}>
        <div className={styles.listPane}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={`t-${i}`} className={styles.skeletonThread}>
              <SkeletonBlock className={styles.skeletonAvatarSm} />
              <div style={{ flex: 1 }}>
                <SkeletonBlock className={styles.skeletonLine} />
                <SkeletonBlock className={styles.skeletonLineShort} />
              </div>
            </div>
          ))}
        </div>
        <div className={styles.detailPane}>
          <div className={styles.detailEmpty}>
            <Loader2 size={20} className={styles.spinning} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// BADGES
// ============================================================

function StatusPill({ status }: { status: TicketStatus }) {
  const map: Record<TicketStatus, { label: string; className: string }> = {
    OPEN: { label: 'Open', className: styles.statusOpen },
    IN_PROGRESS: { label: 'In progress', className: styles.statusProgress },
    RESOLVED: { label: 'Resolved', className: styles.statusResolved },
    CLOSED: { label: 'Closed', className: styles.statusClosed },
  };
  const cfg = map[status] ?? map.OPEN;
  return <span className={`${styles.pill} ${cfg.className}`}>{cfg.label}</span>;
}

function PriorityPill({ priority }: { priority: TicketPriority }) {
  const map: Record<TicketPriority, { label: string; className: string }> = {
    LOW: { label: 'Low', className: styles.priorityLow },
    MEDIUM: { label: 'Medium', className: styles.priorityMedium },
    HIGH: { label: 'High', className: styles.priorityHigh },
    URGENT: { label: 'Urgent', className: styles.priorityUrgent },
  };
  const cfg = map[priority] ?? map.MEDIUM;
  return <span className={`${styles.pill} ${cfg.className}`}>{cfg.label}</span>;
}

function PriorityDot({ priority }: { priority: TicketPriority }) {
  const map: Record<TicketPriority, string> = {
    LOW: styles.dotLow,
    MEDIUM: styles.dotMedium,
    HIGH: styles.dotHigh,
    URGENT: styles.dotUrgent,
  };
  return <span className={`${styles.priorityDot} ${map[priority]}`} />;
}

// ============================================================
// MAIN PAGE
// ============================================================

type Tab = 'tickets' | 'guides';

export default function SupportPage() {
  const { activeOrganization, suiteContext } = useAuth();
  const { isOwner, hasPermission, isReady } = usePermissions();

  const activeOrgId = activeOrganization?.id;

  const [activeTab, setActiveTab] = useState<Tab>('tickets');

  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(
    null,
  );
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    null,
  );
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Guides
  const [guides, setGuides] = useState<Guide[]>([]);
  const [guidesLoaded, setGuidesLoaded] = useState(false);
  const [loadingGuides, setLoadingGuides] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TicketStatus>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<SortOrder>('recent');

  const canViewAll = isOwner || hasPermission('support.tickets.view');
  const canCreate = isOwner || hasPermission('support.tickets.create');
  const canManage = isOwner || hasPermission('support.tickets.manage');

  // "Inbox" treatment applies to owners and managers-with-view.
  // They are the org's response team; they manage, they don't ask.
  const isInboxView = canViewAll;

  const mountedRef = useRef(true);

  // ============================================================
  // FETCH LIST
  // ============================================================

  const loadList = useCallback(async () => {
    if (!activeOrgId) return;
    try {
      const [ticketsRes, categoriesRes] = await Promise.all([
        api.get(`/api/v1/organizations/${activeOrgId}/support/tickets`),
        api.get(`/api/v1/organizations/${activeOrgId}/support/categories`),
      ]);
      if (!mountedRef.current) return;
      setTickets(ticketsRes.data.items ?? []);
      setCategories(categoriesRes.data.categories ?? []);
    } catch (err) {
      if (mountedRef.current) {
        setToast({
          type: 'error',
          message: getErrorMessage(err, 'Failed to load tickets'),
        });
      }
    }
  }, [activeOrgId]);

  useEffect(() => {
    if (!isReady || !activeOrgId) return;

    mountedRef.current = true;
    let cancelled = false;

    (async () => {
      if (!cancelled) setLoading(true);
      try {
        await loadList();
      } finally {
        if (!cancelled && mountedRef.current) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      mountedRef.current = false;
    };
  }, [activeOrgId, isReady, loadList]);

  // ============================================================
  // FETCH GUIDES (lazy — first time the Guides tab is opened)
  // ============================================================

  const loadGuides = useCallback(async () => {
    if (!activeOrgId || guidesLoaded) return;
    setLoadingGuides(true);
    try {
      const res = await api.get(
        `/api/v1/organizations/${activeOrgId}/support/guides`,
      );
      if (!mountedRef.current) return;
      setGuides(res.data.guides ?? []);
      setGuidesLoaded(true);
    } catch (err) {
      if (mountedRef.current) {
        setToast({
          type: 'error',
          message: getErrorMessage(err, 'Failed to load guides'),
        });
      }
    } finally {
      if (mountedRef.current) setLoadingGuides(false);
    }
  }, [activeOrgId, guidesLoaded]);

  const handleTabChange = useCallback(
    (nextTab: Tab) => {
      setActiveTab(nextTab);
      if (nextTab === 'guides') {
        void loadGuides();
      }
    },
    [loadGuides],
  );

  // ============================================================
  // FETCH DETAIL
  // ============================================================

  const openTicket = async (ticketId: string) => {
    if (!activeOrgId) return;
    setSelectedTicketId(ticketId);
    setLoadingDetail(true);
    try {
      const res = await api.get(
        `/api/v1/organizations/${activeOrgId}/support/tickets/${ticketId}`,
      );
      setSelectedTicket(res.data.ticket ?? null);
    } catch (err) {
      setToast({
        type: 'error',
        message: getErrorMessage(err, 'Failed to load ticket'),
      });
    } finally {
      setLoadingDetail(false);
    }
  };

  const refreshDetail = async (ticketId: string) => {
    if (!activeOrgId) return;
    try {
      const res = await api.get(
        `/api/v1/organizations/${activeOrgId}/support/tickets/${ticketId}`,
      );
      setSelectedTicket(res.data.ticket ?? null);
    } catch (err) {
      setToast({
        type: 'error',
        message: getErrorMessage(err, 'Failed to refresh ticket'),
      });
    }
  };

  const closeDetail = () => {
    setSelectedTicket(null);
    setSelectedTicketId(null);
  };

  // ============================================================
  // FILTERED + SORTED LIST
  // ============================================================

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const rows = tickets.filter((t) => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (categoryFilter !== 'ALL' && t.category?.id !== categoryFilter)
        return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    });

    const sorted = [...rows].sort((a, b) => {
      if (sortOrder === 'priority') {
        return PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
      }
      const aTime = new Date(a.updatedAt).getTime();
      const bTime = new Date(b.updatedAt).getTime();
      return sortOrder === 'oldest' ? aTime - bTime : bTime - aTime;
    });

    return sorted;
  }, [tickets, searchQuery, statusFilter, categoryFilter, sortOrder]);

  const stats = useMemo(() => {
    return {
      open: tickets.filter((t) => t.status === 'OPEN').length,
      inProgress: tickets.filter((t) => t.status === 'IN_PROGRESS').length,
      resolved: tickets.filter(
        (t) => t.status === 'RESOLVED' || t.status === 'CLOSED',
      ).length,
    };
  }, [tickets]);

  // ============================================================
  // GATES
  // ============================================================

  if (!isReady) return null;

  if (!canCreate && !canViewAll) {
    return (
      <div className={styles.page}>
        <div className={styles.noAccess}>
          <Lock size={40} />
          <h2>Support is not available</h2>
          <p>
            You don&apos;t have permission to view or create support tickets.
            Ask your organization owner.
          </p>
        </div>
      </div>
    );
  }

  if (loading) return <PageSkeleton />;

  const view: 'list' | 'detail' = selectedTicketId ? 'detail' : 'list';

  return (
    <div className={styles.page}>
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerAvatar}>
            <LifeBuoy size={22} />
          </div>
          <div>
            <div className={styles.headerTitleRow}>
              <h1 className={styles.headerTitle}>
                {isInboxView ? 'Support inbox' : 'Support'}
              </h1>
              <span className={styles.orgBadge}>{activeOrganization?.name}</span>
            </div>
            <p className={styles.headerSubtitle}>
              {isInboxView
                ? 'Tickets and guides for your team'
                : 'Get help or browse guides'}
            </p>
          </div>
        </div>
        {canCreate && activeTab === 'tickets' && (
          <button
            className={styles.primaryButton}
            onClick={() => setShowCreate(true)}
          >
            <Plus size={16} />
            Open a ticket
          </button>
        )}
      </div>

      {/* TABS */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${
            activeTab === 'tickets' ? styles.tabActive : ''
          }`}
          onClick={() => handleTabChange('tickets')}
        >
          <Inbox size={14} />
          Tickets
          {tickets.length > 0 && (
            <span className={styles.tabCount}>{tickets.length}</span>
          )}
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === 'guides' ? styles.tabActive : ''
          }`}
          onClick={() => handleTabChange('guides')}
        >
          <BookOpen size={14} />
          Guides
        </button>
      </div>

      {activeTab === 'tickets' && tickets.length > 0 && (
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={`${styles.statDot} ${styles.dotOpen}`} />
            <span className={styles.statValue}>{stats.open}</span>
            <span className={styles.statLabel}>Open</span>
          </div>
          <div className={styles.statCard}>
            <span className={`${styles.statDot} ${styles.dotProgress}`} />
            <span className={styles.statValue}>{stats.inProgress}</span>
            <span className={styles.statLabel}>In progress</span>
          </div>
          <div className={styles.statCard}>
            <span className={`${styles.statDot} ${styles.dotResolved}`} />
            <span className={styles.statValue}>{stats.resolved}</span>
            <span className={styles.statLabel}>Resolved</span>
          </div>
        </div>
      )}

      {/* TICKETS TAB */}
      {activeTab === 'tickets' && (
        <>
          {tickets.length === 0 ? (
            <div className={styles.friendlyEmpty}>
              <div className={styles.friendlyEmptyIcon}>
                <LifeBuoy size={28} />
              </div>
              <h3>No tickets yet</h3>
              <p>
                {isInboxView
                  ? "When your team runs into an issue, it'll show up here."
                  : 'Something not working? Open a ticket and your organization owner will get back to you.'}
              </p>
              {!isInboxView && canCreate && (
                <button
                  className={styles.primaryButton}
                  onClick={() => setShowCreate(true)}
                >
                  <Plus size={16} />
                  Open a ticket
                </button>
              )}
            </div>
          ) : (
            <div className={styles.inboxGrid} data-view={view}>
              {/* LIST PANE */}
              <div className={styles.listPane}>
                <div className={styles.filtersBar}>
                  <div className={styles.searchWrap}>
                    <Search size={15} className={styles.searchIcon} />
                    <input
                      type="text"
                      className={styles.searchInput}
                      placeholder="Search tickets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className={styles.filterGroup}>
                    <select
                      className={styles.filterSelect}
                      value={statusFilter}
                      onChange={(e) =>
                        setStatusFilter(e.target.value as typeof statusFilter)
                      }
                    >
                      <option value="ALL">All statuses</option>
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                    {categories.length > 0 && (
                      <select
                        className={styles.filterSelect}
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                      >
                        <option value="ALL">All categories</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    )}
                    <button
                      type="button"
                      className={styles.sortButton}
                      title="Change sort order"
                      onClick={() =>
                        setSortOrder((prev) =>
                          prev === 'recent'
                            ? 'priority'
                            : prev === 'priority'
                              ? 'oldest'
                              : 'recent',
                        )
                      }
                    >
                      <ArrowUpDown size={13} />
                      {sortOrder === 'recent'
                        ? 'Recent'
                        : sortOrder === 'priority'
                          ? 'Priority'
                          : 'Oldest'}
                    </button>
                  </div>
                </div>

                {filtered.length === 0 ? (
                  <div className={styles.emptyState}>
                    <Filter size={28} className={styles.emptyIcon} />
                    <h3>No tickets match</h3>
                    <p>Try adjusting the search or filters.</p>
                  </div>
                ) : (
                  <div className={styles.threadList}>
                    {filtered.map((t) => {
                      const preview = t.description;
                      const isActive = t.id === selectedTicketId;
                      return (
                        <button
                          key={t.id}
                          className={`${styles.threadItem} ${
                            isActive ? styles.threadItemActive : ''
                          }`}
                          onClick={() => openTicket(t.id)}
                        >
                          <div className={styles.threadAvatar}>
                            {initials(t.user)}
                          </div>
                          <div className={styles.threadMain}>
                            <div className={styles.threadTop}>
                              <span className={styles.threadName}>
                                {canViewAll ? userName(t.user) : t.title}
                              </span>
                              <span className={styles.threadTime}>
                                {formatRelative(t.updatedAt)}
                              </span>
                            </div>
                            <div className={styles.threadTitleRow}>
                              <PriorityDot priority={t.priority} />
                              <span className={styles.threadTitle}>
                                {canViewAll ? t.title : preview}
                              </span>
                            </div>
                            {canViewAll && (
                              <div className={styles.threadPreview}>
                                {preview}
                              </div>
                            )}
                            <div className={styles.threadMeta}>
                              <StatusPill status={t.status} />
                              <span className={styles.threadMetaItem}>
                                <Tag size={10} />
                                {t.category?.name ?? 'Uncategorized'}
                              </span>
                              <span className={styles.threadMetaItem}>
                                <MessageSquare size={10} />
                                {t._count?.messages ?? 0}
                              </span>
                              {t.productKey && (
                                <span className={styles.productTag}>
                                  {t.productKey}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* DETAIL PANE */}
              <div className={styles.detailPane}>
                {selectedTicketId && selectedTicket ? (
                  <ThreadPanel
                    ticket={selectedTicket}
                    loading={loadingDetail}
                    canManage={canManage}
                    activeOrgId={activeOrgId!}
                    currentUserId={suiteContext?.user?.id}
                    onBack={closeDetail}
                    onRefresh={() => refreshDetail(selectedTicket.id)}
                    onRefreshList={loadList}
                    setToast={setToast}
                  />
                ) : selectedTicketId && loadingDetail ? (
                  <div className={styles.detailEmpty}>
                    <Loader2 size={22} className={styles.spinning} />
                  </div>
                ) : (
                  <div className={styles.detailEmpty}>
                    <MessageSquare size={30} />
                    <h3>Select a ticket</h3>
                    <p>Pick a conversation from the list to read and reply.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* GUIDES TAB */}
      {activeTab === 'guides' && (
        <GuidesPanel
          guides={guides}
          loading={loadingGuides}
          products={suiteContext?.products ?? []}
        />
      )}

      {/* CREATE MODAL */}
      {showCreate && (
        <CreateTicketModal
          categories={categories}
          products={suiteContext?.products ?? []}
          activeOrgId={activeOrgId!}
          onClose={() => setShowCreate(false)}
          onCreated={async () => {
            setShowCreate(false);
            await loadList();
            setToast({
              type: 'success',
              message: 'Ticket created',
            });
          }}
          setToast={setToast}
        />
      )}
    </div>
  );
}

// ============================================================
// GUIDES PANEL
// ============================================================

function GuidesPanel({
  guides,
  loading,
  products,
}: {
  guides: Guide[];
  loading: boolean;
  products: { key: string; name: string; isActive: boolean }[];
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('ALL');

  const categories = useMemo(() => {
    const set = new Set(guides.map((g) => g.category).filter(Boolean));
    return Array.from(set);
  }, [guides]);

  const productName = (key: string | null) =>
    products.find((p) => p.key === key)?.name ?? key;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return guides.filter((g) => {
      if (category !== 'ALL' && g.category !== category) return false;
      if (!q) return true;
      return (
        g.title.toLowerCase().includes(q) ||
        g.summary.toLowerCase().includes(q)
      );
    });
  }, [guides, query, category]);

  if (loading) {
    return (
      <div className={styles.guidesGrid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={`g-${i}`} className={styles.skeletonGuide}>
            <SkeletonBlock className={styles.skeletonLine} />
            <SkeletonBlock className={styles.skeletonLineShort} />
            <SkeletonBlock className={styles.skeletonLineTiny} />
          </div>
        ))}
      </div>
    );
  }

  if (guides.length === 0) {
    return (
      <div className={styles.friendlyEmpty}>
        <div className={styles.friendlyEmptyIcon}>
          <BookOpen size={28} />
        </div>
        <h3>No guides yet</h3>
        <p>Help articles and how-tos will show up here once published.</p>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.filtersBar}>
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search guides..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {categories.length > 0 && (
          <div className={styles.filterGroup}>
            <select
              className={styles.filterSelect}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="ALL">All topics</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <Filter size={28} className={styles.emptyIcon} />
          <h3>No guides match</h3>
          <p>Try a different search or topic.</p>
        </div>
      ) : (
        <div className={styles.guidesGrid}>
          {filtered.map((g) => {
            const content = (
              <>
                <div className={styles.guideTop}>
                  <span className={styles.guideCategory}>{g.category}</span>
                  {g.url && <ExternalLink size={13} className={styles.guideLinkIcon} />}
                </div>
                <h3 className={styles.guideTitle}>{g.title}</h3>
                <p className={styles.guideSummary}>{g.summary}</p>
                <div className={styles.guideMeta}>
                  {g.productKey && (
                    <span className={styles.productTag}>
                      {productName(g.productKey)}
                    </span>
                  )}
                  <span className={styles.guideUpdated}>
                    Updated {formatRelative(g.updatedAt)}
                  </span>
                </div>
              </>
            );
            return g.url ? (
              <a
                key={g.id}
                href={g.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.guideCard}
              >
                {content}
              </a>
            ) : (
              <div key={g.id} className={styles.guideCard}>
                {content}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// CREATE TICKET MODAL
// ============================================================

function CreateTicketModal({
  categories,
  products,
  activeOrgId,
  onClose,
  onCreated,
  setToast,
}: {
  categories: Category[];
  products: { key: string; name: string; isActive: boolean }[];
  activeOrgId: string;
  onClose: () => void;
  onCreated: () => void;
  setToast: (t: { type: 'success' | 'error'; message: string } | null) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM');
  const [productKey, setProductKey] = useState('');
  const [saving, setSaving] = useState(false);

  const activeProducts = products.filter((p) => p.isActive);
  const showProductPicker = activeProducts.length >= 2;

  // Derive the default category during render — no effect, no cascading render.
  const defaultCategoryId = useMemo(() => {
    if (categories.length === 0) return '';
    const other = categories.find((c) => c.slug === 'other') ?? categories[0];
    return other.id;
  }, [categories]);

  // If the user hasn't picked one, fall back to the derived default.
  const effectiveCategoryId = categoryId || defaultCategoryId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || title.trim().length < 3) {
      setToast({ type: 'error', message: 'Title must be at least 3 characters.' });
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setToast({
        type: 'error',
        message: 'Description must be at least 10 characters.',
      });
      return;
    }
    if (!effectiveCategoryId) {
      setToast({ type: 'error', message: 'Choose a category.' });
      return;
    }

    setSaving(true);
    try {
      await api.post(`/api/v1/organizations/${activeOrgId}/support/tickets`, {
        title: title.trim(),
        description: description.trim(),
        categoryId: effectiveCategoryId,
        priority,
        productKey: productKey || undefined,
      });
      onCreated();
    } catch (err) {
      setToast({
        type: 'error',
        message: getErrorMessage(err, 'Failed to create ticket'),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <Plus size={18} />
            New Support Ticket
          </h2>
          <button className={styles.modalClose} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short summary of the issue"
              autoFocus
              maxLength={120}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What happened? What did you expect?"
              rows={5}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Category</label>
              <select
                value={effectiveCategoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                {categories.length === 0 ? (
                  <option value="">Loading…</option>
                ) : (
                  categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Priority</label>
              <select
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as TicketPriority)
                }
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          {showProductPicker && (
            <div className={styles.formGroup}>
              <label>Product (optional)</label>
              <select
                value={productKey}
                onChange={(e) => setProductKey(e.target.value)}
              >
                <option value="">Not specific to a product</option>
                {activeProducts.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

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
                <Loader2 size={15} className={styles.spinning} />
              ) : (
                <Send size={15} />
              )}
              {saving ? 'Creating…' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// THREAD PANEL (ticket conversation)
// ============================================================

function ThreadPanel({
  ticket,
  loading,
  canManage,
  activeOrgId,
  currentUserId,
  onBack,
  onRefresh,
  onRefreshList,
  setToast,
}: {
  ticket: TicketDetail;
  loading: boolean;
  canManage: boolean;
  activeOrgId: string;
  currentUserId: string | undefined;
  onBack: () => void;
  onRefresh: () => void;
  onRefreshList: () => void;
  setToast: (t: { type: 'success' | 'error'; message: string } | null) => void;
}) {
  const [reply, setReply] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ block: 'end' });
  }, [ticket.messages.length, loading]);

  const handleSend = async () => {
    if (!reply.trim() || reply.trim().length < 2) return;
    setSending(true);
    try {
      await api.post(
        `/api/v1/organizations/${activeOrgId}/support/tickets/${ticket.id}/messages`,
        {
          message: reply.trim(),
          isInternal,
        },
      );
      setReply('');
      setIsInternal(false);
      onRefresh();
      setToast({ type: 'success', message: 'Reply sent' });
    } catch (err) {
      setToast({
        type: 'error',
        message: getErrorMessage(err, 'Failed to send reply'),
      });
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (status: TicketStatus) => {
    if (status === ticket.status) return;
    setUpdatingStatus(true);
    try {
      await api.patch(
        `/api/v1/organizations/${activeOrgId}/support/tickets/${ticket.id}`,
        { status },
      );
      onRefresh();
      onRefreshList();
      setToast({ type: 'success', message: 'Status updated' });
    } catch (err) {
      setToast({
        type: 'error',
        message: getErrorMessage(err, 'Failed to update status'),
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePriorityChange = async (priority: TicketPriority) => {
    if (priority === ticket.priority) return;
    setUpdatingStatus(true);
    try {
      await api.patch(
        `/api/v1/organizations/${activeOrgId}/support/tickets/${ticket.id}`,
        { priority },
      );
      onRefresh();
      onRefreshList();
      setToast({ type: 'success', message: 'Priority updated' });
    } catch (err) {
      setToast({
        type: 'error',
        message: getErrorMessage(err, 'Failed to update priority'),
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.thread}>
      {/* HEADER */}
      <div className={styles.threadHeader}>
        <button className={styles.backButton} onClick={onBack}>
          <ArrowLeft size={14} />
          <span className={styles.backButtonLabel}>Back</span>
        </button>

        <div className={styles.threadHeaderMain}>
          <h2 className={styles.threadHeaderTitle}>{ticket.title}</h2>
          <div className={styles.detailMeta}>
            Opened by {userName(ticket.user)} · {formatAbsolute(ticket.createdAt)}
            {ticket.category && ` · ${ticket.category.name}`}
          </div>
        </div>

        {canManage ? (
          <div className={styles.detailControls}>
            <select
              className={styles.detailSelect}
              value={ticket.status}
              onChange={(e) =>
                handleStatusChange(e.target.value as TicketStatus)
              }
              disabled={updatingStatus}
            >
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
            <select
              className={styles.detailSelect}
              value={ticket.priority}
              onChange={(e) =>
                handlePriorityChange(e.target.value as TicketPriority)
              }
              disabled={updatingStatus}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        ) : (
          <div className={styles.detailBadges}>
            <StatusPill status={ticket.status} />
            <PriorityPill priority={ticket.priority} />
          </div>
        )}
      </div>

      {/* CONVERSATION */}
      <div className={styles.threadBody}>
        {/* Original description, as the first bubble */}
        <MessageBubble
          author={userName(ticket.user)}
          initials={initials(ticket.user)}
          time={formatAbsolute(ticket.createdAt)}
          body={ticket.description}
          isMine={ticket.user.id === currentUserId}
          isInternal={false}
        />

        {loading ? (
          <div className={styles.detailLoading}>
            <Loader2 size={18} className={styles.spinning} />
            <span>Loading…</span>
          </div>
        ) : (
          ticket.messages.map((m) => (
            <MessageBubble
              key={m.id}
              author={userName(m.user)}
              initials={initials(m.user)}
              time={formatAbsolute(m.createdAt)}
              body={m.message}
              isMine={m.userId === currentUserId}
              isInternal={m.isInternal}
            />
          ))
        )}
        <div ref={threadEndRef} />
      </div>

      {/* REPLY */}
      {ticket.status !== 'CLOSED' ? (
        <div className={styles.replyBox}>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a reply… (⌘/Ctrl + Enter to send)"
            rows={3}
            className={styles.replyInput}
          />
          <div className={styles.replyActions}>
            {canManage && (
              <label className={styles.internalToggle}>
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                />
                Internal note
              </label>
            )}
            <button
              className={styles.submitButton}
              onClick={handleSend}
              disabled={sending || reply.trim().length < 2}
            >
              {sending ? (
                <Loader2 size={15} className={styles.spinning} />
              ) : (
                <Send size={15} />
              )}
              {sending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.closedBanner}>
          <AlertCircle size={14} />
          This ticket is closed. Reopen it from the status selector above if
          needed.
        </div>
      )}
    </div>
  );
}

function MessageBubble({
  author,
  initials: authorInitials,
  time,
  body,
  isMine,
  isInternal,
}: {
  author: string;
  initials: string;
  time: string;
  body: string;
  isMine: boolean;
  isInternal: boolean;
}) {
  return (
    <div
      className={`${styles.messageRow} ${isMine ? styles.messageRowMine : ''}`}
    >
      <div
        className={`${styles.avatarCircle} ${
          isMine ? styles.avatarCircleMine : ''
        }`}
      >
        {authorInitials}
      </div>
      <div
        className={`${styles.messageBubble} ${
          isMine ? styles.messageBubbleMine : ''
        } ${isInternal ? styles.messageBubbleInternal : ''}`}
      >
        <div className={styles.messageHeader}>
          <span className={styles.messageAuthor}>
            {author}
            {isInternal && <span className={styles.internalTag}>Internal</span>}
          </span>
          <span className={styles.messageTime}>{time}</span>
        </div>
        <div className={styles.messageBody}>{body}</div>
      </div>
    </div>
  );
}