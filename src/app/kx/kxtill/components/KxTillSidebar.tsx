// app/kx/kxtill/components/KxTillSidebar.tsx

"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Package,
  Users,
  Settings,
  LogOut,
  ChevronsLeft,
  ShoppingCart,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import styles from "../styles/KxTillSidebar.module.css";

const APP_VERSION = "v1.0.0";

type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const NAV_LINKS: NavLink[] = [
  { href: "/kx/kxtill", label: "Dashboard", icon: LayoutDashboard },
  { href: "/kx/kxtill/pos", label: "POS", icon: ShoppingCart },
  { href: "/kx/kxtill/inventory", label: "Inventory", icon: Package },
  { href: "/kx/kxtill/reports", label: "Reports", icon: BarChart3 },
  { href: "/kx/kxtill/settings", label: "Settings", icon: Settings },
];

export default function KxTillSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const handleNavClick = (href: string) => {
    router.push(href);
  };

  const handleLogout = () => {
    // Clear auth and redirect
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    router.push("/login");
  };

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
        {NAV_LINKS.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
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

      {/* Logout */}
      <button className={styles.logoutRow} onClick={handleLogout} title="Logout">
        <LogOut size={15} />
        <span className={styles.navLabel}>Logout</span>
      </button>
      <span className={styles.version}>{APP_VERSION}</span>
    </aside>
  );
}