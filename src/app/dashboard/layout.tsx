// src/app/dashboard/layout.tsx

"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth, SuiteProduct } from "@/contexts/AuthContext";
import styles from "./layout.module.css";

type NavLink = {
  href: string;
  label: string;
  // Omit for links visible to anyone with an active org. Present when
  // visibility genuinely depends on suite context.
  show?: (ctx: { isOwner: boolean; products: SuiteProduct[] }) => boolean;
};

const NAV_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Home" },
  {
    href: "/dashboard/products",
    label: "Products",
    show: ({ products }) => products.length > 0,
  },
  // Members/Branches/Billing are owner-managed actions in the backend
  // (branch.service.js throws "Only the organization owner can..." for
  // all of these) — gated the same way here. Settings stays open to
  // everyone; the page itself can restrict individual controls.
  {
    href: "/dashboard/members",
    label: "Members",
    show: ({ isOwner }) => isOwner,
  },
  {
    href: "/dashboard/branches",
    label: "Branches",
    show: ({ isOwner }) => isOwner,
  },
  {
    href: "/dashboard/billing",
    label: "Billing",
    show: ({ isOwner }) => isOwner,
  },
  { href: "/dashboard/settings", label: "Settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    user,
    isAuthenticated,
    isLoading,
    organizations,
    activeOrganization,
    branches,
    activeBranch,
    setActiveBranch,
    suiteContext,
    logout,
  } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (organizations.length === 0 || !activeOrganization) {
      router.push("/onboarding/select-organization");
      return;
    }
  }, [isLoading, isAuthenticated, organizations, activeOrganization, router]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === "ALL") {
      setActiveBranch(null);
      return;
    }
    const branch = branches.find((b) => b.id === e.target.value);
    if (branch) setActiveBranch(branch);
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (!isAuthenticated || !activeOrganization) {
    return null;
  }

  const products = suiteContext?.products ?? [];
  const activeProducts = products.filter((p) => p.isActive && p.subscriptionIsActive);

  // HEURISTIC — /me/dashboard doesn't return an explicit role name, only
  // membership.roleId (null for Vinny, the owner, in the sample payload).
  // Treating roleId === null as "owner" until that's confirmed against
  // your actual role schema. If a custom role can also have a null
  // roleId, this needs a real signal instead (e.g. an isOwner flag from
  // the API, or comparing against organization.ownerId).
  const isOwner = suiteContext?.membership.roleId === null;
  const roleLabel = isOwner ? "Owner" : "Member";

  const visibleLinks = NAV_LINKS.filter(
    (link) => !link.show || link.show({ isOwner, products })
  );

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarBrand}>
          <span>
            KXBYTE <span className={styles.brandSuite}>Suite</span>
          </span>
        </div>

        <nav className={styles.sidebarNav}>
          {visibleLinks.map((link) => (
            <div key={link.href}>
              <a
                href={link.href}
                className={
                  pathname === link.href ? styles.sidebarLinkActive : styles.sidebarLink
                }
              >
                {link.label}
                {link.href === "/dashboard/products" &&
                  suiteContext &&
                  suiteContext.lowStockCount > 0 && (
                    <span className={styles.navBadge}>{suiteContext.lowStockCount}</span>
                  )}
              </a>

              {/* Data-driven sub-nav: only products this membership
                  actually has active show up here — nothing hardcoded. */}
              {link.href === "/dashboard/products" && activeProducts.length > 0 && (
                <div className={styles.sidebarSubNav}>
                  {activeProducts.map((product) => (
                    <a
                      key={product.key}
                      href={`/dashboard/products/${product.key}`}
                      className={
                        pathname === `/dashboard/products/${product.key}`
                          ? styles.sidebarSubLinkActive
                          : styles.sidebarSubLink
                      }
                    >
                      {product.name}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerContext}>
            <span className={styles.contextLabel}>Organization</span>
            <span className={styles.contextValue}>{activeOrganization.name}</span>
          </div>

          <div className={styles.headerContext}>
            <span className={styles.contextLabel}>Branch</span>
            {branches.length > 1 ? (
              <select
                className={styles.branchDropdown}
                value={activeBranch?.id || "ALL"}
                onChange={handleBranchChange}
              >
                <option value="ALL">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className={styles.contextValue}>
                {branches[0]?.name || "—"}
              </span>
            )}
          </div>

          <div className={styles.headerRight}>
            <span className={styles.userName}>
              {user?.firstName} {user?.lastName}
            </span>
            {suiteContext && (
              <span className={isOwner ? styles.roleBadgeOwner : styles.roleBadge}>
                {roleLabel}
              </span>
            )}
          </div>
        </header>

        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}