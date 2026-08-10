import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";

// Hardcoded data for products listing
const products = [
  {
    name: "KxTill",
    slug: "kxtill",
    tagline: "Point of Sale & Inventory Management",
    description: "Run your retail business with a complete POS system. Track sales, manage stock, and keep customers happy.",
    features: ["POS", "Inventory", "Sales reports", "Receipts"],
    status: "live" as const,
  },
  {
    name: "KxInvoice",
    slug: "kxinvoice",
    tagline: "Invoicing & Payments",
    description: "Create and send professional invoices. Get paid faster with payment tracking and reminders.",
    features: ["Invoices", "Payments", "Reminders", "Reports"],
    status: "soon" as const,
  },
  {
    name: "KxCRM",
    slug: "kxcrm",
    tagline: "Customer Relationship Management",
    description: "Manage your customer relationships. Track leads, follow-ups, and grow your business.",
    features: ["Contacts", "Pipelines", "Follow-ups", "Insights"],
    status: "soon" as const,
  },
];

export default function ProductsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>KXBYTE Products</h1>
          <p>Choose the tools your business needs to grow.</p>
        </header>

        <div className={styles.grid}>
          {products.map((product) => (
            <div key={product.slug} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.identity}>
                  <Image
                    src="/assets/logo.png"
                    alt={`${product.name} logo`}
                    width={40}
                    height={40}
                    className={product.status === "live" ? styles.logo : styles.logoMuted}
                  />
                  <div>
                    <h2>{product.name}</h2>
                    <span className={product.status === "live" ? styles.liveBadge : styles.soonBadge}>
                      {product.status === "live" ? "● Live" : "Coming Soon"}
                    </span>
                  </div>
                </div>
              </div>

              <p className={styles.tagline}>{product.tagline}</p>
              <p className={styles.description}>{product.description}</p>

              <div className={styles.features}>
                {product.features.map((feature) => (
                  <span key={feature} className={styles.featurePill}>
                    {feature}
                  </span>
                ))}
              </div>

              {product.status === "live" ? (
                <Link href={`/products/${product.slug}`} className={styles.cta}>
                  Explore {product.name} →
                </Link>
              ) : (
                <button className={styles.ctaSoon} disabled>
                  Notify me when ready
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}