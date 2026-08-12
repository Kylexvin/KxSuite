// src/app/(auth)/onboarding/select-organization/page.tsx

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import { useAuth, Organization, Branch } from "@/contexts/AuthContext";
import { api } from "@/lib/axios";
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
    setActiveBranch,
    isLoading 
  } = useAuth();

  const [pendingInvites, setPendingInvites] = useState<PendingInvitation[]>([]);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({ name: "", country: "KE" });

  const loadEverything = useCallback(async () => {
    setChecking(true);
    setError("");
    try {
      const [orgsRes, invitesRes] = await Promise.allSettled([
        api.get<OrganizationsResponse>("/api/v1/organizations"),
        api.get("/api/v1/invitations/my"),
      ]);

      let freshOrgs: Organization[] = organizations;
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
      }
    } catch (err) {
      console.error("Failed to load organizations/invitations:", err);
      setError("Could not load your organizations. You can still create one below.");
      setShowCreateForm(true);
    } finally {
      setChecking(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      void loadEverything();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-select if only one organization
useEffect(() => {
  if (!checking && organizations.length === 1 && pendingInvites.length === 0) {
    const org = organizations[0];
    setActiveOrganization(org.id).then(() => {
      loadBranches(org.id).then((branches) => {
        if (branches.length <= 1) {
          if (branches.length === 1) {
            setActiveBranch(branches[0]);
          }
          router.push("/dashboard");
        } else {
          router.push("/onboarding/select-branch");
        }
      });
    });
  }
}, [checking, organizations, pendingInvites]);

  const handleSelect = async (orgId: string) => {
    setError("");
    try {
      await setActiveOrganization(orgId);
      
      const branches = await loadBranches(orgId);
      
      if (branches.length === 0) {
        router.push("/dashboard");
      } else if (branches.length === 1) {
        setActiveBranch(branches[0]);
        router.push("/dashboard");
      } else {
        router.push("/onboarding/select-branch");
      }
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
        const branches = await loadBranches(org.id);
        if (branches.length <= 1) {
          if (branches.length === 1) {
            setActiveBranch(branches[0]);
          }
          router.push("/dashboard");
        } else {
          router.push("/onboarding/select-branch");
        }
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
        role: membership.role?.name || "MEMBER",
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

      await setActiveOrganization(newOrg.id);
      const branches = await loadBranches(newOrg.id);
      if (branches.length <= 1) {
        if (branches.length === 1) {
          setActiveBranch(branches[0]);
        }
        router.push("/dashboard");
      } else {
        router.push("/onboarding/select-branch");
      }
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
          <div className={styles.card}>
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <p>Checking your account...</p>
            </div>
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
        <div className={showCreateForm ? styles.card : styles.cardWide}>
          <div className={styles.brand}>
            <Image src="/assets/logo.png" alt="KXBYTE" width={44} height={44} className={styles.brandLogo} />
            <h1>
              KXBYTE <span className={styles.brandSuite}>Suite</span>
            </h1>
          </div>

          {showCreateForm ? (
            <>
              <h2>Create your organization</h2>
              <p className={styles.subtitle}>
                {hasOrgs || hasInvites
                  ? "Set up a new organization."
                  : "You don't have any organizations yet. Set one up to get started."}
              </p>

              {error && <div className={styles.error}>{error}</div>}

              <form onSubmit={handleCreateSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                  <label htmlFor="name">Organization name</label>
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
                    className={styles.select}
                  >
                    <option value="KE">Kenya</option>
                    <option value="UG">Uganda</option>
                    <option value="TZ">Tanzania</option>
                    <option value="RW">Rwanda</option>
                    <option value="NG">Nigeria</option>
                    <option value="ZA">South Africa</option>
                  </select>
                </div>

                <button type="submit" className={styles.submitBtn} disabled={creating}>
                  {creating ? "Creating..." : "Create organization"}
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
            </>
          ) : (
            <>
              <h2>Your organizations</h2>
              <p className={styles.subtitle}>
                Select an organization to continue or accept an invitation.
              </p>

              {error && <div className={styles.error}>{error}</div>}

              {hasOrgs && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Your organizations</h3>
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
                          <div className={styles.orgTop}>
                            <div className={styles.orgIcon}>
                              {org.name.charAt(0).toUpperCase()}
                            </div>
                            <div className={styles.arrow}>→</div>
                          </div>
                          <h4 className={styles.orgName}>{org.name}</h4>
                          <p className={styles.orgRole}>
                            {role === "OWNER" ? "👑 Owner" : "Member"}
                          </p>
                          {role === "OWNER" ? (
                            <span className={styles.badgeOwner}>Full Access</span>
                          ) : fullAccess ? (
                            <span className={styles.badge}>All Branches</span>
                          ) : (
                            <span className={styles.badgeLimited}>Limited Access</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {hasInvites && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Pending invitations</h3>
                  <div className={styles.inviteGrid}>
                    {pendingInvites.map((invite) => (
                      <div key={invite.id} className={styles.inviteCard}>
                        <div className={styles.orgTop}>
                          <div className={styles.inviteIcon}>
                            {invite.organization.name.charAt(0).toUpperCase()}
                          </div>
                          <span className={styles.badgePending}>Pending</span>
                        </div>
                        <h4 className={styles.orgName}>{invite.organization.name}</h4>
                        <p className={styles.inviteBy}>
                          Invited by {invite.invitedBy.firstName} {invite.invitedBy.lastName}
                        </p>
                        <div className={styles.inviteActions}>
                          <button
                            className={styles.acceptBtn}
                            onClick={() => handleAcceptInvite(invite.token)}
                          >
                            Accept
                          </button>
                          <button
                            className={styles.rejectBtn}
                            onClick={() => handleRejectInvite(invite.token)}
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className={styles.helpText}>
                You can switch organizations later from the dashboard.
              </p>
            </>
          )}
        </div>
      </div>

      {showFab && (
        <button className={styles.fab} onClick={() => setShowCreateForm(true)}>
          <span className={styles.fabPlus}>+</span>
          <span className={styles.fabLabel}>New organization</span>
        </button>
      )}
    </div>
  );
}