"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";
import axios from "axios";
import { api } from "@/lib/axios";

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isEmailVerified: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  role: string;
  hasAllBranches: boolean;
  membershipId?: string;
  branchIds?: string[];
};

export type OrganizationDetail = {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  country: string;
  currency: string;
  timezone: string;
  isActive: boolean;
};

export type Branch = {
  id: string;
  name: string;
  code: string;
  isDefault: boolean;
  isActive: boolean;
  organizationId?: string;
};

export type BranchesResponse = {
  branches: Branch[];
};

type LoginResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
  organizations: Organization[];
};

type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  organizations: Organization[];
  activeOrganization: Organization | null;
  activeOrganizationDetail: OrganizationDetail | null;
  branches: Branch[];
  activeBranch: Branch | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ hasOrganizations: boolean }>;
  logout: () => void;
  setAuth: (user: User, accessToken: string, refreshToken: string, organizations: Organization[]) => void;
  setActiveOrganization: (orgId: string) => Promise<void>;
  loadBranches: (orgId: string) => Promise<Branch[]>;
  setActiveBranch: (branch: Branch | null) => void;
  switchBranch: (branchId: string) => Promise<void>;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function safeLocalStorageGet<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  const stored = localStorage.getItem(key);
  if (!stored || stored === "undefined" || stored === "null") return defaultValue;
  try {
    const parsed = JSON.parse(stored);
    return parsed !== null && parsed !== undefined ? parsed : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() =>
    safeLocalStorageGet<User | null>("user", null)
  );
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    safeLocalStorageGet<string | null>("accessToken", null)
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(() =>
    safeLocalStorageGet<string | null>("refreshToken", null)
  );
  const [organizations, setOrganizations] = useState<Organization[]>(() =>
    safeLocalStorageGet<Organization[]>("organizations", [])
  );
  const [activeOrganization, setActiveOrganizationState] = useState<Organization | null>(() =>
    safeLocalStorageGet<Organization | null>("activeOrganization", null)
  );
  const [activeOrganizationDetail, setActiveOrganizationDetail] = useState<OrganizationDetail | null>(null);
  const [branches, setBranches] = useState<Branch[]>(() =>
    safeLocalStorageGet<Branch[]>("branches", [])
  );
  const [activeBranch, setActiveBranchState] = useState<Branch | null>(() =>
    safeLocalStorageGet<Branch | null>("activeBranch", null)
  );
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.post<LoginResponse>("/api/v1/auth/login", {
        email,
        password,
      });

      const { user, accessToken, refreshToken, organizations } = response.data;

      setUser(user);
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);
      setOrganizations(organizations || []);

      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("organizations", JSON.stringify(organizations || []));

      if (organizations && organizations.length === 1) {
        await setActiveOrganization(organizations[0].id);
      }

      return { hasOrganizations: organizations && organizations.length > 0 };
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        throw new Error(err.response?.data?.message || "Login failed");
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    setOrganizations([]);
    setActiveOrganizationState(null);
    setActiveOrganizationDetail(null);
    setBranches([]);
    setActiveBranchState(null);
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("organizations");
    localStorage.removeItem("activeOrganization");
    localStorage.removeItem("branches");
    localStorage.removeItem("activeBranch");
  };

  const setAuth = (user: User, accessToken: string, refreshToken: string, organizations: Organization[]) => {
    const safeOrgs = organizations || [];
    setUser(user);
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
    setOrganizations(safeOrgs);

    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("organizations", JSON.stringify(safeOrgs));

    if (safeOrgs.length === 1) {
      const org = safeOrgs[0];
      setActiveOrganizationState(org);
      localStorage.setItem("activeOrganization", JSON.stringify(org));

      (async () => {
        try {
          const detailResponse = await api.get<{ organization: OrganizationDetail }>(
            `/api/v1/organizations/${org.id}`
          );
          setActiveOrganizationDetail(detailResponse.data.organization);

          const branchesResponse = await api.get<BranchesResponse>(
            `/api/v1/organizations/${org.id}/branches/my`
          );
          const items = branchesResponse.data.branches || [];
          setBranches(items);
          localStorage.setItem("branches", JSON.stringify(items));

          // Auto-select if only one branch
          if (items.length === 1) {
            setActiveBranchState(items[0]);
            localStorage.setItem("activeBranch", JSON.stringify(items[0]));
          }
        } catch (err) {
          console.error("Failed to fetch org details:", err);
        }
      })();
    }
  };

  const setActiveOrganization = async (orgId: string) => {
    setIsLoading(true);
    try {
      const org = organizations.find(o => o.id === orgId);
      if (!org) {
        throw new Error("Organization not found");
      }

      setActiveOrganizationState(org);
      localStorage.setItem("activeOrganization", JSON.stringify(org));

      const detailResponse = await api.get<{ organization: OrganizationDetail }>(
        `/api/v1/organizations/${orgId}`
      );
      setActiveOrganizationDetail(detailResponse.data.organization);

      const items = await loadBranches(orgId);

      // Auto-select if only one branch
      if (items.length === 1) {
        setActiveBranchState(items[0]);
        localStorage.setItem("activeBranch", JSON.stringify(items[0]));
      } else {
        // Clear branch selection if multiple
        setActiveBranchState(null);
        localStorage.removeItem("activeBranch");
      }
    } catch (err) {
      console.error("Failed to set active organization:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loadBranches = async (orgId: string): Promise<Branch[]> => {
    try {
      const response = await api.get<BranchesResponse>(
        `/api/v1/organizations/${orgId}/branches/my`
      );
      const items = response.data.branches || [];
      setBranches(items);
      localStorage.setItem("branches", JSON.stringify(items));
      return items;
    } catch (err) {
      console.error("Failed to load branches:", err);
      throw err;
    }
  };

  const setActiveBranch = (branch: Branch | null) => {
    setActiveBranchState(branch);
    if (branch) {
      localStorage.setItem("activeBranch", JSON.stringify(branch));
    } else {
      localStorage.removeItem("activeBranch");
    }
  };

  const switchBranch = async (branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    if (!branch) {
      throw new Error("Branch not found");
    }
    setActiveBranch(branch);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        organizations,
        activeOrganization,
        activeOrganizationDetail,
        branches,
        activeBranch,
        isLoading,
        login,
        logout,
        setAuth,
        setActiveOrganization,
        loadBranches,
        setActiveBranch,
        switchBranch,
        isAuthenticated: !!user && !!accessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}