import { api } from "./axios";

export type Organization = {
  id: string;
  name: string;
  slug: string;
  role: string;
  hasAllBranches: boolean;
};

export type Branch = {
  id: string;
  name: string;
  code: string;
  isDefault: boolean;
  isActive: boolean;
};

export type DashboardSummary = {
  today: {
    sales: number;
    count: number;
    growth: number;
  };
  thisWeek: number;
  thisMonth: number;
  totalRevenue: number;
};

export type RecentSale = {
  id: string;
  total: number;
  items: Array<{ name: string; quantity: number; total: number }>;
  user: string;
  branch: string;
  createdAt: string;
};

export type Subscription = {
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

export type Member = {
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

export const dashboardApi = {
  getBranches: (orgId: string) =>
    api.get<{ items: Branch[]; total: number }>(
      `/api/v1/organizations/${orgId}/branches`
    ),

  getSummary: (orgId: string, branchId?: string) =>
    api.get<DashboardSummary>(
      `/api/v1/organizations/${orgId}/kxtill/dashboard/summary${
        branchId ? `?branchId=${branchId}` : ""
      }`
    ),

  getRecentSales: (orgId: string, branchId?: string, limit: number = 5) =>
    api.get<{ items: RecentSale[]; total: number }>(
      `/api/v1/organizations/${orgId}/kxtill/dashboard/recent-sales?limit=${limit}${
        branchId ? `&branchId=${branchId}` : ""
      }`
    ),

  getSubscriptions: (orgId: string) =>
    api.get<{ subscriptions: Subscription[] }>(
      `/api/v1/organizations/${orgId}/subscriptions`
    ),

  getMembers: (orgId: string) =>
    api.get<{ members: Member[] }>(
      `/api/v1/organizations/${orgId}/members`
    ),
};