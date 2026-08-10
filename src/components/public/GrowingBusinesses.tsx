"use client";

import styles from "./GrowingBusinesses.module.css";

const stages = [
  {
    stage: "Start",
    name: "KxTill",
    tagline: "POS · Inventory · Sales",
    ready: true,
  },
  {
    stage: "Grow",
    name: "KxInvoice",
    tagline: "Invoices · Payments · Customers",
    ready: false,
  },
  {
    stage: "Scale",
    name: "KxCRM",
    tagline: "Customers · Relationships · Insights",
    ready: false,
  },
];

const metrics = [
  { label: "Products", value: "03" },
  { label: "Active", value: "01" },
  { label: "Organization", value: "1" },
  { label: "Account", value: "Connected" },
];

export default function GrowingBusinesses() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.heading}>
          <h2>Start small. Scale naturally.</h2>
          <p>Use what you need today. Add more when your business grows.</p>
        </div>

        <div className={styles.grid}>
          {stages.map((s, i) => (
            <div key={s.name} className={styles.stageWrap}>
              <div className={s.ready ? styles.cardReady : styles.cardSoon}>
                <span className={styles.stageLabel}>{s.stage}</span>
                <div className={styles.cardTop}>
                  <h3>{s.name}</h3>
                  <span className={s.ready ? styles.liveBadge : styles.soonBadge}>
                    {s.ready ? "Active" : "Coming soon"}
                  </span>
                </div>
                <p className={styles.tagline}>{s.tagline}</p>
              </div>

              {i < stages.length - 1 && (
                <div className={styles.arrow} aria-hidden="true">
                  →
                </div>
              )}
            </div>
          ))}
        </div>

        <div className={styles.metrics}>
          {metrics.map((m) => (
            <div key={m.label} className={styles.metricTile}>
              <span className={styles.metricValue}>{m.value}</span>
              <span className={styles.metricLabel}>{m.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}