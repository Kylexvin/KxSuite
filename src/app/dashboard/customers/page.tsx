// src/app/dashboard/customers/page.tsx

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Contact } from "lucide-react";
import { usePermissions } from "@/contexts/PermissionsContext";
import styles from "./page.module.css";

export default function CustomersPage() {
  const router = useRouter();
  const { isReady, hasPermission } = usePermissions();

  useEffect(() => {
    if (!isReady) return;
    if (!hasPermission("customers.view")) {
      router.replace("/dashboard");
    }
  }, [isReady, hasPermission, router]);

  if (!isReady) return null;
  if (!hasPermission("customers.view")) return null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Contact size={18} className={styles.headerIcon} />
        <h1 className={styles.title}>Customers</h1>
      </header>
      <p className={styles.subtitle}>
        View and manage your organization customers.
      </p>

      <div className={styles.placeholder}>
        Customers list coming soon.
      </div>
    </div>
  );
}