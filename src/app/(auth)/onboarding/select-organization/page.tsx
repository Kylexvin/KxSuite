// src/app/(auth)/onboarding/select-organization/page.tsx

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";
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
  CheckCircle,
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
    setActiveOrganization,
    loadBranches,
    isLoading,
    setActiveOrganizationState,
  } = useAuth();

  const [pendingInvites, setPendingInvites] = useState<PendingInvitation[]>([]);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({ name: "", country: "KE" });
  
  const hasLoaded = useRef(false);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

      if (freshOrgs.length === 0 && freshInvites.length === 0) {
        setShowCreateForm(true);
      } else {
        setShowCreateForm(false);
      }

      // Auto-select if only one organization and no invites
      if (freshOrgs.length === 1 && freshInvites.length === 0) {
        const org = freshOrgs[0];
        await setActiveOrganization(org.id);
        await loadBranches(org.id);
        router.push("/dashboard");
        return;
      }
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Could not load your organizations. You can still create one below.");
      setShowCreateForm(true);
    } finally {
      setChecking(false);
    }
  }, [user, setAuth, setActiveOrganization, loadBranches, router]);

  useEffect(() => {
    loadEverything();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  const handleSelect = async (orgId: string) => {
    setError("");
    try {
      await setActiveOrganization(orgId);
      await loadBranches(orgId);
      router.push("/dashboard");
    } catch (err) {
      setError("Failed to select organization. Please try again.");
      console.error(err);
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

      if (updatedOrgs.length === 1 && remainingInvites.length === 0) {
        const org = updatedOrgs[0];
        await setActiveOrganization(org.id);
        await loadBranches(org.id);
        router.push("/dashboard");
      }
    } catch (err) {
      setError("Failed to accept invitation. Please try again.");
      console.error(err);
    }
  };

  const handleRejectInvite = async (token: string) => {
    setError("");
    try {
      await api.post("/api/v1/invitations/reject", { token });
      const remainingInvites = pendingInvites.filter((inv) => inv.token !== token);
      setPendingInvites(remainingInvites);
      if (organizations.length === 0 && remainingInvites.length === 0) {
        setShowCreateForm(true);
      }
    } catch (err) {
      setError("Failed to reject invitation. Please try again.");
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
    setSuccessMessage("");
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
      
      // Update auth context with new orgs list
      if (user) {
        setAuth(user, accessToken, refreshToken, updatedOrgs);
      }
      
      // Store default branch
      localStorage.setItem("defaultBranch", JSON.stringify(defaultBranch));

      // Load branches for the new org
      await loadBranches(newOrg.id);

      // Set active organization directly (bypass state lookup)
      setActiveOrganizationState(newOrg);
      localStorage.setItem("activeOrganization", JSON.stringify(newOrg));

      setSuccessMessage(`🎉 "${organization.name}" created successfully!`);

      // Redirect after delay
      successTimeoutRef.current = setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Failed to create organization");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
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

  if (checking || isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loadingCard}>
            <div className={styles.spinner} />
            <p>Loading your workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  const hasOrgs = organizations.length > 0;
  const hasInvites = pendingInvites.length > 0;
  const showFab = !showCreateForm && (hasOrgs || hasInvites);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.mainCard}>
          {/* Brand */}
          <div className={styles.brand}>
            <Image
              src="/assets/logo.png"
              alt="KXBYTE"
              width={48}
              height={48}
              className={styles.brandLogo}
            />
            <div className={styles.brandText}>
              <h1 className={styles.brandTitle}>KXBYTE</h1>
              <span className={styles.brandSuite}>Suite</span>
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className={styles.successBanner}>
              <CheckCircle size={20} />
              <span>{successMessage}</span>
            </div>
          )}

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
                      disabled={creating || !!successMessage}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="country">Country</label>
                    <select
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleCreateChange}
                      disabled={creating || !!successMessage}
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

                <button 
                  type="submit" 
                  className={styles.submitBtn} 
                  disabled={creating || !!successMessage}
                >
                  {creating ? (
                    <>
                      <span className={styles.spinnerSmall} />
                      Creating...
                    </>
                  ) : successMessage ? (
                    <>
                      <CheckCircle size={16} />
                      Created!
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
                  disabled={creating || !!successMessage}
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
                          disabled={isLoading}
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
                            <ArrowRight size={16} className={styles.orgArrow} />
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

      {/* FAB for quick create */}
      {showFab && (
        <button className={styles.fab} onClick={() => setShowCreateForm(true)}>
          <Plus size={20} />
        </button>
      )}
    </div>
  );
}