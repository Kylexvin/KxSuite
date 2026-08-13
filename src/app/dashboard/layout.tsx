// dashboard/layout.tsx

"use client";

import { useEffect } from "react";
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
  const { isAuthenticated, isLoading, organizations, activeOrganization, user, accessToken } = useAuth();

  // Debug
  console.log('DashboardLayout - isAuthenticated:', isAuthenticated);
  console.log('DashboardLayout - isLoading:', isLoading);
  console.log('DashboardLayout - user:', user);
  console.log('DashboardLayout - accessToken:', accessToken);
  console.log('DashboardLayout - organizations:', organizations);
  console.log('DashboardLayout - activeOrganization:', activeOrganization);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      console.log('Redirecting to login - not authenticated');
      router.push("/login");
      return;
    }

    if (organizations.length === 0 || !activeOrganization) {
      console.log('Redirecting to select organization - no orgs or active org');
      router.push("/onboarding/select-organization");
      return;
    }
  }, [isLoading, isAuthenticated, organizations, activeOrganization, router]);

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (!isAuthenticated || !activeOrganization) {
    return null;
  }

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.main}>
        <TopBar />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}