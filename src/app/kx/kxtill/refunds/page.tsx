// app/kx/kxtill/refunds/page.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/axios";
import {
  Search,
  Filter,
  ChevronDown,
  Eye,
  RefreshCw,
  Download,
  X,
  Receipt,
  AlertCircle,
  Building2,
  CreditCard,
  User,
  Calendar,
  Clock,
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

type ReturnsSummary = {
  today: { total: number; count: number };
  totalReturns: number;
  thisMonth: number;
  thisWeek: number;
  returnRate: number;
  totalAmount: number;
  topReturnedProducts: { name: string; count: number; total: number }[];
  byBranch: { branchName: string; count: number; total: number }[];
};

type RefundedSale = {
  id: string;
  reference: string | null;
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  refundedAt: string | null;
  refundedBy: string | null;
  customerName: string | null;
  branch: { id: string; name: string };
  user: { firstName: string; lastName: string };
  refundedByUser?: { firstName: string; lastName: string };
  items: { product: { name: string }; quantity: number; total: number }[];
  payments: { method: string; amount: number }[];
};

type RefundedSalesResponse = {
  items: RefundedSale[];
  total: number;
  limit: number;
  offset: number;
};

type SaleDetail = {
  id: string;
  reference: string | null;
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
  refundedAt: string | null;
  refundedBy: string | null;
  customerName: string | null;
  branch: { id: string; name: string };
  user: { id: string; email: string; firstName: string; lastName: string };
  refundedByUser?: { id: string; firstName: string; lastName: string; email: string };
  items: {
    id: string;
    productId: string;
    unitId: string;
    quantity: string;
    unitPrice: string;
    total: string;
    unit: { id: string; name: string; abbreviation: string };
    product: { id: string; name: string; sku: string };
  }[];
  payments: { id: string; method: string; amount: string }[];
};

function RefundDetailModal({
  saleId,
  onClose,
  orgId,
}: {
  saleId: string | null;
  onClose: () => void;
  orgId: string;
}) {
  const [detail, setDetail] = useState<SaleDetail | null>(null);
  const [loading, setLoading] = useState(false);

  // FIXED: fetchDetail declared BEFORE useEffect
  useEffect(() => {
    let isMounted = true;

    const fetchDetail = async () => {
      if (!saleId) return;
      if (!isMounted) return;
      setLoading(true);
      try {
        const res = await api.get(`/api/v1/organizations/${orgId}/kxtill/sales/${saleId}`);
        if (!isMounted) return;
        setDetail(res.data.sale || res.data);
      } catch (error) {
        console.error("Failed to fetch sale detail:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (saleId) fetchDetail();

    return () => {
      isMounted = false;
    };
  }, [saleId, orgId]);

  const formatDate = (date: string) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("en-KE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!saleId) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <div className={styles.modalInvoice}>
              <Receipt size={18} />
              <span>Sale #{detail?.reference || saleId.slice(0, 8).toUpperCase()}</span>
            </div>
            {detail?.status === "REFUNDED" && (
              <span className={`${styles.statusBadge} ${styles.statusRefunded}`}>REFUNDED</span>
            )}
          </div>
          <button className={styles.modalCloseBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className={styles.modalLoading}>
            <div className={styles.loaderWrapper}>
              <div className={styles.loader} />
            </div>
            <p>Loading sale details...</p>
          </div>
        ) : detail ? (
          <div className={styles.modalBody}>
            {detail.status === "REFUNDED" && (
              <div className={styles.refundNotice}>
                <span className={styles.refundNoticeIcon}>⏪</span>
                <div>
                  <div className={styles.refundNoticeTitle}>Refunded</div>
                  <div className={styles.refundNoticeDate}>
                    {formatDate(detail.refundedAt || detail.updatedAt)}
                  </div>
                </div>
                <div className={styles.refundNoticeAmount}>
                  -KES {Number(detail.totalAmount).toLocaleString()}
                </div>
              </div>
            )}

            <div className={styles.modalMeta}>
              <div className={styles.modalMetaItem}>
                <span className={styles.modalMetaLabel}>Original Sale</span>
                <span className={styles.modalMetaValue}>
                  <Calendar size={14} />
                  {formatDate(detail.createdAt)}
                </span>
              </div>
              <div className={styles.modalMetaItem}>
                <span className={styles.modalMetaLabel}>Refunded By</span>
                <span className={styles.modalMetaValue}>
                  <User size={14} />
                  {detail.refundedByUser
                    ? `${detail.refundedByUser.firstName} ${detail.refundedByUser.lastName}`
                    : detail.user?.firstName
                    ? `${detail.user.firstName} ${detail.user.lastName}`
                    : "Unknown"}
                </span>
              </div>
              <div className={styles.modalMetaItem}>
                <span className={styles.modalMetaLabel}>Branch</span>
                <span className={styles.modalMetaValue}>
                  <Building2 size={14} />
                  {detail.branch?.name || "N/A"}
                </span>
              </div>
              <div className={styles.modalMetaItem}>
                <span className={styles.modalMetaLabel}>Customer</span>
                <span className={styles.modalMetaValue}>
                  <User size={14} />
                  {detail.customerName || "Walk-in"}
                </span>
              </div>
            </div>

            <div className={styles.modalItems}>
              <div className={styles.modalItemsHeader}>
                <span>Product</span>
                <span>Qty</span>
                <span>Price</span>
                <span>Total</span>
              </div>
              {detail.items?.map((item, idx) => (
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
                <span>KES {Number(detail.subtotal) || 0}</span>
              </div>
              <div className={styles.modalTotalRow}>
                <span>Discount</span>
                <span>KES {Number(detail.discount) || 0}</span>
              </div>
              <div className={styles.modalTotalRow}>
                <span>Tax</span>
                <span>KES {Number(detail.taxAmount) || 0}</span>
              </div>
              <div className={styles.modalTotalRowGrand}>
                <span>Total</span>
                <span>KES {Number(detail.totalAmount) || 0}</span>
              </div>
            </div>

            <div className={styles.modalPayment}>
              <div className={styles.modalPaymentMethod}>
                <CreditCard size={14} />
                <span>{detail.payments?.[0]?.method || "N/A"}</span>
              </div>
            </div>

            {detail.status === "REFUNDED" && (
              <>
                <div className={styles.stockNotice}>
                  <span>Stock restored — Items returned to inventory.</span>
                </div>
                <div className={styles.paymentNotice}>
                  <span>Payment reversal is handled manually.</span>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className={styles.modalEmpty}>
            <AlertCircle size={32} />
            <p>Failed to load sale details</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReturnsPage() {
  const { activeOrganization, activeBranch, suiteContext } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [summary, setSummary] = useState<ReturnsSummary | null>(null);
  const [refunds, setRefunds] = useState<RefundedSalesResponse | null>(null);

  const permissions = suiteContext?.permissions ?? [];
  const isOwner = permissions.includes("*");
  const orgId = activeOrganization?.id || "";
  const branchId = activeBranch?.id;

  // FIXED: Use isMounted pattern, no need for useCallback
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
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

        const summaryRes = await api.get<ReturnsSummary>(
          `/api/v1/organizations/${orgId}/kxtill/dashboard/returns-summary`,
          { params }
        );
        if (!isMounted) return;
        setSummary(summaryRes.data);

        const refundsRes = await api.get<RefundedSalesResponse>(
          `/api/v1/organizations/${orgId}/kxtill/sales`,
          { params: { ...params, status: "REFUNDED", limit: 50 } }
        );
        if (!isMounted) return;
        setRefunds(refundsRes.data);
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to fetch returns data:", err);
        setError("Failed to load returns data. Please try again.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [orgId, branchId, period]); // Simple dependencies, no function in deps

  const contextName = activeBranch?.name || "All Branches";
  const chartData = summary?.topReturnedProducts?.map((p) => ({
    name: p.name,
    value: p.count,
  })) || [];

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
          <button className={styles.retryBtn} onClick={() => window.location.reload()}>
            <RefreshCw size={16} /> Retry
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
          <h3>No returns data</h3>
          <p>No refunds have been processed yet.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.page}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <Receipt size={24} />
            </div>
            <div>
              <h1 className={styles.title}>Refunds</h1>
              <p className={styles.subtitle}>
                View and manage refunded sales • {contextName}
              </p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.periodControls}>
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
            <button className={styles.refreshBtn} onClick={() => window.location.reload()}>
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryCardTop}>
              <span className={styles.summaryCardLabel}>Refunded Today</span>
            </div>
            <div className={styles.summaryCardValue}>
              KES {summary.today?.total?.toLocaleString() || 0}
            </div>
            <div className={styles.summaryCardSub}>{summary.today?.count || 0} refunds</div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryCardTop}>
              <span className={styles.summaryCardLabel}>Refund Count</span>
            </div>
            <div className={styles.summaryCardValue}>{summary.totalReturns || 0}</div>
            <div className={styles.summaryCardSub}>Total refunds</div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryCardTop}>
              <span className={styles.summaryCardLabel}>This Month</span>
            </div>
            <div className={styles.summaryCardValue}>KES {summary.thisMonth?.toLocaleString() || 0}</div>
            <div className={styles.summaryCardSub}>{summary.thisMonth || 0} refunds</div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryCardTop}>
              <span className={styles.summaryCardLabel}>Return Rate</span>
            </div>
            <div className={styles.summaryCardValue}>{summary.returnRate || 0}%</div>
            <div className={styles.summaryCardSub}>Of total sales</div>
          </div>
        </div>

        <div className={styles.twoCol}>
          <div className={styles.breakdownCard}>
            <div className={styles.breakdownCardHeader}>
              <span className={styles.breakdownCardTitle}>Top Returned Products</span>
            </div>
            {chartData.length > 0 ? (
              <div className={styles.chartBodySmall}>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "#62636e", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#62636e", fontSize: 10 }} axisLine={false} tickLine={false} width={25} />
                    <Tooltip
                      contentStyle={{
                        background: "#1b1c23",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="value" fill="#ef5350" radius={[3, 3, 0, 0]} maxBarSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className={styles.chartEmpty}>No returned products</div>
            )}
          </div>

          {isOwner && summary.byBranch && summary.byBranch.length > 0 && (
            <div className={styles.breakdownCard}>
              <div className={styles.breakdownCardHeader}>
                <span className={styles.breakdownCardTitle}>Returns by Branch</span>
              </div>
              <div className={styles.breakdownList}>
                {summary.byBranch.map((branch) => (
                  <div key={branch.branchName} className={styles.branchRow}>
                    <div className={styles.branchRowInfo}>
                      <span className={styles.branchRowName}>{branch.branchName}</span>
                      <span className={styles.branchRowTxns}>{branch.count} refunds</span>
                    </div>
                    <span className={styles.branchRowAmount}>KES {branch.total.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.transactionsCard}>
          <div className={styles.transactionsHeader}>
            <div className={styles.transactionsHeaderLeft}>
              <span className={styles.transactionsTitle}>Recent Refunds</span>
              <span className={styles.transactionsCount}>{refunds?.total || 0} refunds</span>
            </div>
            <div className={styles.transactionsFilters}>
              <div className={styles.searchWrap}>
                <Search size={14} className={styles.searchIcon} />
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search sale / invoice..."
                />
              </div>
              <button className={styles.filterBtn}>
                <Filter size={14} /> Filters <ChevronDown size={12} />
              </button>
              <button className={styles.exportBtn}>
                <Download size={14} /> Export
              </button>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Sale</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Branch</th>
                  <th>Amount</th>
                  <th>Refunded By</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {refunds?.items && refunds.items.length > 0 ? (
                  refunds.items.map((tx) => {
                    const refundedByUser = tx.refundedByUser || tx.user;
                    return (
                      <tr
                        key={tx.id}
                        className={styles.tableRow}
                        onClick={() => {
                          setSelectedSaleId(tx.id);
                          setShowDetail(true);
                        }}
                      >
                        <td className={styles.txInvoice}>
                          #{tx.reference || tx.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td>
                          <div className={styles.txDateTime}>
                            <span>{new Date(tx.createdAt).toLocaleDateString()}</span>
                            <span className={styles.txTime}>
                              <Clock size={10} />
                              {new Date(tx.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                        </td>
                        <td>{tx.customerName || "Walk-in"}</td>
                        <td>{tx.branch?.name || "N/A"}</td>
                        <td className={styles.txAmount}>
                          KES {Number(tx.totalAmount).toLocaleString()}
                        </td>
                        <td>
                          {refundedByUser
                            ? `${refundedByUser.firstName} ${refundedByUser.lastName}`
                            : "Unknown"}
                        </td>
                        <td>
                          <span className={`${styles.statusBadge} ${styles.statusRefunded}`}>
                            Refunded
                          </span>
                        </td>
                        <td>
                          <button
                            className={styles.txActionBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSaleId(tx.id);
                              setShowDetail(true);
                            }}
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className={styles.emptyTableRow}>
                      <div className={styles.emptyTable}>
                        <p>No refunds found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showDetail && selectedSaleId && (
        <RefundDetailModal
          saleId={selectedSaleId}
          onClose={() => {
            setShowDetail(false);
            setSelectedSaleId(null);
          }}
          orgId={orgId}
        />
      )}
    </>
  );
}