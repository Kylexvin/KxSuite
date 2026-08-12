"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/axios";
import styles from "./page.module.css";

type Organization = {
  id: string;
  name: string;
  slug: string;
  role: string;
  hasAllBranches: boolean;
};

type Branch = {
  id: string;
  name: string;
  code: string;
  isDefault: boolean;
  isActive: boolean;
};

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

type Subscription = {
  id: string;
  productKey: string;
  status: string;
  isActive: boolean;
  plan: {
    key: string;
    name: string;
    price: number;
  };
  remainingDays: number | null;
  trialEnd: string | null;
};

type Member = {
  id: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  role: string;
  hasAllBranches: boolean;
  joinedAt: string;
};

export default function DashboardPage() {
  const { accessToken } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>(() => {
    if (typeof window === "undefined") return [];
    const storedOrgs = localStorage.getItem("organizations");
    if (!storedOrgs) return [];
    try {
      return JSON.parse(storedOrgs);
    } catch {
      return [];
    }
  });
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(() => {
    if (typeof window === "undefined") return null;
    const storedOrgs = localStorage.getItem("organizations");
    if (!storedOrgs) return null;
    try {
      const parsed: Organization[] = JSON.parse(storedOrgs);
      return parsed.length === 1 ? parsed[0] : null;
    } catch {
      return null;
    }
  });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBranches = useCallback(async () => {
    if (!selectedOrg || !accessToken) return;

    try {
      const response = await api.get<{ items: Branch[]; total: number }>(
        `/api/v1/organizations/${selectedOrg.id}/branches`
      );
      setBranches(response.data.items);
      const defaultBranch = response.data.items.find((b) => b.isDefault);
      if (defaultBranch) {
        setSelectedBranch(defaultBranch);
      } else if (response.data.items.length > 0) {
        setSelectedBranch(response.data.items[0]);
      }
    } catch (err) {
      console.error("Failed to load branches:", err);
    }
  }, [selectedOrg, accessToken]);

  const loadDashboardData = useCallback(async () => {
    if (!selectedOrg || !accessToken) return;

    setLoading(true);
    setError("");

    try {
      const orgId = selectedOrg.id;
      const branchId = selectedBranch?.id;

      const [summaryRes, salesRes, subsRes, membersRes] = await Promise.all([
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
        api.get<{ subscriptions: Subscription[] }>(
          `/api/v1/organizations/${orgId}/subscriptions`
        ),
        api.get<{ members: Member[] }>(
          `/api/v1/organizations/${orgId}/members`
        ),
      ]);

      setSummary(summaryRes.data);
      setRecentSales(salesRes.data.items);
      setSubscriptions(subsRes.data.subscriptions);
      setMembers(membersRes.data.members);
    } catch (err) {
      setError("Failed to load dashboard data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedOrg, selectedBranch, accessToken]);

  // Load branches when org is selected
  useEffect(() => {
    if (!selectedOrg || !accessToken) return;

    const fetchBranches = async () => {
      await loadBranches();
    };

    fetchBranches();
  }, [selectedOrg, accessToken, loadBranches]);

  // Load dashboard data when org and branch are selected
  useEffect(() => {
    if (!selectedOrg || !accessToken) return;

    const fetchDashboardData = async () => {
      await loadDashboardData();
    };

    fetchDashboardData();
  }, [selectedOrg, selectedBranch, accessToken, loadDashboardData]);

  const formatCurrency = (amount: number) => {
    return `KSh ${amount.toLocaleString()}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-KE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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

  // If multiple orgs, show selector
  if (organizations.length > 1 && !selectedOrg) {
    return (
      <div className={styles.orgSelector}>
        <h2>Select Organization</h2>
        <div className={styles.orgGrid}>
          {organizations.map((org) => (
            <button
              key={org.id}
              className={styles.orgCard}
              onClick={() => setSelectedOrg(org)}
            >
              <h3>{org.name}</h3>
              <span className={styles.orgRole}>{org.role}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      {/* Branch Selector */}
      {branches.length > 1 && (
        <div className={styles.branchSelector}>
          <label>Branch:</label>
          <select
            value={selectedBranch?.id || ""}
            onChange={(e) => {
              const branch = branches.find((b) => b.id === e.target.value);
              if (branch) setSelectedBranch(branch);
            }}
            className={styles.branchSelect}
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Today&apos;s Sales</span>
          <span className={styles.statValue}>
            {formatCurrency(summary?.today.sales || 0)}
          </span>
          <span className={styles.statSub}>
            {summary?.today.count || 0} transactions
            {summary?.today.growth && (
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

      {/* Two Column Layout */}
      <div className={styles.twoColumn}>
        {/* Recent Sales */}
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

        {/* Right Column: Subscriptions + Members */}
        <div className={styles.rightColumn}>
          {/* Subscriptions */}
          <div className={styles.card}>
            <h3>Subscriptions</h3>
            {subscriptions.length === 0 ? (
              <p className={styles.empty}>No active subscriptions</p>
            ) : (
              <div className={styles.subscriptionList}>
                {subscriptions.map((sub) => (
                  <div key={sub.id} className={styles.subscriptionItem}>
                    <span className={styles.subProduct}>
                      {sub.productKey.toUpperCase()}
                    </span>
                    <span
                      className={`${styles.subStatus} ${
                        sub.status === "TRIAL"
                          ? styles.statusTrial
                          : styles.statusActive
                      }`}
                    >
                      {sub.status}
                    </span>
                    <span className={styles.subPlan}>{sub.plan.name}</span>
                    {sub.remainingDays !== null && (
                      <span className={styles.subDays}>
                        {sub.remainingDays} days remaining
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Members */}
          <div className={styles.card}>
            <h3>Team Members</h3>
            {members.length === 0 ? (
              <p className={styles.empty}>No members</p>
            ) : (
              <div className={styles.memberList}>
                {members.map((member) => (
                  <div key={member.id} className={styles.memberItem}>
                    <span className={styles.memberName}>
                      {member.user.firstName} {member.user.lastName}
                    </span>
                    <span className={styles.memberRole}>{member.role}</span>
                    <span className={styles.memberEmail}>
                      {member.user.email}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}