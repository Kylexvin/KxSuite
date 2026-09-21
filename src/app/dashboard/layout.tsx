// src/app/dashboard/layout.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "./Sidebar";
import TopBar from "@/components/layout/TopBar";
import styles from "./layout.module.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, organizations, activeOrganization } = useAuth();

  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    if (isLoading) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (organizations.length === 0 || !activeOrganization) {
      router.push("/onboarding/select-organization");
      return;
    }
  }, [isMounted, isLoading, isAuthenticated, organizations, activeOrganization, router]);

  if (!isMounted || isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (!isAuthenticated || !activeOrganization) return null;

  return (
    <div className={styles.layout}>
      <TopBar
        isMobile={isMobile}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
      />

      {isMobile && sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`${styles.sidebarWrap} ${sidebarOpen ? styles.open : ""}`}
      >
        <Sidebar
          isMobile={isMobile}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      <div className={styles.contentWrap}>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}