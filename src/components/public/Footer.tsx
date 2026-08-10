"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "./Footer.module.css";

const currentYear = new Date().getFullYear();

const footerLinks = {
  products: [
    { name: "KxTill", href: "/products/kxtill", ready: true },
    { name: "KxInvoice", href: "/products/kxinvoice", ready: false },
    { name: "KxCRM", href: "/products/kxcrm", ready: false },
  ],
  company: [
    { name: "About", href: "/about" },
    { name: "Careers", href: "/careers" },
    { name: "Blog", href: "/blog" },
  ],
  support: [
    { name: "Help Center", href: "/help" },
    { name: "Contact", href: "/contact" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
  ],
};

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* ---- Top section: brand + links ---- */}
        <div className={styles.top}>
          {/* Brand */}
          <div className={styles.brand}>
            <Link href="/" className={styles.logoLink}>
              <Image
                src="/assets/logo.png"
                alt="KXBYTE"
                width={32}
                height={32}
                className={styles.logo}
              />
              <span className={styles.brandName}>KXBYTE</span>
            </Link>
            <p className={styles.tagline}>
              Suite of tools for growing businesses.
            </p>
          </div>

          {/* Links */}
          <div className={styles.links}>
            <div className={styles.linkGroup}>
              <h4>Products</h4>
              <ul>
                {footerLinks.products.map((p) => (
                  <li key={p.name}>
                    {p.ready ? (
                      <Link href={p.href}>{p.name}</Link>
                    ) : (
                      <span className={styles.comingSoon}>
                        {p.name}
                        <span className={styles.badge}>Soon</span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.linkGroup}>
              <h4>Company</h4>
              <ul>
                {footerLinks.company.map((item) => (
                  <li key={item.name}>
                    <Link href={item.href}>{item.name}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.linkGroup}>
              <h4>Support</h4>
              <ul>
                {footerLinks.support.map((item) => (
                  <li key={item.name}>
                    <Link href={item.href}>{item.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ---- Bottom section: social + legal ---- */}
        <div className={styles.bottom}>
          <div className={styles.social}>
            <a
              href="https://twitter.com/kxbyte"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
              className={styles.socialLink}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
                <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
              </svg>
            </a>
            <a
              href="https://linkedin.com/company/kxbyte"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className={styles.socialLink}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect x="2" y="9" width="4" height="12" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </a>
            <a
              href="https://youtube.com/@kxbyte"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className={styles.socialLink}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
              </svg>
            </a>
          </div>

          <div className={styles.legal}>
            <span>&copy; {currentYear} KXBYTE. All rights reserved.</span>
            <span className={styles.divider}>·</span>
            <span>Made in Kenya</span>
          </div>
        </div>
      </div>
    </footer>
  );
}