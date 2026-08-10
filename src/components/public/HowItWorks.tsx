"use client";

import styles from "./HowItWorks.module.css";

const steps = [
  {
    number: "01",
    title: "Create your account",
    description: "Your KXBYTE identity gives you access to the Suite.",
  },
  {
    number: "02",
    title: "Create your organization",
    description: "Set up the business you want to manage.",
  },
  {
    number: "03",
    title: "Choose your products",
    description: "Activate the tools your business needs.",
  },
  {
    number: "04",
    title: "Run your business",
    description: "Everything stays connected as you grow.",
  },
];

const sparkline = [28, 42, 36, 58, 50, 68, 60, 82];

export default function HowItWorks() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.heading}>
          <h2>Get started in minutes.</h2>
        </div>

        <div className={styles.timeline}>
          {steps.map((step, i) => (
            <div key={step.number} className={styles.row}>
              <div className={styles.markerCol}>
                <span className={styles.number}>{step.number}</span>
                {i < steps.length - 1 && <span className={styles.line} />}
              </div>

              <div className={styles.content}>
                <h3>{step.title}</h3>
                <p>{step.description}</p>

                {i === 0 && (
                  <div className={styles.previewCard}>
                    <div className={styles.checkRow}>
                      <span className={styles.dotActive} />
                      <span>Identity created</span>
                    </div>
                    <div className={styles.checkRow}>
                      <span className={styles.dotActive} />
                      <span>Secure access</span>
                    </div>
                  </div>
                )}

                {i === 1 && (
                  <div className={styles.previewCard}>
                    <span className={styles.orgName}>Acme Stores</span>
                    <span className={styles.orgLocation}>Nairobi · Kenya</span>
                  </div>
                )}

                {i === 2 && (
                  <div className={styles.previewCard}>
                    <div className={styles.checkRow}>
                      <span className={styles.dotActive} />
                      <span>KxTill</span>
                    </div>
                    <div className={styles.checkRowMuted}>
                      <span className={styles.dotMuted} />
                      <span>KxInvoice</span>
                    </div>
                    <div className={styles.checkRowMuted}>
                      <span className={styles.dotMuted} />
                      <span>KxCRM</span>
                    </div>
                  </div>
                )}

                {i === 3 && (
                  <div className={styles.dashboardCard}>
                    <div className={styles.dashboardHeader}>
                      <span className={styles.dashboardGreeting}>Good morning</span>
                      <span className={styles.dashboardOrg}>Acme Stores</span>
                    </div>

                    <div className={styles.dashboardMetrics}>
                      <div className={styles.dashboardMetric}>
                        <span className={styles.metricValue}>84,500</span>
                        <span className={styles.metricLabel}>Sales (KSh)</span>
                      </div>
                      <div className={styles.dashboardMetric}>
                        <span className={styles.metricValue}>342</span>
                        <span className={styles.metricLabel}>Stock</span>
                      </div>
                    </div>

                    <div className={styles.sparkline}>
                      {sparkline.map((h, idx) => (
                        <span
                          key={idx}
                          className={styles.bar}
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                    <span className={styles.sparklineLabel}>Sales overview</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}