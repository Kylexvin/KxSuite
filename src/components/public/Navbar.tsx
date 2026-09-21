// components/Navbar.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, CreditCard, LogIn, UserPlus } from "lucide-react";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
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

        {/* <div className={styles.navLinks}>
          <Link href="/pricing" className={styles.navLink}>
            <CreditCard size={16} />
            Pricing
          </Link>
        </div> */}

        <div className={styles.navActions}>
          <Link href="/login" className={styles.navLogin}>
            <LogIn size={16} />
            Login
          </Link>
          <Link href="/signup" className={styles.navCta}>
            <UserPlus size={16} />
            Get Started
          </Link>
        </div>

        <button
          className={styles.menuToggle}
          aria-label="Toggle menu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <div className={`${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ""}`}>
        <div className={styles.mobileMenuInner}>
          <Link href="/pricing" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
            <CreditCard size={16} />
            Pricing
          </Link>
          <div className={styles.mobileDivider} />
          <Link href="/login" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
            <LogIn size={16} />
            Login
          </Link>
          <Link href="/signup" className={styles.mobileCta} onClick={() => setMenuOpen(false)}>
            <UserPlus size={16} />
            Get Started
          </Link>
        </div>
      </div>
    </>
  );
}