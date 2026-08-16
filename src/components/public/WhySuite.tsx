// components/public/WhySuite.tsx

"use client";

import Link from "next/link";
import {
  Sparkles,
  ArrowRight,

  Users,
  Building2,
  Package,
  Zap,
  Shield,
  Rocket,

} from "lucide-react";
import styles from "./WhySuite.module.css";

const reasons = [
  {
    icon: Users,
    title: "One account",
    description: "Access your KXBYTE products without creating separate accounts.",
  },
  {
    icon: Building2,
    title: "One business workspace",
    description: "Manage your business and products from a central place.",
  },
  {
    icon: Package,
    title: "Flexible",
    description: "Use only the products you need.",
  },
  {
    icon: Zap,
    title: "Built to grow",
    description: "Start small and expand your software stack as your business grows.",
  },
  {
    icon: Shield,
    title: "Connected",
    description: "Your products are designed to work together.",
  },
  {
    icon: Rocket,
    title: "Made for modern businesses",
    description: "Practical tools without unnecessary complexity.",
  },
];

export default function WhySuite() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {/* Heading */}
        <div className={styles.heading}>
          <div className={styles.badge}>
            <Sparkles size={12} />
            Why KXBYTE Suite
          </div>
          <h2>
            Built around your business,{" "}
            <span className={styles.accent}>not around a single tool.</span>
          </h2>
          <p className={styles.subtitle}>
            Your business shouldn&apos;t have to adapt to your software.
            KXBYTE Suite adapts to you.
          </p>
        </div>

        {/* Reasons Grid */}
        <div className={styles.grid}>
          {reasons.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className={styles.card}>
                <div className={styles.cardIcon}>
                  <Icon size={20} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className={styles.footer}>
          <Link href="/signup" className={styles.ctaButton}>
            Start building your Suite
            <ArrowRight size={16} />
          </Link>
          <p className={styles.footerText}>
            Start with what you need today. Add more when you&apos;re ready.
          </p>
        </div>
      </div>
    </section>
  );
}