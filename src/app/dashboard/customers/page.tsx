// app/dashboard/customers/page.tsx
// ============================================================
// FUTURE: KxCRM INTEGRATION
// ============================================================
// The Suite customers page is a read-only viewer today. When
// KxCRM ships as a product, this page becomes a discovery
// surface: an "Open in KxCRM" link will appear in the drawer,
// visible only when the org has KxCRM active.
//
// The plumbing is already in place:
//   - suiteContext.products exposes active products
//   - customer.createdByProduct records the source product
//
// No structural change will be needed — only a conditional
// <Link /> in the drawer footer.
// ============================================================
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import { api } from '@/lib/axios';
import { AxiosError } from 'axios';
import {
  Users,
  Search,
  X,
  Building2,
  User as UserIcon,
  Phone,
  Mail,
  MapPin,
  Filter,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldOff,
} from 'lucide-react';
import styles from './page.module.css';

// ============================================================
// TYPES
// ============================================================

type Customer = {
  id: string;
  name: string;
  customerType: 'INDIVIDUAL' | 'BUSINESS';
  phone: string | null;
  email: string | null;
  taxNumber: string | null;
  companyName: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  source: string | null;
  createdByProduct: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const SOURCE_LABELS: Record<string, string> = {
  WALK_IN: 'Walk-in',
  REFERRAL: 'Referral',
  FACEBOOK: 'Facebook',
  WEBSITE: 'Website',
  WHATSAPP: 'WhatsApp',
  OTHER: 'Other',
};

function sourceLabel(source: string | null): string | null {
  if (!source) return null;
  return SOURCE_LABELS[source] || source;
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
      <span className={styles.srOnly}>Loading customers…</span>

      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <SkeletonBlock className={styles.skeletonAvatar} />
          <div style={{ flex: 1 }}>
            <SkeletonBlock className={styles.skeletonTitle} />
            <SkeletonBlock className={styles.skeletonSubtitle} />
          </div>
        </div>
      </div>

      <div className={styles.filtersBar}>
        <SkeletonBlock className={styles.skeletonSearch} />
        <SkeletonBlock className={styles.skeletonFilter} />
      </div>

      <div className={styles.list}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={`r-${i}`} className={styles.skeletonRow}>
            <SkeletonBlock className={styles.skeletonAvatarSm} />
            <div style={{ flex: 1 }}>
              <SkeletonBlock className={styles.skeletonLine} />
              <SkeletonBlock className={styles.skeletonLineShort} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// MAIN
// ============================================================

export default function CustomersPage() {
  const { activeOrganization } = useAuth();
  const { hasPermission, isOwner, isReady } = usePermissions();

  const activeOrgId = activeOrganization?.id;
  const canView = isOwner || hasPermission('customers.view');

  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INDIVIDUAL' | 'BUSINESS'>('ALL');
  const [offset, setOffset] = useState(0);
  const limit = 25;

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // ============================================================
  // FETCH
  // ============================================================

  const loadCustomers = useCallback(async () => {
    if (!activeOrgId) return;
    try {
      const params: Record<string, string | number> = {
        limit,
        offset,
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (typeFilter !== 'ALL') params.customerType = typeFilter;

      const res = await api.get(
        `/api/v1/organizations/${activeOrgId}/customers`,
        { params },
      );
      setCustomers(res.data.items ?? []);
      setTotal(res.data.total ?? 0);
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  }, [activeOrgId, offset, searchQuery, typeFilter]);

useEffect(() => {
  if (!isReady || !canView) return;

  let cancelled = false;

  const load = async () => {
    setLoading(true);
    try {
      await loadCustomers();
    } finally {
      if (!cancelled) setLoading(false);
    }
  };

  load();

  return () => {
    cancelled = true;
  };
}, [isReady, canView, loadCustomers]);
  // ============================================================
  // PAGINATION
  // ============================================================

  const totalPages = useMemo(() => Math.ceil(total / limit), [total]);
  const currentPage = Math.floor(offset / limit) + 1;
  const hasPrev = offset > 0;
  const hasNext = offset + limit < total;

  // ============================================================
  // GATES
  // ============================================================

  if (!isReady) return null;

  if (!canView) {
    return (
      <div className={styles.page}>
        <div className={styles.noAccess}>
          <ShieldOff size={40} />
          <h2>Customers are restricted</h2>
          <p>
            You don&apos;t have permission to view customer records. Ask your
            organization owner for access.
          </p>
        </div>
      </div>
    );
  }

  if (loading && customers.length === 0) return <PageSkeleton />;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerAvatar}>
            <Users size={22} />
          </div>
          <div>
            <div className={styles.headerTitleRow}>
              <h1 className={styles.headerTitle}>Customers</h1>
              <span className={styles.orgBadge}>
                {total.toLocaleString()} total
              </span>
            </div>
            <p className={styles.headerSubtitle}>
              Everyone your organization does business with
            </p>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className={styles.filtersBar}>
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by name, phone, or email…"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setOffset(0);
           }}
          />
          {searchQuery && (
            <button
              type="button"
              className={styles.clearSearch}
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>
        <div className={styles.filterGroup}>
          <select
            className={styles.filterSelect}
            value={typeFilter}
            onChange={(e) => {
  setTypeFilter(e.target.value as typeof typeFilter);
  setOffset(0);
}}
          >
            <option value="ALL">All types</option>
            <option value="INDIVIDUAL">Individuals</option>
            <option value="BUSINESS">Businesses</option>
          </select>
        </div>
      </div>

      {/* LIST */}
      {customers.length === 0 ? (
        <div className={styles.friendlyEmpty}>
          <div className={styles.friendlyEmptyIcon}>
            <Users size={28} />
          </div>
          <h3>
            {searchQuery || typeFilter !== 'ALL'
              ? 'No customers match your filters'
              : 'No customers yet'}
          </h3>
          <p>
            {searchQuery || typeFilter !== 'ALL'
              ? 'Try adjusting your search or filters.'
              : 'Customers appear here as your team records sales and adds them in KxTill.'}
          </p>
        </div>
      ) : (
        <>
          <div className={styles.list}>
            {customers.map((c) => (
              <button
                key={c.id}
                type="button"
                className={styles.row}
                onClick={() => setSelectedCustomer(c)}
              >
                <div className={styles.rowIcon}>
                  {c.customerType === 'BUSINESS' ? (
                    <Building2 size={15} />
                  ) : (
                    <UserIcon size={15} />
                  )}
                </div>

                <div className={styles.rowMain}>
                  <div className={styles.rowName}>
                    {c.name}
                    {c.customerType === 'BUSINESS' && (
                      <span className={styles.typeBadge}>Business</span>
                    )}
                  </div>
                  <div className={styles.rowMeta}>
                    {c.phone && <span>{c.phone}</span>}
                    {c.phone && c.email && <span className={styles.dot}>·</span>}
                    {c.email && <span>{c.email}</span>}
                    {!c.phone && !c.email && (
                      <span className={styles.noContact}>No contact info</span>
                    )}
                  </div>
                </div>

                <div className={styles.rowRight}>
                  {c.source && (
                    <span className={styles.sourceTag}>
                      {sourceLabel(c.source)}
                    </span>
                  )}
                  <span className={styles.rowDate}>
                    {formatDate(c.createdAt)}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* PAGINATION */}
          {total > limit && (
            <div className={styles.pagination}>
              <div className={styles.paginationInfo}>
                Showing {offset + 1}–{Math.min(offset + limit, total)} of{' '}
                {total.toLocaleString()}
              </div>
              <div className={styles.paginationControls}>
                <button
                  type="button"
                  className={styles.paginationButton}
                  disabled={!hasPrev}
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                >
                  <ChevronLeft size={16} />
                </button>
                <span className={styles.paginationPage}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  className={styles.paginationButton}
                  disabled={!hasNext}
                  onClick={() => setOffset(offset + limit)}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* DRAWER */}
      {selectedCustomer && (
        <CustomerDrawer
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
}

// ============================================================
// DRAWER
// ============================================================

function CustomerDrawer({
  customer,
  onClose,
}: {
  customer: Customer;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const initials = customer.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  return (
    <div className={styles.drawerOverlay} onClick={onClose}>
      <aside
        className={styles.drawer}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Customer details"
      >
        <header className={styles.drawerHeader}>
          <div className={styles.drawerAvatar}>
            {customer.customerType === 'BUSINESS' ? (
              <Building2 size={22} />
            ) : (
              <span>{initials || <UserIcon size={20} />}</span>
            )}
          </div>
          <div className={styles.drawerHeaderText}>
            <h2 className={styles.drawerName}>{customer.name}</h2>
            <div className={styles.drawerSubRow}>
              <span className={styles.drawerType}>
                {customer.customerType === 'BUSINESS'
                  ? 'Business'
                  : 'Individual'}
              </span>
              {customer.source && (
                <>
                  <span className={styles.drawerDot}>·</span>
                  <span className={styles.drawerSource}>
                    via {sourceLabel(customer.source)}
                  </span>
                </>
              )}
            </div>
          </div>
          <button
            type="button"
            className={styles.drawerClose}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>

        <div className={styles.drawerBody}>
          {/* CONTACT */}
          <section className={styles.drawerSection}>
            <h3 className={styles.drawerSectionTitle}>Contact</h3>

            {customer.phone && (
              <div className={styles.drawerRow}>
                <span className={styles.drawerRowIcon}>
                  <Phone size={13} />
                </span>
                <span className={styles.drawerRowValue}>{customer.phone}</span>
              </div>
            )}

            {customer.email && (
              <div className={styles.drawerRow}>
                <span className={styles.drawerRowIcon}>
                  <Mail size={13} />
                </span>
                <a
                  className={styles.drawerRowLink}
                  href={`mailto:${customer.email}`}
                >
                  {customer.email}
                </a>
              </div>
            )}

            {(customer.address || customer.city || customer.country) && (
              <div className={styles.drawerRow}>
                <span className={styles.drawerRowIcon}>
                  <MapPin size={13} />
                </span>
                <span className={styles.drawerRowValue}>
                  {[customer.address, customer.city, customer.country]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </div>
            )}

            {!customer.phone &&
              !customer.email &&
              !customer.address &&
              !customer.city &&
              !customer.country && (
                <p className={styles.drawerEmpty}>No contact info recorded.</p>
              )}
          </section>

          {/* BUSINESS */}
          {customer.customerType === 'BUSINESS' && (
            <section className={styles.drawerSection}>
              <h3 className={styles.drawerSectionTitle}>Business</h3>
              {customer.companyName && (
                <div className={styles.drawerRow}>
                  <span className={styles.drawerRowLabel}>Company</span>
                  <span className={styles.drawerRowValue}>
                    {customer.companyName}
                  </span>
                </div>
              )}
              {customer.taxNumber && (
                <div className={styles.drawerRow}>
                  <span className={styles.drawerRowLabel}>Tax number</span>
                  <span className={styles.drawerRowValue}>
                    {customer.taxNumber}
                  </span>
                </div>
              )}
            </section>
          )}

          {/* NOTES */}
          {customer.notes && (
            <section className={styles.drawerSection}>
              <h3 className={styles.drawerSectionTitle}>Notes</h3>
              <p className={styles.drawerNotes}>{customer.notes}</p>
            </section>
          )}

          {/* META */}
          <section className={styles.drawerSection}>
            <h3 className={styles.drawerSectionTitle}>Record</h3>
            <div className={styles.drawerRow}>
              <span className={styles.drawerRowLabel}>Added</span>
              <span className={styles.drawerRowValue}>
                {formatDate(customer.createdAt)}
              </span>
            </div>
            {customer.createdByProduct && (
              <div className={styles.drawerRow}>
                <span className={styles.drawerRowLabel}>Source product</span>
                <span className={styles.drawerProductTag}>
                  {customer.createdByProduct}
                </span>
              </div>
            )}
            <div className={styles.drawerRow}>
              <span className={styles.drawerRowLabel}>Status</span>
              <span
                className={`${styles.drawerStatus} ${
                  customer.isActive ? styles.drawerStatusActive : ''
                }`}
              >
                {customer.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </section>
        </div>

        <footer className={styles.drawerFooter}>
          <p className={styles.drawerFooterNote}>
            Customers are managed from the product they were created in.
          </p>
        </footer>
      </aside>
    </div>
  );
}