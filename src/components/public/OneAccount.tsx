// components/public/OneAccount.tsx

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

  ShoppingBag,
  FileText,
} from "lucide-react";
import styles from "./OneAccount.module.css";

const benefits = [
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
    description: "Use only the products you need. Add more as you grow.",
  },
  {
    icon: Zap,
    title: "Built to grow",
    description: "Start small and expand your software stack as your business grows.",
  },
  {
    icon: Shield,
    title: "Connected",
    description: "Your products are designed to work together seamlessly.",
  },
  {
    icon: Rocket,
    title: "Made for modern businesses",
    description: "Practical tools without unnecessary complexity.",
  },
];

export default function OneAccount() {
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
            Your business shouldn&apos;t have to operate through a collection of disconnected systems.
            KXBYTE Suite brings your business tools together — so you can focus on what matters.
          </p>
        </div>

        {/* Ecosystem Visual */}
        <div className={styles.ecosystemVisual}>
          <div className={styles.ecosystemCenter}>
            <div className={styles.ecosystemLogo}>
              <span className={styles.ecosystemLogoText}>KXBYTE</span>
              <span className={styles.ecosystemLogoSub}>Suite</span>
            </div>
            <span className={styles.ecosystemLabel}>One connected platform</span>
          </div>

          <div className={styles.ecosystemProducts}>
            <div className={`${styles.ecosystemProduct} ${styles.productReady}`}>
              <ShoppingBag size={20} className={styles.productIcon} />
              <span className={styles.productName}>KxTill</span>
              <span className={styles.productStatusLive}>Live</span>
            </div>
            <div className={`${styles.ecosystemProduct} ${styles.productSoon}`}>
              <FileText size={20} className={styles.productIcon} />
              <span className={styles.productName}>KxInvoice</span>
              <span className={styles.productStatusSoon}>Soon</span>
            </div>
            <div className={`${styles.ecosystemProduct} ${styles.productSoon}`}>
              <Users size={20} className={styles.productIcon} />
              <span className={styles.productName}>KxCRM</span>
              <span className={styles.productStatusSoon}>Soon</span>
            </div>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className={styles.grid}>
          {benefits.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className={styles.benefitCard}>
                <div className={styles.benefitIcon}>
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