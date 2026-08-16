"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/axios";
import {
  Package,
  Activity,
  PieChart as PieChartIcon,
  RefreshCw,
  Bot,
  X,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ShoppingBag,
  TrendingUp,
  CreditCard,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
} from "recharts";
import styles from "./page.module.css";

// ============================================================
// TYPES
// ============================================================

type ProductStatus = "active" | "trial" | "expired" | "available";

type AuditEvent = {
  id: string;
  action: string;
  resource: string;
  metadata: Record<string, unknown>;
  user: { firstName: string; lastName: string };
  userId: string;
  createdAt: string;
};

type Member = {
  id: string;
  userId: string;
  user: { firstName: string; lastName: string; email: string };
  roleId: string | null;
  joinedAt: string;
  isActive: boolean;
};

type SaleItem = {
  product: { name: string };
  quantity: number;
};

type Sale = {
  id: string;
  userId: string;
  totalAmount: number;
  createdAt: string;
  items: SaleItem[];
  user: { firstName: string; lastName: string };
};

type ActivityItem = {
  id: string;
  user: string;
  action: string;
  target?: string;
  time: string;
  type: "audit" | "sale";
  total?: number;
};

type Subscription = {
  id: string;
  productKey: string;
  status: string;
  plan: {
    name: string;
    price: number;
    currency: string;
    interval: string;
  };
  currentPeriodEnd: string;
  isActive: boolean;
};

// ============================================================
// FORMAT HELPERS
// ============================================================

const formatAction = (action: string): string => {
  return action
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ============================================================
// AI ASSISTANT (Owner only)
// ============================================================

const AI_RESPONSES: Record<string, string> = {
  "top products": "Based on your data, your top product is Pishori Rice with KES 12,000 in sales.",
  "low stock": "You have 3 items below minimum stock: Eggs (30 left), Omo 1kg (5 left), Cooking Oil (8L).",
  "members": "You have 5 active members. 2 pending invitations.",
  "branches": "You have 2 branches: Main Branch and Kawangware.",
  "products": "You have 4 products: 2 active, 1 trial, 1 available.",
  "default": "I can help you with products, stock, members, or branches. What would you like to know?",
};

function AIAssistant({ isMobile, onClose }: { isMobile?: boolean; onClose?: () => void }) {
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "👋 Hi! I'm your KXBYTE AI assistant. Ask me about your organization, products, stock, members, or branches." },
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = () => {
    if (!message.trim()) return;

    const userMsg = message.trim();
    setConversation((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    setMessage("");

    setTimeout(() => {
      const lowerMsg = userMsg.toLowerCase();
      let response = AI_RESPONSES.default;

      if (lowerMsg.includes("top") || lowerMsg.includes("product")) {
        response = AI_RESPONSES["top products"];
      } else if (lowerMsg.includes("stock") || lowerMsg.includes("inventory") || lowerMsg.includes("low")) {
        response = AI_RESPONSES["low stock"];
      } else if (lowerMsg.includes("member") || lowerMsg.includes("team") || lowerMsg.includes("staff")) {
        response = AI_RESPONSES["members"];
      } else if (lowerMsg.includes("branch") || lowerMsg.includes("location")) {
        response = AI_RESPONSES["branches"];
      } else if (lowerMsg.includes("product")) {
        response = AI_RESPONSES["products"];
      }

      setConversation((prev) => [...prev, { role: "assistant", content: response }]);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className={`${styles.aiCard} ${isMobile ? styles.aiCardMobile : styles.aiCardDesktop}`}>
      {isMobile && (
        <button className={styles.aiMobileClose} onClick={onClose}>
          <X size={18} />
        </button>
      )}
      <div className={styles.aiHeader}>
        <div className={styles.aiHeaderLeft}>
          <Bot size={14} className={styles.aiIcon} />
          <span className={styles.aiTitle}>AI Assistant</span>
        </div>
        <span className={styles.aiBadge}>Beta</span>
      </div>

      <div className={styles.aiConversation}>
        {conversation.map((msg, idx) => (
          <div key={idx} className={msg.role === "user" ? styles.aiUserMsg : styles.aiAssistantMsg}>
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className={styles.aiTyping}>
            <span></span><span></span><span></span>
          </div>
        )}
      </div>

      <div className={styles.aiInputWrap}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask about your organization..."
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading || !message.trim()}>
          <ArrowUpRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// PRODUCT STATUS BADGE
// ============================================================

function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const configs = {
    active: { label: "Active", icon: CheckCircle2, className: styles.badgeActive },
    trial: { label: "Trial", icon: Clock, className: styles.badgeTrial },
    expired: { label: "Expired", icon: AlertTriangle, className: styles.badgeExpired },
    available: { label: "Available", icon: Circle, className: styles.badgeAvailable },
  };
  const config = configs[status] || configs.available;
  const Icon = config.icon;
  return (
    <span className={`${styles.productBadge} ${config.className}`}>
      <Icon size={10} />
      {config.label}
    </span>
  );
}

// ============================================================
// SUBSCRIPTION & BILLING CARD
// ============================================================

function SubscriptionCard({ subscription }: { subscription: Subscription | null }) {
  const router = useRouter();

  if (!subscription) {
    return (
      <div className={styles.billingCard}>
        <div className={styles.billingHeader}>
          <span className={styles.billingProduct}>No active subscription</span>
        </div>
        <div className={styles.billingDetails}>
          <p className={styles.billingEmpty}>Subscribe to a product to get started.</p>
        </div>
        <button className={styles.billingCTA} onClick={() => router.push("/dashboard/marketplace")}>
          View Plans →
        </button>
      </div>
    );
  }

  const statusColor = subscription.status === "ACTIVE" ? styles.badgeActive : styles.badgeInactive;
  const statusLabel = subscription.status === "ACTIVE" ? "Active" : subscription.status;

  return (
    <div className={styles.billingCard}>
      <div className={styles.billingHeader}>
        <span className={styles.billingProduct}>
          <CreditCard size={14} />
          {subscription.plan?.name || subscription.productKey}
        </span>
        <span className={`${styles.billingStatus} ${statusColor}`}>
          {statusLabel}
        </span>
      </div>
      <div className={styles.billingDetails}>
        <div className={styles.billingRow}>
          <span>Renews:</span>
          <span>{formatDate(subscription.currentPeriodEnd)}</span>
        </div>
        <div className={styles.billingRow}>
          <span>Amount:</span>
          <span>KES {subscription.plan?.price || 0}/{subscription.plan?.interval?.toLowerCase() || "month"}</span>
        </div>
        <div className={styles.billingRow}>
          <span>Payment:</span>
          <span>M-PESA</span>
        </div>
      </div>
      <button className={styles.billingCTA} onClick={() => router.push("/dashboard/billing")}>
        Manage Billing →
      </button>
    </div>
  );
}

// ============================================================
// MAIN DASHBOARD
// ============================================================

export default function DashboardPage() {
  const router = useRouter();
  const { activeOrganization, branches, suiteContext } = useAuth();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [salesData, setSalesData] = useState<{ items: Sale[] }>({ items: [] });
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [showAIMobile, setShowAIMobile] = useState(false);

  const permissions = suiteContext?.permissions ?? [];
  const isOwner = permissions.includes("*");
  const hasAuditPermission = isOwner || permissions.includes("audit.logs.view");
  const hasBillingPermission = isOwner || permissions.includes("subscriptions.view");
  const currentUserId = suiteContext?.user?.id;

  // ============================================================
  // FETCH DATA
  // ============================================================

  useEffect(() => {
    const fetchData = async () => {
      if (!activeOrganization) return;

      setLoading(true);
      try {
        const orgId = activeOrganization.id;

        const membersRes = await api.get<{ members: Member[] }>(
          `/api/v1/organizations/${orgId}/members`
        );
        setMembers(membersRes.data.members || []);

        if (hasAuditPermission) {
          const auditRes = await api.get<{ items: AuditEvent[] }>(
            `/api/v1/organizations/${orgId}/audit-logs?limit=30`
          );
          setAuditLogs(auditRes.data.items || []);
        }

        const salesRes = await api.get<{ items: Sale[] }>(
          `/api/v1/organizations/${orgId}/kxtill/sales?limit=20`
        );
        setSalesData(salesRes.data || { items: [] });

        const subsRes = await api.get<{ subscriptions: Subscription[] }>(
          `/api/v1/organizations/${orgId}/subscriptions`
        );
        setSubscriptions(subsRes.data.subscriptions || []);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeOrganization, hasAuditPermission]);

  // ============================================================
  // COMPUTED DATA
  // ============================================================

  const products = suiteContext?.products || [];
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.subscriptionIsActive).length;
  const totalBranches = branches?.length || 0;
  const totalMembers = members.filter((m) => m.isActive).length;
  const pendingMembers = members.filter((m) => !m.isActive).length;

  const activeSubscription = subscriptions.find((s) => s.isActive) || null;

  const statusCounts = products.reduce((acc, p) => {
    let status: ProductStatus = "available";
    if (p.subscriptionIsActive && p.subscriptionStatus === "active") status = "active";
    else if (p.subscriptionStatus === "trial") status = "trial";
    else if (p.subscriptionStatus === "expired") status = "expired";
    else status = "available";

    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = [
    { name: "Active", value: statusCounts.active || 0, color: "#4caf82" },
    { name: "Trial", value: statusCounts.trial || 0, color: "#ff8c42" },
    { name: "Available", value: statusCounts.available || 0, color: "#62636e" },
    { name: "Expired", value: statusCounts.expired || 0, color: "#ef5350" },
  ].filter((d) => d.value > 0);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });

  let activityCounts: Record<string, number> = {};

  if (hasAuditPermission) {
    activityCounts = auditLogs.reduce((acc, log) => {
      const date = new Date(log.createdAt).toISOString().split("T")[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  } else {
    const salesItems = salesData.items || [];
    activityCounts = salesItems.reduce((acc, sale) => {
      const date = new Date(sale.createdAt).toISOString().split("T")[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  const chartData = last7Days.map((date) => ({
    date: new Date(date).toLocaleDateString("en-KE", { day: "2-digit", month: "short" }),
    count: activityCounts[date] || 0,
  }));

  const salesItems = salesData.items || [];

  let activityItems: ActivityItem[] = [];

  if (hasAuditPermission) {
    activityItems = auditLogs.slice(0, 5).map((log) => ({
      id: log.id,
      user: `${log.user?.firstName || ""} ${log.user?.lastName || ""}`.trim() || "System",
      action: formatAction(log.action),
      target: log.resource,
      time: formatTime(log.createdAt),
      type: "audit",
    }));
  } else {
    const mySales = salesItems.filter((sale) => sale.userId === currentUserId);
    activityItems = mySales.slice(0, 5).map((sale) => ({
      id: sale.id,
      user: `${sale.user?.firstName || "You"}`,
      action: "Created sale",
      target: sale.items
        ?.map((item: SaleItem) => `${item.quantity} × ${item.product?.name || "product"}`)
        .join(", "),
      time: formatTime(sale.createdAt),
      type: "sale",
      total: sale.totalAmount,
    }));
  }

  // ============================================================
  // COMING SOON PRODUCTS
  // ============================================================

  const comingSoonProducts = [
    { name: "KxInvoice", description: "Invoicing & Billing", icon: "📄" },
    { name: "KxCRM", description: "Customer Relationship Management", icon: "👥" },
    { name: "KxHR", description: "HR & Payroll", icon: "👤" },
  ];

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Loading your organization...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className={styles.page}>
      {/* ===== TOP ROW: Org Header + Stats ===== */}
      <div className={`${styles.topRow} ${!isOwner ? styles.topRowNoAI : ""}`}>
        <div className={styles.orgHeader}>
          <div className={styles.orgHeaderGrid}>
            <div className={styles.orgHeaderMain}>
              <div className={styles.orgAvatar}>
                {activeOrganization?.name?.charAt(0) || "O"}
              </div>
              <h1 className={styles.orgHeaderName}>
                {activeOrganization?.name || "Organization"}
              </h1>
            </div>

            <div className={styles.orgHeaderStats}>
              <div className={styles.headerStatItem}>
                <span className={styles.headerStatValue}>{totalBranches}</span>
                <span className={styles.headerStatLabel}>Branches</span>
              </div>
              <div className={styles.headerStatDivider} />
              <div className={styles.headerStatItem}>
                <span className={styles.headerStatValue}>{totalMembers}</span>
                <span className={styles.headerStatLabel}>Members</span>
              </div>
              <div className={styles.headerStatDivider} />
              <div className={styles.headerStatItem}>
                <span className={styles.headerStatValue}>{activeProducts}/{totalProducts}</span>
                <span className={styles.headerStatLabel}>Active</span>
              </div>
            </div>
          </div>

          <div className={styles.orgStatsStrip}>
            <div className={styles.orgStatItem}>
              <span className={styles.orgStatValue}>{totalProducts}</span>
              <span className={styles.orgStatLabel}>Products</span>
            </div>
            <div className={styles.orgStatDivider} />
            <div className={styles.orgStatItem}>
              <span className={styles.orgStatValue}>{activeProducts}</span>
              <span className={styles.orgStatLabel}>Active</span>
            </div>
            <div className={styles.orgStatDivider} />
            <div className={styles.orgStatItem}>
              <span className={styles.orgStatValue}>{totalBranches}</span>
              <span className={styles.orgStatLabel}>Branches</span>
            </div>
            <div className={styles.orgStatDivider} />
            <div className={styles.orgStatItem}>
              <span className={styles.orgStatValue}>{totalMembers}</span>
              <span className={styles.orgStatLabel}>Members</span>
            </div>
            <div className={styles.orgStatDivider} />
            <div className={styles.orgStatItem}>
              <span className={styles.orgStatValue}>{pendingMembers}</span>
              <span className={styles.orgStatLabel}>Pending</span>
            </div>
          </div>
        </div>

        {isOwner && (
          <div className={styles.aiDesktopWrapper}>
            <AIAssistant />
          </div>
        )}
      </div>

      {/* ===== TWO COLUMN ===== */}
      <div className={styles.twoCol}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitle}>
              <PieChartIcon size={14} />
              <span>Products</span>
            </div>
            <span className={styles.chartMeta}>{totalProducts} total</span>
          </div>
          <div className={styles.pieContainer}>
            <div className={styles.pieChart}>
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    innerRadius={36}
                    outerRadius={52}
                    stroke="none"
                    paddingAngle={2}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className={styles.pieCenter}>
                <span className={styles.pieCenterValue}>{activeProducts}</span>
                <span className={styles.pieCenterLabel}>Active</span>
              </div>
            </div>
            <div className={styles.pieLegend}>
              {pieData.map((item) => (
                <div key={item.name} className={styles.legendRow}>
                  <span className={styles.legendDot} style={{ background: item.color }} />
                  <span className={styles.legendName}>{item.name}</span>
                  <span className={styles.legendValue}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitle}>
              <TrendingUp size={14} />
              <span>Activity</span>
            </div>
            <span className={styles.chartMeta}>Last 7 days</span>
          </div>
          <div className={styles.chartBody}>
            {chartData.some((d) => d.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="heatGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#4caf82" stopOpacity={0.2} />
                      <stop offset="50%" stopColor="#ff8c42" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#ef5350" stopOpacity={0.2} />
                    </linearGradient>
                    <linearGradient id="heatLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#4caf82" stopOpacity={1} />
                      <stop offset="50%" stopColor="#ff8c42" stopOpacity={1} />
                      <stop offset="100%" stopColor="#ef5350" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#62636e", fontSize: 8 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#62636e", fontSize: 8 }}
                    axisLine={false}
                    tickLine={false}
                    width={16}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#1b1c23",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: "6px",
                      fontSize: "11px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="url(#heatLine)"
                    strokeWidth={2}
                    fill="url(#heatGradient)"
                    dot={{ fill: "#ff6a2b", r: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.chartEmpty}>
                <Activity size={20} />
                <p>No activity yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== PRODUCTS ===== */}
      <div className={styles.productsRow}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>
            <Package size={14} />
            Products
          </span>
          <span className={styles.sectionCount}>{totalProducts + comingSoonProducts.length}</span>
        </div>
        <div className={styles.productsGrid}>
          {/* Active Products */}
          {products.map((product) => (
            <div key={product.key} className={styles.productCard}>
              <div className={styles.productCardTop}>
                <div className={styles.productCardIcon}>
                  {product.name.charAt(0) || product.key.charAt(0)}
                </div>
                <div className={styles.productCardInfo}>
                  <span className={styles.productCardName}>{product.name}</span>
                  <span className={styles.productCardDesc}>{product.description}</span>
                </div>
                <ProductStatusBadge
                  status={
                    product.subscriptionIsActive && product.subscriptionStatus === "active"
                      ? "active"
                      : product.subscriptionStatus === "trial"
                      ? "trial"
                      : product.subscriptionStatus === "expired"
                      ? "expired"
                      : "available"
                  }
                />
              </div>
              <button
                className={styles.productCardCTA}
                onClick={() => router.push(`/kx/${product.key}`)}
              >
                View
                <ArrowUpRight size={12} />
              </button>
            </div>
          ))}

          {/* Coming Soon Placeholders */}
          {comingSoonProducts.map((product, index) => (
            <div key={`coming-${index}`} className={styles.productCardPlaceholder}>
              <div className={styles.productCardTop}>
                <div className={styles.productCardIconPlaceholder}>
                  <span>{product.icon}</span>
                </div>
                <div className={styles.productCardInfo}>
                  <span className={styles.productCardName}>{product.name}</span>
                  <span className={styles.productCardDesc}>{product.description}</span>
                </div>
                <span className={`${styles.productBadge} ${styles.badgeComingSoon}`}>
                  Coming Soon
                </span>
              </div>
              <div className={styles.productCardCTADisabled}>Coming Soon</div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== BOTTOM ROW: Recent Activity + Subscription ===== */}
      <div className={styles.bottomRow}>
        <div className={`${styles.activityCard} ${!hasBillingPermission ? styles.activityCardFull : ""}`}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>
              {hasAuditPermission ? (
                <>
                  <RefreshCw size={14} />
                  Recent Activity
                </>
              ) : (
                <>
                  <ShoppingBag size={14} />
                  My Recent Sales
                </>
              )}
            </span>
          </div>
          <div className={styles.activityGrid}>
            {activityItems.length > 0 ? (
              activityItems.map((item) => (
                <div key={item.id} className={styles.activityItem}>
                  <div className={styles.activityIcon}>
                    {item.type === "sale" && <ShoppingBag size={11} />}
                    {item.type === "audit" && <Activity size={11} />}
                  </div>
                  <div className={styles.activityContent}>
                    <span className={styles.activityText}>
                      <strong>{item.user}</strong>
                      <span className={styles.activityAction}>{item.action}</span>
                      {item.target && <span className={styles.activityTarget}>· {item.target}</span>}
                      {item.total && <span className={styles.activityTotal}>· KES {item.total}</span>}
                    </span>
                    <span className={styles.activityTime}>{item.time}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.activityEmpty}>No recent activity</div>
            )}
          </div>
        </div>

        {hasBillingPermission && (
          <div className={styles.subscriptionCard}>
            <SubscriptionCard subscription={activeSubscription} />
          </div>
        )}
      </div>

      {/* ===== AI FAB (Mobile only, Owner only) ===== */}
      {isOwner && (
        <button className={styles.aiFab} onClick={() => setShowAIMobile(true)}>
          <Bot size={20} />
        </button>
      )}

      {isOwner && showAIMobile && (
        <div className={styles.aiMobileOverlay}>
          <AIAssistant isMobile onClose={() => setShowAIMobile(false)} />
        </div>
      )}
    </div>
  );
}
