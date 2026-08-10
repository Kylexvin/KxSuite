"use client";

import Link from "next/link";
import styles from "./CTASection.module.css";

export default function CTASection() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.content}>
          <h2>Ready when you are.</h2>
          <p>Explore the KXBYTE Suite.</p>

          <div className={styles.actions}>
            <Link href="/products" className={styles.primary}>
              Explore Products
            </Link>
            <Link href="/contact" className={styles.secondary}>
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}