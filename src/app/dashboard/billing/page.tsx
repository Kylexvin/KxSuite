"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/axios";
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
  Calendar,
  DollarSign,
  RefreshCw,
  Ban,
  Shield,
  Building2,
  Users,
  Phone,
  MapPin,
  Loader2,
} from "lucide-react";
import styles from "./page.module.css";

// ============================================================
// TYPES
// ============================================================

type SubscriptionStatus = "TRIAL" | "ACTIVE" | "GRACE" | "EXPIRED" | "CANCELLED";

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
    limits: any;
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
// STATUS BADGE
// ============================================================

function StatusBadge({ status }: { status: SubscriptionStatus }) {
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
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function BillingPage() {
  const router = useRouter();
  const { activeOrganization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | SubscriptionStatus>("ALL");
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // ============================================================
  // FETCH DATA
  // ============================================================

  const fetchData = useCallback(async () => {
    if (!activeOrganization) return;

    setLoading(true);
    try {
      const [subsRes, productsRes] = await Promise.all([
        api.get(`/api/v1/organizations/${activeOrganization.id}/subscriptions`),
        api.get("/api/v1/products"),
      ]);

      setSubscriptions(subsRes.data.subscriptions || []);
      setProducts(productsRes.data.products || []);
    } catch (err) {
      console.error("Failed to load billing data:", err);
      setToast({ type: "error", message: "Failed to load subscriptions. Please try again." });
    } finally {
      setLoading(false);
    }
  }, [activeOrganization]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!activeOrganization) return;

    setCancelling(true);
    try {
      const sub = subscriptions.find((s) => s.id === subscriptionId);
      if (!sub) return;

      await api.delete(
        `/api/v1/organizations/${activeOrganization.id}/subscriptions/${sub.productKey}`
      );

      await fetchData();
      setToast({ type: "success", message: "Subscription cancelled successfully" });
      setShowCancelModal(false);
      setSelectedSubscription(null);
    } catch (err: any) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to cancel subscription",
      });
    } finally {
      setCancelling(false);
    }
  };

  const handleRenew = async (productKey: string) => {
    if (!activeOrganization) return;

    try {
      await api.post(
        `/api/v1/organizations/${activeOrganization.id}/subscriptions/${productKey}/renew`
      );
      await fetchData();
      setToast({ type: "success", message: "Subscription renewed successfully" });
    } catch (err: any) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to renew subscription",
      });
    }
  };

  // ============================================================
  // FILTERS
  // ============================================================

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const product = products.find((p) => p.key === sub.productKey);
    const productName = product?.name || sub.productKey;
    const matchesSearch = productName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // ============================================================
  // STATS
  // ============================================================

  const totalSubscriptions = subscriptions.length;
  const activeSubscriptions = subscriptions.filter((s) => s.status === "ACTIVE").length;
  const trialSubscriptions = subscriptions.filter((s) => s.status === "TRIAL").length;
  const expiringSubscriptions = subscriptions.filter((s) => s.status === "GRACE").length;

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <Loader2 size={32} className={styles.spinner} />
          <p>Loading subscriptions...</p>
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
                {totalSubscriptions} products
              </span>
            </div>
            <div className={styles.orgMeta}>Manage your subscriptions and billing information</div>
          </div>
        </div>
        <button
          className={styles.primaryButton}
          onClick={() => router.push("/dashboard/marketplace")}
        >
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {/* ===== STATS ===== */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{activeSubscriptions}</div>
          <div className={styles.statLabel}>Active Subscriptions</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{trialSubscriptions}</div>
          <div className={styles.statLabel}>Trial</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{expiringSubscriptions}</div>
          <div className={styles.statLabel}>Expiring Soon</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{totalSubscriptions}</div>
          <div className={styles.statLabel}>Total Products</div>
        </div>
      </div>

      {/* ===== FILTERS ===== */}
      <div className={styles.filtersBar}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search subscriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className={styles.filterGroup}>
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          >
            <option value="ALL">All Status</option>
            <option value="TRIAL">Trial</option>
            <option value="ACTIVE">Active</option>
            <option value="GRACE">Grace Period</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* ===== SUBSCRIPTION GRID ===== */}
      {filteredSubscriptions.length === 0 ? (
        <div className={styles.emptyState}>
          <Package size={48} className={styles.emptyIcon} />
          <h3>No subscriptions found</h3>
          <p>
            {subscriptions.length === 0
              ? "You haven't subscribed to any products yet."
              : "Try adjusting your filters."}
          </p>
          <button
            className={styles.primaryButton}
            onClick={() => router.push("/dashboard/marketplace")}
          >
            <Plus size={16} />
            Browse Products
          </button>
        </div>
      ) : (
        <div className={styles.subscriptionGrid}>
          {filteredSubscriptions.map((sub) => {
            const product = products.find((p) => p.key === sub.productKey);
            const productName = product?.name || sub.productKey;
            const isExpiring = sub.status === "ACTIVE" && sub.remainingDays && sub.remainingDays < 30;

            return (
              <div key={sub.id} className={styles.subscriptionCard}>
                <div className={styles.subscriptionHeader}>
                  <div className={styles.subscriptionProduct}>
                    <span className={styles.subscriptionIcon}>
                      {productName.charAt(0)}
                    </span>
                    <div>
                      <div className={styles.subscriptionName}>{productName}</div>
                      <div className={styles.subscriptionPlan}>
                        {sub.plan?.name || sub.plan?.key || "Plan"} Plan
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={sub.status} />
                </div>

                <div className={styles.subscriptionDetails}>
                  <div className={styles.subscriptionRow}>
                    <span className={styles.subscriptionLabel}>Amount</span>
                    <span className={styles.subscriptionValue}>
                      {formatCurrency(sub.plan?.price || 0, sub.plan?.currency || "KES")}
                      <span className={styles.subscriptionCycle}>
                        /{sub.plan?.interval?.toLowerCase() || "monthly"}
                      </span>
                    </span>
                  </div>
                  <div className={styles.subscriptionRow}>
                    <span className={styles.subscriptionLabel}>Period</span>
                    <span className={styles.subscriptionValue}>
                      {formatDate(sub.currentPeriodStart)} - {formatDate(sub.currentPeriodEnd)}
                    </span>
                  </div>
                  {sub.remainingDays !== undefined && sub.remainingDays > 0 && (
                    <div className={styles.subscriptionRow}>
                      <span className={styles.subscriptionLabel}>Remaining</span>
                      <span className={styles.subscriptionValue}>
                        {sub.remainingDays} days
                      </span>
                    </div>
                  )}
                  {isExpiring && (
                    <div className={styles.expiringWarning}>
                      <AlertTriangle size={14} />
                      Expires in {sub.remainingDays} days
                    </div>
                  )}
                  {sub.status === "GRACE" && (
                    <div className={styles.graceWarning}>
                      <AlertTriangle size={14} />
                      Grace period ends {formatDate(sub.graceEnd || sub.currentPeriodEnd)}
                    </div>
                  )}
                </div>

                <div className={styles.subscriptionActions}>
                  <button
                    className={styles.subscriptionAction}
                    onClick={() => {
                      setSelectedSubscription(sub);
                      setShowDetailModal(true);
                    }}
                  >
                    <Eye size={14} />
                    Details
                  </button>

                  {sub.status === "ACTIVE" && (
                    <button
                      className={`${styles.subscriptionAction} ${styles.subscriptionActionDanger}`}
                      onClick={() => {
                        setSelectedSubscription(sub);
                        setShowCancelModal(true);
                      }}
                    >
                      <Ban size={14} />
                      Cancel
                    </button>
                  )}

                  {(sub.status === "TRIAL" || sub.status === "EXPIRED") && (
                    <button
                      className={styles.subscriptionActionPrimary}
                      onClick={() => {
                        const productKey = sub.productKey;
                        router.push(`/dashboard/marketplace`);
                        // Or trigger payment flow
                      }}
                    >
                      <ArrowRight size={14} />
                      {sub.status === "TRIAL" ? "Upgrade" : "Reactivate"}
                    </button>
                  )}

                  {sub.status === "GRACE" && (
                    <button
                      className={styles.subscriptionActionPrimary}
                      onClick={() => handleRenew(sub.productKey)}
                    >
                      <RefreshCw size={14} />
                      Renew Now
                    </button>
                  )}
                </div>
              </div>
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
                    {products.find((p) => p.key === selectedSubscription.productKey)?.name ||
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
              <h3>Cancel {products.find((p) => p.key === selectedSubscription.productKey)?.name || selectedSubscription.productKey}?</h3>
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