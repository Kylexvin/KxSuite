// app/kx/kxtill/sales/page.tsx

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/axios";
import {
  Search,
  Filter,
  ChevronDown,
  Eye,
  Printer,
  Share2,
  RefreshCw,
  Download,
  X,
  User,
  Building2,
  CreditCard,
  Receipt,
  TrendingUp,
  AlertCircle,
  AlertTriangle,
  Check,
  Calendar,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import styles from "./page.module.css";

// ===== TYPES =====
type DashboardSummary = {
  totalSales: number;
  totalRevenue: number;
  activeUsers: number;
  conversionRate: number;
  averageOrderValue: number;
  growth: number;
  inventoryItems: number;
  lowStock: number;
};

type SalesChartDataPoint = {
  date: string;
  label: string;
  value: number;
};

type SalesChartResponse = {
  data: SalesChartDataPoint[];
  total: number;
  trend: number;
};

type PaymentMethod = {
  name: string;
  value: number;
  amount: number;
};

type PaymentMethodsResponse = {
  paymentMethods: PaymentMethod[];
  total: number;
};

type BranchBreakdownItem = {
  name: string;
  code: string;
  sales: number;
  transactions: number;
  percentage: number;
};

type BranchBreakdownResponse = {
  data: BranchBreakdownItem[];
  totalSales: number;
  totalTransactions: number;
  branchCount: number;
};

type SaleItemProduct = {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  category: string;
  taxRate: string;
  isActive: boolean;
  trackInventory: boolean;
  baseUnitId: string;
  createdAt: string;
  updatedAt: string;
};

type SaleItemUnit = {
  id: string;
  productId: string;
  name: string;
  abbreviation: string;
  unitType: string;
  conversionQty: string;
  price: string;
  allowFractional: boolean;
  barcode: string | null;
  isBaseUnit: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type SaleItem = {
  id: string;
  saleId: string;
  productId: string;
  branchProductId: string;
  unitId: string;
  unitName: string;
  unitAbbrev: string;
  unitType: string;
  quantity: string;
  conversionQty: string;
  unitPrice: string;
  baseQuantity: string;
  taxRate: string;
  taxAmount: string;
  discount: string;
  total: string;
  createdAt: string;
  updatedAt: string;
  product: SaleItemProduct;
  unit: SaleItemUnit;
};

type Payment = {
  id: string;
  saleId: string;
  method: string;
  amount: string;
  reference: string | null;
  metadata: string | null;
  createdAt: string;
};

type SaleUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

type Transaction = {
  id: string;
  organizationId: string;
  userId: string;
  branchId: string;
  subtotal: string;
  taxAmount: string;
  discount: string;
  totalAmount: string;
  status: "COMPLETED" | "REFUNDED" | "VOIDED";
  paymentStatus: "PAID" | "PENDING" | "FAILED";
  createdAt: string;
  updatedAt: string;
  items: SaleItem[];
  payments: Payment[];
  user: SaleUser;
};

type TransactionsResponse = {
  items: Transaction[];
  total: number;
  limit: number;
  offset: number;
};

type TransactionDetailResponse = {
  sale: Transaction;
};

type RefundResponse = {
  message: string;
  sale: {
    id: string;
    organizationId: string;
    userId: string;
    branchId: string;
    reference: string;
    customerName: string;
    refundedBy: string;
    refundedAt: string;
    subtotal: string;
    taxAmount: string;
    discount: string;
    totalAmount: string;
    status: string;
    paymentStatus: string;
    createdAt: string;
    updatedAt: string;
  };
};

// ============================================================
// TOAST NOTIFICATION
// ============================================================
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`${styles.toast} ${type === 'success' ? styles.toastSuccess : styles.toastError}`}>
      <div className={styles.toastContent}>
        {type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
        <span>{message}</span>
      </div>
      <button className={styles.toastClose} onClick={onClose}>
        <X size={16} />
      </button>
    </div>
  );
}

// ============================================================
// REFUND CONFIRMATION MODAL
// ============================================================
function RefundConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  transaction,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  transaction: Transaction | null;
  loading: boolean;
}) {
  if (!isOpen || !transaction) return null;

  return (
    <div className={styles.confirmOverlay} onClick={onClose}>
      <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.confirmIcon}>
          <AlertTriangle size={48} />
        </div>
        <h3 className={styles.confirmTitle}>Refund this sale?</h3>
        <div className={styles.confirmDetails}>
          <div className={styles.confirmRow}>
            <span className={styles.confirmLabel}>Sale</span>
            <span className={styles.confirmValue}>#{transaction.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className={styles.confirmRow}>
            <span className={styles.confirmLabel}>Amount</span>
            <span className={styles.confirmValue}>KES {Number(transaction.totalAmount).toLocaleString()}</span>
          </div>
          <div className={styles.confirmRow}>
            <span className={styles.confirmLabel}>Customer</span>
            <span className={styles.confirmValue}>Walk-in</span>
          </div>
        </div>
        <p className={styles.confirmMessage}>
          This will mark the sale as refunded and restore the sold items to inventory.
        </p>
        <div className={styles.confirmActions}>
          <button className={styles.confirmCancel} onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className={styles.confirmDanger}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Refunding..." : "Confirm Refund"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SALE DETAIL MODAL
// ============================================================
function SaleDetailModal({
  transaction,
  onClose,
  orgId,
  onRefundSuccess,
}: {
  transaction: Transaction | null;
  onClose: () => void;
  orgId: string;
  onRefundSuccess: () => void;
}) {
  const [detail, setDetail] = useState<TransactionDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isRefunded, setIsRefunded] = useState(false);

  const { suiteContext } = useAuth();
  const permissions = suiteContext?.permissions ?? [];
  const isOwner = permissions.includes("*");
  const canRefund = isOwner || permissions.includes("kxtill.sales.refund");

  // Fixed: Use isMounted pattern
  useEffect(() => {
    let isMounted = true;

    const fetchDetail = async () => {
      if (!transaction) return;
      setLoading(true);
      try {
        const res = await api.get<TransactionDetailResponse>(
          `/api/v1/organizations/${orgId}/kxtill/sales/${transaction.id}`
        );
        if (!isMounted) return;
        setDetail(res.data);
        setIsRefunded(res.data.sale.status === "REFUNDED");
      } catch (error) {
        console.error("Failed to fetch transaction detail:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDetail();

    return () => {
      isMounted = false;
    };
  }, [transaction, orgId]);

  const handleRefund = async () => {
    if (!transaction) return;

    setRefunding(true);
    setShowConfirm(false);

    try {
      const res = await api.post<RefundResponse>(
        `/api/v1/organizations/${orgId}/kxtill/sales/${transaction.id}/refund`
      );

      if (res.data.message) {
        setIsRefunded(true);
        setToast({ 
          message: res.data.message || "Sale refunded successfully! Inventory has been restored.", 
          type: 'success' 
        });
        
        setTimeout(() => {
          onRefundSuccess();
          onClose();
        }, 1500);
      }
    } catch (error: unknown) {
      console.error("Failed to refund sale:", error);
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to process refund. Please try again.";
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setRefunding(false);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "COMPLETED": return { label: "Completed", className: "statusCompleted" };
      case "REFUNDED": return { label: "Refunded", className: "statusRefunded" };
      case "VOIDED": return { label: "Voided", className: "statusVoided" };
      default: return { label: status, className: "statusPending" };
    }
  };

  if (!transaction) return null;

  const sale = detail?.sale;
  const status = sale ? getStatusDisplay(sale.status) : { label: "Loading", className: "statusPending" };

  const getUserName = (user: SaleUser | undefined) => {
    if (!user) return "Unknown";
    return `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown";
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <RefundConfirmationModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleRefund}
        transaction={transaction}
        loading={refunding}
      />

      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <div className={styles.modalHeaderLeft}>
              <div className={styles.modalInvoice}>
                <Receipt size={18} />
                <span>Sale #{transaction.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <span className={`${styles.statusBadge} ${styles[status.className]}`}>
                {status.label}
              </span>
            </div>
            <div className={styles.modalHeaderRight}>
              <button className={styles.modalActionBtn} onClick={() => console.log("Print")}>
                <Printer size={16} />
              </button>
              <button className={styles.modalActionBtn} onClick={() => console.log("Share")}>
                <Share2 size={16} />
              </button>
              <button className={styles.modalCloseBtn} onClick={onClose}>
                <X size={18} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className={styles.modalLoading}>
              <div className={styles.loaderWrapper}>
                <div className={styles.loader} />
              </div>
              <p>Loading sale details...</p>
            </div>
          ) : sale ? (
            <>
              <div className={styles.modalBody}>
                {isRefunded && (
                  <div className={styles.refundedBadge}>
                    <AlertCircle size={16} />
                    <span>This sale has been refunded</span>
                  </div>
                )}

                <div className={styles.modalMeta}>
                  <div className={styles.modalMetaItem}>
                    <span className={styles.modalMetaLabel}>Date & Time</span>
                    <span className={styles.modalMetaValue}>
                      {new Date(sale.createdAt).toLocaleDateString()}, {new Date(sale.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className={styles.modalMetaItem}>
                    <span className={styles.modalMetaLabel}>Customer</span>
                    <span className={styles.modalMetaValue}>Walk-in Customer</span>
                  </div>
                  <div className={styles.modalMetaItem}>
                    <span className={styles.modalMetaLabel}>Sold by</span>
                    <span className={styles.modalMetaValue}>{getUserName(sale.user)}</span>
                  </div>
                  <div className={styles.modalMetaItem}>
                    <span className={styles.modalMetaLabel}>Payment</span>
                    <span className={styles.modalMetaValue}>
                      <CreditCard size={14} />
                      {sale.payments?.[0]?.method || "N/A"}
                    </span>
                  </div>
                  <div className={styles.modalMetaItem}>
                    <span className={styles.modalMetaLabel}>Status</span>
                    <span className={styles.modalMetaValue}>{sale.paymentStatus || "N/A"}</span>
                  </div>
                </div>

                <div className={styles.modalItems}>
                  <div className={styles.modalItemsHeader}>
                    <span>Product</span>
                    <span>Qty</span>
                    <span>Price</span>
                    <span>Total</span>
                  </div>
                  {sale.items?.map((item, idx) => (
                    <div key={idx} className={styles.modalItemRow}>
                      <span className={styles.modalItemName}>{item.product?.name || "Unknown"}</span>
                      <span>{Number(item.quantity) || 0}</span>
                      <span>KES {Number(item.unitPrice) || 0}</span>
                      <span>KES {Number(item.total) || 0}</span>
                    </div>
                  ))}
                </div>

                <div className={styles.modalTotals}>
                  <div className={styles.modalTotalRow}>
                    <span>Subtotal</span>
                    <span>KES {Number(sale.subtotal) || 0}</span>
                  </div>
                  <div className={styles.modalTotalRow}>
                    <span>Discount</span>
                    <span>KES {Number(sale.discount) || 0}</span>
                  </div>
                  <div className={styles.modalTotalRow}>
                    <span>Tax</span>
                    <span>KES {Number(sale.taxAmount) || 0}</span>
                  </div>
                  <div className={`${styles.modalTotalRow} ${styles.modalTotalRowGrand}`}>
                    <span>Total</span>
                    <span>KES {Number(sale.totalAmount) || 0}</span>
                  </div>
                </div>

                <div className={styles.modalPayment}>
                  <div className={styles.modalPaymentMethod}>
                    <CreditCard size={14} />
                    <span>{sale.payments?.[0]?.method || "N/A"}</span>
                  </div>
                  {sale.payments?.[0]?.reference && (
                    <div className={styles.modalTransactionId}>
                      <span>Ref: {sale.payments[0].reference}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button className={styles.modalFooterBtn} onClick={() => console.log("Print Receipt")}>
                  <Printer size={16} />
                  Print Receipt
                </button>
                <button className={styles.modalFooterBtn} onClick={() => console.log("Share Receipt")}>
                  <Share2 size={16} />
                  Share Receipt
                </button>
                {canRefund && !isRefunded && (
                  <button
                    className={`${styles.modalFooterBtn} ${styles.modalFooterBtnDanger}`}
                    onClick={() => setShowConfirm(true)}
                    disabled={refunding}
                  >
                    {refunding ? (
                      <>
                        <span className={styles.spinnerSmall} />
                        Refunding...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={16} />
                        Refund
                      </>
                    )}
                  </button>
                )}
                {isRefunded && (
                  <button className={`${styles.modalFooterBtn} ${styles.modalFooterBtnDisabled}`} disabled>
                    Already Refunded
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className={styles.modalEmpty}>
              <AlertCircle size={32} />
              <p>Failed to load sale details</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function SalesPage() {
  const { activeOrganization, activeBranch, suiteContext } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"today" | "7d" | "30d" | "90d">("today");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [chartData, setChartData] = useState<SalesChartResponse | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodsResponse | null>(null);
  const [branchBreakdown, setBranchBreakdown] = useState<BranchBreakdownResponse | null>(null);
  const [transactions, setTransactions] = useState<TransactionsResponse | null>(null);

  const permissions = suiteContext?.permissions ?? [];
  const isOwner = permissions.includes("*");
  const showBranchPanel = isOwner;

  const orgId = activeOrganization?.id || "";
  const branchId = activeBranch?.id;

  // ============================================================
  // FETCH DATA - Fixed with useCallback and isMounted
  // ============================================================


  // Fixed: Use isMounted pattern to prevent setState warning
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!orgId) {
        if (isMounted) setLoading(false);
        return;
      }

      if (isMounted) {
        setLoading(true);
        setError(null);
      }

      try {
        const params: Record<string, string> = {};
        if (branchId) params.branchId = branchId;
        if (period) params.period = period;

        const [summaryRes, chartRes, paymentRes, branchRes, txRes] = await Promise.all([
          api.get<DashboardSummary>(`/api/v1/organizations/${orgId}/kxtill/dashboard/summary`, { params }),
          api.get<SalesChartResponse>(`/api/v1/organizations/${orgId}/kxtill/dashboard/sales-chart`, { params }),
          api.get<PaymentMethodsResponse>(`/api/v1/organizations/${orgId}/kxtill/dashboard/payment-methods`, { params }),
          isOwner ? api.get<BranchBreakdownResponse>(`/api/v1/organizations/${orgId}/kxtill/dashboard/branch-breakdown`, { params }) : Promise.resolve(null),
          api.get<TransactionsResponse>(`/api/v1/organizations/${orgId}/kxtill/sales`, { params: { ...params, limit: 20 } }),
        ]);

        if (!isMounted) return;

        setSummary(summaryRes.data);
        setChartData(chartRes.data);
        setPaymentMethods(paymentRes.data);
        if (isOwner && branchRes) setBranchBreakdown(branchRes.data);
        setTransactions(txRes.data);

      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to fetch sales data:", err);
        setError("Failed to load sales data. Please try again.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [orgId, branchId, period, refreshKey, isOwner]);

  const handleRefundSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Recharts tooltip formatter can receive a scalar or a readonly array value.
  const formatTooltipValue = (
    value: number | string | readonly (number | string)[] | undefined
  ): string => {
    const numericValue = Array.isArray(value)
      ? Number(value[0] ?? 0)
      : Number(value ?? 0);

    return Number.isFinite(numericValue) ? `KES ${numericValue.toLocaleString()}` : "KES 0";
  };

  const chartFormatted = chartData?.data?.map((d) => ({
    time: d.label,
    sales: d.value,
    transactions: 0,
  })) || [];

  const contextName = activeBranch?.name || "All Branches";

  // ============================================================
  // RENDER
  // ============================================================

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loaderWrapper}>
          <div className={styles.loader} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.errorState}>
          <AlertCircle size={32} className={styles.errorIcon} />
          <p className={styles.errorText}>{error}</p>
          <button className={styles.retryBtn} onClick={() => setRefreshKey(prev => prev + 1)}>
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyState}>
          <Receipt size={48} className={styles.emptyIcon} />
          <h3>No sales data</h3>
          <p>No sales data available for the selected period.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.page}>
        {/* ===== HEADER ===== */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <Receipt size={24} />
            </div>
            <div>
              <h1 className={styles.title}>Sales</h1>
              <p className={styles.subtitle}>
                {contextName} • {period === "today" ? "Today" : period === "7d" ? "Last 7 Days" : period === "30d" ? "Last 30 Days" : "Last 90 Days"}
              </p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.periodControls}>
              <button
                className={`${styles.periodBtn} ${period === "today" ? styles.periodBtnActive : ""}`}
                onClick={() => setPeriod("today")}
              >
                <Calendar size={12} />
                Today
              </button>
              <button
                className={`${styles.periodBtn} ${period === "7d" ? styles.periodBtnActive : ""}`}
                onClick={() => setPeriod("7d")}
              >
                7 Days
              </button>
              <button
                className={`${styles.periodBtn} ${period === "30d" ? styles.periodBtnActive : ""}`}
                onClick={() => setPeriod("30d")}
              >
                30 Days
              </button>
              <button
                className={`${styles.periodBtn} ${period === "90d" ? styles.periodBtnActive : ""}`}
                onClick={() => setPeriod("90d")}
              >
                90 Days
              </button>
            </div>
            <button className={styles.refreshBtn} onClick={() => setRefreshKey(prev => prev + 1)}>
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* ===== SUMMARY CARDS ===== */}
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryCardTop}>
              <span className={styles.summaryCardLabel}>Total Sales</span>
            </div>
            <div className={styles.summaryCardValue}>{summary.totalSales}</div>
            <div className={styles.summaryCardSub}>Transactions</div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryCardTop}>
              <span className={styles.summaryCardLabel}>Revenue</span>
              <span className={styles.summaryCardGrowth}>
                <TrendingUp size={12} />
                {summary.growth || 0}%
              </span>
            </div>
            <div className={styles.summaryCardValue}>KES {summary.totalRevenue?.toLocaleString() || 0}</div>
            <div className={styles.summaryCardSub}>Total revenue</div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryCardTop}>
              <span className={styles.summaryCardLabel}>Active Users</span>
            </div>
            <div className={styles.summaryCardValue}>{summary.activeUsers || 0}</div>
            <div className={styles.summaryCardSub}>Today</div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryCardTop}>
              <span className={styles.summaryCardLabel}>Conversion Rate</span>
            </div>
            <div className={styles.summaryCardValue}>{summary.conversionRate || 0}%</div>
            <div className={styles.summaryCardSub}>Average: KES {summary.averageOrderValue || 0}</div>
          </div>
        </div>

        {/* ===== CHART ===== */}
        {chartData && (
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div className={styles.chartHeaderLeft}>
                <span className={styles.chartTitle}>Sales Overview</span>
              </div>
              <span className={styles.chartMeta}>
                {period === "today" ? "Hourly breakdown" : "Daily breakdown"}
              </span>
            </div>
            <div className={styles.chartBody}>
              {chartFormatted.some(d => d.sales > 0) ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartFormatted} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="time" tick={{ fill: "#62636e", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fill: "#62636e", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                      tickFormatter={(value) => `KES ${value/1000}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#1b1c23",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={formatTooltipValue}
                    />
                    <Bar dataKey="sales" fill="#ff6a2b" radius={[3, 3, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className={styles.chartEmpty}>No sales data</div>
              )}
            </div>
          </div>
        )}

        {/* ===== TWO COLUMN ===== */}
        <div className={styles.twoCol}>
          {paymentMethods && (
            <div className={styles.breakdownCard}>
              <div className={styles.breakdownCardHeader}>
                <span className={styles.breakdownCardTitle}>Payment Methods</span>
                <span className={styles.breakdownCardTotal}>
                  KES {paymentMethods.total?.toLocaleString() || 0}
                </span>
              </div>
              <div className={styles.breakdownList}>
                {paymentMethods.paymentMethods?.map((item) => (
                  <div key={item.name} className={styles.breakdownRow}>
                    <span className={styles.breakdownLabel}>{item.name}</span>
                    <div className={styles.breakdownBar}>
                      <div
                        className={styles.breakdownBarFill}
                        style={{ width: `${item.value || 0}%` }}
                      />
                    </div>
                    <span className={styles.breakdownAmount}>KES {item.amount?.toLocaleString() || 0}</span>
                    <span className={styles.breakdownPercent}>{item.value || 0}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showBranchPanel && branchBreakdown && (
            <div className={styles.breakdownCard}>
              <div className={styles.breakdownCardHeader}>
                <span className={styles.breakdownCardTitle}>Sales by Branch</span>
                <span className={styles.breakdownCardTotal}>
                  KES {branchBreakdown.totalSales?.toLocaleString() || 0}
                </span>
              </div>
              <div className={styles.breakdownList}>
                {branchBreakdown.data?.map((branch) => (
                  <div key={branch.code} className={styles.branchRow}>
                    <div className={styles.branchRowInfo}>
                      <span className={styles.branchRowName}>{branch.name}</span>
                      <span className={styles.branchRowTxns}>{branch.transactions || 0} txns</span>
                    </div>
                    <span className={styles.branchRowAmount}>KES {branch.sales?.toLocaleString() || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ===== TRANSACTIONS ===== */}
        {transactions && (
          <div className={styles.transactionsCard}>
            <div className={styles.transactionsHeader}>
              <div className={styles.transactionsHeaderLeft}>
                <span className={styles.transactionsTitle}>Recent Sales</span>
                <span className={styles.transactionsCount}>{transactions.total || 0} transactions</span>
              </div>
              <div className={styles.transactionsFilters}>
                <div className={styles.searchWrap}>
                  <Search size={14} className={styles.searchIcon} />
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Search invoice..."
                  />
                </div>
                <button className={styles.filterBtn}>
                  <Filter size={14} />
                  Filters
                  <ChevronDown size={12} />
                </button>
                <button className={styles.exportBtn}>
                  <Download size={14} />
                  Export
                </button>
              </div>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Date & Time</th>
                    <th>Items</th>
                    <th>Cashier</th>
                    <th>Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.items && transactions.items.length > 0 ? (
                    transactions.items.map((tx) => (
                      <tr
                        key={tx.id}
                        className={styles.tableRow}
                        onClick={() => {
                          setSelectedTransaction(tx);
                          setShowDetail(true);
                        }}
                      >
                        <td className={styles.txInvoice}>{tx.id.slice(0, 8).toUpperCase()}</td>
                        <td>
                          <div className={styles.txDateTime}>
                            <span>{new Date(tx.createdAt).toLocaleDateString()}</span>
                            <span className={styles.txTime}>{new Date(tx.createdAt).toLocaleTimeString()}</span>
                          </div>
                        </td>
                        <td>{tx.items?.length || 0} items</td>
                        <td>{tx.user ? `${tx.user.firstName} ${tx.user.lastName}` : "Unknown"}</td>
                        <td className={styles.txAmount}>KES {Number(tx.totalAmount)?.toLocaleString() || 0}</td>
                        <td>
                          <button
                            className={styles.txActionBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTransaction(tx);
                              setShowDetail(true);
                            }}
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className={styles.emptyTableRow}>
                        <div className={styles.emptyTable}>
                          <p>No transactions found</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showDetail && selectedTransaction && (
        <SaleDetailModal
          transaction={selectedTransaction}
          onClose={() => {
            setShowDetail(false);
            setSelectedTransaction(null);
          }}
          orgId={orgId}
          onRefundSuccess={handleRefundSuccess}
        />
      )}
    </>
  );
}