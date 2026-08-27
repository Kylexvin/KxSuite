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

} from "lucide-react";
import styles from "../styles/KxTillSidebar.module.css";





export default function KxTillSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { suiteContext, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(true);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const isSmallScreen = typeof window !== "undefined" && window.innerWidth <= 1024;

  const permissions = suiteContext?.permissions ?? [];
  const isOwner = permissions.includes("*");



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
    if (collapsed && isSmallScreen) {
      setCollapsed(false);
      setTimeout(() => {
        setInventoryOpen((v) => !v);
      }, 300);
    } else {
      setInventoryOpen((v) => !v);
    }
  };



  const isInventoryActive = () => {
    return pathname.startsWith("/kx/kxtill/inventory");
  };


  return (
    <aside 
      ref={sidebarRef}
      className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}
    >
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

      <nav className={styles.nav}>
        {/* Overview */}
        <button
          className={pathname === "/kx/kxtill" ? styles.navLinkActive : styles.navLink}
          onClick={() => handleNavClick("/kx/kxtill")}
          title="Overview"
        >
          <LayoutDashboard size={16} color="currentColor" className={styles.navIcon} />
          <span className={styles.navLabel}>Overview</span>
        </button>

        {/* Sales */}
        <button
          className={pathname === "/kx/kxtill/sales" ? styles.navLinkActive : styles.navLink}
          onClick={() => handleNavClick("/kx/kxtill/sales")}
          title="Sales"
        >
          <ShoppingCart size={16} color="currentColor" className={styles.navIcon} />
          <span className={styles.navLabel}>Sales</span>
        </button>

        {/* Refunds */}
        <button
          className={pathname === "/kx/kxtill/refunds" ? styles.navLinkActive : styles.navLink}
          onClick={() => handleNavClick("/kx/kxtill/refunds")}
          title="Refunds"
        >
          <ArrowLeft size={16} color="currentColor" className={styles.navIcon} />
          <span className={styles.navLabel}>Refunds</span>
        </button>

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

        {/* Reports */}
        <button
          className={pathname === "/kx/kxtill/reports" ? styles.navLinkActive : styles.navLink}
          onClick={() => handleNavClick("/kx/kxtill/reports")}
          title="Reports"
        >
          <FileText size={16} color="currentColor" className={styles.navIcon} />
          <span className={styles.navLabel}>Reports</span>
        </button>

        {/* Settings */}
        <button
          className={pathname === "/kx/kxtill/settings" ? styles.navLinkActive : styles.navLink}
          onClick={() => handleNavClick("/kx/kxtill/settings")}
          title="Settings"
        >
          <Settings size={16} color="currentColor" className={styles.navIcon} />
          <span className={styles.navLabel}>Settings</span>
        </button>

        {/* Staff - Owner only */}
        {isOwner && (
          <button
            className={pathname === "/kx/kxtill/staff" ? styles.navLinkActive : styles.navLink}
            onClick={() => handleNavClick("/kx/kxtill/staff")}
            title="Staff"
          >
            <Users size={16} color="currentColor" className={styles.navIcon} />
            <span className={styles.navLabel}>Staff</span>
          </button>
        )}
      </nav>

      <div className={styles.spacer} />

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