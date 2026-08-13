// app/kx/kxtill/page.tsx

"use client";

import { useAuth } from "@/contexts/AuthContext";
import {
  Package,
  ShoppingCart,
  DollarSign,
  Users,
  Percent,
  TrendingUp,
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

// ===== MOCK DATA =====
const KXTILL_STATS = {
  totalSales: 1250,
  totalRevenue: 450000,
  activeUsers: 12,
  conversionRate: 68,
  averageOrderValue: 2500,
  growth: 15.5,
  inventoryItems: 3420,
  lowStock: 12,
};

const SALES_DATA = [
  { date: "Jan", value: 150 },
  { date: "Feb", value: 180 },
  { date: "Mar", value: 220 },
  { date: "Apr", value: 280 },
  { date: "May", value: 320 },
  { date: "Jun", value: 400 },
];

const REVENUE_DATA = [
  { date: "Jan", value: 45000 },
  { date: "Feb", value: 55000 },
  { date: "Mar", value: 68000 },
  { date: "Apr", value: 82000 },
  { date: "May", value: 95000 },
  { date: "Jun", value: 120000 },
];

const CATEGORY_DATA = [
  { name: "Groceries", value: 35, color: "#ff6a2b" },
  { name: "Electronics", value: 25, color: "#ff8c42" },
  { name: "Clothing", value: 20, color: "#4caf82" },
  { name: "Other", value: 20, color: "#62636e" },
];

const ACTIVITY = [
  { id: "1", user: "John Doe", action: "processed sale #INV-001", time: "2h ago" },
  { id: "2", user: "Jane Smith", action: "added 50 items to inventory", time: "4h ago" },
  { id: "3", user: "Bob Johnson", action: "adjusted stock for 3 products", time: "6h ago" },
];

export default function KxTillDashboard() {
  const { activeOrganization, activeBranch } = useAuth();

  const contextName = activeBranch ? activeBranch.name : activeOrganization?.name || "Organization";

  return (
    <div className={styles.page}>
      {/* ===== HEADER ===== */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.productIcon}>K</div>
          <div>
            <h1 className={styles.title}>KxTill Dashboard</h1>
            <p className={styles.subtitle}>
              Point of Sale & Inventory Management • {contextName}
            </p>
          </div>
        </div>
        <div className={styles.headerStats}>
          <div className={styles.headerStat}>
            <span className={styles.headerStatValue}>{KXTILL_STATS.totalSales}</span>
            <span className={styles.headerStatLabel}>Total Sales</span>
          </div>
          <div className={styles.headerDivider} />
          <div className={styles.headerStat}>
            <span className={styles.headerStatValue}>KSh {KXTILL_STATS.totalRevenue.toLocaleString()}</span>
            <span className={styles.headerStatLabel}>Revenue</span>
          </div>
          <div className={styles.headerDivider} />
          <div className={styles.headerStat}>
            <span className={styles.headerStatValue}>{KXTILL_STATS.activeUsers}</span>
            <span className={styles.headerStatLabel}>Active Users</span>
          </div>
        </div>
      </div>

      {/* ===== KPI ROW ===== */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiIcon}>
              <ShoppingCart size={16} />
            </span>
            <span className={`${styles.kpiDelta} ${styles.deltaUp}`}>
              <ArrowUpRight size={12} />
              +{KXTILL_STATS.growth}%
            </span>
          </div>
          <div className={styles.kpiValue}>{KXTILL_STATS.totalSales.toLocaleString()}</div>
          <div className={styles.kpiLabel}>Total Sales</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiIcon}>
              <DollarSign size={16} />
            </span>
          </div>
          <div className={styles.kpiValue}>KSh {KXTILL_STATS.totalRevenue.toLocaleString()}</div>
          <div className={styles.kpiLabel}>Revenue</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiIcon}>
              <Package size={16} />
            </span>
          </div>
          <div className={styles.kpiValue}>{KXTILL_STATS.inventoryItems}</div>
          <div className={styles.kpiLabel}>Inventory Items</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiIcon}>
              <Percent size={16} />
            </span>
          </div>
          <div className={styles.kpiValue}>{KXTILL_STATS.conversionRate}%</div>
          <div className={styles.kpiLabel}>Conversion Rate</div>
        </div>
      </div>

      {/* ===== TWO COLUMN: Charts ===== */}
      <div className={styles.twoCol}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitle}>
              <Activity size={16} />
              <span>Sales Overview</span>
            </div>
            <span className={styles.chartMeta}>Last 6 months</span>
          </div>
          <div className={styles.chartBody}>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={SALES_DATA} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
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
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitle}>
              <BarChart3 size={16} />
              <span>Revenue Trend</span>
            </div>
            <span className={styles.chartMeta}>Last 6 months</span>
          </div>
          <div className={styles.chartBody}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={REVENUE_DATA} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#62636e", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#62636e", fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip contentStyle={{ background: "#1b1c23", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", fontSize: "12px" }} />
                <Bar dataKey="value" fill="#ff8c42" radius={[3, 3, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ===== BOTTOM ROW ===== */}
      <div className={styles.twoCol}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitle}>
              <PieChartIcon size={16} />
              <span>Sales by Category</span>
            </div>
          </div>
          <div className={styles.pieContainer}>
            <div className={styles.pieChart}>
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={CATEGORY_DATA} dataKey="value" innerRadius={35} outerRadius={55} stroke="none" paddingAngle={3}>
                    {CATEGORY_DATA.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#1b1c23", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className={styles.pieLegend}>
              {CATEGORY_DATA.map((item) => (
                <div key={item.name} className={styles.legendRow}>
                  <span className={styles.legendDot} style={{ background: item.color }} />
                  <span className={styles.legendName}>{item.name}</span>
                  <span className={styles.legendValue}>{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.activityCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitle}>
              <RefreshCw size={16} />
              <span>Recent Activity</span>
            </div>
            <span className={styles.chartMeta}>Audit log</span>
          </div>
          <div className={styles.activityList}>
            {ACTIVITY.map((activity) => (
              <div key={activity.id} className={styles.activityItem}>
                <div className={styles.activityContent}>
                  <span className={styles.activityText}>
                    <strong>{activity.user}</strong> {activity.action}
                  </span>
                  <span className={styles.activityTime}>{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== LOW STOCK ALERT ===== */}
      {KXTILL_STATS.lowStock > 0 && (
        <div className={styles.alertCard}>
          <div className={styles.alertContent}>
            <AlertTriangle size={16} className={styles.alertIcon} />
            <span className={styles.alertText}>
              <strong>{KXTILL_STATS.lowStock} items</strong> are below minimum stock level.
              <span className={styles.alertAction}> Review inventory →</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}