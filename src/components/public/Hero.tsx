"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./Hero.module.css";

const products = [
  { name: "KxTill", href: "/products/kxtill", ready: true },
  { name: "KxInvoice", href: "/products/kxinvoice", ready: false },
  { name: "KxCRM", href: "/products/kxcrm", ready: false },
];

export default function Hero() {
  const [menuOpen, setMenuOpen] = useState(false);

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

      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>
          <Image
            src="/assets/logo.png"
            alt="KXBYTE"
            width={28}
            height={28}
            className={styles.logoImg}
          />
          KXBYTE <span className={styles.logoSuite}>Suite</span>
        </Link>

        <div className={styles.navLinks}>
          <div className={styles.navDropdown}>
            <span className={styles.navLink}>
              Products <span className={styles.chevron}>▾</span>
            </span>
            <div className={styles.dropdownPanel}>
              {products.map((p) =>
                p.ready ? (
                  <Link key={p.href} href={p.href} className={styles.dropdownItem}>
                    {p.name}
                  </Link>
                ) : (
                  <span key={p.href} className={styles.dropdownItemDisabled}>
                    {p.name}
                    <span className={styles.soonBadge}>Soon</span>
                  </span>
                )
              )}
            </div>
          </div>
          <Link href="/pricing" className={styles.navLink}>Pricing</Link>
          <Link href="/docs" className={styles.navLink}>Docs</Link>
        </div>

        <div className={styles.navActions}>
          <Link href="/login" className={styles.navLogin}>Login</Link>
          <Link href="/signup" className={styles.navCta}>Get Started</Link>
        </div>

        <button
          className={styles.menuToggle}
          aria-label="Toggle menu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span />
          <span />
        </button>
      </nav>

      {menuOpen && (
        <div className={styles.mobileMenu}>
          {products.map((p) =>
            p.ready ? (
              <Link key={p.href} href={p.href} className={styles.mobileLink}>
                {p.name}
              </Link>
            ) : (
              <span key={p.href} className={styles.mobileLinkDisabled}>
                {p.name}
                <span className={styles.soonBadge}>Soon</span>
              </span>
            )
          )}
          <Link href="/pricing" className={styles.mobileLink}>Pricing</Link>
          <Link href="/login" className={styles.mobileLink}>Login</Link>
          <Link href="/signup" className={styles.mobileCta}>Get Started</Link>
        </div>
      )}

      <div className={styles.content}>
        <h1>Run your business. All in one place.</h1>
        <p>One place for the products that run your business.</p>
        <div className={styles.buttons}>
          <Link href="/products" className={styles.primary}>Explore Products</Link>
          <Link href="/login" className={styles.secondary}>Login</Link>
        </div>
      </div>

      <div className={styles.assetWrap}>
        <Image
          src="/assets/dsk.png"
          alt="KXBYTE Suite dashboard analytics"
          width={1400}
          height={560}
          priority
          className={styles.assetImage}
        />
        <div className={styles.assetFade} />
      </div>
    </section>
  );
}