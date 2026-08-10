"use client";

import Link from "next/link";
import Image from "next/image";
import { getAllProducts } from "@/lib/products";
import styles from "./Products.module.css";

export default function Products() {
  const products = getAllProducts();

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.heading}>
          <h2>Products built for you</h2>
          <p>Choose the tools your business needs to grow.</p>
        </div>

        <div className={styles.grid}>
          {products.map((p) => (
            <div key={p.slug} className={p.status === "live" ? styles.cardReady : styles.cardSoon}>
              <div className={styles.cardTop}>
                <div className={styles.identity}>
                  <Image
                    src={p.logo}
                    alt={`${p.name} logo`}
                    width={36}
                    height={36}
                    className={p.status === "live" ? styles.productLogo : styles.productLogoMuted}
                  />
                  <h3>{p.name}</h3>
                </div>
                <span className={p.status === "live" ? styles.liveBadge : styles.soonBadge}>
                  {p.status === "live" ? "Live" : "Soon"}
                </span>
              </div>

              <p className={styles.tagline}>{p.tagline}</p>
              <p className={styles.description}>{p.description}</p>

              <div className={styles.featureList}>
                {p.features.slice(0, 4).map((f) => (
                  <span
                    key={f.title}
                    className={p.status === "live" ? styles.featurePill : styles.featurePillMuted}
                  >
                    {f.title}
                  </span>
                ))}
              </div>

              {p.status === "live" ? (
                <Link href={`/products/${p.slug}`} className={styles.ctaButton}>
                  Explore {p.name} →
                </Link>
              ) : (
                <span className={styles.ctaButtonSoon}>Notify me</span>
              )}
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          <Link href="/products" className={styles.exploreAll}>
            Explore all products →
          </Link>
        </div>
      </div>
    </section>
  );
}