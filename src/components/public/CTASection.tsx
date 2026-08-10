"use client";

import Link from "next/link";
import styles from "./CTASection.module.css";

export default function Cta() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2>Run your business on one Suite.</h2>
        <p>Start with KxTill today. Add more tools as you grow.</p>

        <div className={styles.actions}>
          <Link href="/signup" className={styles.primary}>
            Create your account →
          </Link>
          <Link href="/products" className={styles.secondary}>
            Explore products
          </Link>
        </div>
      </div>
    </section>
  );
}