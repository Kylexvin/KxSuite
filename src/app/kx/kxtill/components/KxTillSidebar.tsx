// app/kx/kxtill/components/KxTillSidebar.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  ShoppingCart,
  ArrowLeft,
  Package,
  FileText,
  Settings,
  Users,
  LogOut,
  ChevronsLeft,
  ChevronDown,

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
  { href: "/kx/kxtill", label: "Overview", icon: LayoutDashboard },
  { href: "/kx/kxtill/sales", label: "Sales", icon: ShoppingCart, permission: "kxtill.sales.view" },
  { href: "/kx/kxtill/refunds", label: "Refunds", icon: ArrowLeft, permission: "kxtill.sales.view" },
  { href: "/kx/kxtill/reports", label: "Reports", icon: FileText, permission: "kxtill.reports.view" },
  { href: "/kx/kxtill/settings", label: "Settings", icon: Settings, permission: "kxtill.settings.view" },
  { href: "/kx/kxtill/staff", label: "Staff", icon: Users, requiresOwner: true },
];

export default function KxTillSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { suiteContext, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(true);
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
  // AUTO-COLLAPSE ON SMALL SCREENS
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

  const handleNavClick = (href: string) => {
    router.push(href);
    if (isSmallScreen) {
      setTimeout(() => {
        setCollapsed(true);
        setInventoryOpen(false);
      }, 300);
    }
  };

  const handleBackToSuite = () => {
    router.push("/dashboard");
    if (isSmallScreen) {
      setTimeout(() => {
        setCollapsed(true);
      }, 300);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleInventoryToggle = () => {
    // If collapsed on small screen, expand first then toggle
    if (collapsed && isSmallScreen) {
      setCollapsed(false);
      setTimeout(() => {
        setInventoryOpen((v) => !v);
      }, 300);
    } else {
      setInventoryOpen((v) => !v);
    }
  };

  const isLinkActive = (href: string) => {
    if (href === "/kx/kxtill") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const isInventoryActive = () => {
    return pathname.startsWith("/kx/kxtill/inventory");
  };

  // ============================================================
  // FILTER NAV LINKS
  // ============================================================

  const visibleLinks = NAV_LINKS.filter((link) => {
    if (link.requiresOwner && !isOwner) return false;
    return hasPermission(link.permission);
  });

  // ============================================================
  // RENDER
  // ============================================================


  return (
    <aside 
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
          <span className={styles.logoText}>KxTill</span>
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
          const isActive = isLinkActive(link.href);

          return (
            <button
              key={link.href}
              className={isActive ? styles.navLinkActive : styles.navLink}
              onClick={() => handleNavClick(link.href)}
              title={link.label}
            >
              <Icon size={16} color="currentColor" className={styles.navIcon} />
              <span className={styles.navLabel}>{link.label}</span>
            </button>
          );
        })}

        {/* Inventory - Expandable */}
        <div>
          <button
            className={`${styles.navLinkExpandable} ${isInventoryActive() ? styles.navLinkActive : ""}`}
            onClick={handleInventoryToggle}
            title="Inventory"
          >
            <span className={styles.navLinkExpandableLabel}>
              <Package size={16} color="currentColor" className={styles.navIcon} />
              <span className={styles.navLabel}>Inventory</span>
            </span>
            <ChevronDown
              size={13}
              color="currentColor"
              className={styles.chevron}
              data-open={inventoryOpen}
            />
          </button>

          {inventoryOpen && (
            <div className={styles.subNav}>
              <button
                className={pathname === "/kx/kxtill/inventory" ? styles.subLinkActive : styles.subLink}
                onClick={() => handleNavClick("/kx/kxtill/inventory")}
              >
                Overview
              </button>
              <button
                className={pathname === "/kx/kxtill/inventory/transfers" ? styles.subLinkActive : styles.subLink}
                onClick={() => handleNavClick("/kx/kxtill/inventory/transfers")}
              >
                Stock Transfers
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className={styles.spacer} />

      {/* Profile & Logout */}
      <div className={styles.divider} />


      <button
        className={styles.backToSuiteRow}
        onClick={handleBackToSuite}
        title="Back to KXBYTE Suite"
      >
        <ArrowLeft size={15} color="currentColor" />
        <span className={styles.navLabel}>Back to Suite</span>
      </button>

      <button className={styles.logoutRow} onClick={handleLogout} title="Logout">
        <LogOut size={15} color="currentColor" />
        <span className={styles.navLabel}>Logout</span>
      </button>
    </aside>
  );
}