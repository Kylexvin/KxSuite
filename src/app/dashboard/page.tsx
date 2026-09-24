'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import { api } from '@/lib/axios';
import { resolveSuiteLanding } from '@/lib/resolveSuiteLanding';
import { SuiteCardGrid } from './SuiteCardGrid';
import {
  Package,
  Activity,
  RefreshCw,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
} from 'recharts';
import styles from './page.module.css';

// ============================================================
// TYPES
// ============================================================

type ProductStatus = 'active' | 'trial' | 'expired' | 'available';

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
  type: 'audit' | 'sale';
  total?: number;
};

// ============================================================
// FORMAT HELPERS
// ============================================================

const formatAction = (action: string): string =>
  action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const formatTime = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString('en-KE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

// ============================================================
// PRODUCT STATUS BADGE
// ============================================================

function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const configs = {
    active: { label: 'Active', icon: CheckCircle2, className: styles.badgeActive },
    trial: { label: 'Trial', icon: Clock, className: styles.badgeTrial },
    expired: { label: 'Expired', icon: AlertTriangle, className: styles.badgeExpired },
    available: { label: 'Available', icon: Circle, className: styles.badgeAvailable },
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
// SKELETON
// ============================================================

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`${styles.skeleton} ${className ?? ''}`} />;
}

function DashboardSkeleton() {
  return (
    <div className={styles.page} aria-busy="true" aria-live="polite">
      <span className={styles.srOnly}>Loading your organization…</span>

      {/* ===== ORG HEADER ===== */}
      <div className={styles.topRow}>
        <div className={styles.orgHeader}>
          <div className={styles.orgHeaderGrid}>
            <div className={styles.orgHeaderMain}>
              <SkeletonBlock className={styles.skeletonAvatar} />
              <SkeletonBlock className={styles.skeletonTitle} />
            </div>
            <div className={styles.orgHeaderStats}>
              <SkeletonBlock className={styles.skeletonStat} />
              <SkeletonBlock className={styles.skeletonStat} />
              <SkeletonBlock className={styles.skeletonStat} />
            </div>
          </div>
        </div>
      </div>

      {/* ===== CHART ===== */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <SkeletonBlock className={styles.skeletonLabel} />
          <SkeletonBlock className={styles.skeletonMeta} />
        </div>
        <SkeletonBlock className={styles.skeletonChart} />
      </div>

      {/* ===== PRODUCTS ===== */}
      <div className={styles.productsRow}>
        <div className={styles.sectionHeader}>
          <SkeletonBlock className={styles.skeletonLabel} />
          <SkeletonBlock className={styles.skeletonPill} />
        </div>
        <div className={styles.subsectionHeader}>
          <SkeletonBlock className={styles.skeletonSubLabel} />
        </div>
        <div className={styles.productsGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={`p-${i}`} className={styles.productCard}>
              <div className={styles.productCardTop}>
                <SkeletonBlock className={styles.skeletonProductIcon} />
                <div className={styles.productCardInfo}>
                  <SkeletonBlock className={styles.skeletonLine} />
                  <SkeletonBlock className={styles.skeletonLineShort} />
                </div>
                <SkeletonBlock className={styles.skeletonBadge} />
              </div>
              <SkeletonBlock className={styles.skeletonCTA} />
            </div>
          ))}
        </div>
      </div>

      {/* ===== MANAGEMENT ===== */}
      <section className={styles.skeletonSection}>
        <SkeletonBlock className={styles.skeletonLabel} />
        <div className={styles.skeletonGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonBlock key={`m-${i}`} className={styles.skeletonCard} />
          ))}
        </div>
      </section>

      {/* ===== ACTIVITY ===== */}
      <div className={styles.bottomRow}>
        <div className={`${styles.activityCard} ${styles.activityCardFull}`}>
          <div className={styles.sectionHeader}>
            <SkeletonBlock className={styles.skeletonLabel} />
          </div>
          <div className={styles.activityGrid}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={`a-${i}`} className={styles.activityItem}>
                <SkeletonBlock className={styles.skeletonActivityIcon} />
                <div className={styles.activityContent}>
                  <SkeletonBlock className={styles.skeletonLine} />
                  <SkeletonBlock className={styles.skeletonLineShort} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN DASHBOARD
// ============================================================

export default function DashboardPage() {
  const router = useRouter();
  const { activeOrganization, branches, suiteContext } = useAuth();
  const { permissions, isOwner, isReady, hasPermission } = usePermissions();

  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [salesData, setSalesData] = useState<{ items: Sale[] }>({ items: [] });

  // Owner sees everything; otherwise gate by permission.
  const canViewAudit = isOwner || hasPermission('audit.logs.view');
  const canViewSales = isOwner || hasPermission('kxtill.sales.view');
  const canViewMembers = isOwner || hasPermission('members.view');
  const currentUserId = suiteContext?.user?.id;

  const products = useMemo(
    () => suiteContext?.products ?? [],
    [suiteContext?.products],
  );

  const resolution = useMemo(
    () => resolveSuiteLanding({ permissions, products }),
    [permissions, products],
  );

  // Redirect only once we know what the user actually has.
  useEffect(() => {
    if (!isReady) return;
    if (resolution.redirectTo) {
      window.location.href = resolution.redirectTo;
    }
  }, [isReady, resolution.redirectTo]);

  // ============================================================
  // FETCH
  // ============================================================

  useEffect(() => {
    const fetchData = async () => {
      if (!isReady) return;
      if (!activeOrganization) return;

      setLoading(true);
      try {
        const orgId = activeOrganization.id;

        if (canViewMembers) {
          const membersRes = await api.get<{ members: Member[] }>(
            `/api/v1/organizations/${orgId}/members`,
          );
          setMembers(membersRes.data.members || []);
        }

        if (canViewAudit) {
          const auditRes = await api.get<{ items: AuditEvent[] }>(
            `/api/v1/organizations/${orgId}/audit-logs?limit=30`,
          );
          setAuditLogs(auditRes.data.items || []);
        }

        if (canViewSales) {
          const salesRes = await api.get<{ items: Sale[] }>(
            `/api/v1/organizations/${orgId}/kxtill/sales?limit=20`,
          );
          setSalesData(salesRes.data || { items: [] });
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, activeOrganization, canViewAudit, canViewSales, canViewMembers]);

  // ============================================================
  // COMPUTED
  // ============================================================

  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.subscriptionIsActive).length;
  const totalBranches = branches?.length || 0;
  const totalMembers = members.filter((m) => m.isActive).length;

  // Split products into "live" (active/trial/expired) vs "available" (never subscribed).
  const liveProducts = products.filter(
    (p) =>
      p.subscriptionIsActive ||
      p.subscriptionStatus === 'active' ||
      p.subscriptionStatus === 'trial' ||
      p.subscriptionStatus === 'expired',
  );
  const availableProducts = products.filter(
    (p) =>
      !p.subscriptionIsActive &&
      p.subscriptionStatus !== 'active' &&
      p.subscriptionStatus !== 'trial' &&
      p.subscriptionStatus !== 'expired',
  );

  const salesItems = salesData.items || [];

  // ---- Activity chart data -----------------------------------------
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  let activityCounts: Record<string, number> = {};
  let activitySource: 'audit' | 'sales' | null = null;

  if (canViewAudit) {
    activitySource = 'audit';
    activityCounts = auditLogs.reduce((acc, log) => {
      const date = new Date(log.createdAt).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  } else if (canViewSales) {
    activitySource = 'sales';
    activityCounts = salesItems.reduce((acc, sale) => {
      const date = new Date(sale.createdAt).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  const chartData = last7Days.map((date) => ({
    date: new Date(date).toLocaleDateString('en-KE', {
      day: '2-digit',
      month: 'short',
    }),
    count: activityCounts[date] || 0,
  }));

  // ---- Recent activity list ----------------------------------------
  let activityItems: ActivityItem[] = [];

  if (canViewAudit) {
    activityItems = auditLogs.slice(0, 5).map((log) => ({
      id: log.id,
      user:
        `${log.user?.firstName || ''} ${log.user?.lastName || ''}`.trim() ||
        'System',
      action: formatAction(log.action),
      target: log.resource,
      time: formatTime(log.createdAt),
      type: 'audit',
    }));
  } else if (canViewSales) {
    const mySales = salesItems.filter((sale) => sale.userId === currentUserId);
    activityItems = mySales.slice(0, 5).map((sale) => ({
      id: sale.id,
      user: `${sale.user?.firstName || 'You'}`,
      action: 'Created sale',
      target: sale.items
        ?.map((item: SaleItem) => `${item.quantity} × ${item.product?.name || 'product'}`)
        .join(', '),
      time: formatTime(sale.createdAt),
      type: 'sale',
      total: sale.totalAmount,
    }));
  }

  // ============================================================
  // COMING SOON
  // ============================================================

  const comingSoonProducts = [
    { name: 'KxInvoice', description: 'Invoicing & Billing', icon: '📄' },
    { name: 'KxCRM', description: 'Customer Relationship Management', icon: '👥' },
    { name: 'KxHR', description: 'HR & Payroll', icon: '👤' },
  ];

  // ============================================================
  // GATES
  // ============================================================

  if (!isReady) return null;

  if (resolution.redirectTo) return null;

  if (loading) return <DashboardSkeleton />;

  const { context } = resolution;
  if (context.kind === 'product-only') return null;

  const showActivityChart = activitySource !== null;
  const showProductsSection =
    context.kind === 'owner' || context.kind === 'platform-and-products';
  const showManagementSection = context.cards.length > 0;
  const showActivityList = activityItems.length > 0;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className={styles.page}>
      {/* ===== ORG HEADER (metrics only) ===== */}
      <div className={`${styles.topRow} ${styles.topRowNoAI}`}>
        <div className={styles.orgHeader}>
          <div className={styles.orgHeaderGrid}>
            <div className={styles.orgHeaderMain}>
              <div className={styles.orgAvatar}>
                {activeOrganization?.name?.charAt(0) || 'O'}
              </div>
              <h1 className={styles.orgHeaderName}>
                {activeOrganization?.name || 'Organization'}
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
                <span className={styles.headerStatValue}>
                  {activeProducts}/{totalProducts}
                </span>
                <span className={styles.headerStatLabel}>Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== ACTIVITY CHART ===== */}
      {showActivityChart && (
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitle}>
              <TrendingUp size={14} />
              <span>Activity</span>
            </div>
            <span className={styles.chartMeta}>
              Last 7 days · {activitySource === 'audit' ? 'Audit' : 'Sales'}
            </span>
          </div>
          <div className={styles.chartBody}>
            {chartData.some((d) => d.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 4, right: 4, left: -8, bottom: 0 }}
                >
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
                    tick={{ fill: '#62636e', fontSize: 8 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#62636e', fontSize: 8 }}
                    axisLine={false}
                    tickLine={false}
                    width={16}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1b1c23',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: '6px',
                      fontSize: '11px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="url(#heatLine)"
                    strokeWidth={2}
                    fill="url(#heatGradient)"
                    dot={{ fill: '#ff6a2b', r: 3 }}
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
      )}

      {/* ===== PRODUCTS (above Management) ===== */}
      {showProductsSection && (
        <div className={styles.productsRow}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>
              <Package size={14} />
              Products
            </span>
            <span className={styles.sectionCount}>
              {totalProducts + comingSoonProducts.length}
            </span>
          </div>

          {/* --- Live / subscribed products --- */}
          {liveProducts.length > 0 && (
            <>
              <div className={styles.subsectionHeader}>
                <span className={styles.subsectionTitle}>Your Products</span>
              </div>
              <div className={styles.productsGrid}>
                {liveProducts.map((product) => {
                  const canOpen =
                    isOwner ||
                    permissions.some((perm) => perm.startsWith(`${product.key}.`));

                  const status: ProductStatus =
                    product.subscriptionIsActive &&
                    product.subscriptionStatus === 'active'
                      ? 'active'
                      : product.subscriptionStatus === 'trial'
                      ? 'trial'
                      : product.subscriptionStatus === 'expired'
                      ? 'expired'
                      : 'available';

                  return (
                    <div key={product.key} className={styles.productCard}>
                      <div className={styles.productCardTop}>
                        <div className={styles.productCardIcon}>
                          {product.name.charAt(0) || product.key.charAt(0)}
                        </div>
                        <div className={styles.productCardInfo}>
                          <span className={styles.productCardName}>
                            {product.name}
                          </span>
                          <span className={styles.productCardDesc}>
                            {product.description}
                          </span>
                        </div>
                        <ProductStatusBadge status={status} />
                      </div>
                      <button
                        className={styles.productCardCTA}
                        onClick={() =>
                          canOpen
                            ? router.push(`/kx/${product.key}`)
                            : router.push('/dashboard/marketplace')
                        }
                      >
                        {canOpen ? 'View' : 'Learn More'}
                        <ArrowUpRight size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* --- Available (not subscribed) + Coming Soon --- */}
          {(availableProducts.length > 0 || comingSoonProducts.length > 0) && (
            <>
              <div className={styles.subsectionHeader}>
                <span className={styles.subsectionTitle}>Available Soon</span>
              </div>
              <div className={styles.productsGrid}>
                {availableProducts.map((product) => (
                  <div key={product.key} className={styles.productCard}>
                    <div className={styles.productCardTop}>
                      <div className={styles.productCardIcon}>
                        {product.name.charAt(0) || product.key.charAt(0)}
                      </div>
                      <div className={styles.productCardInfo}>
                        <span className={styles.productCardName}>
                          {product.name}
                        </span>
                        <span className={styles.productCardDesc}>
                          {product.description}
                        </span>
                      </div>
                      <ProductStatusBadge status="available" />
                    </div>
                    <button
                      className={styles.productCardCTA}
                      onClick={() => router.push('/dashboard/marketplace')}
                    >
                      Learn More
                      <ArrowUpRight size={12} />
                    </button>
                  </div>
                ))}

                {comingSoonProducts.map((product, index) => (
                  <div
                    key={`coming-${index}`}
                    className={styles.productCardPlaceholder}
                  >
                    <div className={styles.productCardTop}>
                      <div className={styles.productCardIconPlaceholder}>
                        <span>{product.icon}</span>
                      </div>
                      <div className={styles.productCardInfo}>
                        <span className={styles.productCardName}>
                          {product.name}
                        </span>
                        <span className={styles.productCardDesc}>
                          {product.description}
                        </span>
                      </div>
                      <span
                        className={`${styles.productBadge} ${styles.badgeComingSoon}`}
                      >
                        Coming Soon
                      </span>
                    </div>
                    <div className={styles.productCardCTADisabled}>Coming Soon</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== ORGANIZATION MANAGEMENT ===== */}
      {showManagementSection && (
        <SuiteCardGrid
          cards={context.cards}
          variant={context.kind === 'owner' ? 'owner' : 'member'}
        />
      )}

      {/* ===== PLATFORM-ONLY NOTICE ===== */}
      {context.kind === 'platform-only' && (
        <p className={styles.notice}>
          You don’t currently have access to any KXBYTE products.
        </p>
      )}

      {/* ===== RECENT ACTIVITY (full width, no billing card) ===== */}
      {showActivityList && (
        <div className={styles.bottomRow}>
          <div className={`${styles.activityCard} ${styles.activityCardFull}`}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>
                {canViewAudit ? (
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
              {activityItems.map((item) => (
                <div key={item.id} className={styles.activityItem}>
                  <div className={styles.activityIcon}>
                    {item.type === 'sale' && <ShoppingBag size={11} />}
                    {item.type === 'audit' && <Activity size={11} />}
                  </div>
                  <div className={styles.activityContent}>
                    <span className={styles.activityText}>
                      <strong>{item.user}</strong>
                      <span className={styles.activityAction}>{item.action}</span>
                      {item.target && (
                        <span className={styles.activityTarget}>
                          · {item.target}
                        </span>
                      )}
                      {item.total && (
                        <span className={styles.activityTotal}>
                          · KES {item.total}
                        </span>
                      )}
                    </span>
                    <span className={styles.activityTime}>{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}