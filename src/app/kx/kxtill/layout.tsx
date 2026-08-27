// app/kx/kxtill/layout.tsx

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import KxTillSidebar from "./components/KxTillSidebar";
import KxTillTopBar from "./components/KxTillTopBar";
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

  // Show loader while loading
  if (isLoading) {
    return (
      <div className={styles.layout}>
        <div className={styles.main}>
          <div className={styles.content}>
            <div className={styles.loaderWrapper}>
              <div className={styles.loader} />
            </div>
          </div>
        </div>
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
        <KxTillTopBar />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}