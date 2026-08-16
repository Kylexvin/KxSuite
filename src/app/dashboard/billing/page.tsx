// app/dashboard/billing/page.tsx

"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/axios";
import { AxiosError } from "axios";
import {
  CreditCard,
  Package,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Eye,
  Search,
  Plus,
  X,
  Check,
  AlertCircle,
  RefreshCw,
  Ban,
  Loader2,
  Wallet,
} from "lucide-react";
import styles from "./page.module.css";

// ============================================================
// TYPES
// ============================================================

type SubscriptionStatus = "TRIAL" | "ACTIVE" | "GRACE" | "EXPIRED" | "CANCELLED";

type PlanLimits = {
  maxUsers?: number;
  maxBranches?: number;
  maxProducts?: number;
  storage?: number;
  [key: string]: unknown;
};

type Subscription = {
  id: string;
  organizationId: string;
  productKey: string;
  planId: string;
  status: SubscriptionStatus;
  trialStart?: string;
  trialEnd?: string;
  graceStart?: string;
  graceEnd?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt?: string;
  expiredAt?: string;
  createdAt: string;
  updatedAt: string;
  plan: {
    id: string;
    productKey: string;
    key: string;
    name: string;
    price: number;
    currency: string;
    interval: string;
    trialDays: number;
    features: string[];
    limits: PlanLimits;
  };
  remainingDays?: number;
  isActive: boolean;
  isTrial: boolean;
  isExpired: boolean;
};

type Product = {
  id: string;
  key: string;
  name: string;
  description: string;
  version: string;
  isActive: boolean;
};

type Payment = {
  id: string;
  amount: number;
  currency: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  method: string;
  reference: string;
  description: string;
  paidAt: string;
  createdAt: string;
};

// ============================================================
// API ERROR TYPE
// ============================================================

type ApiErrorResponse = {
  message?: string;
  error?: string;
  [key: string]: unknown;
};

// ============================================================
// HELPER: Get error message from unknown error
// ============================================================

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse;
    return data?.message || data?.error || fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return fallback;
}

// ============================================================
// TOAST
// ============================================================

function Toast({ type, message, onClose }: { type: "success" | "error" | "info"; message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <Check size={16} />,
    error: <AlertTriangle size={16} />,
    info: <AlertCircle size={16} />,
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
// STATUS BADGE - Memoized
// ============================================================

const StatusBadge = React.memo(function StatusBadge({ status }: { status: SubscriptionStatus }) {
  const configs = {
    TRIAL: { label: "Trial", icon: Clock, className: styles.statusTrial },
    ACTIVE: { label: "Active", icon: CheckCircle, className: styles.statusActive },
    GRACE: { label: "Grace Period", icon: AlertTriangle, className: styles.statusGrace },
    EXPIRED: { label: "Expired", icon: XCircle, className: styles.statusExpired },
    CANCELLED: { label: "Cancelled", icon: Ban, className: styles.statusCancelled },
  };
  const config = configs[status] || configs.EXPIRED;
  const Icon = config.icon;
  return (
    <span className={`${styles.statusPill} ${config.className}`}>
      <Icon size={12} />
      {config.label}
    </span>
  );
});

// ============================================================
// SUBSCRIPTION CARD - Memoized
// ============================================================

const SubscriptionCard = React.memo(function SubscriptionCard({
  subscription,
  product,
  onViewDetails,
  onCancel,
  onRenew,
  onManage,
  isRenewing,
  formatCurrency,
  formatDate,
}: {
  subscription: Subscription;
  product?: Product;
  onViewDetails: (sub: Subscription) => void;
  onCancel: (sub: Subscription) => void;
  onRenew: (productKey: string) => void;
  onManage: (productKey: string) => void;
  isRenewing: boolean;
  formatCurrency: (amount: number, currency: string) => string;
  formatDate: (date: string) => string;
}) {
  const productName = product?.name || subscription.productKey;
  const isExpiring = subscription.status === "ACTIVE" && subscription.remainingDays && subscription.remainingDays < 30;

  return (
    <div className={styles.subscriptionCard}>
      <div className={styles.subscriptionHeader}>
        <div className={styles.subscriptionProduct}>
          <span className={styles.subscriptionIcon}>
            {productName.charAt(0)}
          </span>
          <div>
            <div className={styles.subscriptionName}>{productName}</div>
            <div className={styles.subscriptionPlan}>
              {subscription.plan?.name || subscription.plan?.key || "Plan"} Plan
            </div>
          </div>
        </div>
        <StatusBadge status={subscription.status} />
      </div>

      <div className={styles.subscriptionDetails}>
        <div className={styles.subscriptionRow}>
          <span className={styles.subscriptionLabel}>Amount</span>
          <span className={styles.subscriptionValue}>
            {formatCurrency(subscription.plan?.price || 0, subscription.plan?.currency || "KES")}
            <span className={styles.subscriptionCycle}>
              /{subscription.plan?.interval?.toLowerCase() || "monthly"}
            </span>
          </span>
        </div>
        <div className={styles.subscriptionRow}>
          <span className={styles.subscriptionLabel}>Period</span>
          <span className={styles.subscriptionValue}>
            {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
          </span>
        </div>
        {subscription.remainingDays !== undefined && subscription.remainingDays > 0 && (
          <div className={styles.subscriptionRow}>
            <span className={styles.subscriptionLabel}>Remaining</span>
            <span className={styles.subscriptionValue}>
              {subscription.remainingDays} days
            </span>
          </div>
        )}
        {isExpiring && (
          <div className={styles.expiringWarning}>
            <AlertTriangle size={14} />
            Expires in {subscription.remainingDays} days
          </div>
        )}
        {subscription.status === "GRACE" && (
          <div className={styles.graceWarning}>
            <AlertTriangle size={14} />
            Grace period ends {formatDate(subscription.graceEnd || subscription.currentPeriodEnd)}
          </div>
        )}
      </div>

      <div className={styles.subscriptionActions}>
        <button
          className={styles.subscriptionAction}
          onClick={() => onViewDetails(subscription)}
        >
          <Eye size={14} />
          Details
        </button>

        <button
          className={styles.subscriptionAction}
          onClick={() => onManage(subscription.productKey)}
        >
          <ArrowRight size={14} />
          Manage
        </button>

        {(subscription.status === "TRIAL" || subscription.status === "ACTIVE") && (
          <button
            className={`${styles.subscriptionAction} ${styles.subscriptionActionDanger}`}
            onClick={() => onCancel(subscription)}
          >
            <Ban size={14} />
            {subscription.status === "TRIAL" ? "Deactivate" : "Cancel"}
          </button>
        )}

        {(subscription.status === "ACTIVE" || subscription.status === "GRACE") && (
          <button
            className={subscription.status === "GRACE" ? styles.subscriptionActionPrimary : styles.subscriptionAction}
            onClick={() => onRenew(subscription.productKey)}
            disabled={isRenewing}
          >
            {isRenewing ? (
              <Loader2 size={14} className={styles.spinnerSmall} />
            ) : (
              <>
                <RefreshCw size={14} />
                {subscription.status === "GRACE" ? "Renew Now" : "Renew"}
              </>
            )}
          </button>
        )}

        {subscription.status === "EXPIRED" && (
          <button
            className={styles.subscriptionActionPrimary}
            onClick={() => onManage(subscription.productKey)}
          >
            <ArrowRight size={14} />
            Reactivate
          </button>
        )}
      </div>
    </div>
  );
});

// ============================================================
// MAIN PAGE
// ============================================================

export default function BillingPage() {
  const router = useRouter();
  const { activeOrganization, loadSuiteContext } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [renewing, setRenewing] = useState<string | null>(null);

  // ============================================================
  // REFS
  // ============================================================

  const isMounted = useRef(true);
  const hasFetched = useRef(false);

  // ============================================================
  // HELPERS - Memoized
  // ============================================================

  const formatCurrency = useCallback((amount: number, currency: string) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, []);

  const formatDate = useCallback((date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  // ============================================================
  // FETCH DATA
  // ============================================================

  const refreshEverything = useCallback(async () => {
    if (!activeOrganization) return;
    await loadSuiteContext(activeOrganization.id);
  }, [activeOrganization, loadSuiteContext]);

  const fetchData = useCallback(async () => {
    if (!activeOrganization || !isMounted.current) return;

    setLoading(true);
    try {
      const [subsRes, productsRes] = await Promise.all([
        api.get(`/api/v1/organizations/${activeOrganization.id}/subscriptions`),
        api.get("/api/v1/products"),
      ]);

      if (!isMounted.current) return;

      const allProducts = productsRes.data.products || [];
      setProducts(allProducts);

      const allSubs = subsRes.data.subscriptions || [];
      const activeSubs = allSubs.filter((sub: Subscription) => {
        const product = allProducts.find((p: Product) => p.key === sub.productKey);
        return product !== undefined && product.isActive === true;
      });
      setSubscriptions(activeSubs);

      try {
        const paymentsRes = await api.get(`/api/v1/organizations/${activeOrganization.id}/payments`);
        if (isMounted.current) {
          setPayments(paymentsRes.data.payments || []);
        }
      } catch {
        if (isMounted.current) {
          setPayments([]);
        }
      }
    } catch (err: unknown) {
      if (isMounted.current) {
        console.error("Failed to load billing data:", err);
        setToast({ type: "error", message: "Failed to load subscriptions. Please try again." });
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [activeOrganization]);

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
      await fetchData();
    };

    loadData();

    return () => {
      isMounted.current = false;
    };
  }, [activeOrganization, fetchData]);

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleCancelSubscription = useCallback(async (subscriptionId: string) => {
    if (!activeOrganization) return;

    setCancelling(true);
    try {
      const sub = subscriptions.find((s) => s.id === subscriptionId);
      if (!sub) return;

      await api.delete(
        `/api/v1/products/organizations/${activeOrganization.id}/products/${sub.productKey}`
      );

      await fetchData();
      await refreshEverything();
      setToast({ type: "success", message: "Subscription cancelled successfully" });
      setShowCancelModal(false);
      setSelectedSubscription(null);
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to cancel subscription");
      setToast({
        type: "error",
        message,
      });
    } finally {
      setCancelling(false);
    }
  }, [activeOrganization, subscriptions, fetchData, refreshEverything]);

  const handleRenew = useCallback(async (productKey: string) => {
    if (!activeOrganization) return;

    setRenewing(productKey);
    try {
      await api.post(
        `/api/v1/organizations/${activeOrganization.id}/subscriptions/${productKey}/renew`
      );
      await fetchData();
      await refreshEverything();
      setToast({ type: "success", message: "Subscription renewed successfully" });
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to renew subscription");
      setToast({
        type: "error",
        message,
      });
    } finally {
      setRenewing(null);
    }
  }, [activeOrganization, fetchData, refreshEverything]);

  // ============================================================
  // MEMOIZED COMPUTATIONS
  // ============================================================

  const filteredSubscriptions = useMemo(() => {
    const search = searchQuery.toLowerCase();
    return subscriptions.filter((sub) => {
      const product = products.find((p) => p.key === sub.productKey);
      const productName = product?.name || sub.productKey;
      return productName.toLowerCase().includes(search);
    });
  }, [subscriptions, products, searchQuery]);

  const stats = useMemo(() => ({
    total: subscriptions.length,
    active: subscriptions.filter((s) => s.status === "ACTIVE").length,
    trial: subscriptions.filter((s) => s.status === "TRIAL").length,
    grace: subscriptions.filter((s) => s.status === "GRACE").length,
  }), [subscriptions]);

  const paymentStats = useMemo(() => {
    const completedPayments = payments.filter((p) => p.status === "COMPLETED");
    const totalSpent = completedPayments.reduce((sum, p) => sum + p.amount, 0);
    const lastPayment = completedPayments[completedPayments.length - 1];
    const nextPayment = subscriptions
      .filter((s) => s.status === "ACTIVE" || s.status === "TRIAL")
      .reduce((sum, s) => sum + (s.plan?.price || 0), 0);

    return { totalSpent, lastPayment, nextPayment };
  }, [payments, subscriptions]);

  const productMap = useMemo(() => {
    return new Map(products.map((p) => [p.key, p]));
  }, [products]);

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <Loader2 size={32} className={styles.spinner} />
          <p>Loading billing information...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className={styles.page}>
      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* ===== HEADER ===== */}
      <div className={styles.orgHeader}>
        <div className={styles.orgIdentity}>
          <span className={styles.orgAvatar}>
            <CreditCard size={24} />
          </span>
          <div>
            <div className={styles.orgNameRow}>
              <h1 className={styles.orgName}>Billing & Subscriptions</h1>
              <span className={`${styles.statusPill} ${styles.statusActive}`}>
                {stats.total} products
              </span>
            </div>
            <div className={styles.orgMeta}>Manage your subscriptions and billing information</div>
          </div>
        </div>
      </div>

      {/* ===== STATS ===== */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.active}</div>
          <div className={styles.statLabel}>Active</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.trial}</div>
          <div className={styles.statLabel}>Trial</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.grace}</div>
          <div className={styles.statLabel}>Expiring Soon</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{formatCurrency(paymentStats.totalSpent, "KES")}</div>
          <div className={styles.statLabel}>Total Spent</div>
        </div>
      </div>

      {/* ===== PAYMENT STATUS ===== */}
      <div className={styles.paymentStatusCard}>
        <div className={styles.paymentStatusHeader}>
          <Wallet size={18} />
          <span>Payment Status</span>
        </div>
        <div className={styles.paymentStatusGrid}>
          <div className={styles.paymentStatusItem}>
            <span className={styles.paymentStatusLabel}>Current Balance</span>
            <span className={styles.paymentStatusValue}>
              {formatCurrency(0, "KES")}
            </span>
          </div>
          <div className={styles.paymentStatusItem}>
            <span className={styles.paymentStatusLabel}>Last Payment</span>
            <span className={styles.paymentStatusValue}>
              {paymentStats.lastPayment ? formatCurrency(paymentStats.lastPayment.amount, paymentStats.lastPayment.currency) : "—"}
            </span>
          </div>
          <div className={styles.paymentStatusItem}>
            <span className={styles.paymentStatusLabel}>Last Payment Date</span>
            <span className={styles.paymentStatusValue}>
              {paymentStats.lastPayment ? formatDate(paymentStats.lastPayment.paidAt) : "—"}
            </span>
          </div>
          <div className={styles.paymentStatusItem}>
            <span className={styles.paymentStatusLabel}>Next Payment</span>
            <span className={styles.paymentStatusValue}>
              {paymentStats.nextPayment > 0 ? formatCurrency(paymentStats.nextPayment, "KES") : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* ===== SUBSCRIPTIONS ===== */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          <Package size={18} />
          Your Products
        </h2>
        <span className={styles.sectionCount}>{stats.total}</span>
      </div>

      {/* Search */}
      <div className={styles.searchWrap}>
        <Search size={16} className={styles.searchIcon} />
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredSubscriptions.length === 0 ? (
        <div className={styles.emptyState}>
          <Package size={48} className={styles.emptyIcon} />
          <h3>No active subscriptions</h3>
          <p>Browse the marketplace to activate products for your organization.</p>
          <button
            className={styles.primaryButton}
            onClick={() => router.push("/dashboard/marketplace")}
          >
            <Plus size={16} />
            Browse Marketplace
          </button>
        </div>
      ) : (
        <div className={styles.subscriptionGrid}>
          {filteredSubscriptions.map((sub) => {
            const product = productMap.get(sub.productKey);
            const isRenewingProduct = renewing === sub.productKey;

            return (
              <SubscriptionCard
                key={sub.id}
                subscription={sub}
                product={product}
                onViewDetails={(s) => {
                  setSelectedSubscription(s);
                  setShowDetailModal(true);
                }}
                onCancel={(s) => {
                  setSelectedSubscription(s);
                  setShowCancelModal(true);
                }}
                onRenew={handleRenew}
                onManage={(productKey) => router.push(`/kx/${productKey}`)}
                isRenewing={isRenewingProduct}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
              />
            );
          })}
        </div>
      )}

      {/* ===== DETAIL MODAL ===== */}
      {showDetailModal && selectedSubscription && (
        <div className={styles.modalOverlay} onClick={() => setShowDetailModal(false)}>
          <div className={styles.modalLarge} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <Package size={20} />
                Subscription Details
              </h2>
              <button className={styles.modalClose} onClick={() => setShowDetailModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.subscriptionDetailContent}>
              <div className={styles.detailSection}>
                <h3>Product Information</h3>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Product</span>
                  <span className={styles.detailValue}>
                    {productMap.get(selectedSubscription.productKey)?.name ||
                      selectedSubscription.productKey}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Plan</span>
                  <span className={styles.detailValue}>
                    {selectedSubscription.plan?.name || selectedSubscription.plan?.key || "Plan"}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Status</span>
                  <span className={styles.detailValue}>
                    <StatusBadge status={selectedSubscription.status} />
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Amount</span>
                  <span className={styles.detailValue}>
                    {formatCurrency(
                      selectedSubscription.plan?.price || 0,
                      selectedSubscription.plan?.currency || "KES"
                    )}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Billing Cycle</span>
                  <span className={styles.detailValue}>
                    {selectedSubscription.plan?.interval?.toLowerCase() || "monthly"}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Start Date</span>
                  <span className={styles.detailValue}>
                    {formatDate(selectedSubscription.currentPeriodStart)}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>End Date</span>
                  <span className={styles.detailValue}>
                    {formatDate(selectedSubscription.currentPeriodEnd)}
                  </span>
                </div>
                {selectedSubscription.trialEnd && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Trial Ends</span>
                    <span className={styles.detailValue}>
                      {formatDate(selectedSubscription.trialEnd)}
                    </span>
                  </div>
                )}
              </div>

              {selectedSubscription.plan?.features &&
                selectedSubscription.plan.features.length > 0 && (
                  <div className={styles.detailSection}>
                    <h3>Features</h3>
                    <div className={styles.featuresList}>
                      {selectedSubscription.plan.features.map((feature, index) => (
                        <div key={index} className={styles.featureItem}>
                          <CheckCircle size={14} className={styles.featureCheck} />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setShowDetailModal(false)}
              >
                Close
              </button>
              <button
                className={styles.subscriptionActionPrimary}
                onClick={() => {
                  router.push(`/kx/${selectedSubscription.productKey}`);
                  setShowDetailModal(false);
                }}
              >
                <ArrowRight size={14} />
                Manage Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== CANCEL MODAL ===== */}
      {showCancelModal && selectedSubscription && (
        <div className={styles.modalOverlay} onClick={() => setShowCancelModal(false)}>
          <div className={`${styles.modal} ${styles.modalDanger}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <Ban size={20} />
                Cancel Subscription
              </h2>
              <button className={styles.modalClose} onClick={() => setShowCancelModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.deleteContent}>
              <div className={styles.deleteIcon}>
                <AlertCircle size={48} />
              </div>
              <h3>Cancel {productMap.get(selectedSubscription.productKey)?.name || selectedSubscription.productKey}?</h3>
              <p>
                This will cancel your subscription and you will lose access to this product on{" "}
                <strong>{formatDate(selectedSubscription.currentPeriodEnd)}</strong>.
              </p>
              <p className={styles.deleteWarning}>All data associated with this product will be archived.</p>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setShowCancelModal(false)}
              >
                Keep Subscription
              </button>
              <button
                type="button"
                className={styles.deleteButton}
                onClick={() => handleCancelSubscription(selectedSubscription.id)}
                disabled={cancelling}
              >
                {cancelling ? (
                  <>
                    <Loader2 size={16} className={styles.spinnerSmall} />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <Ban size={16} />
                    Cancel Subscription
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