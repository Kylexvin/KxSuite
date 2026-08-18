// app/kx/kxtill/inventory/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/axios";
import {
  Package,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  ChevronDown,
  Check,
} from "lucide-react";
import styles from "./page.module.css";

// ===== TYPES =====
type InventorySummary = {
  totalProducts: number;
  lowStock: number;
  outOfStock: number;
  stockValue?: number; // Made optional since not always returned
};

type InventoryHealth = {
  health: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
};

type NeedsAttentionItem = {
  id: string;
  product: string;
  sku: string;
  branch: string;
  currentStock: number;
  minimumStock: number;
  status: "Low Stock" | "Out of Stock";
};

type NeedsAttentionResponse = {
  items: NeedsAttentionItem[];
  lowStockCount: number;
  outOfStockCount: number;
};

type ActivityItem = {
  id: string;
  time: string;
  product: string;
  productId: string;
  activity: "Sale" | "Adjustment" | "Refund";
  quantity: number;
  branch: string;
  user: string;
};

type ActivityResponse = {
  items: ActivityItem[];
  total: number;
};

type BranchStock = {
  branchId: string;
  branch: string;
  products: number;
  lowStock: number;
  outOfStock: number;
};

type BranchStockResponse = {
  branches: BranchStock[];
  totalProducts: number;
  totalLowStock: number;
  totalOutOfStock: number;
};

// ============================================================
// COMPONENTS
// ============================================================
function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; className: string }> = {
    "In Stock": { label: "In Stock", className: styles.statusInStock },
    "Low Stock": { label: "Low Stock", className: styles.statusLowStock },
    "Out of Stock": { label: "Out of Stock", className: styles.statusOutOfStock },
  };

  const config = configs[status] || configs["In Stock"];
  return <span className={`${styles.statusBadge} ${config.className}`}>{config.label}</span>;
}

function ActivityBadge({ activity }: { activity: string }) {
  const configs: Record<string, { className: string; icon: string }> = {
    Sale: { className: styles.activitySale, icon: "↓" },
    Adjustment: { className: styles.activityAdjustment, icon: "↔" },
    Refund: { className: styles.activityRefund, icon: "↑" },
  };

  const config = configs[activity] || configs["Adjustment"];
  return <span className={`${styles.activityBadge} ${config.className}`}>{config.icon} {activity}</span>;
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function InventoryPage() {
  const { activeOrganization, activeBranch, suiteContext } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<"all" | "low" | "out">("all");
  const [period, setPeriod] = useState<"today" | "7d" | "30d">("today");
  const [refreshKey, setRefreshKey] = useState(0);

  // State
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [health, setHealth] = useState<InventoryHealth | null>(null);
  const [needsAttention, setNeedsAttention] = useState<NeedsAttentionResponse | null>(null);
  const [activity, setActivity] = useState<ActivityResponse | null>(null);
  const [branchStock, setBranchStock] = useState<BranchStockResponse | null>(null);

  const permissions = suiteContext?.permissions ?? [];
  const isOwner = permissions.includes("*");
  const showBranchPanel = isOwner;
  const showStockValue = isOwner;

  const orgId = activeOrganization?.id || "";
  const branchId = activeBranch?.id;

  // ============================================================
  // FETCH DATA
  // ============================================================

  const fetchData = async () => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params: Record<string, string> = {};
      if (branchId) params.branchId = branchId;
      if (period) params.period = period;

      // 1. Summary
      const summaryRes = await api.get<InventorySummary>(
        `/api/v1/organizations/${orgId}/kxtill/inventory/summary`,
        { params }
      );
      setSummary(summaryRes.data);

      // 2. Health
      const healthRes = await api.get<InventoryHealth>(
        `/api/v1/organizations/${orgId}/kxtill/inventory/health`,
        { params }
      );
      setHealth(healthRes.data);

      // 3. Needs Attention
      const statusParam = filterTab === "all" ? undefined : filterTab;
      const attentionRes = await api.get<NeedsAttentionResponse>(
        `/api/v1/organizations/${orgId}/kxtill/inventory/needs-attention`,
        { params: { ...params, status: statusParam, limit: 20 } }
      );
      setNeedsAttention(attentionRes.data);

      // 4. Stock Activity
      const activityRes = await api.get<ActivityResponse>(
        `/api/v1/organizations/${orgId}/kxtill/inventory/activity`,
        { params: { ...params, limit: 10 } }
      );
      setActivity(activityRes.data);

      // 5. Branch Stock (Owner only)
      if (isOwner) {
        const branchRes = await api.get<BranchStockResponse>(
          `/api/v1/organizations/${orgId}/kxtill/inventory/branches`,
          { params: { period } }
        );
        setBranchStock(branchRes.data);
      }

    } catch (err) {
      console.error("Failed to fetch inventory data:", err);
      setError("Failed to load inventory data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [orgId, branchId, period, filterTab, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const contextName = activeBranch?.name || "All Branches";

  // ============================================================
  // RENDER
  // ============================================================

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Loading inventory data...</p>
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
          <button className={styles.retryBtn} onClick={fetchData}>
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
          <Package size={48} className={styles.emptyIcon} />
          <h3>No inventory data</h3>
          <p>No inventory data available for the selected period.</p>
        </div>
      </div>
    );
  }

  // Filter needs attention items based on tab
  const filteredAttention = needsAttention?.items || [];
  const lowCount = needsAttention?.lowStockCount || 0;
  const outCount = needsAttention?.outOfStockCount || 0;

  return (
    <div className={styles.page}>
      {/* ===== HEADER ===== */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <Package size={24} />
          </div>
          <div>
            <h1 className={styles.title}>Inventory</h1>
            <p className={styles.subtitle}>
              Manage your products, stock levels, and inventory activity • {contextName}
            </p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.periodControls}>
            <button
              className={`${styles.periodBtn} ${period === "today" ? styles.periodBtnActive : ""}`}
              onClick={() => setPeriod("today")}
            >
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
          </div>
          <button className={styles.refreshBtn} onClick={handleRefresh}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>


{/* ===== SUMMARY CARDS ===== */}
<div className={styles.summaryGrid}>
  <div className={styles.summaryCard}>
    <div className={styles.summaryCardTop}>
      <span className={styles.summaryCardLabel}>Total Products</span>
      <span className={styles.summaryCardIcon}>
        <Package size={16} />
      </span>
    </div>
    <div className={styles.summaryCardValue}>{summary.totalProducts}</div>
    <div className={styles.summaryCardSub}>Products in your catalog.</div>
  </div>
  <div className={styles.summaryCard}>
    <div className={styles.summaryCardTop}>
      <span className={styles.summaryCardLabel}>Low Stock</span>
      <span className={styles.summaryCardIcon} style={{ color: "#ffa726" }}>
        <AlertTriangle size={16} />
      </span>
    </div>
    <div className={styles.summaryCardValue}>{summary.lowStock}</div>
    <div className={styles.summaryCardSub}>Below minimum stock level.</div>
  </div>
  <div className={styles.summaryCard}>
    <div className={styles.summaryCardTop}>
      <span className={styles.summaryCardLabel}>Out of Stock</span>
      <span className={styles.summaryCardIcon} style={{ color: "#ef5350" }}>
        <AlertCircle size={16} />
      </span>
    </div>
    <div className={styles.summaryCardValue}>{summary.outOfStock}</div>
    <div className={styles.summaryCardSub}>Currently unavailable.</div>
  </div>
</div>

      {/* ===== INVENTORY HEALTH ===== */}
      {health && (
        <div className={styles.healthCard}>
          <div className={styles.healthHeader}>
            <span className={styles.healthTitle}>Inventory Health</span>
            <span className={styles.healthPercent}>{health.health}%</span>
          </div>
          <div className={styles.healthBar}>
            <div
              className={styles.healthBarFill}
              style={{ width: `${health.health}%` }}
            />
          </div>
          <div className={styles.healthStats}>
            <span className={styles.healthStat}>
              <span className={styles.healthDot} style={{ background: "#4caf82" }} />
              {health.inStock} In Stock
            </span>
            <span className={styles.healthStat}>
              <span className={styles.healthDot} style={{ background: "#ffa726" }} />
              {health.lowStock} Low Stock
            </span>
            <span className={styles.healthStat}>
              <span className={styles.healthDot} style={{ background: "#ef5350" }} />
              {health.outOfStock} Out of Stock
            </span>
          </div>
        </div>
      )}

      {/* ===== NEEDS ATTENTION ===== */}
      <div className={styles.attentionCard}>
        <div className={styles.attentionHeader}>
          <span className={styles.attentionTitle}>Needs Attention</span>
          <div className={styles.attentionTabs}>
            <button
              className={`${styles.attentionTab} ${filterTab === "all" ? styles.attentionTabActive : ""}`}
              onClick={() => setFilterTab("all")}
            >
              All ({lowCount + outCount})
            </button>
            <button
              className={`${styles.attentionTab} ${filterTab === "low" ? styles.attentionTabActive : ""}`}
              onClick={() => setFilterTab("low")}
            >
              Low Stock ({lowCount})
            </button>
            <button
              className={`${styles.attentionTab} ${filterTab === "out" ? styles.attentionTabActive : ""}`}
              onClick={() => setFilterTab("out")}
            >
              Out of Stock ({outCount})
            </button>
          </div>
        </div>
        <div className={styles.attentionList}>
          <div className={styles.attentionHeaders}>
            <span>Product</span>
            <span>Branch</span>
            <span>Current</span>
            <span>Minimum</span>
            <span>Status</span>
          </div>
          {filteredAttention.length > 0 ? (
            filteredAttention.map((item) => (
              <div key={item.id} className={styles.attentionRow}>
                <span className={styles.attentionProduct}>{item.product}</span>
                <span>{item.branch}</span>
                <span>{item.currentStock}</span>
                <span>{item.minimumStock}</span>
                <span>
                  <StatusBadge status={item.status} />
                </span>
              </div>
            ))
          ) : (
            <div className={styles.attentionEmpty}>
              <Check size={24} />
              <span>No items need attention. Everything is stocked!</span>
            </div>
          )}
        </div>
      </div>

      {/* ===== TWO COLUMN: Recent Activity + Branch Inventory ===== */}
      <div className={styles.twoCol}>
        {/* Recent Stock Activity */}
        <div className={styles.activityCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Recent Stock Activity</span>
            <div className={styles.cardActions}>
              <button className={styles.cardFilterBtn}>
                {period === "today" ? "Today" : period === "7d" ? "7 Days" : "30 Days"}
                <ChevronDown size={12} />
              </button>
            </div>
          </div>
          <div className={styles.activityList}>
            <div className={styles.activityHeaders}>
              <span>Time</span>
              <span>Product</span>
              <span>Activity</span>
              <span>Qty</span>
              <span>Branch</span>
              <span>User</span>
            </div>
            {activity?.items && activity.items.length > 0 ? (
              activity.items.map((item) => (
                <div key={item.id} className={styles.activityRow}>
                  <span className={styles.activityTime}>
                    {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span>{item.product}</span>
                  <span>
                    <ActivityBadge activity={item.activity} />
                  </span>
                  <span className={item.quantity > 0 ? styles.quantityPositive : styles.quantityNegative}>
                    {item.quantity > 0 ? `+${item.quantity}` : item.quantity}
                  </span>
                  <span>{item.branch}</span>
                  <span>{item.user}</span>
                </div>
              ))
            ) : (
              <div className={styles.activityEmpty}>
                <span>No recent stock activity.</span>
              </div>
            )}
          </div>
        </div>

        {/* Stock Across Branches */}
        {showBranchPanel && branchStock && (
          <div className={styles.branchCard}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Stock Across Branches</span>
              <span className={styles.cardTotal}>
                {branchStock.totalProducts} total products
              </span>
            </div>
            <div className={styles.branchList}>
              <div className={styles.branchHeaders}>
                <span>Branch</span>
                <span>Products</span>
                <span>Low Stock</span>
                <span>Out of Stock</span>
              </div>
              {branchStock.branches.map((branch) => (
                <div key={branch.branchId} className={styles.branchRow}>
                  <span className={styles.branchName}>{branch.branch}</span>
                  <span>{branch.products}</span>
                  <span className={styles.branchLowStock}>{branch.lowStock}</span>
                  <span className={styles.branchOutOfStock}>{branch.outOfStock}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}