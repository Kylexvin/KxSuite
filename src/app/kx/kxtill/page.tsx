// app/kx/kxtill/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/axios";
import {
  Package,
  ShoppingCart,
  DollarSign,
  Percent,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  RefreshCw,
  ArrowUpRight,
  AlertTriangle,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
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

type SalesChartResponse = {
  data: { date: string; label: string; value: number }[];
  total: number;
  trend: number;
};

type RecentSale = {
  id: string;
  total: number;
  items: { name: string; quantity: number; total: number }[];
  user: string;
  branchName: string;
  createdAt: string;
};

type TopProduct = {
  productId: string;
  name: string;
  total: number;
  quantity: number;
  stock: number;
};

type InventoryAlert = {
  id: string;
  productName: string;
  sku: string;
  currentStock: number;
  minStock: number;
  status: string;
  branch: string;
  branchId: string;
};

export default function KxTillOverview() {
  const { activeOrganization, activeBranch, suiteContext } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [salesData, setSalesData] = useState<{ date: string; value: number }[]>([]);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryAlert[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

  const permissions = suiteContext?.permissions ?? [];
  const isOwner = permissions.includes("*");
  const canViewSales = permissions.some(p => p.startsWith('kxtill.sales.view'));
  const canViewInventory = permissions.some(p => p.startsWith('kxtill.inventory.view'));

  // ============================================================
  // FETCH DATA
  // ============================================================

  const fetchDashboardData = async () => {
    if (!activeOrganization) return;

    setLoading(true);

    const orgId = activeOrganization.id;
    const branchId = activeBranch?.id || undefined;

    try {
      const params = branchId ? { branchId } : {};

      // Fetch summary
      const summaryRes = await api.get<DashboardSummary>(
        `/api/v1/organizations/${orgId}/kxtill/dashboard/summary`,
        { params }
      );
      setSummary(summaryRes.data);

      // Fetch sales chart
      const chartRes = await api.get<SalesChartResponse>(
        `/api/v1/organizations/${orgId}/kxtill/dashboard/sales-chart`,
        { params: { ...params, period: '30d' } }
      );
      setSalesData(chartRes.data.data.map(d => ({ date: d.label, value: d.value })));

      // Fetch recent sales
      const salesRes = await api.get<RecentSale[]>(
        `/api/v1/organizations/${orgId}/kxtill/dashboard/recent-sales`,
        { params: { ...params, limit: 5 } }
      );
      setRecentSales(salesRes.data || []);

      // Fetch top products
      const topRes = await api.get<TopProduct[]>(
        `/api/v1/organizations/${orgId}/kxtill/dashboard/top-products`,
        { params: { ...params, limit: 5 } }
      );
      setTopProducts(topRes.data || []);

      // Fetch inventory alerts
      const alertsRes = await api.get<{ alerts: InventoryAlert[] }>(
        `/api/v1/organizations/${orgId}/kxtill/dashboard/inventory-alerts`,
        { params }
      );
      setInventoryAlerts(alertsRes.data.alerts || []);

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // REFRESH ON CONTEXT CHANGE
  // ============================================================

  useEffect(() => {
    if (activeOrganization) {
      fetchDashboardData();
    }
  }, [activeOrganization?.id, activeBranch?.id]);

  // ============================================================
  // COMPUTED DATA
  // ============================================================

  const COLORS = ['#ff6a2b', '#ff8c42', '#4caf82', '#62636e', '#f5b324', '#ef5350'];
  const totalRevenue = topProducts.reduce((sum, p) => sum + p.total, 0);
  const categories = topProducts.length > 0 ? topProducts.map((p, i) => ({
    name: p.name,
    value: Math.round((p.total / totalRevenue) * 100),
    color: COLORS[i % COLORS.length],
  })) : [];

  const activity = recentSales.map((s) => ({
    id: s.id,
    user: s.user || 'Unknown',
    action: `sold KES ${s.total}`,
    time: new Date(s.createdAt).toLocaleDateString('en-KE', { 
      day: '2-digit', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }),
  }));

  // ============================================================
  // RENDER
  // ============================================================

  const contextName = activeBranch?.name || "All Branches";

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const defaultSummary: DashboardSummary = {
    totalSales: 0,
    totalRevenue: 0,
    activeUsers: 0,
    conversionRate: 0,
    averageOrderValue: 0,
    growth: 0,
    inventoryItems: 0,
    lowStock: 0,
  };

  const data = summary || defaultSummary;

  return (
    <div className={styles.page}>
      {/* ===== HEADER ===== */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.productIcon}>K</div>
          <div>
            <h1 className={styles.title}>KxTill Overview</h1>
            <p className={styles.subtitle}>
              Point of Sale & Inventory • {contextName}
            </p>
          </div>
        </div>
        <div className={styles.headerStats}>
          <div className={styles.headerStat}>
            <span className={styles.headerStatValue}>{data.totalSales}</span>
            <span className={styles.headerStatLabel}>Total Sales</span>
          </div>
          <div className={styles.headerDivider} />
          <div className={styles.headerStat}>
            <span className={styles.headerStatValue}>KSh {data.totalRevenue.toLocaleString()}</span>
            <span className={styles.headerStatLabel}>Revenue</span>
          </div>
          <div className={styles.headerDivider} />
          <div className={styles.headerStat}>
            <span className={styles.headerStatValue}>{data.activeUsers}</span>
            <span className={styles.headerStatLabel}>Active Users</span>
          </div>
        </div>
      </div>

      {/* ===== KPI ROW ===== */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiIcon}><ShoppingCart size={16} /></span>
            <span className={`${styles.kpiDelta} ${styles.deltaUp}`}>
              <ArrowUpRight size={12} />+{data.growth}%
            </span>
          </div>
          <div className={styles.kpiValue}>{data.totalSales.toLocaleString()}</div>
          <div className={styles.kpiLabel}>Total Sales</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiIcon}><DollarSign size={16} /></span>
          </div>
          <div className={styles.kpiValue}>KSh {data.totalRevenue.toLocaleString()}</div>
          <div className={styles.kpiLabel}>Revenue</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiIcon}><Package size={16} /></span>
          </div>
          <div className={styles.kpiValue}>{data.inventoryItems}</div>
          <div className={styles.kpiLabel}>Inventory Items</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiIcon}><Percent size={16} /></span>
          </div>
          <div className={styles.kpiValue}>{data.conversionRate}%</div>
          <div className={styles.kpiLabel}>Conversion Rate</div>
        </div>
      </div>

      {/* ===== TWO COLUMN: Charts ===== */}
      <div className={styles.twoCol}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitle}><Activity size={16} /> <span>Sales Overview</span></div>
            <span className={styles.chartMeta}>Last 30 days</span>
          </div>
          <div className={styles.chartBody}>
            {salesData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={salesData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ff6a2b" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#ff6a2b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: "#62636e", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#62636e", fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip contentStyle={{ background: "#1b1c23", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", fontSize: "12px" }} />
                  <Area type="monotone" dataKey="value" stroke="#ff6a2b" strokeWidth={2} fill="url(#salesGradient)" dot={{ fill: "#ff6a2b", r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.chartEmpty}>No sales data</div>
            )}
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitle}><BarChart3 size={16} /> <span>Top Products</span></div>
            <span className={styles.chartMeta}>By revenue</span>
          </div>
          <div className={styles.chartBody}>
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={topProducts} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "#62636e", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#62636e", fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip contentStyle={{ background: "#1b1c23", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", fontSize: "12px" }} />
                  <Bar dataKey="total" fill="#ff8c42" radius={[3, 3, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.chartEmpty}>No products sold</div>
            )}
          </div>
        </div>
      </div>

      {/* ===== BOTTOM ROW ===== */}
      <div className={styles.twoCol}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitle}><PieChartIcon size={16} /> <span>Product Distribution</span></div>
          </div>
          <div className={styles.pieContainer}>
            {categories.length > 0 ? (
              <>
                <div className={styles.pieChart}>
                  <ResponsiveContainer width={120} height={120}>
                    <PieChart>
                      <Pie data={categories} dataKey="value" innerRadius={35} outerRadius={55} stroke="none" paddingAngle={3}>
                        {categories.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#1b1c23", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", fontSize: "12px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className={styles.pieLegend}>
                  {categories.map((item) => (
                    <div key={item.name} className={styles.legendRow}>
                      <span className={styles.legendDot} style={{ background: item.color }} />
                      <span className={styles.legendName}>{item.name}</span>
                      <span className={styles.legendValue}>{item.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className={styles.chartEmpty}>No product data</div>
            )}
          </div>
        </div>

        <div className={styles.activityCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitle}><RefreshCw size={16} /> <span>Recent Activity</span></div>
            <span className={styles.chartMeta}>Recent sales</span>
          </div>
          <div className={styles.activityList}>
            {activity.length > 0 ? (
              activity.map((item) => (
                <div key={item.id} className={styles.activityItem}>
                  <div className={styles.activityContent}>
                    <span className={styles.activityText}>
                      <strong>{item.user}</strong> {item.action}
                    </span>
                    <span className={styles.activityTime}>{item.time}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.chartEmpty}>No recent activity</div>
            )}
          </div>
        </div>
      </div>

      {/* ===== LOW STOCK ALERT ===== */}
      {data.lowStock > 0 && (
        <div className={styles.alertCard}>
          <div className={styles.alertContent}>
            <AlertTriangle size={16} className={styles.alertIcon} />
            <span className={styles.alertText}>
              <strong>{data.lowStock} items</strong> are below minimum stock level.
              <span className={styles.alertAction}> Review inventory →</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}