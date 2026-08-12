"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./layout.module.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [orgName, setOrgName] = useState("");

  // Load org name from localStorage
  useEffect(() => {
    const storedOrgs = localStorage.getItem("organizations");
    if (storedOrgs) {
      try {
        const orgs = JSON.parse(storedOrgs);
        if (Array.isArray(orgs) && orgs.length > 0) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setOrgName(orgs[0]?.name || "");
        }
      } catch {
        // ignore
      }
    }
  }, []);

  // Strict auth + organization check
  useEffect(() => {
    if (!isLoading) {
      // Not authenticated → login
      if (!isAuthenticated) {
        router.push("/login");
        return;
      }

      // Check if user has organizations
      const storedOrgs = localStorage.getItem("organizations");
      if (storedOrgs) {
        try {
          const orgs = JSON.parse(storedOrgs);
          // No organizations → onboarding
          if (!Array.isArray(orgs) || orgs.length === 0) {
            router.push("/onboarding/organization");
            return;
          }
        } catch {
          router.push("/onboarding/organization");
          return;
        }
      } else {
        // No organizations in localStorage → onboarding
        router.push("/onboarding/organization");
        return;
      }
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarBrand}>
          <span>KXBYTE Suite</span>
        </div>
        <nav className={styles.sidebarNav}>
          <a href="/dashboard" className={styles.sidebarLinkActive}>Dashboard</a>
          <a href="/dashboard/products" className={styles.sidebarLink}>Products</a>
          <a href="/dashboard/organizations" className={styles.sidebarLink}>Organizations</a>
          <a href="/dashboard/members" className={styles.sidebarLink}>Members</a>
          <a href="/dashboard/billing" className={styles.sidebarLink}>Billing</a>
          <a href="/dashboard/settings" className={styles.sidebarLink}>Settings</a>
        </nav>
        <div className={styles.sidebarFooter}>
          <button className={styles.logoutBtn}>Logout</button>
        </div>
      </aside>
      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <h1>Dashboard</h1>
          </div>
          <div className={styles.headerRight}>
            {orgName && <span className={styles.orgBadge}>{orgName}</span>}
            <span className={styles.userName}>
              {user?.firstName} {user?.lastName}
            </span>
          </div>
        </header>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}