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

function ListSkeleton() {
  return (
    <div className={styles.page} aria-busy="true" aria-live="polite">
      <span className={styles.srOnly}>Loading support tickets…</span>

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

      <div className={styles.filtersBar}>
        <SkeletonBlock className={styles.skeletonSearch} />
        <SkeletonBlock className={styles.skeletonFilter} />
        <SkeletonBlock className={styles.skeletonFilter} />
      </div>

      <div className={styles.ticketList}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={`t-${i}`} className={styles.skeletonTicket}>
            <SkeletonBlock className={styles.skeletonLine} />
            <SkeletonBlock className={styles.skeletonLineShort} />
            <SkeletonBlock className={styles.skeletonLineTiny} />
          </div>
        ))}
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

// ============================================================
// MAIN PAGE
// ============================================================

export default function SupportPage() {
  const { activeOrganization, suiteContext } = useAuth();
  const { isOwner, hasPermission, isReady } = usePermissions();

  const activeOrgId = activeOrganization?.id;

  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(
    null,
  );
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TicketStatus>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

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
  // FETCH DETAIL
  // ============================================================

  const openTicket = async (ticketId: string) => {
    if (!activeOrgId) return;
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

  // ============================================================
  // FILTERED LIST
  // ============================================================

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tickets.filter((t) => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (categoryFilter !== 'ALL' && t.category?.id !== categoryFilter)
        return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    });
  }, [tickets, searchQuery, statusFilter, categoryFilter]);

  // ============================================================
  // GATES
  // ============================================================

  if (!isReady) return null;

  if (!canCreate && !canViewAll) {
    // No permission to even see anything.
    // In practice, every member has `support.tickets.create` by default
    // via org defaults, but the guard is here for safety.
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

  if (loading) return <ListSkeleton />;

  // ============================================================
  // DETAIL VIEW
  // ============================================================

  if (selectedTicket) {
    return (
      <TicketDetailView
        ticket={selectedTicket}
        loading={loadingDetail}
        canManage={canManage}
        activeOrgId={activeOrgId!}
        currentUserId={suiteContext?.user?.id}
        onBack={() => setSelectedTicket(null)}
        onRefresh={() => refreshDetail(selectedTicket.id)}
        onRefreshList={loadList}
        setToast={setToast}
        toast={toast}
        setToastNull={() => setToast(null)}
      />
    );
  }

  // ============================================================
  // LIST VIEW
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
                ? 'Tickets from your team'
                : 'Your support tickets'}
            </p>
          </div>
        </div>
        {canCreate && !isInboxView && (
          <button
            className={styles.primaryButton}
            onClick={() => setShowCreate(true)}
          >
            <Plus size={16} />
            Open a ticket
          </button>
        )}
      </div>

      {/* FILTERS */}
      {tickets.length > 0 && (
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
          </div>
        </div>
      )}

      {/* LIST */}
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
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <Filter size={32} className={styles.emptyIcon} />
          <h3>No tickets match your filters</h3>
          <p>Try adjusting the search or filters.</p>
        </div>
      ) : (
        <div className={styles.ticketList}>
          {filtered.map((t) => (
            <button
              key={t.id}
              className={styles.ticketCard}
              onClick={() => openTicket(t.id)}
            >
              <div className={styles.ticketCardTop}>
                <div className={styles.ticketCardBadges}>
                  <StatusPill status={t.status} />
                  <PriorityPill priority={t.priority} />
                  {t.productKey && (
                    <span className={styles.productTag}>{t.productKey}</span>
                  )}
                </div>
                <span className={styles.ticketTime}>
                  <Clock size={11} />
                  {formatRelative(t.createdAt)}
                </span>
              </div>

              <div className={styles.ticketTitle}>{t.title}</div>
              <div className={styles.ticketDesc}>{t.description}</div>

              <div className={styles.ticketMeta}>
                <span className={styles.ticketMetaItem}>
                  <Tag size={11} />
                  {t.category?.name ?? 'Uncategorized'}
                </span>
                <span className={styles.ticketMetaItem}>
                  <MessageSquare size={11} />
                  {t._count?.messages ?? 0} message
                  {(t._count?.messages ?? 0) === 1 ? '' : 's'}
                </span>
                {canViewAll && (
                  <span className={styles.ticketMetaItem}>
                    by {userName(t.user)}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
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
// TICKET DETAIL VIEW
// ============================================================

function TicketDetailView({
  ticket,
  loading,
  canManage,
  activeOrgId,
  currentUserId,
  onBack,
  onRefresh,
  onRefreshList,
  setToast,
  toast,
  setToastNull,
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
  toast: { type: 'success' | 'error'; message: string } | null;
  setToastNull: () => void;
}) {
  const [reply, setReply] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

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

  return (
    <div className={styles.page}>
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={setToastNull} />
      )}

      {/* BACK */}
      <button className={styles.backButton} onClick={onBack}>
        <ArrowLeft size={14} />
        Back to tickets
      </button>

      {/* HEADER */}
      <div className={styles.detailHeader}>
        <div className={styles.detailHeaderMain}>
          <h1 className={styles.detailTitle}>{ticket.title}</h1>
          <div className={styles.detailBadges}>
            <StatusPill status={ticket.status} />
            <PriorityPill priority={ticket.priority} />
            {ticket.category && (
              <span className={styles.categoryPill}>
                <Tag size={11} />
                {ticket.category.name}
              </span>
            )}
            {ticket.productKey && (
              <span className={styles.productTag}>{ticket.productKey}</span>
            )}
          </div>
          <div className={styles.detailMeta}>
            Opened by {userName(ticket.user)} · {formatAbsolute(ticket.createdAt)}
          </div>
        </div>

        {canManage && (
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
        )}
      </div>

      {/* ORIGINAL DESCRIPTION */}
      <div className={styles.originalMessage}>
        <div className={styles.messageHeader}>
          <span className={styles.messageAuthor}>
            {userName(ticket.user)}
          </span>
          <span className={styles.messageTime}>
            {formatAbsolute(ticket.createdAt)}
          </span>
        </div>
        <div className={styles.messageBody}>{ticket.description}</div>
      </div>

      {/* THREAD */}
      {loading ? (
        <div className={styles.detailLoading}>
          <Loader2 size={20} className={styles.spinning} />
          <span>Loading…</span>
        </div>
      ) : ticket.messages.length === 0 ? (
        <div className={styles.emptyThread}>
          No replies yet.
        </div>
      ) : (
        <div className={styles.thread}>
          {ticket.messages.map((m) => {
            const isMine = m.userId === currentUserId;
            return (
              <div
                key={m.id}
                className={`${styles.messageItem} ${
                  isMine ? styles.messageMine : ''
                } ${m.isInternal ? styles.messageInternal : ''}`}
              >
                <div className={styles.messageHeader}>
                  <span className={styles.messageAuthor}>
                    {userName(m.user)}
                    {m.isInternal && (
                      <span className={styles.internalTag}>Internal</span>
                    )}
                  </span>
                  <span className={styles.messageTime}>
                    {formatAbsolute(m.createdAt)}
                  </span>
                </div>
                <div className={styles.messageBody}>{m.message}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* REPLY */}
      {ticket.status !== 'CLOSED' && (
        <div className={styles.replyBox}>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write a reply…"
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
      )}

      {ticket.status === 'CLOSED' && (
        <div className={styles.closedBanner}>
          <AlertCircle size={14} />
          This ticket is closed. Reopen it from the status selector above if
          needed.
        </div>
      )}
    </div>
  );
}