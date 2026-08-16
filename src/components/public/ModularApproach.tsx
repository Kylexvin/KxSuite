// components/public/ModularApproach.tsx

"use client";

import Link from "next/link";
import {
  ArrowRight,
  ShoppingBag,
  FileText,
  Users,
} from "lucide-react";
import styles from "./ModularApproach.module.css";


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