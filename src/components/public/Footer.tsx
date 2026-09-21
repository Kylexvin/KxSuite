// components/Footer.tsx

import Link from "next/link";
import Image from "next/image";
import styles from "./Footer.module.css";

const currentYear = new Date().getFullYear();
const MARKETING = "https://kxbyte.co.ke";

const footerLinks = {
  suite: [
    { name: "Pricing", href: "/pricing" },
    { name: "Sign in", href: "/login" },
    { name: "Get started", href: "/signup" },
  ],
  company: [
    { name: "About", href: `${MARKETING}/about` },
    { name: "Products", href: `${MARKETING}/products` },
    { name: "Contact", href: `${MARKETING}/contact` },
    { name: "Careers", href: `${MARKETING}/careers` },
  ],
  legal: [
    { name: "Privacy Policy", href: `${MARKETING}/privacy` },
    { name: "Terms of Service", href: `${MARKETING}/terms` },
    { name: "Cookie Policy", href: `${MARKETING}/cookies` },
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
              <span className={styles.brandName}>
                KXBYTE <span className={styles.brandSuite}>Suite</span>
              </span>
            </Link>
            <p className={styles.tagline}>
              Everything your business needs to run, connected.
            </p>
          </div>

          {/* Links */}
          <div className={styles.links}>
            <div className={styles.linkGroup}>
              <h4>Suite</h4>
              <ul>
                {footerLinks.suite.map((item) => (
                  <li key={item.name}>
                    <Link href={item.href}>{item.name}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.linkGroup}>
              <h4>Company</h4>
              <ul>
                {footerLinks.company.map((item) => (
                  <li key={item.name}>
                    <a href={item.href} target="_blank" rel="noopener noreferrer">
                      {item.name}
                      <span className={styles.external} aria-hidden="true">↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.linkGroup}>
              <h4>Legal</h4>
              <ul>
                {footerLinks.legal.map((item) => (
                  <li key={item.name}>
                    <a href={item.href} target="_blank" rel="noopener noreferrer">
                      {item.name}
                      <span className={styles.external} aria-hidden="true">↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ---- Bottom section: legal ---- */}
        <div className={styles.bottom}>
          <div className={styles.legal}>
            <span>&copy; {currentYear} KXBYTE. All rights reserved.</span>
            <span className={styles.divider}>·</span>
            <span>Made in Kenya 🇰🇪</span>
          </div>
        </div>
      </div>
    </footer>
  );
}