// app/kx/kxtill/components/KxTillSidebar.tsx

"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  ShoppingCart,
  ArrowLeft,
  Package,
  ClipboardList,
  FileText,
  Settings,
  Building2,
  Users,
  LogOut,
  ChevronsLeft,
  type LucideIcon,
} from "lucide-react";
import styles from "../styles/KxTillSidebar.module.css";

type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  permission?: string;
  requiresOwner?: boolean;
};

const NAV_LINKS: NavLink[] = [
  // Always visible
  { href: "/kx/kxtill", label: "Overview", icon: LayoutDashboard },
  { href: "/kx/kxtill/sales", label: "Sales", icon: ShoppingCart, permission: "kxtill.sales.view" },
  { href: "/kx/kxtill/returns", label: "Returns", icon: ArrowLeft, permission: "kxtill.sales.view" },
  
  // Inventory section - renamed from "Products" to "Inventory"
  { href: "/kx/kxtill/inventory", label: "Inventory", icon: Package, permission: "kxtill.inventory.view" },
  { href: "/kx/kxtill/stock", label: "Stock", icon: ClipboardList, permission: "kxtill.inventory.view" },
  
  { href: "/kx/kxtill/reports", label: "Reports", icon: FileText, permission: "kxtill.reports.view" },
  { href: "/kx/kxtill/settings", label: "Settings", icon: Settings, permission: "kxtill.settings.view" },
  
  // Owner only
  { href: "/kx/kxtill/branches", label: "Branches", icon: Building2, requiresOwner: true },
  { href: "/kx/kxtill/staff", label: "Staff", icon: Users, requiresOwner: true },
];

export default function KxTillSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { suiteContext, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

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
  // HANDLERS
  // ============================================================

  const handleNavClick = (href: string) => {
    router.push(href);
  };

  const handleBackToSuite = () => {
    router.push("/dashboard");
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const isLinkActive = (href: string) => {
    if (href === "/kx/kxtill") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  // ============================================================
  // FILTER NAV LINKS
  // ============================================================

  const visibleLinks = NAV_LINKS.filter((link) => {
    if (link.requiresOwner && !isOwner) {
      return false;
    }
    return hasPermission(link.permission);
  });

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      {/* Logo */}
      <div className={styles.logoRow}>
        <div className={styles.logoWrapper}>
          <Image
            src="/assets/logo.png"
            alt="KXBYTE"
            width={32}
            height={32}
            className={styles.logoImage}
            priority
          />
          <span className={styles.logoText}>KxTill</span>
        </div>
        <button
          className={styles.collapseBtn}
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? "Expand" : "Collapse"}
        >
          <ChevronsLeft size={14} />
        </button>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        {visibleLinks.map((link) => {
          const Icon = link.icon;
          const isActive = isLinkActive(link.href);
          return (
            <button
              key={link.href}
              className={isActive ? styles.navLinkActive : styles.navLink}
              onClick={() => handleNavClick(link.href)}
              title={link.label}
            >
              <Icon size={16} className={styles.navIcon} />
              <span className={styles.navLabel}>{link.label}</span>
            </button>
          );
        })}
      </nav>

      <div className={styles.spacer} />

      {/* Divider */}
      <div className={styles.divider} />

      {/* Back to Suite */}
      <button
        className={styles.backToSuiteRow}
        onClick={handleBackToSuite}
        title="Back to KXBYTE Suite"
      >
        <ArrowLeft size={15} />
        <span className={styles.navLabel}>Back to Suite</span>
      </button>

      {/* Logout */}
      <button className={styles.logoutRow} onClick={handleLogout} title="Logout">
        <LogOut size={15} />
        <span className={styles.navLabel}>Logout</span>
      </button>
    </aside>
  );
}