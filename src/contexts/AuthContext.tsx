// src/contexts/AuthContext.tsx

"use client";

import {
  createContext,
  useContext,
  useRef,
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
  role: string; // "Owner" or "Member"
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
  /**
   * True while a fresh /auth/me/dashboard is in flight for the currently
   * selected org. Consumers (PermissionsContext, dashboard) should treat
   * suiteContext as stale while this is true.
   */
  contextLoading: boolean;
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
  /** Re-fetches /auth/me and updates user state + localStorage. */
  refreshUser: () => Promise<User>;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function safeLocalStorageGet<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  const stored = localStorage.getItem(key);
  if (!stored || stored === "undefined" || stored === "null") return defaultValue;

  if (typeof defaultValue === "string") {
    return stored as T;
  }

  try {
    const parsed = JSON.parse(stored);
    return parsed !== null && parsed !== undefined ? parsed : defaultValue;
  } catch {
    return stored as T;
  }
}

// ---------------------------------------------------------------- helpers

/**
 * Wildcard-aware permission check. Handles:
 *   - exact match: "members.view" matches "members.view"
 *   - top-level wildcard: "*" matches everything
 *   - prefix wildcard: "members.*" matches "members.view"
 */
function matchesPermission(permissions: string[], key: string): boolean {
  return permissions.some((p) => {
    if (p === "*") return true;
    if (p.endsWith(".*")) return key.startsWith(p.slice(0, -1));
    return p === key;
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // ---- State: initialized synchronously from localStorage ----
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
  const [contextLoading, setContextLoading] = useState(false);

  // Tracks the in-flight dashboard request so a rapid org switch can cancel
  // the previous one before firing a new fetch. Without this, a slow Org A
  // response can land after Org B's and overwrite the correct data.
  const contextRequestRef = useRef<AbortController | null>(null);

  // ============================================================
  // LOGIN — does NOT touch org loading, lets caller navigate
  // ============================================================

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.post<LoginResponse>("/api/v1/auth/login", {
        email,
        password,
      });

      const { user, accessToken, refreshToken, organizations } = response.data;
      const safeOrgs = organizations || [];

      setUser(user);
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);
      setOrganizations(safeOrgs);

      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("organizations", JSON.stringify(safeOrgs));

      // If user has exactly one org, silently select it — but do NOT
      // await loadSuiteContext here. That's the caller's job after
      // they decide where to navigate. Failing here would break login.
      if (safeOrgs.length === 1) {
        const org = safeOrgs[0];
        setActiveOrganizationState(org);
        localStorage.setItem("activeOrganization", JSON.stringify(org));
      }

      return { hasOrganizations: safeOrgs.length > 0 };
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        throw new Error(
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Login failed"
        );
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // SET TOKENS (used by /callback after social auth)
  // ============================================================

  const setTokens = async (accessToken: string, refreshToken: string) => {
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
      const organizations: Organization[] = orgsRes.data.organizations || [];
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
    // Cancel any in-flight context load so it can't repopulate state
    // after we've cleared everything.
    contextRequestRef.current?.abort();
    contextRequestRef.current = null;

    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    setOrganizations([]);
    setActiveOrganizationState(null);
    setActiveOrganizationDetail(null);
    setBranches([]);
    setActiveBranchState(null);
    setSuiteContext(null);
    setContextLoading(false);

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
    // Cancel any previous in-flight request before starting a new one.
    contextRequestRef.current?.abort();
    const controller = new AbortController();
    contextRequestRef.current = controller;

    setContextLoading(true);

    try {
      const response = await api.get<SuiteContext>(
        `/api/v1/auth/me/dashboard?organizationId=${organizationId}`,
        { signal: controller.signal }
      );

      if (controller.signal.aborted) {
        // A newer request superseded this one — discard without touching state.
        return response.data;
      }

      const context = response.data;

      setSuiteContext(context);
      localStorage.setItem("suiteContext", JSON.stringify(context));

      setActiveOrganizationDetail(context.organization);
      localStorage.setItem("activeOrganizationDetail", JSON.stringify(context.organization));

      setBranches(context.branches);
      localStorage.setItem("branches", JSON.stringify(context.branches));

      // Branch reset: keep the current branch if it still exists in the new
      // org's branch list, otherwise fall back to the first available.
      setActiveBranchState((current) => {
        if (context.branches.length === 0) {
          localStorage.removeItem("activeBranch");
          return null;
        }
        const stillValid =
          current && context.branches.some((b) => b.id === current.id);
        const branchToSet = stillValid ? current! : context.branches[0];
        localStorage.setItem("activeBranch", JSON.stringify(branchToSet));
        return branchToSet;
      });

      return context;
    } catch (err) {
      // Abort throws an axios CanceledError; swallow it so a rapid org
      // switch doesn't surface a spurious error.
      if (axios.isCancel(err) || (err as { name?: string })?.name === "CanceledError") {
        // Re-return whatever's in state — the newer request will set the real value.
        return suiteContext as SuiteContext;
      }
      throw err;
    } finally {
      // Only clear the loading flag if we're still the active request.
      if (contextRequestRef.current === controller) {
        setContextLoading(false);
        contextRequestRef.current = null;
      }
    }
  };

  // ============================================================
  // SET AUTH (used by register flow if needed)
  // ============================================================

  const setAuth = (
    user: User,
    accessToken: string,
    refreshToken: string,
    organizations: Organization[]
  ) => {
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
  // SET ACTIVE ORGANIZATION (called from org-select page)
  // ============================================================

  const setActiveOrganization = async (orgId: string) => {
    const org = organizations.find((o) => o.id === orgId);
    if (!org) {
      throw new Error("Organization not found");
    }

    setActiveOrganizationState(org);
    localStorage.setItem("activeOrganization", JSON.stringify(org));

    await loadSuiteContext(orgId);
  };

  const setActiveOrganizationDirect = (org: Organization) => {
    setActiveOrganizationState(org);
    localStorage.setItem("activeOrganization", JSON.stringify(org));
  };

  // ============================================================
  // BRANCHES
  // ============================================================

  const loadBranches = async (orgId: string): Promise<Branch[]> => {
    const response = await api.get<BranchesResponse>(
      `/api/v1/organizations/${orgId}/branches/my`
    );
    const items = response.data.branches || [];
    setBranches(items);
    localStorage.setItem("branches", JSON.stringify(items));
    return items;
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
    const branch = branches.find((b) => b.id === branchId);
    if (!branch) {
      throw new Error("Branch not found");
    }
    setActiveBranch(branch);
  };

  // ============================================================
  // PERMISSIONS
  // ============================================================

  /**
   * Wildcard-aware permission check. Prefer `usePermissions().hasPermission`
   * for new code; this exists for legacy callers.
   */
  const hasPermission = (permission: string): boolean => {
    const perms = suiteContext?.permissions ?? [];
    return matchesPermission(perms, permission);
  };

  // ============================================================
  // REFRESH USER
  // ============================================================
  // Re-fetches /auth/me and updates context + localStorage.
  // Used after profile updates (name change, etc.) so the whole
  // app sees the new values.

  const refreshUser = async (): Promise<User> => {
    const response = await api.get<User>("/api/v1/auth/me");
    const fresh = response.data;

    setUser(fresh);
    localStorage.setItem("user", JSON.stringify(fresh));

    return fresh;
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
        contextLoading,
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
        refreshUser,
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