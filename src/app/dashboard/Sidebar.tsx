// src/app/dashboard/Sidebar.tsx

"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  Building2,
  FileText,
  CreditCard,
  Settings,
  ChevronDown,
  LogOut,
  ExternalLink,
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
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  {
    href: "/dashboard/marketplace",
    label: "Marketplace",
    icon: ShoppingBag,
    requiresOwner: true,
  },
  { href: "/kx", label: "Products", icon: Package },
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

export default function Sidebar({
  isMobile,
  onClose,
}: {
  isMobile: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { activeOrganization, suiteContext, logout } = useAuth();

  const isKxProduct = pathname.startsWith("/kx/") && pathname !== "/kx";

  const [productsOpen, setProductsOpen] = useState(isKxProduct ? true : true);

  const permissions = suiteContext?.permissions ?? [];
  const isOwner = permissions.includes("*");

  const hasPermission = (permission?: string): boolean => {
    if (!permission) return true;
    if (isOwner) return true;
    return permissions.includes(permission);
  };

  const products = suiteContext?.products ?? [];
  const visibleProducts = products.filter((p) => {
    if (!p.isActive) return false;
    if (isOwner) return true;
    return permissions.some((perm) => perm.startsWith(`${p.key}.`));
  });

  const showProductsTab = visibleProducts.length > 0 || isOwner;

  if (!activeOrganization) return null;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const closeIfMobile = () => {
    if (isMobile) onClose();
  };

  const handleNavClick = (href: string) => {
    router.push(href);
    closeIfMobile();
  };

  const handleProductClick = (href: string) => {
    router.push(href);
    closeIfMobile();
  };

  const handleVisitKxbyte = () => {
    window.open("https://kxbyte.co.ke", "_blank", "noopener,noreferrer");
  };

  const visibleLinks = NAV_LINKS.filter((link) => {
    if (link.href === "/kx") return showProductsTab;
    if (link.requiresOwner && !isOwner) return false;
    return hasPermission(link.permission);
  });

  const user = suiteContext?.user;

  return (
    <aside className={`${styles.sidebar} ${isMobile ? styles.mobile : ""}`}>
      {isMobile && <div className={styles.mobileSpacer} />}

      <nav className={styles.nav}>
        {visibleLinks.map((link) => {
          const Icon = link.icon;

          if (link.href === "/kx") {
            return (
              <div key={link.href}>
                <button
                  type="button"
                  className={`${styles.navLinkExpandable} ${
                    pathname === link.href || isKxProduct
                      ? styles.navLinkActive
                      : ""
                  }`}
                  onClick={() => setProductsOpen((v) => !v)}
                >
                  <span className={styles.navLinkExpandableLabel}>
                    <Icon size={16} className={styles.navIcon} />
                    <span className={styles.navLabel}>{link.label}</span>
                  </span>
                  <ChevronDown
                    size={13}
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
                          type="button"
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

          const isActive =
            link.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(link.href);

          return (
            <button
              key={link.href}
              type="button"
              className={isActive ? styles.navLinkActive : styles.navLink}
              onClick={() => handleNavClick(link.href)}
            >
              <Icon size={16} className={styles.navIcon} />
              <span className={styles.navLabel}>{link.label}</span>
            </button>
          );
        })}
      </nav>

      <div className={styles.spacer} />

      <div className={styles.divider} />

      <button
        type="button"
        className={styles.suiteRow}
        onClick={handleVisitKxbyte}
        title="Visit KXBYTE"
      >
        <ExternalLink size={15} />
        <span className={styles.navLabel}>Visit KXBYTE</span>
      </button>

      {user && (
        <button
          type="button"
          className={styles.profileRow}
          onClick={() => handleNavClick("/dashboard/profile")}
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

      <button
        type="button"
        className={styles.logoutRow}
        onClick={handleLogout}
        title="Logout"
      >
        <LogOut size={15} />
        <span className={styles.navLabel}>Logout</span>
      </button>
    </aside>
  );
}