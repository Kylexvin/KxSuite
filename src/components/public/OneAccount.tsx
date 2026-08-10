"use client";

import styles from "./OneAccount.module.css";

const products = [
  { name: "KxTill", ready: true },
  { name: "KxInvoice", ready: false },
  { name: "KxCRM", ready: false },
];

const capabilities = [
  { label: "Identity", detail: "One secure account" },
  { label: "Organization", detail: "One business workspace" },
  { label: "Billing", detail: "One place to manage subscriptions" },
  { label: "Security", detail: "Roles, permissions & audit logs" },
];

export default function OneAccount() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.heading}>
          <h2>Everything connected.</h2>
          <p>One account brings your business, organization, and KXBYTE products together.</p>
        </div>

        <div className={styles.orgCard}>
          <div className={styles.orgCardTop}>
            <span className={styles.orgLabel}>Your organization</span>
            <span className={styles.liveBadge}>Connected</span>
          </div>
          <h3 className={styles.orgName}>Acme Stores</h3>

          <div className={styles.productList}>
            {products.map((p) => (
              <div key={p.name} className={styles.productRow}>
                <span
                  className={p.ready ? styles.productDot : styles.productDotMuted}
                />
                <span className={styles.productName}>{p.name}</span>
                <span className={p.ready ? styles.liveBadge : styles.soonBadge}>
                  {p.ready ? "Active" : "Coming soon"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.grid}>
          {capabilities.map((c) => (
            <div key={c.label} className={styles.capabilityCard}>
              <h3>{c.label}</h3>
              <p>{c.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}