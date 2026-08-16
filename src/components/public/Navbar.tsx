// components/Navbar.tsx

"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronDown,
  Menu,
  X,
  LayoutDashboard,
  Package,
  CreditCard,
  BookOpen,
  LogIn,
  UserPlus,
  Sparkles,
} from "lucide-react";
import styles from "./Navbar.module.css";

const products = [
  { name: "KxTill", href: "/products/kxtill", ready: true, icon: Package },
  { name: "KxInvoice", href: "/products/kxinvoice", ready: false, icon: CreditCard },
  { name: "KxCRM", href: "/products/kxcrm", ready: false, icon: LayoutDashboard },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle dropdown hover with delay
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setDropdownOpen(false);
    }, 200); // 200ms delay gives user time to move to dropdown
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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

        <div className={styles.navLinks}>
          {/* Products Dropdown */}
          <div
            className={styles.navDropdown}
            ref={dropdownRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <span className={`${styles.navLink} ${dropdownOpen ? styles.navLinkActive : ""}`}>
              <Package size={16} />
              Products
              <ChevronDown size={14} className={`${styles.chevron} ${dropdownOpen ? styles.chevronOpen : ""}`} />
            </span>
            <div className={`${styles.dropdownPanel} ${dropdownOpen ? styles.dropdownOpen : ""}`}>
              {products.map((p) =>
                p.ready ? (
                  <Link key={p.href} href={p.href} className={styles.dropdownItem}>
                    <p.icon size={16} className={styles.dropdownIcon} />
                    {p.name}
                    <span className={styles.dropdownBadge}>
                      <Sparkles size={10} />
                      Ready
                    </span>
                  </Link>
                ) : (
                  <span key={p.href} className={styles.dropdownItemDisabled}>
                    <p.icon size={16} className={styles.dropdownIcon} />
                    {p.name}
                    <span className={styles.soonBadge}>Soon</span>
                  </span>
                )
              )}
            </div>
          </div>

          <Link href="/pricing" className={styles.navLink}>
            <CreditCard size={16} />
            Pricing
          </Link>
          <Link href="/docs" className={styles.navLink}>
            <BookOpen size={16} />
            Docs
          </Link>
        </div>

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
          <div className={styles.mobileSection}>
            <span className={styles.mobileSectionTitle}>Products</span>
            {products.map((p) =>
              p.ready ? (
                <Link key={p.href} href={p.href} className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
                  <p.icon size={16} />
                  {p.name}
                </Link>
              ) : (
                <span key={p.href} className={styles.mobileLinkDisabled}>
                  <p.icon size={16} />
                  {p.name}
                  <span className={styles.soonBadge}>Soon</span>
                </span>
              )
            )}
          </div>
          <Link href="/pricing" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
            <CreditCard size={16} />
            Pricing
          </Link>
          <Link href="/docs" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
            <BookOpen size={16} />
            Docs
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