// src/app/dashboard/products/kxtill/page.tsx

"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/axios";
import styles from "./page.module.css";

type DashboardSummary = {
  today: {
    sales: number;
    count: number;
    growth: number;
  };
  thisWeek: number;
  thisMonth: number;
  totalRevenue: number;
};

type RecentSale = {
  id: string;
  total: number;
  items: Array<{ name: string; quantity: number; total: number }>;
  user: string;
  branch: string;
  createdAt: string;
};

export default function KxTillOverviewPage() {
  const { activeOrganization, activeBranch } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    if (!activeOrganization) return;

    setLoading(true);
    setError("");

    try {
      const orgId = activeOrganization.id;
      const branchId = activeBranch?.id;

      const [summaryRes, salesRes] = await Promise.all([
        api.get<DashboardSummary>(
          `/api/v1/organizations/${orgId}/kxtill/dashboard/summary${
            branchId ? `?branchId=${branchId}` : ""
          }`
        ),
        api.get<{ items: RecentSale[]; total: number }>(
          `/api/v1/organizations/${orgId}/kxtill/dashboard/recent-sales?limit=5${
            branchId ? `&branchId=${branchId}` : ""
          }`
        ),
      ]);

      setSummary(summaryRes.data);
      setRecentSales(salesRes.data.items);
    } catch (err) {
      setError("Failed to load KxTill overview");
      console.error(err);
    } finally {
      setLoading(false);
    }
    // Re-fetches automatically whenever the branch dropdown in the
    // layout header changes activeBranch — no local selector needed here.
  }, [activeOrganization, activeBranch]);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const fetchData = async () => {
      if (isMounted) {
        await loadData();
      }
    };

    void fetchData();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [loadData]);

  const formatCurrency = (amount: number) => `KSh ${amount.toLocaleString()}`;

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-KE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading && !summary) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.overview}>
      <div className={styles.overviewHeader}>
        <h1>KxTill Overview</h1>
        <p className={styles.subtitle}>
          {activeBranch ? activeBranch.name : "All Branches"}
        </p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Today&apos;s Sales</span>
          <span className={styles.statValue}>
            {formatCurrency(summary?.today.sales || 0)}
          </span>
          <span className={styles.statSub}>
            {summary?.today.count || 0} transactions
            {!!summary?.today.growth && (
              <span className={styles.statGrowth}>
                +{summary.today.growth}% from yesterday
              </span>
            )}
          </span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>This Week</span>
          <span className={styles.statValue}>
            {formatCurrency(summary?.thisWeek || 0)}
          </span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>This Month</span>
          <span className={styles.statValue}>
            {formatCurrency(summary?.thisMonth || 0)}
          </span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Revenue</span>
          <span className={styles.statValue}>
            {formatCurrency(summary?.totalRevenue || 0)}
          </span>
        </div>
      </div>

      <div className={styles.card}>
        <h3>Recent Sales</h3>
        {recentSales.length === 0 ? (
          <p className={styles.empty}>No recent sales</p>
        ) : (
          <div className={styles.salesList}>
            {recentSales.map((sale) => (
              <div key={sale.id} className={styles.saleItem}>
                <div className={styles.saleInfo}>
                  <span className={styles.saleAmount}>
                    {formatCurrency(sale.total)}
                  </span>
                  <span className={styles.saleBranch}>{sale.branch}</span>
                </div>
                <div className={styles.saleMeta}>
                  <span className={styles.saleUser}>{sale.user}</span>
                  <span className={styles.saleTime}>
                    {formatDate(sale.createdAt)}
                  </span>
                </div>
                <div className={styles.saleItems}>
                  {sale.items.map((item, i) => (
                    <span key={i} className={styles.saleItemTag}>
                      {item.quantity}x {item.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}