// src/contexts/AuthContext.tsx

"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useRef,
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
  role: string; // "Owner" or "Member" from login response
  hasAllBranches: boolean;
  membershipId?: string;
  branchIds?: string[];
};

export type OrganizationDetail = {
  id: string;
  name: string;
  slug: string;
  currency: string;
  timezone: string;
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

export type Membership = {
  id: string;
  roleId: string | null;
  hasAllBranches: boolean;
  isActive: boolean;
};

export type SuiteProduct = {
  key: string;
  name: string;
  description: string;
  isActive: boolean;
  subscriptionStatus: string;
  subscriptionIsActive: boolean;
};

export type SuiteContext = {
  user: User;
  organization: OrganizationDetail;
  membership: Membership;
  permissions: string[];
  branches: Branch[];
  products: SuiteProduct[];
  lowStockCount: number;
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
  suiteContext: SuiteContext | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ hasOrganizations: boolean }>;
  logout: () => void;
  setAuth: (user: User, accessToken: string, refreshToken: string, organizations: Organization[]) => void;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  setActiveOrganization: (orgId: string) => Promise<void>;
  setActiveOrganizationDirect: (org: Organization) => void;
  loadBranches: (orgId: string) => Promise<Branch[]>;
  loadSuiteContext: (organizationId: string) => Promise<SuiteContext>;
  hasPermission: (permission: string) => boolean;
  setActiveBranch: (branch: Branch | null) => void;
  switchBranch: (branchId: string | null) => Promise<void>;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function safeLocalStorageGet<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  const stored = localStorage.getItem(key);
  if (!stored || stored === "undefined" || stored === "null") return defaultValue;
  
  if (typeof defaultValue === 'string') {
    return stored as T;
  }
  
  try {
    const parsed = JSON.parse(stored);
    return parsed !== null && parsed !== undefined ? parsed : defaultValue;
  } catch {
    return stored as T;
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
  const [activeOrganizationDetail, setActiveOrganizationDetail] = useState<OrganizationDetail | null>(
    () => safeLocalStorageGet<OrganizationDetail | null>("activeOrganizationDetail", null)
  );
  const [branches, setBranches] = useState<Branch[]>(() =>
    safeLocalStorageGet<Branch[]>("branches", [])
  );
  const [activeBranch, setActiveBranchState] = useState<Branch | null>(() =>
    safeLocalStorageGet<Branch | null>("activeBranch", null)
  );
  const [suiteContext, setSuiteContext] = useState<SuiteContext | null>(() =>
    safeLocalStorageGet<SuiteContext | null>("suiteContext", null)
  );
  const [isLoading, setIsLoading] = useState(false);
  const authInitialized = useRef(false);

  useEffect(() => {
    if (authInitialized.current) return;
    authInitialized.current = true;

    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("accessToken");
    const storedRefresh = localStorage.getItem("refreshToken");
    const storedOrgs = localStorage.getItem("organizations");
    const storedActive = localStorage.getItem("activeOrganization");
    const storedActiveDetail = localStorage.getItem("activeOrganizationDetail");
    const storedBranches = localStorage.getItem("branches");
    const storedActiveBranch = localStorage.getItem("activeBranch");
    const storedSuiteContext = localStorage.getItem("suiteContext");

    if (storedToken) setAccessToken(storedToken);
    if (storedRefresh) setRefreshToken(storedRefresh);
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch {}
    }
    if (storedOrgs) {
      try { setOrganizations(JSON.parse(storedOrgs)); } catch {}
    }
    if (storedActive) {
      try { setActiveOrganizationState(JSON.parse(storedActive)); } catch {}
    }
    if (storedActiveDetail) {
      try { setActiveOrganizationDetail(JSON.parse(storedActiveDetail)); } catch {}
    }
    if (storedBranches) {
      try { setBranches(JSON.parse(storedBranches)); } catch {}
    }
    if (storedActiveBranch) {
      try { setActiveBranchState(JSON.parse(storedActiveBranch)); } catch {}
    }
    if (storedSuiteContext) {
      try { setSuiteContext(JSON.parse(storedSuiteContext)); } catch {}
    }
  }, []);

  // ============================================================
  // LOGIN
  // ============================================================

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

  // ============================================================
  // SET TOKENS
  // ============================================================

  const setTokens = async (accessToken: string, refreshToken: string) => {
    if (isLoading) {
      console.log("⏳ Already loading, skipping duplicate setTokens call");
      return;
    }

    setIsLoading(true);
    try {
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      const userRes = await api.get("/api/v1/auth/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const user = userRes.data;
      setUser(user);
      localStorage.setItem("user", JSON.stringify(user));

      const orgsRes = await api.get("/api/v1/organizations", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const organizations = orgsRes.data.organizations || [];
      setOrganizations(organizations);
      localStorage.setItem("organizations", JSON.stringify(organizations));

      if (organizations.length === 1) {
        const org = organizations[0];
        setActiveOrganizationState(org);
        localStorage.setItem("activeOrganization", JSON.stringify(org));
      }
    } catch (error) {
      console.error("Failed to set tokens:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    setOrganizations([]);
    setActiveOrganizationState(null);
    setActiveOrganizationDetail(null);
    setBranches([]);
    setActiveBranchState(null);
    setSuiteContext(null);
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("organizations");
    localStorage.removeItem("activeOrganization");
    localStorage.removeItem("activeOrganizationDetail");
    localStorage.removeItem("branches");
    localStorage.removeItem("activeBranch");
    localStorage.removeItem("suiteContext");
  };

  // ============================================================
  // LOAD SUITE CONTEXT
  // ============================================================

  const loadSuiteContext = async (organizationId: string): Promise<SuiteContext> => {
    try {
      const response = await api.get<SuiteContext>(
        `/api/v1/auth/me/dashboard?organizationId=${organizationId}`
      );
      const context = response.data;

      setSuiteContext(context);
      localStorage.setItem("suiteContext", JSON.stringify(context));

      setActiveOrganizationDetail(context.organization);
      localStorage.setItem("activeOrganizationDetail", JSON.stringify(context.organization));

      setBranches(context.branches);
      localStorage.setItem("branches", JSON.stringify(context.branches));

      if (context.branches.length > 0) {
        const currentBranch = activeBranch;
        const stillValid = currentBranch && context.branches.some(b => b.id === currentBranch.id);
        const branchToSet = stillValid ? currentBranch : context.branches[0];
        
        setActiveBranchState(branchToSet);
        localStorage.setItem("activeBranch", JSON.stringify(branchToSet));
      } else {
        setActiveBranchState(null);
        localStorage.removeItem("activeBranch");
      }

      return context;
    } catch (error) {
      console.error('Failed to load suite context:', error);
      throw error;
    }
  };

  // ============================================================
  // SET AUTH
  // ============================================================

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
    }
  };

  // ============================================================
  // SET ACTIVE ORGANIZATION
  // ============================================================

  const setActiveOrganization = async (orgId: string) => {
    setIsLoading(true);
    try {
      const org = organizations.find(o => o.id === orgId);
      if (!org) {
        throw new Error("Organization not found");
      }

      setActiveOrganizationState(org);
      localStorage.setItem("activeOrganization", JSON.stringify(org));

      await loadSuiteContext(orgId);
    } catch (err) {
      console.error("Failed to set active organization:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const setActiveOrganizationDirect = (org: Organization) => {
    setActiveOrganizationState(org);
    localStorage.setItem("activeOrganization", JSON.stringify(org));
  };

  // ============================================================
  // BRANCHES
  // ============================================================

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

  const switchBranch = async (branchId: string | null) => {
    if (branchId === null) {
      setActiveBranch(null);
      return;
    }
    const branch = branches.find(b => b.id === branchId);
    if (!branch) {
      throw new Error("Branch not found");
    }
    setActiveBranch(branch);
  };

  // ============================================================
  // PERMISSIONS
  // ============================================================

  const hasPermission = (permission: string): boolean => {
    return suiteContext?.permissions.includes(permission) ?? false;
  };

  const isAuthenticated = !!user && !!accessToken;

  // ============================================================
  // PROVIDER
  // ============================================================

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
        suiteContext,
        isLoading,
        login,
        logout,
        setAuth,
        setTokens,
        setActiveOrganization,
        setActiveOrganizationDirect,
        loadBranches,
        loadSuiteContext,
        hasPermission,
        setActiveBranch,
        switchBranch,
        isAuthenticated,
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