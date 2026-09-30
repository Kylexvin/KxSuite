// app/(auth)/onboarding/select-organization/page.tsx

"use client";

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { useAuth, Organization } from "@/contexts/AuthContext";
import { api } from "@/lib/axios";
import Image from "next/image";
import {
  Building2,
  Check,
  X,
  Plus,
  Crown,
  Mail,
  Rocket,
  RefreshCw,
  LogOut,
  Search,
  ChevronRight,
} from "lucide-react";
import styles from "./page.module.css";

// ============================================================
// TYPES
// ============================================================

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

type ApiErrorResponse = {
  message?: string;
  error?: string;
  [key: string]: unknown;
};

// ============================================================
// COUNTRY → DIAL CODE MAP
// Keep in sync with the <select> options below.
// ============================================================

const COUNTRIES = [
  { code: "KE", name: "Kenya",        flag: "🇰🇪", dial: "+254" },
  { code: "UG", name: "Uganda",       flag: "🇺🇬", dial: "+256" },
  { code: "TZ", name: "Tanzania",     flag: "🇹🇿", dial: "+255" },
  { code: "RW", name: "Rwanda",       flag: "🇷🇼", dial: "+250" },
  { code: "NG", name: "Nigeria",      flag: "🇳🇬", dial: "+234" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", dial: "+27"  },
] as const;

const DEFAULT_COUNTRY = "KE";

function getCountry(code: string) {
  return COUNTRIES.find((c) => c.code === code) || COUNTRIES[0];
}

// ============================================================
// HELPERS
// ============================================================

function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse;
    return data?.message || data?.error || fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return fallback;
}

// Strip everything except digits from the local part the user types.
function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

// ============================================================
// PAGE
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
    logout,
  } = useAuth();

  const [pendingInvites, setPendingInvites] = useState<PendingInvitation[]>([]);
  const [archivedOrgs, setArchivedOrgs] = useState<Organization[]>([]);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // form state — country drives the dial code prefix for phone
  const [formData, setFormData] = useState({
    name: "",
    country: DEFAULT_COUNTRY,
    phoneLocal: "", // digits only, no dial code
  });

  const [redirecting, setRedirecting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const hasLoaded = useRef(false);
  const redirectingRef = useRef(false);

  const selectedCountry = useMemo(
    () => getCountry(formData.country),
    [formData.country]
  );

  // ============================================================
  // LOAD DATA — ONLY ONCE
  // ============================================================

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (hasLoaded.current) return;
      if (!user) return;

      try {
        const [orgsRes, invitesRes, archivedRes] = await Promise.all([
          api.get("/api/v1/organizations"),
          api.get("/api/v1/invitations/my"),
          api
            .get("/api/v1/organizations/archived")
            .catch(() => ({ data: { organizations: [] } })),
        ]);

        if (!mounted) return;

        const freshOrgs = orgsRes.data.organizations || [];
        const accessToken = localStorage.getItem("accessToken") || "";
        const refreshToken = localStorage.getItem("refreshToken") || "";
        setAuth(user, accessToken, refreshToken, freshOrgs);

        const freshInvites = (invitesRes.data.invitations || []).filter(
          (inv: PendingInvitation) => inv.status === "PENDING"
        );
        setPendingInvites(freshInvites);
        setArchivedOrgs(archivedRes.data.organizations || []);

        if (freshOrgs.length === 0 && freshInvites.length === 0) {
          setShowCreateForm(true);
        }

        setLoading(false);
        hasLoaded.current = true;
      } catch (err) {
        console.error("Failed to load data:", err);
        toast.error("Could not load your organizations");
        setShowCreateForm(true);
        setLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [user, setAuth]);

  // ============================================================
  // AUTO-REDIRECT — when data is ready
  // ============================================================

  useEffect(() => {
    if (redirectingRef.current || loading) return;
    if (!user) return;

    if (
      organizations.length === 1 &&
      pendingInvites.length === 0 &&
      archivedOrgs.length === 0
    ) {
      const org = organizations[0];
      redirectingRef.current = true;

      Promise.resolve().then(() => {
        setRedirecting(true);
      });

      setActiveOrganizationDirect(org);

      loadSuiteContext(org.id)
        .then(() => loadBranches(org.id))
        .then(() => {
          router.push("/dashboard");
        })
        .catch((err) => {
          console.error("Auto-redirect failed:", err);
          redirectingRef.current = false;
          Promise.resolve().then(() => {
            setRedirecting(false);
          });
        });
    }
  }, [
    organizations,
    pendingInvites,
    archivedOrgs,
    loading,
    user,
    setActiveOrganizationDirect,
    loadSuiteContext,
    loadBranches,
    router,
  ]);

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleSelect = useCallback(
    async (orgId: string) => {
      setError("");
      setRedirecting(true);
      try {
        const org = organizations.find((o) => o.id === orgId);
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
    },
    [organizations, setActiveOrganizationDirect, loadSuiteContext, loadBranches, router]
  );

  const handleRestoreOrganization = useCallback(
    async (orgId: string) => {
      setRestoring(orgId);
      try {
        await api.patch(`/api/v1/organizations/${orgId}/restore`);

        setArchivedOrgs((prev) => prev.filter((org) => org.id !== orgId));

        const orgsRes = await api.get("/api/v1/organizations");
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
    },
    [user, setAuth]
  );

  const handleAcceptInvite = useCallback(
    async (token: string) => {
      setError("");
      try {
        await api.post("/api/v1/invitations/accept", { token });

        const orgsRes = await api.get("/api/v1/organizations");
        const updatedOrgs = orgsRes.data.organizations || [];

        const accessToken = localStorage.getItem("accessToken") || "";
        const refreshToken = localStorage.getItem("refreshToken") || "";
        if (user) {
          setAuth(user, accessToken, refreshToken, updatedOrgs);
        }

        const remainingInvites = pendingInvites.filter((inv) => inv.token !== token);
        setPendingInvites(remainingInvites);
        setShowCreateForm(false);

        toast.success("Invitation accepted!");
      } catch (err: unknown) {
        const message = getErrorMessage(err, "Failed to accept invitation");
        toast.error(message);
        console.error(err);
      }
    },
    [user, pendingInvites, setAuth]
  );

  const handleRejectInvite = useCallback(
    async (token: string) => {
      setError("");
      try {
        await api.post("/api/v1/invitations/reject", { token });
        const remainingInvites = pendingInvites.filter((inv) => inv.token !== token);
        setPendingInvites(remainingInvites);

        if (organizations.length === 0 && remainingInvites.length === 0) {
          setShowCreateForm(true);
        }

        toast.info("Invitation declined");
      } catch (err: unknown) {
        const message = getErrorMessage(err, "Failed to reject invitation");
        toast.error(message);
        console.error(err);
      }
    },
    [pendingInvites, organizations]
  );

  // ---------- form change ----------
  const handleCreateChange = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
      const { name, value } = e.target;

      if (name === "phoneLocal") {
        // keep only digits, cap length so it stays sane
        setFormData((prev) => ({
          ...prev,
          phoneLocal: digitsOnly(value).slice(0, 14),
        }));
        return;
      }

      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  // ---------- submit ----------
  const handleCreateSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      const trimmedName = formData.name.trim();
      const localDigits = formData.phoneLocal;

      // client-side pre-flight (server validates again)
      if (trimmedName.length < 2) {
        toast.error("Organization name must be at least 2 characters.");
        return;
      }
      if (localDigits.length < 6 || localDigits.length > 12) {
        toast.error("Enter a valid phone number.");
        return;
      }

      // Compose full E.164-ish phone: +<dial><localDigits>
      const fullPhone = `${selectedCountry.dial}${localDigits}`;

      setCreating(true);

      try {
        const response = await api.post<CreateOrganizationResponse>(
          "/api/v1/organizations",
          {
            name: trimmedName,
            country: formData.country,
            phone: fullPhone,
          }
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
    },
    [
      formData,
      selectedCountry,
      organizations,
      user,
      setAuth,
      setActiveOrganizationDirect,
      loadSuiteContext,
      loadBranches,
      router,
    ]
  );

  const getOrgRole = useCallback((org: Organization): string => {
    return org.role || "MEMBER";
  }, []);

  const filteredOrganizations = useMemo(() => {
    if (!query.trim()) return organizations;
    const q = query.trim().toLowerCase();
    return organizations.filter((org) => org.name.toLowerCase().includes(q));
  }, [organizations, query]);

  // ============================================================
  // LOADING
  // ============================================================

  if (loading || isLoading || redirecting) {
    return (
      <div className={styles.page}>
        <div className={styles.glowAmber} />
        <div className={styles.glowMoss} />
        <div className={styles.loadingCard}>
          <div className={styles.spinner} />
          <p>
            {redirecting
              ? "Redirecting to dashboard..."
              : "Loading your workspace..."}
          </p>
        </div>
      </div>
    );
  }

  const hasOrgs = organizations.length > 0;
  const hasInvites = pendingInvites.length > 0;
  const hasArchived = archivedOrgs.length > 0;
  const initial = user?.firstName?.charAt(0).toUpperCase() || "?";

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className={styles.page}>
      <div className={styles.glowAmber} />
      <div className={styles.glowMoss} />

      <div className={styles.glassCard}>
        {/* ===== brand + user ===== */}
        <div className={styles.cardTopRow}>
          <div className={styles.brand}>
            <Image
              src="/assets/logo.png"
              alt="KXBYTE"
              width={28}
              height={28}
              className={styles.logoMark}
              priority
            />
            <span className={styles.brandName}>KXBYTE</span>
          </div>
          <div className={styles.userChip}>
            <div className={styles.avatar}>{initial}</div>
            <span className={styles.userNameText}>{user?.firstName}</span>
          </div>
        </div>

        {showCreateForm ? (
          // ===== CREATE ORGANIZATION =====
          <div className={styles.createWrap}>
            <div className={styles.createIconWrap}>
              <Rocket size={18} />
            </div>
            <h1 className={styles.title}>Launch an organization</h1>
            <p className={styles.subtitle}>
              {hasOrgs || hasInvites
                ? "Set up a new organization to expand your business."
                : "Create your first organization to get started with KXBYTE Suite."}
            </p>

            <div className={styles.createCard}>
              {error && <div className={styles.error}>{error}</div>}

              <form onSubmit={handleCreateSubmit} className={styles.form}>
                {/* Row 1: Country + Phone */}
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="country">Country</label>
                    <select
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleCreateChange}
                      disabled={creating}
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="phoneLocal">Phone number</label>
                    <div className={styles.phoneInput}>
                      <span className={styles.phonePrefix}>
                        {selectedCountry.flag} {selectedCountry.dial}
                      </span>
                      <input
                        id="phoneLocal"
                        name="phoneLocal"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        value={formData.phoneLocal}
                        onChange={handleCreateChange}
                        placeholder="712 345 678"
                        required
                        disabled={creating}
                        maxLength={14}
                      />
                    </div>
                    <span className={styles.fieldHint}>
                      We&apos;ll only use this to reach you about your account.
                    </span>
                  </div>
                </div>

                {/* Row 2: Organization name (full width) */}
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

                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={creating}
                >
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
          </div>
        ) : (
          // ===== DASHBOARD =====
          <>
            <div className={styles.heroText}>
              <h1 className={styles.title}>Select a workspace</h1>
              <p className={styles.subtitle}>
                Pick an organization to continue, or start a new one.
              </p>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            {/* search + quick add */}
            <div className={styles.searchRow}>
              <div className={styles.searchBar}>
                <Search size={15} className={styles.searchIcon} />
                <input
                  className={styles.searchInput}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search organizations..."
                />
              </div>
              <button
                className={styles.addIconBtn}
                onClick={() => setShowCreateForm(true)}
                title="New organization"
                type="button"
              >
                <Plus size={18} />
              </button>
            </div>

            <div className={styles.scrollArea}>
              {/* Organizations — main column */}
              <div className={styles.mainCol}>
                <section className={styles.section}>
                  <div className={styles.sectionLabel}>
                    <Building2 size={12} />
                    Your Organizations
                  </div>

                  <div className={styles.orgList}>
                    {filteredOrganizations.map((org) => {
                      const role = getOrgRole(org);
                      const isOwner = role === "Owner" || role === "OWNER";

                      return (
                        <button
                          key={org.id}
                          className={styles.orgCardNeo}
                          onClick={() => handleSelect(org.id)}
                          disabled={isLoading || redirecting}
                        >
                          <div className={styles.orgIcon}>
                            {org.name.charAt(0).toUpperCase()}
                          </div>
                          <div className={styles.orgMeta}>
                            <span className={styles.orgName}>{org.name}</span>
                          </div>
                          {isOwner ? (
                            <span className={styles.badgeOwner}>
                              <Crown size={11} />
                              Owner
                            </span>
                          ) : (
                            <span className={styles.badgeMember}>Member</span>
                          )}
                          <ChevronRight
                            size={16}
                            className={styles.chevron}
                          />
                        </button>
                      );
                    })}

                    {filteredOrganizations.length === 0 && (
                      <div className={styles.emptyNote}>
                        {query
                          ? `No organizations match "${query}"`
                          : "No organizations yet"}
                      </div>
                    )}

                    <button
                      className={styles.addOrgCard}
                      onClick={() => setShowCreateForm(true)}
                    >
                      <Plus size={15} />
                      <span>New organization</span>
                    </button>
                  </div>
                </section>
              </div>

              {/* Invites + archived — side column */}
              {(hasInvites || hasArchived) && (
                <div className={styles.sideCol}>
                  {hasInvites && (
                    <section className={styles.section}>
                      <div className={styles.sectionLabel}>
                        <Mail size={12} />
                        Pending Invitations
                      </div>
                      <div className={styles.inviteList}>
                        {pendingInvites.map((invite) => (
                          <div key={invite.id} className={styles.inviteCard}>
                            <div className={styles.inviteTop}>
                              <div className={styles.inviteIcon}>
                                {invite.organization.name
                                  .charAt(0)
                                  .toUpperCase()}
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
                                <Check size={13} />
                                Accept
                              </button>
                              <button
                                className={styles.rejectBtn}
                                onClick={() => handleRejectInvite(invite.token)}
                              >
                                <X size={13} />
                                Decline
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {hasArchived && (
                    <section className={styles.section}>
                      <div className={styles.sectionLabel}>
                        <RefreshCw size={12} />
                        Archived
                      </div>
                      <div className={styles.inviteList}>
                        {archivedOrgs.map((org) => (
                          <div
                            key={org.id}
                            className={`${styles.inviteCard} ${styles.archivedCard}`}
                          >
                            <div className={styles.inviteTop}>
                              <div className={styles.inviteIcon}>
                                {org.name.charAt(0).toUpperCase()}
                              </div>
                              <div className={styles.inviteInfo}>
                                <span className={styles.inviteName}>
                                  {org.name}
                                </span>
                                <span className={styles.inviteBy}>
                                  Restore to regain access
                                </span>
                              </div>
                            </div>
                            <div className={styles.inviteActions}>
                              <button
                                className={styles.restoreBtn}
                                onClick={() =>
                                  handleRestoreOrganization(org.id)
                                }
                                disabled={restoring === org.id}
                              >
                                {restoring === org.id ? (
                                  <span className={styles.spinnerSmall} />
                                ) : (
                                  <RefreshCw size={13} />
                                )}
                                Restore
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* logout */}
        <button
          className={styles.logoutCorner}
          onClick={handleLogout}
          title="Log out"
          type="button"
        >
          <LogOut size={15} />
        </button>
      </div>
    </div>
  );
}