// src/app/(auth)/onboarding/select-organization/page.tsx

"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { useAuth, Organization } from "@/contexts/AuthContext";
import { api } from "@/lib/axios";
import {
  Building2,
  Check,
  X,
  Plus,
  ArrowRight,
  Crown,
  Mail,
  Rocket,
  ChevronRight,
  Users,
  TrendingUp,
  Zap,
  RefreshCw,
} from "lucide-react";
import styles from "./page.module.css";

type PendingInvitation = {
  id: string;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  invitedBy: {
    firstName: string;
    lastName: string;
  };
  token: string;
  status: string;
};

type OrganizationsResponse = {
  organizations: Organization[];
};

type CreateOrganizationResponse = {
  organization: {
    id: string;
    name: string;
    slug: string;
    ownerId: string;
  };
  membership: {
    id: string;
    hasAllBranches: boolean;
    role?: { id: string; name: string };
  };
  defaultBranch: {
    id: string;
    organizationId: string;
    name: string;
    code: string;
    address: string;
    phone: string;
    email: string;
    isActive: boolean;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
  };
};

// ============================================================
// API ERROR TYPE
// ============================================================

type ApiErrorResponse = {
  message?: string;
  error?: string;
  [key: string]: unknown;
};

// ============================================================
// HELPER: Get error message from unknown error
// ============================================================

function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse;
    return data?.message || data?.error || fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return fallback;
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function SelectOrganizationPage() {
  const router = useRouter();
  const {
    user,
    organizations,
    setAuth,
    loadSuiteContext,
    setActiveOrganizationDirect,
    loadBranches,
    isLoading,
  } = useAuth();

  const [pendingInvites, setPendingInvites] = useState<PendingInvitation[]>([]);
  const [archivedOrgs, setArchivedOrgs] = useState<Organization[]>([]);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({ name: "", country: "KE" });
  const [redirecting, setRedirecting] = useState(false);
  // ✅ REMOVED: const [initialLoadDone, setInitialLoadDone] = useState(false);
  
  const hasLoaded = useRef(false);
  const isMounted = useRef(true);

  // ============================================================
  // LOAD DATA
  // ============================================================

  useEffect(() => {
    isMounted.current = true;

    const loadData = async () => {
      if (hasLoaded.current || !isMounted.current) return;
      hasLoaded.current = true;

      setChecking(true);
      setError("");

      try {
        // Fetch organizations and invitations
        const [orgsRes, invitesRes] = await Promise.allSettled([
          api.get<OrganizationsResponse>("/api/v1/organizations"),
          api.get("/api/v1/invitations/my"),
        ]);

        if (!isMounted.current) return;

        let freshOrgs: Organization[] = [];
        if (orgsRes.status === "fulfilled") {
          freshOrgs = orgsRes.value.data.organizations || [];
          const accessToken = localStorage.getItem("accessToken") || "";
          const refreshToken = localStorage.getItem("refreshToken") || "";
          if (user) {
            setAuth(user, accessToken, refreshToken, freshOrgs);
          }
        }

        let freshInvites: PendingInvitation[] = [];
        if (invitesRes.status === "fulfilled") {
          const invites = invitesRes.value.data.invitations || [];
          freshInvites = invites.filter((inv: PendingInvitation) => inv.status === "PENDING");
          setPendingInvites(freshInvites);
        }

        // Fetch archived orgs
        let archivedOrgsData: Organization[] = [];
        try {
          const archivedRes = await api.get("/api/v1/organizations/archived");
          archivedOrgsData = archivedRes.data.organizations || [];
          if (isMounted.current) {
            setArchivedOrgs(archivedOrgsData);
          }
        } catch (err: unknown) {
          console.error("Failed to fetch archived orgs:", err);
        }

        if (!isMounted.current) return;

        // ─── DECISION LOGIC ─────────────────────────────────────────────

        // If no orgs and no invites → show create form
        if (freshOrgs.length === 0 && freshInvites.length === 0) {
          setShowCreateForm(true);
          setChecking(false);
          // ✅ REMOVED: setInitialLoadDone(true);
          return;
        }

        // If there are invites → show selection (don't auto-redirect)
        if (freshInvites.length > 0) {
          setShowCreateForm(false);
          setChecking(false);
          // ✅ REMOVED: setInitialLoadDone(true);
          return;
        }

        // ✅ If there is an archived org → show selection (don't auto-redirect)
        if (archivedOrgsData.length > 0) {
          setShowCreateForm(false);
          setChecking(false);
          // ✅ REMOVED: setInitialLoadDone(true);
          console.log("📦 Archived orgs found, showing selection page");
          return;
        }

        // ✅ If exactly 1 org, no invites, no archived orgs → auto-redirect
        if (freshOrgs.length === 1 && freshInvites.length === 0 && archivedOrgsData.length === 0) {
          setRedirecting(true);
          const org = freshOrgs[0];
          try {
            setActiveOrganizationDirect(org);
            await loadSuiteContext(org.id);
            await loadBranches(org.id);
            router.push("/dashboard");
          } catch (err: unknown) {
            console.error("Auto-redirect failed:", err);
            setRedirecting(false);
            setShowCreateForm(false);
            setChecking(false);
            // ✅ REMOVED: setInitialLoadDone(true);
          }
          return;
        }

        // Multiple orgs → show selection
        setShowCreateForm(false);
        setChecking(false);
        // ✅ REMOVED: setInitialLoadDone(true);

      } catch (err: unknown) {
        console.error("Failed to load data:", err);
        toast.error("Could not load your organizations");
        setShowCreateForm(true);
        setChecking(false);
        // ✅ REMOVED: setInitialLoadDone(true);
      }
    };

    loadData();

    return () => {
      isMounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================
  // HANDLERS - Memoized
  // ============================================================

  const handleSelect = useCallback(async (orgId: string) => {
    setError("");
    setRedirecting(true);
    try {
      const org = organizations.find(o => o.id === orgId);
      if (!org) {
        toast.error("Organization not found");
        setRedirecting(false);
        return;
      }
      
      setActiveOrganizationDirect(org);
      await loadSuiteContext(org.id);
      await loadBranches(org.id);
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to select organization");
      toast.error(message);
      console.error(err);
      setRedirecting(false);
    }
  }, [organizations, setActiveOrganizationDirect, loadSuiteContext, loadBranches, router]);

  const handleRestoreOrganization = useCallback(async (orgId: string) => {
    setRestoring(orgId);
    try {
      await api.patch(`/api/v1/organizations/${orgId}/restore`);
      
      setArchivedOrgs(prev => prev.filter(org => org.id !== orgId));
      
      // Refetch active organizations
      const orgsRes = await api.get<OrganizationsResponse>("/api/v1/organizations");
      const freshOrgs = orgsRes.data.organizations || [];
      const accessToken = localStorage.getItem("accessToken") || "";
      const refreshToken = localStorage.getItem("refreshToken") || "";
      if (user) {
        setAuth(user, accessToken, refreshToken, freshOrgs);
      }
      
      toast.success("Organization restored successfully!");
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to restore organization");
      toast.error(message);
      console.error(err);
    } finally {
      setRestoring(null);
    }
  }, [user, setAuth]);

  const handleAcceptInvite = useCallback(async (token: string) => {
    setError("");
    try {
      await api.post("/api/v1/invitations/accept", { token });

      const orgsResponse = await api.get<OrganizationsResponse>("/api/v1/organizations");
      const updatedOrgs = orgsResponse.data.organizations || [];

      const accessToken = localStorage.getItem("accessToken") || "";
      const refreshToken = localStorage.getItem("refreshToken") || "";
      if (user) {
        setAuth(user, accessToken, refreshToken, updatedOrgs);
      }

      const remainingInvites = pendingInvites.filter((inv) => inv.token !== token);
      setPendingInvites(remainingInvites);
      setShowCreateForm(false);

      toast.success("Invitation accepted!");

      // ✅ Check if there are archived orgs before auto-redirect
      if (updatedOrgs.length === 1 && remainingInvites.length === 0 && archivedOrgs.length === 0) {
        setRedirecting(true);
        const org = updatedOrgs[0];
        setActiveOrganizationDirect(org);
        await loadSuiteContext(org.id);
        await loadBranches(org.id);
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to accept invitation");
      toast.error(message);
      console.error(err);
    }
  }, [user, pendingInvites, archivedOrgs, setAuth, setActiveOrganizationDirect, loadSuiteContext, loadBranches, router]);

  const handleRejectInvite = useCallback(async (token: string) => {
    setError("");
    try {
      await api.post("/api/v1/invitations/reject", { token });
      const remainingInvites = pendingInvites.filter((inv) => inv.token !== token);
      setPendingInvites(remainingInvites);
      
      if (organizations.length === 0 && remainingInvites.length === 0) {
        setShowCreateForm(true);
      }
      
      if (organizations.length === 1 && remainingInvites.length === 0 && archivedOrgs.length === 0) {
        setRedirecting(true);
        const org = organizations[0];
        setActiveOrganizationDirect(org);
        await loadSuiteContext(org.id);
        await loadBranches(org.id);
        router.push("/dashboard");
      }
      
      toast.info("Invitation declined");
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to reject invitation");
      toast.error(message);
      console.error(err);
    }
  }, [pendingInvites, organizations, archivedOrgs, setActiveOrganizationDirect, loadSuiteContext, loadBranches, router]);

  // ✅ Fixed with functional update
  const handleCreateChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleCreateSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCreating(true);

    try {
      const response = await api.post<CreateOrganizationResponse>(
        "/api/v1/organizations",
        { name: formData.name, country: formData.country }
      );

      const { organization, membership, defaultBranch } = response.data;

      const newOrg: Organization = {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        role: membership.role?.name || "OWNER",
        hasAllBranches: membership.hasAllBranches,
        membershipId: membership.id,
      };

      const updatedOrgs = [...organizations, newOrg];

      const accessToken = localStorage.getItem("accessToken") || "";
      const refreshToken = localStorage.getItem("refreshToken") || "";
      if (user) {
        setAuth(user, accessToken, refreshToken, updatedOrgs);
      }
      localStorage.setItem("defaultBranch", JSON.stringify(defaultBranch));

      toast.success(`🎉 "${organization.name}" created successfully!`);

      setRedirecting(true);
      setActiveOrganizationDirect(newOrg);
      await loadSuiteContext(newOrg.id);
      await loadBranches(newOrg.id);
      router.push("/dashboard");

    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to create organization");
      toast.error(message);
      setCreating(false);
    }
  }, [formData, organizations, user, setAuth, setActiveOrganizationDirect, loadSuiteContext, loadBranches, router]);

  // ============================================================
  // HELPERS - Memoized
  // ============================================================

  const getOrgRole = useCallback((org: { ownerId?: string; owner?: { id?: string } | null; [key: string]: unknown }): string => {
    if (!user) return "MEMBER";
    const ownerId = org.ownerId ?? (org.owner?.id as string | undefined);
    return ownerId === user.id ? "OWNER" : "MEMBER";
  }, [user]);

  const hasFullAccess = useCallback((org: { ownerId?: string; owner?: { id?: string } | null; [key: string]: unknown }): boolean => {
    if (!user) return false;
    const ownerId = org.ownerId ?? (org.owner?.id as string | undefined);
    return ownerId === user.id;
  }, [user]);

  // ============================================================
  // LOADING / REDIRECTING
  // ============================================================

  if (checking || isLoading || redirecting) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loadingCard}>
            <div className={styles.spinner} />
            <p>{redirecting ? "Redirecting to dashboard..." : "Loading your workspace..."}</p>
          </div>
        </div>
      </div>
    );
  }

  const hasOrgs = organizations.length > 0;
  const hasInvites = pendingInvites.length > 0;
  const showFab = !showCreateForm && (hasOrgs || hasInvites);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Left Panel - Branding */}
        <div className={styles.leftPanel}>
          <div className={styles.leftContent}>
            <div className={styles.brandLarge}>
              <div className={styles.logoMark}>K</div>
              <div className={styles.brandTextLarge}>
                <h1 className={styles.brandTitleLarge}>KXBYTE</h1>
                <span className={styles.brandSubtitle}>Business Technology Ecosystem</span>
              </div>
            </div>

            <div className={styles.featuresList}>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <Building2 size={18} />
                </div>
                <div>
                  <h4>Organization Management</h4>
                  <p>Manage all your businesses in one place</p>
                </div>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <Users size={18} />
                </div>
                <div>
                  <h4>Team Collaboration</h4>
                  <p>Invite members and assign roles</p>
                </div>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <TrendingUp size={18} />
                </div>
                <div>
                  <h4>Business Growth</h4>
                  <p>Track performance with real-time insights</p>
                </div>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <Zap size={18} />
                </div>
                <div>
                  <h4>All-in-One Suite</h4>
                  <p>KxTill, KxInvoice, KxCRM and more</p>
                </div>
              </div>
            </div>

            <div className={styles.leftFooter}>
              <p>© 2026 KXBYTE. All rights reserved.</p>
            </div>
          </div>
        </div>

        {/* Right Panel - Auth */}
        <div className={styles.rightPanel}>
          <div className={styles.mainCard}>
            {/* Brand - Mobile only */}
            <div className={styles.brandMobile}>
              <div className={styles.logoMarkSmall}>K</div>
              <div>
                <h1 className={styles.brandTitleMobile}>KXBYTE</h1>
                <span className={styles.brandSubtitleMobile}>Suite</span>
              </div>
            </div>

            {showCreateForm ? (
              // ===== CREATE ORGANIZATION FORM =====
              <div className={styles.createSection}>
                <div className={styles.createHeader}>
                  <h2>Create your organization</h2>
                  <p className={styles.subtitle}>
                    {hasOrgs || hasInvites
                      ? "Set up a new organization to expand your business."
                      : "Get started by creating your first organization."}
                  </p>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleCreateSubmit} className={styles.form}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="name">Organization Name</label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleCreateChange}
                        placeholder="e.g. Kamau Supermarket"
                        required
                        disabled={creating}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="country">Country</label>
                      <select
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleCreateChange}
                        disabled={creating}
                      >
                        <option value="KE">🇰🇪 Kenya</option>
                        <option value="UG">🇺🇬 Uganda</option>
                        <option value="TZ">🇹🇿 Tanzania</option>
                        <option value="RW">🇷🇼 Rwanda</option>
                        <option value="NG">🇳🇬 Nigeria</option>
                        <option value="ZA">🇿🇦 South Africa</option>
                      </select>
                    </div>
                  </div>

                  <button type="submit" className={styles.submitBtn} disabled={creating}>
                    {creating ? (
                      <>
                        <span className={styles.spinnerSmall} />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Rocket size={16} />
                        Launch Organization
                      </>
                    )}
                  </button>
                </form>

                {(hasOrgs || hasInvites) && (
                  <button
                    className={styles.backBtn}
                    onClick={() => setShowCreateForm(false)}
                    disabled={creating}
                  >
                    ← Back to your organizations
                  </button>
                )}
              </div>
            ) : (
              // ===== SELECT ORGANIZATION =====
              <div className={styles.selectSection}>
                <div className={styles.selectHeader}>
                  <h2>Welcome to KXBYTE Suite</h2>
                  <p className={styles.subtitle}>
                    {hasOrgs || hasInvites
                      ? "Select an organization to continue."
                      : "Get started by creating your first organization."}
                  </p>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                {/* Organizations */}
                {hasOrgs && (
                  <div className={styles.section}>
                    <div className={styles.sectionLabel}>
                      <Building2 size={14} />
                      Your Organizations
                    </div>
                    <div className={styles.orgGrid}>
                      {organizations.map((org) => {
                        const role = getOrgRole(org);
                        const fullAccess = hasFullAccess(org);

                        return (
                          <button
                            key={org.id}
                            className={styles.orgCard}
                            onClick={() => handleSelect(org.id)}
                            disabled={isLoading || redirecting}
                          >
                            <div className={styles.orgCardLeft}>
                              <div className={styles.orgIcon}>
                                {org.name.charAt(0).toUpperCase()}
                              </div>
                              <div className={styles.orgInfo}>
                                <span className={styles.orgName}>{org.name}</span>
                                <span className={styles.orgRole}>
                                  {role === "OWNER" ? (
                                    <>
                                      <Crown size={12} />
                                      Owner
                                    </>
                                  ) : (
                                    "Member"
                                  )}
                                </span>
                              </div>
                            </div>
                            <div className={styles.orgCardRight}>
                              {role === "OWNER" ? (
                                <span className={styles.badgeOwner}>Full Access</span>
                              ) : fullAccess ? (
                                <span className={styles.badge}>All Branches</span>
                              ) : (
                                <span className={styles.badgeLimited}>Limited</span>
                              )}
                              <ChevronRight size={16} className={styles.orgArrow} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Invitations */}
                {hasInvites && (
                  <div className={styles.section}>
                    <div className={styles.sectionLabel}>
                      <Mail size={14} />
                      Pending Invitations
                    </div>
                    <div className={styles.inviteGrid}>
                      {pendingInvites.map((invite) => (
                        <div key={invite.id} className={styles.inviteCard}>
                          <div className={styles.inviteLeft}>
                            <div className={styles.inviteIcon}>
                              {invite.organization.name.charAt(0).toUpperCase()}
                            </div>
                            <div className={styles.inviteInfo}>
                              <span className={styles.inviteName}>
                                {invite.organization.name}
                              </span>
                              <span className={styles.inviteBy}>
                                Invited by {invite.invitedBy.firstName}{" "}
                                {invite.invitedBy.lastName}
                              </span>
                            </div>
                          </div>
                          <div className={styles.inviteActions}>
                            <button
                              className={styles.acceptBtn}
                              onClick={() => handleAcceptInvite(invite.token)}
                            >
                              <Check size={14} />
                              Accept
                            </button>
                            <button
                              className={styles.rejectBtn}
                              onClick={() => handleRejectInvite(invite.token)}
                            >
                              <X size={14} />
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Archived Organizations */}
                {archivedOrgs.length > 0 && (
                  <div className={styles.section}>
                    <div className={styles.sectionLabel}>
                      <RefreshCw size={14} />
                      Archived Organizations
                    </div>
                    <div className={styles.inviteGrid}>
                      {archivedOrgs.map((org) => (
                        <div key={org.id} className={`${styles.inviteCard} ${styles.archivedCard}`}>
                          <div className={styles.inviteLeft}>
                            <div className={styles.inviteIcon} style={{ opacity: 0.5 }}>
                              {org.name.charAt(0).toUpperCase()}
                            </div>
                            <div className={styles.inviteInfo}>
                              <span className={styles.inviteName} style={{ opacity: 0.6 }}>
                                {org.name}
                              </span>
                              <span className={styles.inviteBy} style={{ color: 'var(--text-faint)' }}>
                                Archived • Restore to regain access
                              </span>
                            </div>
                          </div>
                          <div className={styles.inviteActions}>
                            <button
                              className={styles.restoreBtn}
                              onClick={() => handleRestoreOrganization(org.id)}
                              disabled={restoring === org.id}
                            >
                              {restoring === org.id ? (
                                <span className={styles.spinnerSmall} />
                              ) : (
                                <RefreshCw size={14} />
                              )}
                              Restore
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Create New */}
                <button
                  className={styles.createBtn}
                  onClick={() => setShowCreateForm(true)}
                >
                  <Plus size={16} />
                  {hasOrgs || hasInvites
                    ? "Create New Organization"
                    : "Create Your First Organization"}
                  <ArrowRight size={14} />
                </button>

                <p className={styles.helpText}>
                  You can switch organizations anytime from the dashboard.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FAB for quick create */}
      {showFab && (
        <button className={styles.fab} onClick={() => setShowCreateForm(true)}>
          <Plus size={20} />
        </button>
      )}
    </div>
  );
}