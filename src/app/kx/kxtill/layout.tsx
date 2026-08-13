// app/kx/kxtill/layout.tsx

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import KxTillSidebar from "./components/KxTillSidebar";
import TopBar from "@/components/layout/TopBar";
import styles from "./layout.module.css";

export default function KxTillLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, organizations, activeOrganization } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (organizations.length === 0 || !activeOrganization) {
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
      <KxTillSidebar />
      <div className={styles.main}>
        <TopBar />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}