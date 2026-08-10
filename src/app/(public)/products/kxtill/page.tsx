import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";

export default function KxTillPage() {
  return (
    <div className={styles.page}>
      {/* ===== NAV ===== */}
      <nav className={styles.nav}>
        <div className={styles.navContainer}>
          <div className={styles.navBrand}>
            <Image src="/assets/logo.png" alt="KXBYTE" width={32} height={32} />
            <span className={styles.navBrandName}>KXBYTE Suite</span>
          </div>
          <div className={styles.navLinks}>
            <Link href="/products" className={styles.navLink}>Products</Link>
            <Link href="/pricing" className={styles.navLink}>Pricing</Link>
            <Link href="/login" className={styles.navLink}>Login</Link>
            <Link href="/contact" className={styles.navCta}>Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <div className={styles.heroProductBadge}>
                <Image src="/assets/logo.png" alt="KxTill" width={40} height={40} />
                <span>KxTill</span>
                <span className={styles.liveBadge}>Live</span>
              </div>
              <h1 className={styles.heroTitle}>Point of Sale & Inventory Management</h1>
              <p className={styles.heroDescription}>
                Sell faster, know your stock, and track your business — all in one place.
              </p>
              <div className={styles.heroActions}>
                <Link href="/contact" className={styles.heroPrimary}>Start using KxTill</Link>
                <Link href="#pricing" className={styles.heroSecondary}>View pricing</Link>
              </div>
            </div>
            <div className={styles.heroVisual}>
              <div className={styles.mockup}>
                <div className={styles.mockupHeader}>
                  <span>POS</span>
                  <span>KxTill</span>
                </div>
                <div className={styles.mockupBody}>
                  <div className={styles.mockupProduct}>Product 1 — KSh 500</div>
                  <div className={styles.mockupProduct}>Product 2 — KSh 750</div>
                  <div className={styles.mockupProduct}>Product 3 — KSh 1,200</div>
                  <div className={styles.mockupCart}>
                    <span>Total: KSh 2,450</span>
                    <span className={styles.mockupPay}>Pay</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== VALUE PROPS ===== */}
      <section className={styles.values}>
        <div className={styles.container}>
          <div className={styles.valuesGrid}>
            <div className={styles.valueCard}>
              <h3>Sell faster</h3>
              <p>Complete transactions in seconds with an intuitive POS interface.</p>
            </div>
            <div className={styles.valueCard}>
              <h3>Know your stock</h3>
              <p>Real-time inventory tracking with low-stock alerts.</p>
            </div>
            <div className={styles.valueCard}>
              <h3>Track your business</h3>
              <p>Every sale, every payment, every product — all in one place.</p>
            </div>
            <div className={styles.valueCard}>
              <h3>Understand your numbers</h3>
              <p>Sales reports, revenue insights, and business analytics.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className={styles.features}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Everything you need to run your business</h2>
          <div className={styles.featuresGrid}>
            <div className={styles.featureItem}>
              <h3>POS / Sales</h3>
              <p>Fast, reliable point of sale for retail businesses.</p>
            </div>
            <div className={styles.featureItem}>
              <h3>Inventory Management</h3>
              <p>Track products, stock levels, and get low-stock alerts.</p>
            </div>
            <div className={styles.featureItem}>
              <h3>Flexible Units & Pricing</h3>
              <p>Sell by piece, gram, kilogram, carton, or any unit.</p>
            </div>
            <div className={styles.featureItem}>
              <h3>Multi Payment Tracking</h3>
              <p>Cash, M-Pesa, card, bank — track everything.</p>
            </div>
            <div className={styles.featureItem}>
              <h3>Sales Reports & Dashboard</h3>
              <p>Real-time insights into your business performance.</p>
            </div>
            <div className={styles.featureItem}>
              <h3>Receipts</h3>
              <p>Professional receipts for every transaction.</p>
            </div>
            <div className={styles.featureItem}>
              <h3>Staff Access</h3>
              <p>Multiple attendants with role-based access control.</p>
            </div>
            <div className={styles.featureItem}>
              <h3>Audit Trail</h3>
              <p>Complete history of every transaction and change.</p>
            </div>
            <div className={styles.featureItem}>
              <h3>Offline Friendly</h3>
              <p>Works even without internet — syncs when you re back online.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== POS SECTION ===== */}
      <section className={styles.posSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2>How selling works</h2>
            <p>Fast, intuitive, and built for business.</p>
          </div>
          <div className={styles.posGrid}>
            <div className={styles.posStep}>
              <span className={styles.stepNumber}>1</span>
              <h3>Search products</h3>
              <p>Find products instantly by name, category, or barcode.</p>
            </div>
            <div className={styles.posStep}>
              <span className={styles.stepNumber}>2</span>
              <h3>Add to cart</h3>
              <p>Select quantity and unit — piece, gram, carton, etc.</p>
            </div>
            <div className={styles.posStep}>
              <span className={styles.stepNumber}>3</span>
              <h3>Choose payment</h3>
              <p>Cash, M-Pesa, card, bank — or split payments.</p>
            </div>
            <div className={styles.posStep}>
              <span className={styles.stepNumber}>4</span>
              <h3>Complete sale</h3>
              <p>One click to finalize. Receipt generated instantly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FLEXIBLE PRODUCTS ===== */}
      <section className={styles.flexible}>
        <div className={styles.container}>
          <div className={styles.flexibleContent}>
            <h2>Flexible products. Powerful inventory.</h2>
            <p>KxTill lets you sell products in any way your customers need.</p>
            <div className={styles.unitExamples}>
              <span className={styles.unitPill}>1 piece</span>
              <span className={styles.unitPill}>½ piece</span>
              <span className={styles.unitPill}>500g</span>
              <span className={styles.unitPill}>1kg</span>
              <span className={styles.unitPill}>Carton</span>
              <span className={styles.unitPill}>5L</span>
            </div>
            <div className={styles.unitDetails}>
              <div className={styles.unitDetail}>
                <span>Different prices per selling unit</span>
              </div>
              <div className={styles.unitDetail}>
                <span>Automatic base-unit stock conversion</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PAYMENTS SECTION ===== */}
      <section className={styles.payments}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Payments, simplified</h2>
          <div className={styles.paymentsGrid}>
            <div className={styles.paymentItem}>Cash</div>
            <div className={styles.paymentItem}>M-Pesa</div>
            <div className={styles.paymentItem}>Card</div>
            <div className={styles.paymentItem}>Bank</div>
            <div className={styles.paymentItem}>Partial payments</div>
            <div className={styles.paymentItem}>Payment references</div>
          </div>
        </div>
      </section>

      {/* ===== BUSINESS INSIGHTS ===== */}
      <section className={styles.insights}>
        <div className={styles.container}>
          <div className={styles.insightsGrid}>
            <div className={styles.insightsContent}>
              <h2>Know your business</h2>
              <p>Real-time insights to help you make better decisions.</p>
              <ul className={styles.insightsList}>
                <li>Sales overview</li>
                <li>Revenue tracking</li>
                <li>Best-selling products</li>
                <li>Stock status</li>
                <li>Payment breakdown</li>
                <li>Sales trends</li>
              </ul>
            </div>
            <div className={styles.insightsVisual}>
              <div className={styles.dashboardMockup}>
                <div className={styles.dashboardRow}>
                  <span className={styles.dashboardLabel}>Today s sales</span>
                  <span className={styles.dashboardValue}>KSh 12,450</span>
                </div>
                <div className={styles.dashboardRow}>
                  <span className={styles.dashboardLabel}>Revenue</span>
                  <span className={styles.dashboardValue}>KSh 348,200</span>
                </div>
                <div className={styles.dashboardRow}>
                  <span className={styles.dashboardLabel}>Best seller</span>
                  <span className={styles.dashboardValue}>Product A</span>
                </div>
                <div className={styles.dashboardRow}>
                  <span className={styles.dashboardLabel}>Low stock</span>
                  <span className={styles.dashboardValue}>5 items</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== WHO IT'S FOR ===== */}
      <section className={styles.audience}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Built for growing businesses</h2>
          <div className={styles.audienceGrid}>
            <span className={styles.audiencePill}>Retail shops</span>
            <span className={styles.audiencePill}>Mini supermarkets</span>
            <span className={styles.audiencePill}>Pharmacies</span>
            <span className={styles.audiencePill}>Groceries</span>
            <span className={styles.audiencePill}>Hardware shops</span>
            <span className={styles.audiencePill}>Wholesalers</span>
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className={styles.pricing}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Simple, transparent pricing</h2>
          <div className={styles.pricingGrid}>
            <div className={styles.pricingCard}>
              <h3>Professional</h3>
              <p className={styles.pricingPrice}>KSh 2,500<span>/mo</span></p>
              <ul className={styles.pricingFeatures}>
                <li>✓ Full POS</li>
                <li>✓ Inventory management</li>
                <li>✓ Sales reports</li>
                <li>✓ Receipts</li>
                <li>✓ 1 user</li>
              </ul>
              <Link href="/contact" className={styles.pricingCta}>Start trial</Link>
            </div>
            <div className={`${styles.pricingCard} ${styles.pricingPopular}`}>
              <span className={styles.popularBadge}>Popular</span>
              <h3>Business</h3>
              <p className={styles.pricingPrice}>KSh 5,000<span>/mo</span></p>
              <ul className={styles.pricingFeatures}>
                <li>✓ Everything in Professional</li>
                <li>✓ Multi-store support</li>
                <li>✓ Staff access (5 users)</li>
                <li>✓ Advanced reports</li>
                <li>✓ Audit trail</li>
              </ul>
              <Link href="/contact" className={styles.pricingCta}>Start trial</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className={styles.faq}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Frequently asked questions</h2>
          <div className={styles.faqGrid}>
            <details className={styles.faqItem}>
              <summary>Can I sell different units?</summary>
              <p>Yes. KxTill supports multiple selling units per product — piece, gram, kilogram, carton, and more.</p>
            </details>
            <details className={styles.faqItem}>
              <summary>Can I track M-Pesa and cash?</summary>
              <p>Yes. KxTill tracks all payment methods including cash, M-Pesa, card, and bank.</p>
            </details>
            <details className={styles.faqItem}>
              <summary>Can I manage multiple products?</summary>
              <p>Yes. KxTill supports unlimited products with categories, units, and pricing.</p>
            </details>
            <details className={styles.faqItem}>
              <summary>Can I use KxTill for a pharmacy or retail shop?</summary>
              <p>Yes. KxTill is built for retail businesses of all types — pharmacies, supermarkets, hardware, and more.</p>
            </details>
            <details className={styles.faqItem}>
              <summary>Can I upgrade my plan?</summary>
              <p>Yes. You can upgrade from Professional to Business at any time.</p>
            </details>
            <details className={styles.faqItem}>
              <summary>How does the trial work?</summary>
              <p>Start with a 14-day free trial. No credit card required.</p>
            </details>
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className={styles.cta}>
        <div className={styles.container}>
          <div className={styles.ctaContent}>
            <h2>Ready to take control of your business?</h2>
            <p>Join thousands of businesses using KxTill to sell faster and grow smarter.</p>
            <div className={styles.ctaActions}>
              <Link href="/contact" className={styles.ctaPrimary}>Start using KxTill</Link>
              <Link href="#pricing" className={styles.ctaSecondary}>Explore pricing</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerGrid}>
            <div className={styles.footerBrand}>
              <Image src="/assets/logo.png" alt="KXBYTE" width={32} height={32} />
              <span>KXBYTE Suite</span>
            </div>
            <div className={styles.footerLinks}>
              <div>
                <h4>Products</h4>
                <Link href="/products/kxtill">KxTill</Link>
                <Link href="/products/kxinvoice" className={styles.comingSoon}>KxInvoice</Link>
                <Link href="/products/kxcrm" className={styles.comingSoon}>KxCRM</Link>
              </div>
              <div>
                <h4>Company</h4>
                <Link href="/about">About</Link>
                <Link href="/contact">Contact</Link>
              </div>
              <div>
                <h4>Support</h4>
                <Link href="/help">Help Center</Link>
                <Link href="/terms">Terms</Link>
                <Link href="/privacy">Privacy</Link>
              </div>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <span>&copy; 2026 KXBYTE. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}