// src/app/dashboard/support/page.tsx

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LifeBuoy } from "lucide-react";
import { usePermissions } from "@/contexts/PermissionsContext";
import styles from "./page.module.css";

export default function SupportPage() {
  const router = useRouter();
  const { isReady, hasPermission } = usePermissions();

  useEffect(() => {
    if (!isReady) return;
    if (!hasPermission("support.tickets.view")) {
      router.replace("/dashboard");
    }
  }, [isReady, hasPermission, router]);

  if (!isReady) return null;
  if (!hasPermission("support.tickets.view")) return null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <LifeBuoy size={18} className={styles.headerIcon} />
        <h1 className={styles.title}>Support</h1>
      </header>
      <p className={styles.subtitle}>
        View and manage your support tickets.
      </p>

      <div className={styles.placeholder}>
        Support tickets coming soon.
      </div>
    </div>
  );
}