// src/app/kx/kxtill/components/KxTillSidebar.tsx

"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
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
  ChevronDown,
} from "lucide-react";
import styles from "../styles/KxTillSidebar.module.css";

export default function KxTillSidebar({
  isMobile,
  onClose,
}: {
  isMobile: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { suiteContext, logout } = useAuth();

  const [inventoryMenuOpen, setInventoryMenuOpen] = useState(true);

  const permissions = suiteContext?.permissions ?? [];
  const isOwner = permissions.includes("*");
  const inventoryOpen = pathname.startsWith("/kx/kxtill/inventory") || inventoryMenuOpen;

  const closeIfMobile = () => {
    if (isMobile) onClose();
  };

  const handleNavClick = (href: string) => {
    router.push(href);
    closeIfMobile();
  };

  const handleBackToSuite = () => {
    router.push("/dashboard");
    closeIfMobile();
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const isInventoryActive = pathname.startsWith("/kx/kxtill/inventory");

  return (
    <aside className={`${styles.sidebar} ${isMobile ? styles.mobile : ""}`}>
      {isMobile && <div className={styles.mobileSpacer} />}

      <nav className={styles.nav}>
        <button
          className={pathname === "/kx/kxtill" ? styles.navLinkActive : styles.navLink}
          onClick={() => handleNavClick("/kx/kxtill")}
          title="Overview"
          type="button"
        >
          <LayoutDashboard size={16} className={styles.navIcon} />
          <span className={styles.navLabel}>Overview</span>
        </button>

        <button
          className={pathname === "/kx/kxtill/sales" ? styles.navLinkActive : styles.navLink}
          onClick={() => handleNavClick("/kx/kxtill/sales")}
          title="Sales"
          type="button"
        >
          <ShoppingCart size={16} className={styles.navIcon} />
          <span className={styles.navLabel}>Sales</span>
        </button>

        <button
          className={pathname === "/kx/kxtill/refunds" ? styles.navLinkActive : styles.navLink}
          onClick={() => handleNavClick("/kx/kxtill/refunds")}
          title="Refunds"
          type="button"
        >
          <ArrowLeft size={16} className={styles.navIcon} />
          <span className={styles.navLabel}>Refunds</span>
        </button>

        <div>
          <button
            className={`${styles.navLinkExpandable} ${isInventoryActive ? styles.navLinkActive : ""}`}
            onClick={() => setInventoryMenuOpen((v) => !v)}
            title="Inventory"
            type="button"
          >
            <span className={styles.navLinkExpandableLabel}>
              <Package size={16} className={styles.navIcon} />
              <span className={styles.navLabel}>Inventory</span>
            </span>
            <ChevronDown
              size={13}
              className={styles.chevron}
              data-open={inventoryOpen}
            />
          </button>

          {inventoryOpen && (
            <div className={styles.subNav}>
              <button
                className={pathname === "/kx/kxtill/inventory" ? styles.subLinkActive : styles.subLink}
                onClick={() => handleNavClick("/kx/kxtill/inventory")}
                type="button"
              >
                Overview
              </button>
              <button
                className={pathname === "/kx/kxtill/inventory/transfers" ? styles.subLinkActive : styles.subLink}
                onClick={() => handleNavClick("/kx/kxtill/inventory/transfers")}
                type="button"
              >
                Stock Transfers
              </button>
            </div>
          )}
        </div>

        <button
          className={pathname === "/kx/kxtill/reports" ? styles.navLinkActive : styles.navLink}
          onClick={() => handleNavClick("/kx/kxtill/reports")}
          title="Reports"
          type="button"
        >
          <FileText size={16} className={styles.navIcon} />
          <span className={styles.navLabel}>Reports</span>
        </button>

        <button
          className={pathname === "/kx/kxtill/settings" ? styles.navLinkActive : styles.navLink}
          onClick={() => handleNavClick("/kx/kxtill/settings")}
          title="Settings"
          type="button"
        >
          <Settings size={16} className={styles.navIcon} />
          <span className={styles.navLabel}>Settings</span>
        </button>

        {isOwner && (
          <button
            className={pathname === "/kx/kxtill/staff" ? styles.navLinkActive : styles.navLink}
            onClick={() => handleNavClick("/kx/kxtill/staff")}
            title="Staff"
            type="button"
          >
            <Users size={16} className={styles.navIcon} />
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
        type="button"
      >
        <ArrowLeft size={15} />
        <span className={styles.navLabel}>Back to Suite</span>
      </button>

      <button
        className={styles.logoutRow}
        onClick={handleLogout}
        title="Logout"
        type="button"
      >
        <LogOut size={15} />
        <span className={styles.navLabel}>Logout</span>
      </button>
    </aside>
  );
}