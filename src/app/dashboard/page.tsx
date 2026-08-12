// src/app/dashboard/page.tsx

"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./page.module.css";

// Static bits per product that the API doesn't need to send —
// where "Open <Product>" hands off to (a separate deployed app) and
// the tagline. Everything else (isActive, subscriptionStatus, name)
// comes from suiteContext.products.
const PRODUCT_META: Record<string, { tagline: string; appUrl: string }> = {
  kxtill: { tagline: "POS & Sales", appUrl: "https://kxtill.kxbyte.co.ke" },
  kxinvoice: { tagline: "Invoicing", appUrl: "https://kxinvoice.kxbyte.co.ke" },
  kxcrm: { tagline: "Customer Management", appUrl: "https://kxcrm.kxbyte.co.ke" },
};

export default function SuiteHomePage() {
  const { user, activeOrganization, activeBranch, suiteContext } = useAuth();

  const products = suiteContext?.products ?? [];

  const handleOpenProduct = (productKey: string) => {
    if (!activeOrganization) return;
    const meta = PRODUCT_META[productKey];
    if (!meta) return;

    const params = new URLSearchParams({ organizationId: activeOrganization.id });
    if (activeBranch) params.set("branchId", activeBranch.id);
    window.location.href = `${meta.appUrl}/auth/sso?${params.toString()}`;
  };

  return (
    <div className={styles.home}>
      <h1 className={styles.welcome}>Welcome back, {user?.firstName}</h1>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Your Products</h2>

        <div className={styles.productGrid}>
          {products.map((product) => {
            const meta = PRODUCT_META[product.key];
            const active = product.isActive && product.subscriptionIsActive;

            return (
              <div
                key={product.key}
                className={active ? styles.productCard : styles.productCardSoon}
              >
                <div className={styles.productTop}>
                  <h3>{product.name}</h3>
                  <span className={active ? styles.badgeLive : styles.badgeSoon}>
                    {active ? product.subscriptionStatus : "Not activated"}
                  </span>
                </div>
                <p className={styles.productTagline}>
                  {meta?.tagline ?? product.description}
                </p>

                <div className={styles.productActions}>
                  {active ? (
                    <>
                      <Link
                        href={`/dashboard/products/${product.key}`}
                        className={styles.overviewBtn}
                      >
                        Overview
                      </Link>
                      <button
                        className={styles.openBtn}
                        onClick={() => handleOpenProduct(product.key)}
                      >
                        Open {product.name} →
                      </button>
                    </>
                  ) : (
                    <span className={styles.notifyBtn}>Not available</span>
                  )}
                </div>
              </div>
            );
          })}

          {products.length === 0 && (
            <p className={styles.loadingText}>No products activated yet.</p>
          )}
        </div>

        {suiteContext && suiteContext.lowStockCount > 0 && (
          <p className={styles.lowStockNote}>
            {suiteContext.lowStockCount} item{suiteContext.lowStockCount === 1 ? "" : "s"} low
            on stock —{" "}
            <Link href="/dashboard/products/kxtill" className={styles.lowStockLink}>
              view in KxTill overview
            </Link>
          </p>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Organization</h2>
        <div className={styles.quickLinks}>
          <Link href="/dashboard/members" className={styles.quickLink}>
            Members
          </Link>
          <Link href="/dashboard/branches" className={styles.quickLink}>
            Branches
          </Link>
          <Link href="/dashboard/billing" className={styles.quickLink}>
            Billing
          </Link>
          <Link href="/dashboard/settings" className={styles.quickLink}>
            Settings
          </Link>
        </div>
      </section>
    </div>
  );
}