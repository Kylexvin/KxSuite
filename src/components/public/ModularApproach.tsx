// components/public/ModularApproach.tsx

"use client";

import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Package,
  Plus,
  Layers,
  ShoppingBag,
  FileText,
  Users,
} from "lucide-react";
import styles from "./ModularApproach.module.css";

const steps = [
  {
    icon: Package,
    title: "Start with one product",
    description: "Choose the tool that solves your most urgent need. No need to adopt everything at once.",
  },
  {
    icon: Plus,
    title: "Add more when you need them",
    description: "Your business grows. Your software stack should grow with it — seamlessly.",
  },
  {
    icon: Layers,
    title: "Everything stays connected",
    description: "New products join your workspace automatically. No new accounts, no complex setup.",
  },
];

const products = [
  { name: "KxTill", icon: ShoppingBag, ready: true },
  { name: "KxInvoice", icon: FileText, ready: false },
  { name: "KxCRM", icon: Users, ready: false },
];

export default function ModularApproach() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {/* Heading */}
        <div className={styles.heading}>
          <div className={styles.badge}>
            <Sparkles size={12} />
            Modular by Design
          </div>
          <h2>
            Start with what you need.{" "}
            <span className={styles.accent}>Add more when you need it.</span>
          </h2>
          <p className={styles.subtitle}>
            You don&apos;t have to adopt your entire business stack on day one.
            Start with one product. Add another when your business grows.
            Connect more tools as your needs change.
          </p>
        </div>

        {/* Visual: Product Evolution */}
        <div className={styles.visual}>
          <div className={styles.visualRow}>
            {products.map((p) => (
              <div
                key={p.name}
                className={`${styles.productBadge} ${p.ready ? styles.productBadgeReady : styles.productBadgeSoon}`}
              >
                <p.icon size={16} />
                <span>{p.name}</span>
                <span className={p.ready ? styles.startBadge : styles.soonBadge}>
                  {p.ready ? "Start here" : "Soon"}
                </span>
              </div>
            ))}
          </div>
          <div className={styles.visualLabel}>
            <span className={styles.visualLabelLine} />
            <span className={styles.visualLabelText}>Grow as you go</span>
            <span className={styles.visualLabelLine} />
          </div>
        </div>

        {/* Steps */}
        <div className={styles.grid}>
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className={styles.card}>
                <div className={styles.cardIcon}>
                  <Icon size={20} />
                </div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className={styles.footer}>
          <Link href="/products" className={styles.ctaButton}>
            Explore our products
            <ArrowRight size={16} />
          </Link>
          <p className={styles.footerText}>
            One platform. Multiple products. Your choice.
          </p>
        </div>
      </div>
    </section>
  );
}