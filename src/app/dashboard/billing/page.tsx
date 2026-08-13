// app/dashboard/billing/page.tsx

"use client";

import { useState } from "react";
import {
  CreditCard,
  Package,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Download,
  Eye,
  Filter,
  Search,
  Plus,
  X,
  Check,
  AlertCircle,
  Calendar,
  DollarSign,
  RefreshCw,
  Ban,
  Clock as ClockIcon,
  Shield,
  Building2,
  Users,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import styles from "./page.module.css";

// Types
type SubscriptionStatus = "trial" | "active" | "grace" | "expired" | "cancelled";
type PaymentMethod = "pesapal" | "mpesa" | "card" | "bank";

type ProductSubscription = {
  id: string;
  productId: string;
  productName: string;
  plan: "Starter" | "Growth" | "Enterprise";
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  trialEndDate?: string;
  graceEndDate?: string;
  amount: number;
  currency: string;
  billingCycle: "monthly" | "quarterly" | "yearly";
  autoRenew: boolean;
  features: string[];
  usage: {
    users: number;
    branches: number;
    limit: number;
  };
};

type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  status: "completed" | "pending" | "failed" | "refunded";
  paymentMethod: PaymentMethod;
  reference: string;
  invoiceUrl?: string;
  productName: string;
};

type PaymentMethodConfig = {
  id: PaymentMethod;
  name: string;
  icon: any;
  enabled: boolean;
  description: string;
  connected: boolean;
  lastUsed?: string;
};

// Mock Data
const MOCK_SUBSCRIPTIONS: ProductSubscription[] = [
  {
    id: "sub_1",
    productId: "p1",
    productName: "KxTill",
    plan: "Growth",
    status: "active",
    startDate: "2024-01-15",
    endDate: "2025-01-15",
    amount: 24000,
    currency: "KES",
    billingCycle: "yearly",
    autoRenew: true,
    features: ["Point of Sale", "Inventory Management", "Reports", "Multi-branch"],
    usage: {
      users: 12,
      branches: 4,
      limit: 50,
    },
  },
  {
    id: "sub_2",
    productId: "p2",
    productName: "KxInvoice",
    plan: "Starter",
    status: "trial",
    startDate: "2024-06-01",
    endDate: "2024-07-01",
    trialEndDate: "2024-07-01",
    amount: 12000,
    currency: "KES",
    billingCycle: "yearly",
    autoRenew: false,
    features: ["Invoicing", "Quotes", "Payment Tracking"],
    usage: {
      users: 5,
      branches: 2,
      limit: 20,
    },
  },
  {
    id: "sub_3",
    productId: "p3",
    productName: "KxCRM",
    plan: "Starter",
    status: "grace",
    startDate: "2024-03-01",
    endDate: "2024-06-01",
    graceEndDate: "2024-06-15",
    amount: 18000,
    currency: "KES",
    billingCycle: "yearly",
    autoRenew: true,
    features: ["Customer Management", "Lead Tracking", "Email Marketing"],
    usage: {
      users: 3,
      branches: 1,
      limit: 10,
    },
  },
  {
    id: "sub_4",
    productId: "p4",
    productName: "KxInventory",
    plan: "Growth",
    status: "expired",
    startDate: "2023-06-01",
    endDate: "2024-06-01",
    amount: 30000,
    currency: "KES",
    billingCycle: "yearly",
    autoRenew: false,
    features: ["Inventory Tracking", "Stock Alerts", "Supplier Management"],
    usage: {
      users: 8,
      branches: 3,
      limit: 30,
    },
  },
  {
    id: "sub_5",
    productId: "p5",
    productName: "KxAnalytics",
    plan: "Enterprise",
    status: "cancelled",
    startDate: "2024-01-01",
    endDate: "2024-04-01",
    amount: 45000,
    currency: "KES",
    billingCycle: "yearly",
    autoRenew: false,
    features: ["Advanced Analytics", "AI Insights", "Custom Reports"],
    usage: {
      users: 2,
      branches: 1,
      limit: 5,
    },
  },
];

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "tx_1",
    date: "2024-06-15",
    description: "KxTill - Annual Subscription Renewal",
    amount: 24000,
    currency: "KES",
    status: "completed",
    paymentMethod: "pesapal",
    reference: "INV-2024-001",
    invoiceUrl: "#",
    productName: "KxTill",
  },
  {
    id: "tx_2",
    date: "2024-06-01",
    description: "KxInvoice - Trial Activation",
    amount: 0,
    currency: "KES",
    status: "completed",
    paymentMethod: "pesapal",
    reference: "INV-2024-002",
    invoiceUrl: "#",
    productName: "KxInvoice",
  },
  {
    id: "tx_3",
    date: "2024-05-15",
    description: "KxCRM - Monthly Subscription",
    amount: 1500,
    currency: "KES",
    status: "failed",
    paymentMethod: "mpesa",
    reference: "INV-2024-003",
    productName: "KxCRM",
  },
  {
    id: "tx_4",
    date: "2024-05-01",
    description: "KxInventory - Annual Subscription",
    amount: 30000,
    currency: "KES",
    status: "completed",
    paymentMethod: "card",
    reference: "INV-2024-004",
    invoiceUrl: "#",
    productName: "KxInventory",
  },
  {
    id: "tx_5",
    date: "2024-04-15",
    description: "KxAnalytics - Enterprise Plan",
    amount: 45000,
    currency: "KES",
    status: "refunded",
    paymentMethod: "bank",
    reference: "INV-2024-005",
    productName: "KxAnalytics",
  },
  {
    id: "tx_6",
    date: "2024-06-10",
    description: "KxTill - Additional User License",
    amount: 5000,
    currency: "KES",
    status: "pending",
    paymentMethod: "pesapal",
    reference: "INV-2024-006",
    productName: "KxTill",
  },
];

const MOCK_PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: "pesapal",
    name: "Pesapal",
    icon: CreditCard,
    enabled: true,
    connected: true,
    description: "Credit Card, M-Pesa, Airtel Money",
    lastUsed: "2024-06-15",
  },
  {
    id: "mpesa",
    name: "M-Pesa",
    icon: Phone,
    enabled: true,
    connected: true,
    description: "Mobile Money",
    lastUsed: "2024-05-01",
  },
  {
    id: "card",
    name: "Card Payment",
    icon: CreditCard,
    enabled: true,
    connected: false,
    description: "Visa, Mastercard, Amex",
  },
  {
    id: "bank",
    name: "Bank Transfer",
    icon: Building2,
    enabled: true,
    connected: false,
    description: "Direct bank transfer",
  },
];

export default function BillingPage() {
  const [subscriptions, setSubscriptions] = useState<ProductSubscription[]>(MOCK_SUBSCRIPTIONS);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>(MOCK_PAYMENT_METHODS);
  
  // UI States
  const [selectedSubscription, setSelectedSubscription] = useState<ProductSubscription | null>(null);
  const [showSubscriptionDetail, setShowSubscriptionDetail] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | SubscriptionStatus>("ALL");
  const [transactionFilter, setTransactionFilter] = useState<"ALL" | Transaction["status"]>("ALL");

  // Stats
  const totalSubscriptions = subscriptions.length;
  const activeSubscriptions = subscriptions.filter(s => s.status === "active").length;
  const trialSubscriptions = subscriptions.filter(s => s.status === "trial").length;
  const expiringSubscriptions = subscriptions.filter(s => s.status === "grace").length;
  const totalSpent = transactions
    .filter(t => t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  // Filtered subscriptions
  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.productName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered transactions
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tx.productName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = transactionFilter === "ALL" || tx.status === transactionFilter;
    return matchesSearch && matchesStatus;
  });

  // Handlers
  const handleCancelSubscription = (subscriptionId: string) => {
    setSubscriptions(subscriptions.map(sub => 
      sub.id === subscriptionId 
        ? { ...sub, status: "cancelled" as SubscriptionStatus, autoRenew: false }
        : sub
    ));
    setShowCancelModal(false);
    setSelectedSubscription(null);
  };

  const handleRenewSubscription = (subscriptionId: string) => {
    const sub = subscriptions.find(s => s.id === subscriptionId);
    if (!sub) return;
    
    // Extend subscription by 1 year
    const newEndDate = new Date(sub.endDate);
    newEndDate.setFullYear(newEndDate.getFullYear() + 1);
    
    setSubscriptions(subscriptions.map(s => 
      s.id === subscriptionId 
        ? { 
            ...s, 
            status: "active" as SubscriptionStatus, 
            endDate: newEndDate.toISOString().split('T')[0],
          }
        : s
    ));
    setShowRenewModal(false);
    setSelectedSubscription(null);
  };

  const handleInitiatePayment = (subscriptionId: string) => {
    // Mock payment initiation
    const sub = subscriptions.find(s => s.id === subscriptionId);
    if (!sub) return;
    
    // Add a pending transaction
    const newTransaction: Transaction = {
      id: `tx_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      description: `${sub.productName} - Payment via Pesapal`,
      amount: sub.amount,
      currency: sub.currency,
      status: "pending",
      paymentMethod: "pesapal",
      reference: `INV-${Date.now()}`,
      productName: sub.productName,
    };
    
    setTransactions([newTransaction, ...transactions]);
    setShowPaymentModal(false);
    setSelectedSubscription(null);
    
    // Simulate payment completion
    setTimeout(() => {
      setTransactions(prev => 
        prev.map(t => 
          t.id === newTransaction.id 
            ? { ...t, status: "completed" as const }
            : t
        )
      );
    }, 3000);
  };

  const getStatusConfig = (status: SubscriptionStatus) => {
    const configs = {
      trial: { label: "Trial", icon: Clock, className: styles.statusTrial, action: "Start Trial" },
      active: { label: "Active", icon: CheckCircle, className: styles.statusActive, action: "Manage" },
      grace: { label: "Grace Period", icon: AlertTriangle, className: styles.statusGrace, action: "Renew Now" },
      expired: { label: "Expired", icon: XCircle, className: styles.statusExpired, action: "Reactivate" },
      cancelled: { label: "Cancelled", icon: Ban, className: styles.statusCancelled, action: "Resubscribe" },
    };
    return configs[status];
  };

  const getTransactionStatusConfig = (status: Transaction["status"]) => {
    const configs = {
      completed: { label: "Completed", icon: CheckCircle, className: styles.txStatusCompleted },
      pending: { label: "Pending", icon: ClockIcon, className: styles.txStatusPending },
      failed: { label: "Failed", icon: XCircle, className: styles.txStatusFailed },
      refunded: { label: "Refunded", icon: RefreshCw, className: styles.txStatusRefunded },
    };
    return configs[status];
  };

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    const icons = {
      pesapal: CreditCard,
      mpesa: Phone,
      card: CreditCard,
      bank: Building2,
    };
    return icons[method] || CreditCard;
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <>
      <div className={styles.page}>
        {/* Header */}
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
              <div className={styles.orgMeta}>
                Manage your subscriptions and billing information
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
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
            <div className={styles.statValue}>{formatCurrency(totalSpent, 'KES')}</div>
            <div className={styles.statLabel}>Total Spent</div>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${styles.tabActive}`}>
            <Package size={16} />
            Subscriptions
          </button>
          <button className={styles.tab}>
            <CreditCard size={16} />
            Transactions
          </button>
          <button className={styles.tab}>
            <Shield size={16} />
            Payment Methods
          </button>
        </div>

        {/* Filters */}
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
              <option value="trial">Trial</option>
              <option value="active">Active</option>
              <option value="grace">Grace Period</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Subscriptions Grid */}
        <div className={styles.subscriptionGrid}>
          {filteredSubscriptions.length === 0 ? (
            <div className={styles.emptyState}>
              <Package size={48} className={styles.emptyIcon} />
              <h3>No subscriptions found</h3>
              <p>Try adjusting your filters or browse available products</p>
            </div>
          ) : (
            filteredSubscriptions.map((sub) => {
              const statusConfig = getStatusConfig(sub.status);
              const StatusIcon = statusConfig.icon;
              const daysRemaining = getDaysRemaining(sub.endDate);
              const isExpiring = sub.status === "active" && daysRemaining < 30;

              return (
                <div key={sub.id} className={styles.subscriptionCard}>
                  <div className={styles.subscriptionHeader}>
                    <div className={styles.subscriptionProduct}>
                      <span className={styles.subscriptionIcon}>
                        {sub.productName.charAt(0)}
                      </span>
                      <div>
                        <div className={styles.subscriptionName}>{sub.productName}</div>
                        <div className={styles.subscriptionPlan}>{sub.plan} Plan</div>
                      </div>
                    </div>
                    <span className={`${styles.statusPill} ${statusConfig.className}`}>
                      <StatusIcon size={12} />
                      {statusConfig.label}
                    </span>
                  </div>

                  <div className={styles.subscriptionDetails}>
                    <div className={styles.subscriptionRow}>
                      <span className={styles.subscriptionLabel}>Amount</span>
                      <span className={styles.subscriptionValue}>
                        {formatCurrency(sub.amount, sub.currency)}
                        <span className={styles.subscriptionCycle}>/{sub.billingCycle}</span>
                      </span>
                    </div>
                    <div className={styles.subscriptionRow}>
                      <span className={styles.subscriptionLabel}>Period</span>
                      <span className={styles.subscriptionValue}>
                        {formatDate(sub.startDate)} - {formatDate(sub.endDate)}
                      </span>
                    </div>
                    <div className={styles.subscriptionRow}>
                      <span className={styles.subscriptionLabel}>Usage</span>
                      <span className={styles.subscriptionValue}>
                        {sub.usage.users} users · {sub.usage.branches} branches
                        <span className={styles.subscriptionLimit}>
                          (limit: {sub.usage.limit})
                        </span>
                      </span>
                    </div>
                    <div className={styles.subscriptionRow}>
                      <span className={styles.subscriptionLabel}>Auto-Renew</span>
                      <span className={styles.subscriptionValue}>
                        {sub.autoRenew ? (
                          <span className={styles.autoRenewOn}>
                            <CheckCircle size={14} />
                            Enabled
                          </span>
                        ) : (
                          <span className={styles.autoRenewOff}>
                            <XCircle size={14} />
                            Disabled
                          </span>
                        )}
                      </span>
                    </div>
                    {isExpiring && sub.status === "active" && (
                      <div className={styles.expiringWarning}>
                        <AlertTriangle size={14} />
                        Expires in {daysRemaining} days
                      </div>
                    )}
                    {sub.status === "grace" && (
                      <div className={styles.graceWarning}>
                        <AlertTriangle size={14} />
                        Grace period ends {formatDate(sub.graceEndDate || sub.endDate)}
                      </div>
                    )}
                  </div>

                  <div className={styles.subscriptionActions}>
                    <button 
                      className={styles.subscriptionAction}
                      onClick={() => {
                        setSelectedSubscription(sub);
                        setShowSubscriptionDetail(true);
                      }}
                    >
                      <Eye size={14} />
                      Details
                    </button>
                    {sub.status === "active" && (
                      <>
                        <button 
                          className={styles.subscriptionAction}
                          onClick={() => {
                            setSelectedSubscription(sub);
                            setShowRenewModal(true);
                          }}
                        >
                          <RefreshCw size={14} />
                          Renew
                        </button>
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
                      </>
                    )}
                    {sub.status === "trial" && (
                      <button 
                        className={styles.subscriptionActionPrimary}
                        onClick={() => {
                          setSelectedSubscription(sub);
                          setShowPaymentModal(true);
                        }}
                      >
                        <ArrowRight size={14} />
                        Upgrade
                      </button>
                    )}
                    {(sub.status === "grace" || sub.status === "expired") && (
                      <button 
                        className={styles.subscriptionActionPrimary}
                        onClick={() => {
                          setSelectedSubscription(sub);
                          setShowRenewModal(true);
                        }}
                      >
                        <RefreshCw size={14} />
                        {sub.status === "grace" ? "Renew Now" : "Reactivate"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ===== SUBSCRIPTION DETAIL MODAL ===== */}
      {showSubscriptionDetail && selectedSubscription && (
        <div className={styles.modalOverlay} onClick={() => setShowSubscriptionDetail(false)}>
          <div className={styles.modalLarge} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <Package size={20} />
                Subscription Details
              </h2>
              <button 
                className={styles.modalClose}
                onClick={() => setShowSubscriptionDetail(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.subscriptionDetailContent}>
              <div className={styles.detailSection}>
                <h3>Product Information</h3>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Product</span>
                  <span className={styles.detailValue}>{selectedSubscription.productName}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Plan</span>
                  <span className={styles.detailValue}>{selectedSubscription.plan}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Status</span>
                  <span className={styles.detailValue}>
                    <span className={`${styles.statusPill} ${getStatusConfig(selectedSubscription.status).className}`}>
                      {selectedSubscription.status}
                    </span>
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Billing Cycle</span>
                  <span className={styles.detailValue}>{selectedSubscription.billingCycle}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Amount</span>
                  <span className={styles.detailValue}>
                    {formatCurrency(selectedSubscription.amount, selectedSubscription.currency)}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Start Date</span>
                  <span className={styles.detailValue}>{formatDate(selectedSubscription.startDate)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>End Date</span>
                  <span className={styles.detailValue}>{formatDate(selectedSubscription.endDate)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Auto-Renew</span>
                  <span className={styles.detailValue}>
                    {selectedSubscription.autoRenew ? "Yes" : "No"}
                  </span>
                </div>
              </div>

              <div className={styles.detailSection}>
                <h3>Features</h3>
                <div className={styles.featuresList}>
                  {selectedSubscription.features.map((feature, index) => (
                    <div key={index} className={styles.featureItem}>
                      <CheckCircle size={14} className={styles.featureCheck} />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.detailSection}>
                <h3>Usage</h3>
                <div className={styles.usageStats}>
                  <div className={styles.usageStat}>
                    <div className={styles.usageStatValue}>{selectedSubscription.usage.users}</div>
                    <div className={styles.usageStatLabel}>Users</div>
                    <div className={styles.usageStatBar}>
                      <div 
                        className={styles.usageStatBarFill}
                        style={{ width: `${(selectedSubscription.usage.users / selectedSubscription.usage.limit) * 100}%` }}
                      />
                    </div>
                    <div className={styles.usageStatLimit}>
                      Limit: {selectedSubscription.usage.limit}
                    </div>
                  </div>
                  <div className={styles.usageStat}>
                    <div className={styles.usageStatValue}>{selectedSubscription.usage.branches}</div>
                    <div className={styles.usageStatLabel}>Branches</div>
                    <div className={styles.usageStatBar}>
                      <div 
                        className={styles.usageStatBarFill}
                        style={{ width: `${(selectedSubscription.usage.branches / selectedSubscription.usage.limit) * 100}%` }}
                      />
                    </div>
                    <div className={styles.usageStatLimit}>
                      Limit: {selectedSubscription.usage.limit}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button 
                type="button" 
                className={styles.cancelButton}
                onClick={() => setShowSubscriptionDetail(false)}
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
              <button 
                className={styles.modalClose}
                onClick={() => setShowCancelModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.deleteContent}>
              <div className={styles.deleteIcon}>
                <AlertCircle size={48} />
              </div>
              <h3>Cancel {selectedSubscription.productName}?</h3>
              <p>
                This will cancel your subscription and you will lose access to 
                <strong> {selectedSubscription.productName}</strong> on {formatDate(selectedSubscription.endDate)}.
              </p>
              <p className={styles.deleteWarning}>
                All data associated with this product will be archived.
              </p>
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
              >
                <Ban size={16} />
                Cancel Subscription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== RENEW MODAL ===== */}
      {showRenewModal && selectedSubscription && (
        <div className={styles.modalOverlay} onClick={() => setShowRenewModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <RefreshCw size={20} />
                {selectedSubscription.status === "expired" ? "Reactivate" : "Renew"} Subscription
              </h2>
              <button 
                className={styles.modalClose}
                onClick={() => setShowRenewModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.renewContent}>
              <div className={styles.renewSummary}>
                <div className={styles.renewProduct}>
                  <span className={styles.renewIcon}>
                    {selectedSubscription.productName.charAt(0)}
                  </span>
                  <div>
                    <div className={styles.renewName}>{selectedSubscription.productName}</div>
                    <div className={styles.renewPlan}>{selectedSubscription.plan} Plan</div>
                  </div>
                </div>
                <div className={styles.renewAmount}>
                  {formatCurrency(selectedSubscription.amount, selectedSubscription.currency)}
                  <span className={styles.renewCycle}>/{selectedSubscription.billingCycle}</span>
                </div>
              </div>

              <div className={styles.renewDetails}>
                <div className={styles.renewRow}>
                  <span>Current Period</span>
                  <span>{formatDate(selectedSubscription.startDate)} - {formatDate(selectedSubscription.endDate)}</span>
                </div>
                <div className={styles.renewRow}>
                  <span>New Period</span>
                  <span>
                    {formatDate(selectedSubscription.endDate)} - {formatDate(new Date(new Date(selectedSubscription.endDate).setFullYear(new Date(selectedSubscription.endDate).getFullYear() + 1)).toISOString().split('T')[0])}
                  </span>
                </div>
                <div className={styles.renewRow}>
                  <span>Auto-Renew</span>
                  <span>
                    <label className={styles.checkboxLabel}>
                      <input type="checkbox" defaultChecked={selectedSubscription.autoRenew} />
                      Enable auto-renewal
                    </label>
                  </span>
                </div>
              </div>

              <div className={styles.renewPayment}>
                <div className={styles.renewPaymentLabel}>Payment Method</div>
                <div className={styles.renewPaymentMethods}>
                  {paymentMethods.filter(pm => pm.connected).map((pm) => {
                    const Icon = pm.icon;
                    return (
                      <label key={pm.id} className={styles.paymentMethodOption}>
                        <input type="radio" name="paymentMethod" defaultChecked={pm.id === "pesapal"} />
                        <Icon size={16} />
                        {pm.name}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button 
                type="button" 
                className={styles.cancelButton}
                onClick={() => setShowRenewModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className={styles.submitButton}
                onClick={() => handleRenewSubscription(selectedSubscription.id)}
              >
                <RefreshCw size={16} />
                {selectedSubscription.status === "expired" ? "Reactivate" : "Renew"} Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== PAYMENT MODAL ===== */}
      {showPaymentModal && selectedSubscription && (
        <div className={styles.modalOverlay} onClick={() => setShowPaymentModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <CreditCard size={20} />
                Initiate Payment
              </h2>
              <button 
                className={styles.modalClose}
                onClick={() => setShowPaymentModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.paymentContent}>
              <div className={styles.paymentSummary}>
                <div className={styles.paymentProduct}>
                  <span className={styles.paymentIcon}>
                    {selectedSubscription.productName.charAt(0)}
                  </span>
                  <div>
                    <div className={styles.paymentName}>{selectedSubscription.productName}</div>
                    <div className={styles.paymentPlan}>{selectedSubscription.plan} Plan</div>
                  </div>
                </div>
                <div className={styles.paymentAmount}>
                  {formatCurrency(selectedSubscription.amount, selectedSubscription.currency)}
                  <span className={styles.paymentCycle}>/{selectedSubscription.billingCycle}</span>
                </div>
              </div>

              <div className={styles.paymentMethods}>
                <h3>Select Payment Method</h3>
                {paymentMethods.filter(pm => pm.enabled).map((pm) => {
                  const Icon = pm.icon;
                  return (
                    <label key={pm.id} className={styles.paymentMethodCard}>
                      <input type="radio" name="paymentMethod" defaultChecked={pm.id === "pesapal"} />
                      <div className={styles.paymentMethodCardContent}>
                        <Icon size={20} className={styles.paymentMethodIcon} />
                        <div>
                          <div className={styles.paymentMethodName}>{pm.name}</div>
                          <div className={styles.paymentMethodDesc}>{pm.description}</div>
                        </div>
                        {pm.connected ? (
                          <CheckCircle size={16} className={styles.paymentMethodConnected} />
                        ) : (
                          <span className={styles.paymentMethodNotConnected}>Not Connected</span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className={styles.paymentInfo}>
                <AlertCircle size={14} />
                <span>You will be redirected to Pesapal to complete the payment securely.</span>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button 
                type="button" 
                className={styles.cancelButton}
                onClick={() => setShowPaymentModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className={styles.submitButton}
                onClick={() => handleInitiatePayment(selectedSubscription.id)}
              >
                <CreditCard size={16} />
                Pay Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}