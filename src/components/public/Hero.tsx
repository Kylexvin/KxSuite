// components/Hero.tsx

"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import Navbar from "./Navbar";
import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.dotGrid} aria-hidden="true" />
      <div className={styles.orbitRings} aria-hidden="true">
        <span />
        <span />
      </div>
      <div className={styles.orbitRingsLeft} aria-hidden="true">
        <span />
        <span />
      </div>

      {/* Navbar */}
      <Navbar />

      {/* Content */}
      <div className={styles.content}>
        <h1>
          Everything your business needs to run, <span className={styles.accent}>connected.</span>
        </h1>

        {/* <p className={styles.subtitle}>
          A growing suite of business tools that helps you manage sales, customers,
          invoices, operations and more from one connected platform.
        </p> */}

        <div className={styles.buttons}>
          <Link href="/signup" className={styles.primary}>
            Start Now
            <ArrowRight size={16} />
          </Link>
          <Link href="/products" className={styles.secondary}>
            Explore Products
          </Link>
        </div>

        <div className={styles.pricingHint}>
          <span className={styles.pricingAmount}>From KES 699</span>
          <span className={styles.pricingPeriod}>/month</span>
        </div>
      </div>

      {/* ===== L-SHAPED MOCKUPS ===== */}
      <div className={styles.mockupSection}>
        {/* Desktop Mockup - fills the left side */}
        <div className={styles.desktopMockup}>
          <div className={styles.desktopFrame}>
            <Image
              src="/assets/dashboard.jpg"
              alt="KXBYTE Suite desktop dashboard"
              width={1400}
              height={560}
              priority
              className={styles.desktopImage}
            />
          </div>
        </div>

        {/* Phone Mockup - sits to the right, same height */}
        <div className={styles.phoneMockup}>
          <div className={styles.phoneFrame}>
            <Image
              src="/assets/mobilev.png"
              alt="KXBYTE Suite mobile dashboard"
              width={400}
              height={800}
              priority
              className={styles.phoneImage}
            />
          </div>
        </div>
      </div>
    </section>
  );
}