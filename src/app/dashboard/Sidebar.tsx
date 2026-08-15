"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Package,
  Users,
  Building2,
  CreditCard,
  Settings,
  Store,
  ArrowUpDown,
  ChevronDown,
  ChevronsLeft,
  LogOut,
  Check,
  ShoppingBag,
  User,
  type LucideIcon,
} from "lucide-react";
import styles from "./Sidebar.module.css";



type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  permission?: string;
  requiresOwner?: boolean;
};

const NAV_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/dashboard/marketplace",
    label: "Marketplace",
    icon: ShoppingBag,
    requiresOwner: true, // Only owner can add products
  },
  {
    href: "/kx",
    label: "Products",
    icon: Package,
  },
  {
    href: "/dashboard/members",
    label: "Members",
    icon: Users,
    permission: "organizations.members.view",
  },
  {
    href: "/dashboard/branches",
    label: "Branches",
    icon: Building2,
    permission: "branches.view",
  },
  {
    href: "/dashboard/billing",
    label: "Billing",
    icon: CreditCard,
    permission: "subscriptions.view",
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: Settings,
    permission: "kxtill.settings.view",
  },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    activeOrganization,
    organizations,
    setActiveOrganization,
    suiteContext,
    logout,
    loadBranches,
  } = useAuth();

  const [orgMenuOpen, setOrgMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [switchingOrg, setSwitchingOrg] = useState(false);

  const orgMenuRef = useRef<HTMLDivElement>(null);

  const isSmallScreen = typeof window !== "undefined" && window.innerWidth <= 1024;

  // ============================================================
  // PERMISSION HELPERS
  // ============================================================

  const permissions = suiteContext?.permissions ?? [];
  const isOwner = permissions.includes("*");

  const hasPermission = (permission?: string): boolean => {
    if (!permission) return true;
    if (isOwner) return true;
    return permissions.includes(permission);
  };

  // ============================================================
  // PRODUCT VISIBILITY — show ONLY products user has permissions for
  // ============================================================

  const products = suiteContext?.products ?? [];

  const visibleProducts = products.filter((p) => {
    if (!p.isActive) return false;
    if (isOwner) return true;
    return permissions.some((perm) => perm.startsWith(`${p.key}.`));
  });

  // Products tab only shows if user has any visible products OR is owner
  const showProductsTab = visibleProducts.length > 0 || isOwner;

  // ============================================================
  // EFFECTS
  // ============================================================

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (orgMenuRef.current && !orgMenuRef.current.contains(event.target as Node)) {
        setOrgMenuOpen(false);
        if (isSmallScreen && !collapsed) {
          setTimeout(() => setCollapsed(true), 300);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSmallScreen, collapsed]);

  // ============================================================
  // HANDLERS
  // ============================================================

  if (!activeOrganization) return null;

  const isKxProduct = pathname.startsWith("/kx/") && pathname !== "/kx";

  const handleSwitchOrg = async (orgId: string) => {
    if (orgId === activeOrganization.id) {
      setOrgMenuOpen(false);
      if (isSmallScreen) {
        setTimeout(() => setCollapsed(true), 300);
      }
      return;
    }

    setSwitchingOrg(true);
    try {
      await setActiveOrganization(orgId);
      await loadBranches(orgId);
      setOrgMenuOpen(false);
      if (isSmallScreen) {
        setTimeout(() => setCollapsed(true), 300);
      }
      router.push("/dashboard");
    } catch (err) {
      console.error("Failed to switch organization:", err);
    } finally {
      setSwitchingOrg(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleOrgToggle = () => {
    if (collapsed && isSmallScreen) {
      setCollapsed(false);
      setTimeout(() => {
        setOrgMenuOpen((v) => !v);
      }, 300);
    } else {
      setOrgMenuOpen((v) => !v);
    }
  };

  const handleProductsToggle = () => {
    if (collapsed && isSmallScreen) {
      setCollapsed(false);
      setTimeout(() => {
        setProductsOpen((v) => !v);
      }, 300);
    } else {
      setProductsOpen((v) => !v);
    }
  };

  const handleProductClick = (href: string) => {
    router.push(href);
    if (isSmallScreen) {
      setTimeout(() => {
        setCollapsed(true);
        setProductsOpen(false);
      }, 300);
    }
  };

  const handleNavClick = (href: string) => {
    router.push(href);
    if (isSmallScreen) {
      setTimeout(() => {
        setCollapsed(true);
      }, 300);
    }
  };

  // ============================================================
  // FILTER NAV LINKS
  // ============================================================

  const visibleLinks = NAV_LINKS.filter((link) => {
    // Skip Products (/kx) - handled separately
    if (link.href === "/kx") {
      return showProductsTab;
    }

    // Marketplace requires owner
    if (link.requiresOwner && !isOwner) {
      return false;
    }

    // Check permission
    return hasPermission(link.permission);
  });

  // ============================================================
  // RENDER
  // ============================================================

  const user = suiteContext?.user;

  const sidebarKey = `sidebar-${activeOrganization?.id}-${products.length}`;

  return (
    <aside key={sidebarKey} className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      {/* Logo Row */}
      <div className={styles.logoRow}>
        <div className={styles.logoWrapper}>
          <Image
            src="/assets/logo.png"
            alt="KXBYTE Logo"
            width={32}
            height={32}
            className={styles.logoImage}
            priority
          />
          <span className={styles.logoText}>KXBYTE</span>
        </div>
        <button
          className={styles.collapseBtn}
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronsLeft size={14} color="currentColor" />
        </button>
      </div>

      {/* Organization Switcher */}
      <div className={styles.orgSwitcherWrap} ref={orgMenuRef}>
        <button
          className={styles.contextRow}
          onClick={handleOrgToggle}
          disabled={switchingOrg}
          title={switchingOrg ? "Switching..." : "Switch organization"}
        >
          <span className={styles.contextIcon}>
            {activeOrganization.name.charAt(0).toUpperCase()}
          </span>
          <span className={styles.contextText}>
            <span className={styles.contextLabel}>
              {switchingOrg ? "Switching..." : "Organization"}
            </span>
            <span className={styles.contextValue}>
              {switchingOrg ? "Please wait..." : activeOrganization.name}
            </span>
          </span>
          <ArrowUpDown size={13} color="currentColor" className={styles.toggleIcon} />
        </button>

        {orgMenuOpen && !switchingOrg && (
          <div className={styles.orgPopover}>
            <div className={styles.orgPopoverHeader}>
              <span>Switch Organization</span>
            </div>
            <div className={styles.orgPopoverList}>
              {organizations.map((org) => {
                const isActive = org.id === activeOrganization.id;
                return (
                  <button
                    key={org.id}
                    className={`${styles.orgOption} ${isActive ? styles.orgOptionActive : ""}`}
                    onClick={() => handleSwitchOrg(org.id)}
                  >
                    <div className={styles.orgOptionIcon}>
                      {org.name.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.orgOptionText}>
                      <span className={styles.orgOptionName}>{org.name}</span>
                    </div>
                    {isActive && <Check size={16} className={styles.orgOptionCheck} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className={styles.divider} />

      {/* Navigation */}
      <nav className={styles.nav}>
        {visibleLinks.map((link) => {
          const Icon = link.icon;

          if (link.href === "/kx") {
            return (
              <div key={link.href}>
                <button
                  className={`${styles.navLinkExpandable} ${
                    pathname === link.href || isKxProduct ? styles.navLinkActive : ""
                  }`}
                  onClick={handleProductsToggle}
                  title={link.label}
                >
                  <span className={styles.navLinkExpandableLabel}>
                    <Icon size={16} color="currentColor" className={styles.navIcon} />
                    <span className={styles.navLabel}>{link.label}</span>
                  </span>
                  <ChevronDown
                    size={13}
                    color="currentColor"
                    className={styles.chevron}
                    data-open={productsOpen}
                  />
                </button>

                {productsOpen && visibleProducts.length > 0 && (
                  <div className={styles.subNav}>
                    {visibleProducts.map((product) => {
                      const href = `/kx/${product.key}`;
                      return (
                        <button
                          key={product.key}
                          className={`${styles.subLink} ${
                            pathname === href ? styles.subLinkActive : ""
                          }`}
                          onClick={() => handleProductClick(href)}
                        >
                          {product.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={link.href}
              className={
                pathname === link.href ? styles.navLinkActive : styles.navLink
              }
              onClick={() => handleNavClick(link.href)}
              title={link.label}
            >
              <Icon size={16} color="currentColor" className={styles.navIcon} />
              <span className={styles.navLabel}>{link.label}</span>
            </button>
          );
        })}
      </nav>

      <div className={styles.spacer} />

      {/* Profile & Logout */}
      <div className={styles.divider} />

      {user && (
        <button
          className={styles.profileRow}
          onClick={() => router.push("/dashboard/profile")}
          title="My Profile"
        >
          <div className={styles.avatar}>
            {user.firstName?.charAt(0) || "U"}
          </div>
          <span className={styles.navLabel}>
            {user.firstName} {user.lastName}
          </span>
        </button>
      )}

      <button className={styles.logoutRow} onClick={handleLogout} title="Logout">
        <LogOut size={15} color="currentColor" />
        <span className={styles.navLabel}>Logout</span>
      </button>
      
    </aside>
  );
}