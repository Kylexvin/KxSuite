// src/app/dashboard/Sidebar.tsx

"use client";

import { useState, useEffect, useRef } from "react";
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
  ChevronDown,
  ChevronsLeft,
  LogOut,
  ShoppingBag,
  FileText,
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
    requiresOwner: true,
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
    href: "/dashboard/audit",
    label: "Audit Logs",
    icon: FileText,
    permission: "audit.logs.view",
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
    suiteContext,
    logout,
  } = useAuth();

  const [productsOpen, setProductsOpen] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

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
  // PRODUCT VISIBILITY
  // ============================================================

  const products = suiteContext?.products ?? [];

  const visibleProducts = products.filter((p) => {
    if (!p.isActive) return false;
    if (isOwner) return true;
    return permissions.some((perm) => perm.startsWith(`${p.key}.`));
  });

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

  // ============================================================
  // HANDLE CLICK OUTSIDE - ONLY FOR MOBILE
  // ============================================================

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isSmallScreen && 
          sidebarRef.current && 
          !sidebarRef.current.contains(event.target as Node) &&
          !collapsed) {
        setCollapsed(true);
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

  const handleLogout = () => {
    logout();
    router.push("/login");
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
    if (link.href === "/kx") {
      return showProductsTab;
    }

    if (link.requiresOwner && !isOwner) {
      return false;
    }

    return hasPermission(link.permission);
  });

  // ============================================================
  // RENDER
  // ============================================================

  const user = suiteContext?.user;

  const sidebarKey = `sidebar-${activeOrganization?.id}-${products.length}`;

  return (
    <aside 
      key={sidebarKey} 
      ref={sidebarRef}
      className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}
    >
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