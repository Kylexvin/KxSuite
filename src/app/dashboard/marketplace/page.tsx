// app/dashboard/marketplace/page.tsx

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import { api } from '@/lib/axios';
import { AxiosError } from 'axios';
import {
  ShoppingBag,
  Search,
  Check,
  AlertTriangle,
  Plus,
  X,
  ArrowRight,
  Info,
  Settings,
  Sparkles,
} from 'lucide-react';
import styles from './page.module.css';

// ============================================================
// TYPES — mirror the API responses exactly
// ============================================================

type CatalogProduct = {
  id: string;
  key: string;
  name: string;
  version: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type OrgProduct = {
  id: string;
  productId: string;
  productKey: string;
  productName: string;
  productDescription: string | null;
  activatedAt: string;
  isActive: boolean;
};

type SubscriptionPlan = {
  id: string;
  productKey: string;
  key: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  trialDays: number;
  features: unknown[];
  limits: unknown | null;
  isActive: boolean;
};

type Subscription = {
  id: string;
  organizationId: string;
  productKey: string;
  planId: string;
  status: string; // TRIAL | ACTIVE | GRACE | EXPIRED | SUSPENDED | CANCELLED
  trialStart: string | null;
  trialEnd: string | null;
  graceStart: string | null;
  graceEnd: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
  expiredAt: string | null;
  plan: SubscriptionPlan;
  remainingDays: number;
  isActive: boolean;
  isTrial: boolean;
  isExpired: boolean;
  isGrace: boolean;
  isSuspended: boolean;
  isCancelled: boolean;
};

type TrialBurn = {
  productKey: string;
  burnedAt: string;
};

type MarketplaceCard = {
  productKey: string;
  name: string;
  description: string;
  icon: string | null;
  version: string;
  kind: 'owned' | 'available' | 'comingSoon';
  subscription?: Subscription;
  orgProduct?: OrgProduct;
  trialBurned?: boolean;
  highlights?: string[];
};

type ApiErrorResponse = {
  message?: string;
  error?: string;
  [key: string]: unknown;
};

// ============================================================
// STATIC CATALOG — products not yet published to /api/v1/products
// Only entries whose `key` is missing from the API response render.
// Once a product is published, it disappears from this list.
// ============================================================

type StaticCatalogEntry = {
  key: string;
  name: string;
  description: string;
  highlights?: string[];
};

const STATIC_COMING_SOON: StaticCatalogEntry[] = [
  // ===== Flagship (revenue products) =====
  {
    key: 'kxtill',
    name: 'KxTill',
    description: 'Point of Sale & Inventory',
    highlights: ['Sell', 'Inventory', 'Payments'],
  },
  {
    key: 'kxinvoice',
    name: 'KxInvoice',
    description: 'Invoicing, eTIMS, tax compliance',
    highlights: ['Invoices', 'eTIMS', 'Tax'],
  },
  {
    key: 'kxcrm',
    name: 'KxCRM',
    description: 'Customers, leads, sales pipeline',
    highlights: ['Leads', 'Contacts', 'Pipeline'],
  },

  // ===== Operations =====
  { key: 'kxhr', name: 'KxHR', description: 'Staff, attendance, leave, payroll' },
  { key: 'kxwork', name: 'KxWork', description: 'Tasks, work orders, field teams' },
  { key: 'kxassets', name: 'KxAssets', description: 'Asset tracking & maintenance' },
  { key: 'kxprocure', name: 'KxProcure', description: 'Purchases & supplier management' },
  { key: 'kxinventory', name: 'KxInventory', description: 'Standalone inventory module' },
  { key: 'kxwarehouse', name: 'KxWarehouse', description: 'Multi-warehouse stock operations' },
  { key: 'kxfleet', name: 'KxFleet', description: 'Vehicles, fuel, maintenance' },

  // ===== Finance =====
  { key: 'kxaccounts', name: 'KxAccounts', description: 'Accounting & bookkeeping' },
  { key: 'kxexpenses', name: 'KxExpenses', description: 'Expense management' },
  { key: 'kxpayments', name: 'KxPayments', description: 'Payment collection & reconciliation' },
  { key: 'kxsubscriptions', name: 'KxSubscriptions', description: 'Recurring billing engine' },

  // ===== Commerce =====
  { key: 'kxstore', name: 'KxStore', description: 'Online store builder' },
  { key: 'kxorders', name: 'KxOrders', description: 'Order management' },
  { key: 'kxbookings', name: 'KxBookings', description: 'Appointments & reservations' },
  { key: 'kxdelivery', name: 'KxDelivery', description: 'Delivery tracking' },
  { key: 'kxloyalty', name: 'KxLoyalty', description: 'Rewards & customer loyalty' },

  // ===== Communication =====
  { key: 'kxchat', name: 'KxChat', description: 'Internal business chat' },
  { key: 'kxsupport', name: 'KxSupport', description: 'Customer support tickets' },
  { key: 'kxnotify', name: 'KxNotify', description: 'SMS, Email, WhatsApp campaigns' },
  { key: 'kxforms', name: 'KxForms', description: 'Forms & surveys' },

  // ===== Data & Intelligence =====
  { key: 'kxanalytics', name: 'KxAnalytics', description: 'Cross-product reporting' },
  { key: 'kxinsights', name: 'KxInsights', description: 'AI-powered recommendations' },
  { key: 'kxforecast', name: 'KxForecast', description: 'Sales & inventory forecasting' },
  { key: 'kxbi', name: 'KxBI', description: 'Executive dashboards' },

  // ===== Education =====
  { key: 'kxschool', name: 'KxSchool', description: 'School administration' },
  { key: 'kxfees', name: 'KxFees', description: 'Fee collection' },
  { key: 'kxlibrary', name: 'KxLibrary', description: 'Library management' },
  { key: 'kxhostel', name: 'KxHostel', description: 'Hostel management' },

  // ===== Healthcare =====
  { key: 'kxclinic', name: 'KxClinic', description: 'Clinic management' },
  { key: 'kxpharmacy', name: 'KxPharmacy', description: 'Pharmacy POS' },
  { key: 'kxpatients', name: 'KxPatients', description: 'Patient records' },

  // ===== Real Estate =====
  { key: 'kxproperty', name: 'KxProperty', description: 'Property management' },
  { key: 'kxrent', name: 'KxRent', description: 'Rent collection' },
  { key: 'kxmaintenance', name: 'KxMaintenance', description: 'Property maintenance' },

  // ===== Logistics =====
  { key: 'kxcargo', name: 'KxCargo', description: 'Cargo & freight' },
  { key: 'kxtrack', name: 'KxTrack', description: 'Shipment tracking' },
  { key: 'kxdispatch', name: 'KxDispatch', description: 'Dispatch operations' },
];

// ============================================================
// HELPERS
// ============================================================

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse;
    return data?.message || data?.error || fallback;
  }
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return fallback;
}

function isImageIcon(icon: string | null | undefined): icon is string {
  if (!icon) return false;
  return /^https?:\/\//i.test(icon) || icon.includes('cloudinary');
}

type StatusTone =
  | 'active'
  | 'trial'
  | 'grace'
  | 'expired'
  | 'available'
  | 'comingSoon';

function statusFromSubscription(sub: Subscription | undefined): {
  label: string;
  tone: StatusTone;
} {
  if (!sub) return { label: 'Available', tone: 'available' };

  switch (sub.status) {
    case 'TRIAL':
      return { label: 'Trial', tone: 'trial' };
    case 'ACTIVE':
      return { label: 'Active', tone: 'active' };
    case 'GRACE':
      return { label: 'Grace', tone: 'grace' };
    case 'EXPIRED':
      return { label: 'Expired', tone: 'expired' };
    case 'SUSPENDED':
      return { label: 'Suspended', tone: 'expired' };
    case 'CANCELLED':
      return { label: 'Cancelled', tone: 'expired' };
    default:
      return { label: sub.status, tone: 'available' };
  }
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
    success: <Check size={16} />,
    error: <AlertTriangle size={16} />,
    info: <Info size={16} />,
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
        <X size={14} />
      </button>
    </div>
  );
}

// ============================================================
// PRODUCT ICON
// ============================================================

function ProductIcon({
  icon,
  name,
  size = 'md',
}: {
  icon: string | null | undefined;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClass =
    size === 'sm'
      ? styles.productIconSm
      : size === 'lg'
      ? styles.productIconLg
      : styles.productIcon;

  if (isImageIcon(icon)) {
    return (
      <div className={sizeClass}>
        <Image
          src={icon}
          alt={name}
          className={styles.productIconImg}
          width={64}
          height={64}
          unoptimized
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className={sizeClass}>
      <span>{name.charAt(0)}</span>
    </div>
  );
}

// ============================================================
// STATUS PILL
// ============================================================

function StatusPill({
  tone,
  label,
  days,
}: {
  tone: StatusTone;
  label: string;
  days?: number;
}) {
  const toneClass = {
    active: styles.pillActive,
    trial: styles.pillTrial,
    grace: styles.pillGrace,
    expired: styles.pillExpired,
    available: styles.pillAvailable,
    comingSoon: styles.pillComingSoon,
  }[tone];

  return (
    <span className={`${styles.pill} ${toneClass}`}>
      <span className={styles.pillDot} />
      {label}
      {typeof days === 'number' &&
        (tone === 'trial' || tone === 'active' || tone === 'grace') &&
        days >= 0 && <span className={styles.pillDays}>· {days}d</span>}
    </span>
  );
}

// ============================================================
// SKELETON
// ============================================================

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`${styles.skeleton} ${className ?? ''}`} />;
}

function MarketplaceSkeleton() {
  return (
    <div className={styles.page} aria-busy="true" aria-live="polite">
      <span className={styles.srOnly}>Loading marketplace…</span>

      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <SkeletonBlock className={styles.skeletonHeaderIcon} />
          <div style={{ flex: 1 }}>
            <SkeletonBlock className={styles.skeletonTitle} />
            <SkeletonBlock className={styles.skeletonSubtitle} />
          </div>
        </div>
      </div>

      <div className={styles.searchWrap}>
        <SkeletonBlock className={styles.skeletonSearch} />
      </div>

      <div className={styles.productGrid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={`p-${i}`} className={styles.productCard}>
            <div className={styles.cardHeader}>
              <SkeletonBlock className={styles.skeletonCardIcon} />
              <SkeletonBlock className={styles.skeletonStatus} />
            </div>
            <SkeletonBlock className={styles.skeletonCardTitle} />
            <SkeletonBlock className={styles.skeletonCardDesc} />
            <div className={styles.cardFooter}>
              <SkeletonBlock className={styles.skeletonCardBtn} />
              <SkeletonBlock className={styles.skeletonCardBtn} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function MarketplacePage() {
  const router = useRouter();
  const { activeOrganization, loadSuiteContext } = useAuth();
  const { isOwner } = usePermissions();

  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [orgProducts, setOrgProducts] = useState<OrgProduct[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [trialBurns, setTrialBurns] = useState<TrialBurn[]>([]);

  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmProduct, setConfirmProduct] = useState<MarketplaceCard | null>(
    null,
  );
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // ============================================================
  // LOAD — four parallel calls
  // ============================================================

  const loadAll = useCallback(async () => {
    if (!activeOrganization) return;

    try {
      setLoading(true);
      const orgId = activeOrganization.id;

      const [catalogRes, orgRes, subsRes, burnsRes] = await Promise.all([
        api.get<{ products: CatalogProduct[] }>('/api/v1/products'),
        api.get<{ products: OrgProduct[] }>(
          `/api/v1/products/organizations/${orgId}/products`,
        ),
        api.get<{ subscriptions: Subscription[] }>(
          `/api/v1/organizations/${orgId}/subscriptions`,
        ),
        api
          .get<{ burns: TrialBurn[] }>(
            `/api/v1/organizations/${orgId}/trial-burns`,
          )
          .catch(() => ({ data: { burns: [] as TrialBurn[] } })),
      ]);

      setCatalog(catalogRes.data.products || []);
      setOrgProducts(orgRes.data.products || []);
      setSubscriptions(subsRes.data.subscriptions || []);
      setTrialBurns(burnsRes.data.burns || []);
    } catch (err: unknown) {
      console.error('Failed to load marketplace:', err);
      setToast({
        type: 'error',
        message: 'Failed to load marketplace. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }, [activeOrganization]);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      if (!activeOrganization || cancelled) return;
      await loadAll();
      if (cancelled) return;
    };

    void refresh();

    return () => {
      cancelled = true;
    };
  }, [activeOrganization, loadAll]);

  // ============================================================
  // MERGE INTO CARDS
  // ============================================================

  const cards: MarketplaceCard[] = useMemo(() => {
    const subsByKey = new Map(
      subscriptions.map((s) => [s.productKey.toLowerCase(), s]),
    );
    const orgByKey = new Map(
      orgProducts.map((p) => [p.productKey.toLowerCase(), p]),
    );
    const burnedKeys = new Set(
      trialBurns.map((b) => b.productKey.toLowerCase()),
    );
    const publishedKeys = new Set(catalog.map((p) => p.key.toLowerCase()));

    const owned: MarketplaceCard[] = [];
    const available: MarketplaceCard[] = [];
    const comingSoon: MarketplaceCard[] = [];

    // --- 1. Everything the API returned ---
    for (const product of catalog) {
      const key = product.key.toLowerCase();
      const sub = subsByKey.get(key);
      const orgP = orgByKey.get(key);
      const isOwned = !!orgP || !!sub;

      const card: MarketplaceCard = {
        productKey: product.key,
        name: product.name,
        description: product.description ?? '',
        icon: product.icon,
        version: product.version,
        kind: isOwned ? 'owned' : 'available',
        subscription: sub,
        orgProduct: orgP,
        trialBurned: burnedKeys.has(key),
      };

      if (!product.isActive) {
        comingSoon.push({ ...card, kind: 'comingSoon' });
      } else if (isOwned) {
        owned.push(card);
      } else {
        available.push(card);
      }
    }

    // --- 2. Static entries the API hasn't published yet ---
    for (const entry of STATIC_COMING_SOON) {
      const key = entry.key.toLowerCase();
      if (publishedKeys.has(key)) continue; // API wins

      comingSoon.push({
        productKey: entry.key,
        name: entry.name,
        description: entry.description,
        icon: null,
        version: '1.0.0',
        kind: 'comingSoon',
        trialBurned: false,
        highlights: entry.highlights,
      });
    }

    return [...owned, ...available, ...comingSoon];
  }, [catalog, orgProducts, subscriptions, trialBurns]);

  const ownedCards = useMemo(
    () => cards.filter((c) => c.kind === 'owned'),
    [cards],
  );
  const availableCards = useMemo(
    () => cards.filter((c) => c.kind === 'available'),
    [cards],
  );
  const comingSoonCards = useMemo(
    () => cards.filter((c) => c.kind === 'comingSoon'),
    [cards],
  );

  // ---- Filter by search --------------------------------------------
  const filterFn = useCallback(
    (card: MarketplaceCard) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        card.name.toLowerCase().includes(q) ||
        card.description.toLowerCase().includes(q) ||
        (card.highlights ?? []).some((h) => h.toLowerCase().includes(q))
      );
    },
    [searchQuery],
  );

  const filteredOwned = ownedCards.filter(filterFn);
  const filteredAvailable = availableCards.filter(filterFn);
  const filteredComingSoon = comingSoonCards.filter(filterFn);

  const hasAnyResults =
    filteredOwned.length + filteredAvailable.length + filteredComingSoon.length >
    0;

  // ============================================================
  // ACTIVATE
  // ============================================================

  const doActivate = async (productKey: string) => {
    if (!activeOrganization) return;

    setActivating(productKey);
    setToast(null);

    try {
      await api.post(
        `/api/v1/products/organizations/${activeOrganization.id}/products/activate`,
        { productKey },
      );

      await loadAll();
      await loadSuiteContext(activeOrganization.id);

      setToast({
        type: 'success',
        message: `${productKey} activated successfully.`,
      });
    } catch (err: unknown) {
      const error = err as AxiosError<ApiErrorResponse>;
      if (error.response?.status === 400) {
        await loadAll();
        setToast({
          type: 'info',
          message: `${productKey} is already activated.`,
        });
      } else {
        setToast({
          type: 'error',
          message: getErrorMessage(err, `Failed to activate ${productKey}`),
        });
      }
    } finally {
      setActivating(null);
      setConfirmProduct(null);
    }
  };

  const handleConfirmActivate = () => {
    if (!confirmProduct) return;
    doActivate(confirmProduct.productKey);
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) return <MarketplaceSkeleton />;

  // ============================================================
  // RENDER CARD
  // ============================================================

  const renderCard = (card: MarketplaceCard) => {
    const { label, tone } = statusFromSubscription(card.subscription);
    const days = card.subscription?.remainingDays;
    const isActivating = activating === card.productKey;

    const isOwned = card.kind === 'owned';
    const isComingSoon = card.kind === 'comingSoon';
    const isAvailable = card.kind === 'available';

    const canOpen = isOwned && !isComingSoon;
    const canManage = isOwned && !isComingSoon;
    const canActivate = isAvailable && isOwner;
    const trialBurned = card.trialBurned ?? false;

    return (
      <article
        key={card.productKey}
        className={`${styles.productCard} ${
          isComingSoon ? styles.productCardDisabled : ''
        }`}
      >
        <div className={styles.cardHeader}>
          <ProductIcon icon={card.icon} name={card.name} />
          {isComingSoon ? (
            <span className={`${styles.pill} ${styles.pillComingSoon}`}>
              <span className={styles.pillDot} />
              Coming soon
            </span>
          ) : (
            <StatusPill tone={tone} label={label} days={days} />
          )}
        </div>

        <h3 className={styles.productName}>{card.name}</h3>
        {card.description && (
          <p className={styles.productTagline}>{card.description}</p>
        )}
        {card.highlights && card.highlights.length > 0 && (
          <p className={styles.productHighlights}>
            {card.highlights.join(' • ')}
          </p>
        )}

        <div className={styles.cardFooter}>
          {canOpen && (
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => router.push(`/kx/${card.productKey}`)}
            >
              View
              <ArrowRight size={14} />
            </button>
          )}
          {canManage && (
            <button
              type="button"
              className={styles.detailsBtn}
              onClick={() => router.push('/dashboard/billing')}
            >
              <Settings size={14} />
              Manage
            </button>
          )}

          {canActivate && !trialBurned && (
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => setConfirmProduct(card)}
              disabled={isActivating}
            >
              {isActivating ? (
                <>
                  <span className={styles.spinnerSmall} />
                  Activating…
                </>
              ) : (
                <>
                  <Plus size={14} />
                  Activate
                </>
              )}
            </button>
          )}

          {canActivate && trialBurned && (
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => setConfirmProduct(card)}
              disabled={isActivating}
              title="Trial already used. Activate to request payment."
            >
              {isActivating ? (
                <>
                  <span className={styles.spinnerSmall} />
                  Activating…
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Activate &amp; Contact us
                </>
              )}
            </button>
          )}

          {isAvailable && !isOwner && (
            <span className={styles.readOnlyHint}>
              <Info size={12} />
              Ask your owner to activate
            </span>
          )}

          {isComingSoon && (
            <button type="button" className={styles.primaryBtn} disabled>
              Coming soon
            </button>
          )}
        </div>
      </article>
    );
  };

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
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <ShoppingBag size={22} />
          </div>
          <div className={styles.headerText}>
            <h1 className={styles.headerTitle}>Marketplace</h1>
            <p className={styles.headerSubtitle}>
              Discover KXBYTE products and activate what your organization
              needs. Manage plans and billing from{' '}
              <button
                type="button"
                className={styles.inlineLink}
                onClick={() => router.push('/dashboard/billing')}
              >
                Billing
              </button>
              .
            </p>
          </div>
        </div>
      </header>

      {/* ===== SEARCH ===== */}
      <div className={styles.searchWrap}>
        <Search size={15} className={styles.searchIcon} />
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* ===== EMPTY STATE ===== */}
      {!hasAnyResults && (
        <div className={styles.emptyState}>
          <ShoppingBag size={40} className={styles.emptyIcon} />
          <h3>No products match your search</h3>
          <p>Try a different search term.</p>
        </div>
      )}

      {/* ===== YOUR PRODUCTS ===== */}
      {filteredOwned.length > 0 && (
        <section className={styles.section}>
          <header className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Your Products</h2>
            <span className={styles.sectionCount}>{filteredOwned.length}</span>
          </header>
          <div className={styles.productGrid}>
            {filteredOwned.map(renderCard)}
          </div>
        </section>
      )}

      {ownedCards.length === 0 && searchQuery === '' && (
        <div className={styles.emptyInline}>
          You haven&apos;t activated any products yet.
        </div>
      )}

      {/* ===== AVAILABLE PRODUCTS ===== */}
      {filteredAvailable.length > 0 && (
        <section className={styles.section}>
          <header className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Available Products</h2>
            <span className={styles.sectionCount}>
              {filteredAvailable.length}
            </span>
          </header>
          <div className={styles.productGrid}>
            {filteredAvailable.map(renderCard)}
          </div>
        </section>
      )}

      {/* ===== COMING SOON ===== */}
      {filteredComingSoon.length > 0 && (
        <section className={styles.section}>
          <header className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Coming Soon</h2>
            <span className={styles.sectionCount}>
              {filteredComingSoon.length}
            </span>
          </header>
          <div className={styles.productGrid}>
            {filteredComingSoon.map(renderCard)}
          </div>
        </section>
      )}

      {/* ===== ACTIVATION CONFIRM MODAL ===== */}
      {confirmProduct && (
        <div
          className={styles.modalOverlay}
          onClick={() => setConfirmProduct(null)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                Activate {confirmProduct.name}?
              </h2>
              <button
                className={styles.modalClose}
                onClick={() => setConfirmProduct(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBodySimple}>
              {confirmProduct.trialBurned ? (
                <p>
                  Your organization&apos;s trial for{' '}
                  <strong>{confirmProduct.name}</strong> has already been used.
                  Activating will request payment — our team will reach out to
                  complete setup.
                </p>
              ) : (
                <p>
                  You&apos;re about to activate{' '}
                  <strong>{confirmProduct.name}</strong>. Your free trial will
                  start immediately. You can manage billing at any time.
                </p>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.modalCancel}
                onClick={() => setConfirmProduct(null)}
              >
                Cancel
              </button>
              <button
                className={styles.modalPrimary}
                onClick={handleConfirmActivate}
                disabled={activating === confirmProduct.productKey}
              >
                {activating === confirmProduct.productKey ? (
                  'Activating…'
                ) : (
                  <>
                    <Check size={14} />
                    {confirmProduct.trialBurned
                      ? 'Activate & request payment'
                      : 'Activate'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}