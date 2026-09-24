// app/dashboard/billing/page.tsx

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/axios';
import { AxiosError } from 'axios';
import {
  CreditCard,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Ban,
  ArrowRight,
  X,
  Check,
  AlertCircle,
  RefreshCw,
  Wallet,
  Copy,
  Send,
  Receipt,
  ExternalLink,
  Info,
} from 'lucide-react';
import styles from './page.module.css';

// ============================================================
// TYPES — mirror GET /organizations/:orgId/billing exactly
// ============================================================

type BillingOrganization = {
  id: string;
  name: string;
  slug: string;
  currency: string;
};

type BillingSummary = {
  nextDueAt: string | null;
  totalMonthly: number | null;
  currency: string;
  outstanding: number;
  activeProductCount: number;
  pendingPaymentCount: number;
};

type PlanInfo = {
  key: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  trialDays: number;
};

type WhatHappensNext = {
  title: string;
  body: string;
  graceStartsAt: string | null;
  graceEndsAt: string | null;
};

type AccessInfo = {
  included: string[];
  restricted: string[];
};

type AmountInfo = {
  accountNumber: string;
  suggestedAmount: number | null;
  currency: string;
  amountIsCustom: boolean;
  displayAmount: string;
};

type PaymentInstructions = {
  paybill: string | null;
  accountNumber: string | null;
  tillNumber: string | null;
  mpesaPhone: string | null;
  bankName: string | null;
  bankAccount: string | null;
  bankAccountName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  steps: string[];
  alternatives: string[];
};

type Payment = {
  id: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  method: string;
  reference: string;
  paidAt: string | null;
  createdAt: string;
  periodStart: string | null;
  periodEnd: string | null;
  notes: string | null;
};

type BillingProduct = {
  productKey: string;
  productName: string;
  status: 'TRIAL' | 'ACTIVE' | 'GRACE' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED';
  isActive: boolean;
  isTrial: boolean;
  isGrace: boolean;
  isExpired: boolean;
  isSuspended: boolean;
  isCancelled: boolean;
  remainingDays: number;
  phaseStartAt: string | null;
  phaseEndsAt: string | null;
  trialStart: string | null;
  trialEnd: string | null;
  graceStart: string | null;
  graceEnd: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  expiredAt: string | null;
  nextDueAt: string | null;
  plan: PlanInfo;
  whatHappensNext: WhatHappensNext;
  access: AccessInfo;
  amount: AmountInfo;
  paymentInstructions: PaymentInstructions;
  payments: Payment[];
};

type BillingResponse = {
  organization: BillingOrganization;
  summary: BillingSummary;
  products: BillingProduct[];
};

type ApiErrorResponse = {
  message?: string;
  error?: string;
  [key: string]: unknown;
};

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

function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(date: string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatMoney(amount: number | null, currency = 'KES'): string {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

type StatusTone =
  | 'active'
  | 'trial'
  | 'grace'
  | 'expired'
  | 'cancelled'
  | 'suspended';

function toneFromStatus(
  status: BillingProduct['status'],
): { tone: StatusTone; label: string } {
  switch (status) {
    case 'TRIAL':
      return { tone: 'trial', label: 'Trial' };
    case 'ACTIVE':
      return { tone: 'active', label: 'Active' };
    case 'GRACE':
      return { tone: 'grace', label: 'Grace' };
    case 'EXPIRED':
      return { tone: 'expired', label: 'Expired' };
    case 'SUSPENDED':
      return { tone: 'suspended', label: 'Suspended' };
    case 'CANCELLED':
      return { tone: 'cancelled', label: 'Cancelled' };
    default:
      return { tone: 'expired', label: status };
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
    cancelled: styles.pillCancelled,
    suspended: styles.pillSuspended,
  }[tone];

  return (
    <span className={`${styles.pill} ${toneClass}`}>
      <span className={styles.pillDot} />
      {label}
      {typeof days === 'number' &&
        (tone === 'trial' || tone === 'active' || tone === 'grace') &&
        days >= 0 && <span className={styles.pillDays}>· {days}d left</span>}
    </span>
  );
}

// ============================================================
// SKELETON
// ============================================================

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`${styles.skeleton} ${className ?? ''}`} />;
}

function BillingSkeleton() {
  return (
    <div className={styles.page} aria-busy="true" aria-live="polite">
      <span className={styles.srOnly}>Loading billing…</span>

      <div className={styles.header}>
        <SkeletonBlock className={styles.skeletonHeaderIcon} />
        <div style={{ flex: 1 }}>
          <SkeletonBlock className={styles.skeletonTitle} />
          <SkeletonBlock className={styles.skeletonSubtitle} />
        </div>
      </div>

      <div className={styles.summaryBar}>
        <SkeletonBlock className={styles.skeletonSummaryItem} />
        <SkeletonBlock className={styles.skeletonSummaryItem} />
        <SkeletonBlock className={styles.skeletonSummaryItem} />
      </div>

      <div className={styles.productStack}>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={`p-${i}`} className={styles.productCard}>
            <SkeletonBlock className={styles.skeletonCardTitle} />
            <SkeletonBlock className={styles.skeletonCardDesc} />
            <SkeletonBlock className={styles.skeletonCardBody} />
            <SkeletonBlock className={styles.skeletonCardBody} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// COPY BUTTON
// ============================================================

function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // no-op
    }
  };

  return (
    <button
      type="button"
      className={styles.copyBtn}
      onClick={copy}
      aria-label={label ?? `Copy ${value}`}
      title={label ?? 'Copy'}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
    </button>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function BillingPage() {
  const router = useRouter();
  const { activeOrganization, loadSuiteContext } = useAuth();

  const [billing, setBilling] = useState<BillingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [openProduct, setOpenProduct] = useState<string | null>(null);
  const [openTab, setOpenTab] = useState<'instructions' | 'history'>(
    'instructions',
  );
  const [notifyProduct, setNotifyProduct] = useState<BillingProduct | null>(
    null,
  );
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // ============================================================
  // LOAD
  // ============================================================

  const loadBilling = useCallback(async () => {
    if (!activeOrganization) return;

    setLoading(true);
    try {
      const res = await api.get<{ data: BillingResponse }>(
        `/api/v1/organizations/${activeOrganization.id}/billing`,
      );
      setBilling(res.data.data);
    } catch (err: unknown) {
      console.error('Failed to load billing:', err);
      setToast({
        type: 'error',
        message: getErrorMessage(err, 'Failed to load billing information.'),
      });
    } finally {
      setLoading(false);
    }
  }, [activeOrganization]);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const fetchData = async () => {
      if (!activeOrganization) return;

      setLoading(true);
      try {
        const res = await api.get<{ data: BillingResponse }>(
          `/api/v1/organizations/${activeOrganization.id}/billing`,
        );
        if (isMounted) {
          setBilling(res.data.data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error('Failed to load billing:', err);
          setToast({
            type: 'error',
            message: getErrorMessage(err, 'Failed to load billing information.'),
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [activeOrganization]);

  // ============================================================
  // DERIVED
  // ============================================================

  const summary = billing?.summary;
  const products = billing?.products ?? [];

  const currency = summary?.currency ?? billing?.organization.currency ?? 'KES';

  const hasAnything = products.length > 0;

  // ============================================================
  // ACTIONS
  // ============================================================

  const handleOpenProduct = (productKey: string) => {
    router.push(`/kx/${productKey}`);
  };

  const handleNotify = (product: BillingProduct) => {
    setNotifyProduct(product);
  };

  // ============================================================
  // LOADING / EMPTY
  // ============================================================

  if (loading) return <BillingSkeleton />;

  if (!billing) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyState}>
          <CreditCard size={40} className={styles.emptyIcon} />
          <h3>Could not load billing</h3>
          <p>Try again in a moment.</p>
        </div>
      </div>
    );
  }

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
            <CreditCard size={22} />
          </div>
          <div className={styles.headerText}>
            <h1 className={styles.headerTitle}>Billing</h1>
            <p className={styles.headerSubtitle}>
              What you own, what&apos;s due, and how to pay. Browse new products in
              the{' '}
              <button
                type="button"
                className={styles.inlineLink}
                onClick={() => router.push('/dashboard/marketplace')}
              >
                Marketplace
              </button>
              .
            </p>
          </div>
        </div>
      </header>

      {/* ===== SUMMARY BAR ===== */}
      {hasAnything && summary && (
        <div className={styles.summaryBar}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Next due</span>
            <span className={styles.summaryValue}>
              {formatDate(summary.nextDueAt)}
            </span>
          </div>
          <div className={styles.summaryDivider} />
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Active products</span>
            <span className={styles.summaryValue}>
              {summary.activeProductCount}
            </span>
          </div>
          <div className={styles.summaryDivider} />
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Outstanding</span>
            <span
              className={`${styles.summaryValue} ${
                summary.outstanding > 0 ? styles.summaryWarn : ''
              }`}
            >
              {formatMoney(summary.outstanding, currency)}
            </span>
          </div>
          <div className={styles.summaryDivider} />
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Pending payments</span>
            <span
              className={`${styles.summaryValue} ${
                summary.pendingPaymentCount > 0 ? styles.summaryWarn : ''
              }`}
            >
              {summary.pendingPaymentCount}
            </span>
          </div>
        </div>
      )}

      {/* ===== EMPTY ===== */}
      {!hasAnything && (
        <div className={styles.emptyState}>
          <CreditCard size={40} className={styles.emptyIcon} />
          <h3>No products yet</h3>
          <p>
            Once you activate a product in the Marketplace, it will show up
            here.
          </p>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => router.push('/dashboard/marketplace')}
          >
            Browse Marketplace
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* ===== PRODUCTS ===== */}
      {hasAnything && (
        <div className={styles.productStack}>
          {products.map((product) => (
            <ProductBillingCard
              key={product.productKey}
              product={product}
              isOpen={openProduct === product.productKey}
              activeTab={
                openProduct === product.productKey ? openTab : 'instructions'
              }
              onToggle={() => {
                if (openProduct === product.productKey) {
                  setOpenProduct(null);
                } else {
                  setOpenProduct(product.productKey);
                  setOpenTab('instructions');
                }
              }}
              onTabChange={setOpenTab}
              onOpenProduct={handleOpenProduct}
              onNotify={handleNotify}
            />
          ))}
        </div>
      )}

      {/* ===== NOTIFY PAYMENT MODAL ===== */}
      {notifyProduct && (
        <NotifyPaymentModal
          product={notifyProduct}
          currency={currency}
          organizationId={billing.organization.id}
          onClose={() => setNotifyProduct(null)}
          onSuccess={async (msg) => {
            setNotifyProduct(null);
            setToast({ type: 'success', message: msg });
            await loadBilling();
            await loadSuiteContext(billing.organization.id);
          }}
          onError={(msg) => setToast({ type: 'error', message: msg })}
        />
      )}
    </div>
  );
}

// ============================================================
// PRODUCT BILLING CARD
// ============================================================

function ProductBillingCard({
  product,
  isOpen,
  activeTab,
  onToggle,
  onTabChange,
  onOpenProduct,
  onNotify,
}: {
  product: BillingProduct;
  isOpen: boolean;
  activeTab: 'instructions' | 'history';
  onToggle: () => void;
  onTabChange: (tab: 'instructions' | 'history') => void;
  onOpenProduct: (key: string) => void;
  onNotify: (product: BillingProduct) => void;
}) {
  const { tone, label } = toneFromStatus(product.status);

  const cardClass = {
    active: styles.productCardActive,
    trial: styles.productCardTrial,
    grace: styles.productCardGrace,
    expired: styles.productCardExpired,
    cancelled: styles.productCardExpired,
    suspended: styles.productCardExpired,
  }[tone];

  return (
    <article className={`${styles.productCard} ${cardClass}`}>
      {/* === HEAD === */}
      <div className={styles.productHead}>
        <div className={styles.productHeadLeft}>
          <div className={styles.productIcon}>
            {product.productName.charAt(0).toUpperCase()}
          </div>
          <div className={styles.productHeadText}>
            <h3 className={styles.productName}>{product.productName}</h3>
            <div className={styles.productPlanLine}>
              {product.plan.name} Plan ·{' '}
              {product.plan.price > 0
                ? `${formatMoney(product.plan.price, product.plan.currency)} / ${product.plan.interval.toLowerCase()}`
                : 'Custom pricing'}
            </div>
          </div>
        </div>

        <div className={styles.productHeadRight}>
          <StatusPill
            tone={tone}
            label={label}
            days={product.remainingDays}
          />
        </div>
      </div>

      {/* === PHASE === */}
      <div className={styles.productPhase}>
        <div className={styles.phaseRow}>
          <span className={styles.phaseLabel}>
            {product.status === 'TRIAL' ? 'Trial ends' : 'Renews on'}
          </span>
          <span className={styles.phaseValue}>
            {formatDate(product.phaseEndsAt ?? product.currentPeriodEnd)}
          </span>
        </div>
        {product.whatHappensNext?.body && (
          <p className={styles.whatNext}>{product.whatHappensNext.body}</p>
        )}
      </div>

      {/* === AMOUNT === */}
      <div className={styles.productAmount}>
        <div className={styles.amountRow}>
          <span className={styles.amountLabel}>Amount due</span>
          <span className={styles.amountValue}>
            {product.amount.displayAmount}
          </span>
        </div>
        <div className={styles.amountRow}>
          <span className={styles.amountLabel}>Account number</span>
          <span className={styles.amountValueMono}>
            {product.amount.accountNumber}
            <CopyButton value={product.amount.accountNumber} />
          </span>
        </div>
      </div>

      {/* === ACTIONS === */}
      <div className={styles.productActions}>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={() => onNotify(product)}
        >
          <Send size={14} />
          I&apos;ve paid
        </button>

        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={onToggle}
          aria-expanded={isOpen}
        >
          {isOpen ? 'Hide details' : 'Payment details'}
        </button>

        <button
          type="button"
          className={styles.ghostBtn}
          onClick={() => onOpenProduct(product.productKey)}
        >
          Open {product.productName}
          <ExternalLink size={12} />
        </button>
      </div>

      {/* === EXPANDED === */}
      {isOpen && (
        <div className={styles.expanded}>
          <div className={styles.tabBar}>
            <button
              type="button"
              className={`${styles.tab} ${
                activeTab === 'instructions' ? styles.tabActive : ''
              }`}
              onClick={() => onTabChange('instructions')}
            >
              <Wallet size={13} />
              Payment instructions
            </button>
            <button
              type="button"
              className={`${styles.tab} ${
                activeTab === 'history' ? styles.tabActive : ''
              }`}
              onClick={() => onTabChange('history')}
            >
              <Receipt size={13} />
              Payment history
              {product.payments.length > 0 && (
                <span className={styles.tabBadge}>
                  {product.payments.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'instructions' && (
            <PaymentInstructionsPanel
              instructions={product.paymentInstructions}
              amount={product.amount}
            />
          )}

          {activeTab === 'history' && (
            <PaymentHistoryPanel
              payments={product.payments}
              currency={product.amount.currency}
            />
          )}
        </div>
      )}
    </article>
  );
}

// ============================================================
// PAYMENT INSTRUCTIONS PANEL
// ============================================================

function PaymentInstructionsPanel({
  instructions,
  amount,
}: {
  instructions: PaymentInstructions;
  amount: AmountInfo;
}) {
  const hasMpesa = instructions.paybill || instructions.tillNumber;
  const hasBank = instructions.bankName && instructions.bankAccount;

  return (
    <div className={styles.panel}>
      {/* Steps */}
      {instructions.steps.length > 0 && (
        <div className={styles.panelSection}>
          <h4 className={styles.panelHeading}>How to pay</h4>
          <ol className={styles.stepsList}>
            {instructions.steps.map((step, i) => (
              <li key={i} className={styles.stepItem}>
                <span className={styles.stepNumber}>{i + 1}</span>
                <span className={styles.stepText}>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Channels */}
      <div className={styles.panelGrid}>
        {hasMpesa && (
          <div className={styles.channelBox}>
            <div className={styles.channelHead}>
              <Wallet size={13} />
              M-PESA
            </div>
            {instructions.paybill && (
              <div className={styles.channelRow}>
                <span className={styles.channelLabel}>Paybill</span>
                <span className={styles.channelValue}>
                  {instructions.paybill}
                  <CopyButton value={instructions.paybill} />
                </span>
              </div>
            )}
            {instructions.tillNumber && (
              <div className={styles.channelRow}>
                <span className={styles.channelLabel}>Till</span>
                <span className={styles.channelValue}>
                  {instructions.tillNumber}
                  <CopyButton value={instructions.tillNumber} />
                </span>
              </div>
            )}
            {instructions.accountNumber && (
              <div className={styles.channelRow}>
                <span className={styles.channelLabel}>Account</span>
                <span className={styles.channelValue}>
                  {instructions.accountNumber}
                  <CopyButton value={instructions.accountNumber} />
                </span>
              </div>
            )}
            {instructions.mpesaPhone && (
              <div className={styles.channelRow}>
                <span className={styles.channelLabel}>Send money</span>
                <span className={styles.channelValue}>
                  {instructions.mpesaPhone}
                  <CopyButton value={instructions.mpesaPhone} />
                </span>
              </div>
            )}
          </div>
        )}

        {hasBank && (
          <div className={styles.channelBox}>
            <div className={styles.channelHead}>
              <CreditCard size={13} />
              Bank transfer
            </div>
            <div className={styles.channelRow}>
              <span className={styles.channelLabel}>Bank</span>
              <span className={styles.channelValue}>
                {instructions.bankName}
              </span>
            </div>
            <div className={styles.channelRow}>
              <span className={styles.channelLabel}>Account</span>
              <span className={styles.channelValue}>
                {instructions.bankAccount}
                <CopyButton value={instructions.bankAccount!} />
              </span>
            </div>
            {instructions.bankAccountName && (
              <div className={styles.channelRow}>
                <span className={styles.channelLabel}>Name</span>
                <span className={styles.channelValue}>
                  {instructions.bankAccountName}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contact */}
      {(instructions.contactEmail || instructions.contactPhone) && (
        <div className={styles.panelSection}>
          <h4 className={styles.panelHeading}>Send proof of payment</h4>
          <div className={styles.contactRow}>
            {instructions.contactEmail && (
              <a
                className={styles.contactChip}
                href={`mailto:${instructions.contactEmail}`}
              >
                {instructions.contactEmail}
              </a>
            )}
            {instructions.contactPhone && (
              <a
                className={styles.contactChip}
                href={`tel:${instructions.contactPhone}`}
              >
                {instructions.contactPhone}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Alternatives */}
      {instructions.alternatives.length > 0 && (
        <div className={styles.panelSection}>
          <h4 className={styles.panelHeading}>Alternatives</h4>
          <ul className={styles.alternativesList}>
            {instructions.alternatives.map((alt, i) => (
              <li key={i} className={styles.alternativeItem}>
                {alt}
              </li>
            ))}
          </ul>
        </div>
      )}

      {amount.amountIsCustom && (
        <p className={styles.customAmountNote}>
          <Info size={12} />
          Amount is custom for this product. Contact us to confirm before
          paying.
        </p>
      )}
    </div>
  );
}

// ============================================================
// PAYMENT HISTORY PANEL
// ============================================================

function PaymentHistoryPanel({
  payments,

}: {
  payments: Payment[];
  currency: string;
}) {
  if (payments.length === 0) {
    return (
      <div className={styles.historyEmpty}>
        <Receipt size={20} />
        <p>No payments yet.</p>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <ul className={styles.historyList}>
        {payments.map((p) => {
          const statusClass =
            p.status === 'COMPLETED'
              ? styles.payCompleted
              : p.status === 'PENDING'
              ? styles.payPending
              : p.status === 'FAILED'
              ? styles.payFailed
              : styles.payRefunded;

          return (
            <li key={p.id} className={styles.historyItem}>
              <div className={styles.historyTop}>
                <span className={styles.historyAmount}>
                  {formatMoney(p.amount, p.currency)}
                </span>
                <span className={`${styles.payStatus} ${statusClass}`}>
                  {p.status}
                </span>
              </div>
              <div className={styles.historyMeta}>
                <span>{p.method}</span>
                <span>·</span>
                <span className={styles.historyRef}>{p.reference}</span>
              </div>
              <div className={styles.historyTime}>
                {p.paidAt
                  ? `Paid ${formatDateTime(p.paidAt)}`
                  : `Submitted ${formatDateTime(p.createdAt)}`}
              </div>
              {p.notes && <div className={styles.historyNotes}>{p.notes}</div>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ============================================================
// NOTIFY PAYMENT MODAL
// ============================================================

function NotifyPaymentModal({
  product,
  currency,
  organizationId,
  onClose,
  onSuccess,
  onError,
}: {
  product: BillingProduct;
  currency: string;
  organizationId: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [amount, setAmount] = useState<string>(
    product.amount.suggestedAmount !== null
      ? String(product.amount.suggestedAmount)
      : '',
  );
  const [method, setMethod] = useState<string>('MPESA');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    reference.trim().length > 0 && !submitting;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        productKey: product.productKey,
        method,
        reference: reference.trim(),
      };
      const numericAmount = parseFloat(amount);
      if (!Number.isNaN(numericAmount) && numericAmount > 0) {
        body.amount = numericAmount;
      }
      if (notes.trim()) body.notes = notes.trim();

      const res = await api.post(
        `/api/v1/organizations/${organizationId}/billing/notify-payment`,
        body,
      );

      const msg =
        res.data?.message ??
        'Payment notice received. KxByte will verify and activate within 24 hours.';
      onSuccess(msg);
    } catch (err: unknown) {
      onError(getErrorMessage(err, 'Failed to submit payment notice.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="notify-title"
      >
        <div className={styles.modalHeader}>
          <h2 id="notify-title" className={styles.modalTitle}>
            <Send size={16} />
            Notify payment — {product.productName}
          </h2>
          <button className={styles.modalClose} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <p className={styles.modalHint}>
            Enter the M-Pesa / bank transaction details. We&apos;;ll verify and
            activate within 24 hours.
          </p>

          <div className={styles.formRow}>
            <label className={styles.formLabel}>Amount ({currency})</label>
            <input
              className={styles.formInput}
              type="number"
              inputMode="decimal"
              placeholder={
                product.amount.suggestedAmount !== null
                  ? String(product.amount.suggestedAmount)
                  : 'e.g. 699'
              }
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className={styles.formRow}>
            <label className={styles.formLabel}>Method</label>
            <select
              className={styles.formInput}
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="MPESA">M-PESA</option>
              <option value="BANK">Bank transfer</option>
              <option value="CASH">Cash</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className={styles.formRow}>
            <label className={styles.formLabel}>
              Transaction reference <span className={styles.required}>*</span>
            </label>
            <input
              className={styles.formInput}
              type="text"
              placeholder="e.g. ABC123XYZ"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          <div className={styles.formRow}>
            <label className={styles.formLabel}>Notes (optional)</label>
            <textarea
              className={styles.formTextarea}
              rows={3}
              placeholder="Anything we should know?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.modalCancel}
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.modalPrimary}
            onClick={submit}
            disabled={!canSubmit}
          >
            {submitting ? (
              <>
                <RefreshCw size={14} className={styles.spin} />
                Submitting…
              </>
            ) : (
              <>
                <Check size={14} />
                Submit payment notice
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}