// src/app/(auth)/onboarding/select-organization/page.tsx

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({ name: "", country: "KE" });
  const [redirecting, setRedirecting] = useState(false);
  
  const hasLoaded = useRef(false);

  // ============================================================
  // LOAD EVERYTHING
  // ============================================================

  const loadEverything = useCallback(async () => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    
    setChecking(true);
    setError("");
    try {
      const [orgsRes, invitesRes] = await Promise.allSettled([
        api.get<OrganizationsResponse>("/api/v1/organizations"),
        api.get("/api/v1/invitations/my"),
      ]);

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

      // ✅ If no orgs and no invites → show create form
      if (freshOrgs.length === 0 && freshInvites.length === 0) {
        setShowCreateForm(true);
        setChecking(false);
        return;
      }

      // ✅ If there are invites → show selection (don't auto-redirect)
      if (freshInvites.length > 0) {
        setShowCreateForm(false);
        setChecking(false);
        return;
      }

      // ✅ If exactly 1 org and NO invites → auto-redirect to dashboard
      if (freshOrgs.length === 1 && freshInvites.length === 0) {
        setRedirecting(true);
        const org = freshOrgs[0];
        try {
          setActiveOrganizationDirect(org);
          await loadSuiteContext(org.id);
          await loadBranches(org.id);
          router.push("/dashboard");
        } catch (err) {
          console.error("Auto-redirect failed:", err);
          setRedirecting(false);
          setShowCreateForm(false);
          setChecking(false);
        }
        return;
      }

      // ✅ Multiple orgs → show selection
      setShowCreateForm(false);
      setChecking(false);

    } catch (err) {
      console.error("Failed to load data:", err);
      toast.error("Could not load your organizations");
      setShowCreateForm(true);
      setChecking(false);
    }
  }, [user, setAuth, setActiveOrganizationDirect, loadSuiteContext, loadBranches, router]);

  useEffect(() => {
    loadEverything();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleSelect = async (orgId: string) => {
    setError("");
    setRedirecting(true);
    try {
      const org = organizations.find(o => o.id === orgId);
      if (!org) {
        toast.error("Organization not found");
        setRedirecting(false);
        return;
      }
      
      // ✅ Set active org
      setActiveOrganizationDirect(org);
      
      // ✅ Load suite context (permissions, branches, products)
      await loadSuiteContext(org.id);
      
      // ✅ Load branches
      await loadBranches(org.id);
      
      router.push("/dashboard");
    } catch (err) {
      toast.error("Failed to select organization");
      console.error(err);
      setRedirecting(false);
    }
  };

  const handleAcceptInvite = async (token: string) => {
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

      // ✅ Auto-redirect if only 1 org and no invites left
      if (updatedOrgs.length === 1 && remainingInvites.length === 0) {
        setRedirecting(true);
        const org = updatedOrgs[0];
        setActiveOrganizationDirect(org);
        await loadSuiteContext(org.id);
        await loadBranches(org.id);
        router.push("/dashboard");
      }
    } catch (err) {
      toast.error("Failed to accept invitation");
      console.error(err);
    }
  };

  const handleRejectInvite = async (token: string) => {
    setError("");
    try {
      await api.post("/api/v1/invitations/reject", { token });
      const remainingInvites = pendingInvites.filter((inv) => inv.token !== token);
      setPendingInvites(remainingInvites);
      
      // ✅ If no invites and no orgs → show create form
      if (organizations.length === 0 && remainingInvites.length === 0) {
        setShowCreateForm(true);
      }
      
      // ✅ If no invites and exactly 1 org → auto-redirect
      if (organizations.length === 1 && remainingInvites.length === 0) {
        setRedirecting(true);
        const org = organizations[0];
        setActiveOrganizationDirect(org);
        await loadSuiteContext(org.id);
        await loadBranches(org.id);
        router.push("/dashboard");
      }
      
      toast.info("Invitation declined");
    } catch (err) {
      toast.error("Failed to reject invitation");
      console.error(err);
    }
  };

  const handleCreateChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
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

      // ✅ Auto-redirect to dashboard
      setRedirecting(true);
      setActiveOrganizationDirect(newOrg);
      await loadSuiteContext(newOrg.id);
      await loadBranches(newOrg.id);
      router.push("/dashboard");

    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Failed to create organization");
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Something went wrong. Please try again.");
      }
      setCreating(false);
    }
  };

  type OrgShape = {
    ownerId?: string;
    owner?: { id?: string } | null;
    [key: string]: unknown;
  };

  const getOrgRole = (org: OrgShape): string => {
    if (!user) return "MEMBER";
    const ownerId = org.ownerId ?? org.owner?.id;
    return ownerId === user.id ? "OWNER" : "MEMBER";
  };

  const hasFullAccess = (org: OrgShape): boolean => {
    if (!user) return false;
    const ownerId = org.ownerId ?? org.owner?.id;
    return ownerId === user.id;
  };

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