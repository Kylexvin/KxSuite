// components/public/Products.tsx

"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2, ShoppingBag, FileText, Users, Globe, Sparkles } from "lucide-react";
import { getAllProducts } from "@/lib/products";
import styles from "./Products.module.css";

export default function Products() {
  const products = getAllProducts();

  // Problem → Product mapping with Lucide icons
  const problemStatements = {
    kxtill: {
      problem: "Need to manage sales and inventory?",
      icon: ShoppingBag,
    },
    kxinvoice: {
      problem: "Need to create and manage invoices?",
      icon: FileText,
    },
    kxcrm: {
      problem: "Need to manage your customers?",
      icon: Users,
    },
    moihub: {
      problem: "Need to take your business online?",
      icon: Globe,
    },
  };

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {/* Heading */}
        <div className={styles.heading}>
          <div className={styles.badge}>
            <Sparkles size={12} />
            Products
          </div>
          <h2>Whatever your business needs to get done, there&apos;s a tool for it.</h2>
          <p className={styles.subtitle}>
            Each product is built to solve a specific business challenge — 
            so you can focus on what matters most.
          </p>
        </div>

        {/* Product Grid */}
        <div className={styles.grid}>
          {products.map((p) => {
            const problem = problemStatements[p.slug as keyof typeof problemStatements];
            const isLive = p.status === "live";
            const ProblemIcon = problem?.icon || ShoppingBag;

            return (
              <div 
                key={p.slug} 
                className={`${styles.card} ${isLive ? styles.cardLive : styles.cardSoon}`}
              >
                {/* Problem statement (above product) */}
                <div className={styles.problemStatement}>
                  <ProblemIcon size={16} className={styles.problemIcon} />
                  <span className={styles.problemText}>{problem?.problem || "Solve your business challenges"}</span>
                </div>

                <div className={styles.cardDivider} />

                {/* Product identity */}
                <div className={styles.cardTop}>
                  <div className={styles.identity}>
                    <Image
                      src={p.logo}
                      alt={`${p.name} logo`}
                      width={40}
                      height={40}
                      className={isLive ? styles.productLogo : styles.productLogoMuted}
                    />
                    <div>
                      <h3 className={styles.productName}>{p.name}</h3>
                      <span className={isLive ? styles.liveBadge : styles.soonBadge}>
                        {isLive ? "Live" : "Soon"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className={styles.tagline}>{p.tagline}</p>
                <p className={styles.description}>{p.description}</p>

                {/* Features */}
                <div className={styles.featureList}>
                  {p.features.slice(0, 4).map((f) => (
                    <span
                      key={f.title}
                      className={isLive ? styles.featurePill : styles.featurePillMuted}
                    >
                      <CheckCircle2 size={12} />
                      {f.title}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                {isLive ? (
                  <Link href={`/products/${p.slug}`} className={styles.ctaButton}>
                    Learn More
                    <ArrowRight size={16} />
                  </Link>
                ) : (
                  <span className={styles.ctaButtonSoon}>
                    Notify me when ready
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className={styles.footer}>
          <p className={styles.footerText}>
            Need help deciding? <Link href="/contact" className={styles.footerLink}>Talk to our team</Link>
          </p>
        </div>
      </div>
    </section>
  );
}