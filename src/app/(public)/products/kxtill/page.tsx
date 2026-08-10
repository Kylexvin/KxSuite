"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

import {
  Zap, Boxes, TrendingUp, PieChart, Search, ShoppingCart, CreditCard,
  CheckCircle2, Package, Store, Users, Wallet, UserCircle, BarChart3,
  Calculator, Cpu, RefreshCw, ShieldCheck, Sparkles, Receipt, Sparkle,
  X,
} from "lucide-react";
import styles from "./page.module.css";

const products = [
  { name: "KxTill", href: "/products/kxtill", ready: true },
  { name: "KxInvoice", href: "/products/kxinvoice", ready: false },
  { name: "KxCRM", href: "/products/kxcrm", ready: false },
];

const highlights = [
  { icon: Zap, title: "Sell faster", desc: "Complete transactions in seconds with an intuitive POS interface." },
  { icon: Boxes, title: "Know your stock", desc: "Real-time inventory tracking with low-stock alerts." },
  { icon: TrendingUp, title: "Track your business", desc: "Every sale, every payment, every product — all in one place." },
  { icon: PieChart, title: "Understand your numbers", desc: "Sales reports, revenue insights, and business analytics." },
];

const features = [
  { icon: ShoppingCart, title: "POS / Sales", desc: "Fast, reliable point of sale for retail businesses." },
  { icon: Boxes, title: "Inventory Management", desc: "Track products, stock levels, and get low-stock alerts." },
  { icon: Package, title: "Flexible Units & Pricing", desc: "Sell by piece, gram, kilogram, carton, or any unit." },
  { icon: Wallet, title: "Multi Payment Tracking", desc: "Cash, M-Pesa, card, bank — track everything." },
  { icon: BarChart3, title: "Sales Reports & Dashboard", desc: "Real-time insights into your business performance." },
  { icon: Receipt, title: "Receipts", desc: "Professional receipts for every transaction." },
  { icon: Users, title: "Staff Access", desc: "Multiple attendants with role-based access control." },
  { icon: ShieldCheck, title: "Audit Trail", desc: "Complete history of every transaction and change." },
  { icon: RefreshCw, title: "Offline Friendly", desc: "Works even without internet — syncs when you're back online." },
];

const steps = [
  { icon: Search, n: "1", title: "Search products", desc: "Find products instantly by name, category, or barcode." },
  { icon: ShoppingCart, n: "2", title: "Add to cart", desc: "Select quantity and unit — piece, gram, carton, etc." },
  { icon: CreditCard, n: "3", title: "Choose payment", desc: "Cash, M-Pesa, card, bank — or split payments." },
  { icon: CheckCircle2, n: "4", title: "Complete sale", desc: "One click to finalize. Receipt generated instantly." },
];

const units = ["1 piece", "½ piece", "500g", "1kg", "Carton", "5L"];
const paymentMethods = ["Cash", "M-Pesa", "Card", "Bank"];

const stats = [
  { label: "Today's sales", value: "KSh 12,450" },
  { label: "Revenue", value: "KSh 348,200" },
  { label: "Best seller", value: "Product A" },
  { label: "Low stock", value: "5 items" },
];

const trendData = [40, 55, 48, 62, 58, 74, 68, 82, 76, 90, 85, 96];

const industries = [
  "Retail shops", "Mini supermarkets", "Pharmacies", "Groceries", "Hardware shops", "Wholesalers",
];

const pricingTiers = [
  {
    name: "Professional",
    price: "KSh 2,500/mo",
    popular: false,
    features: ["Full POS", "Inventory management", "Sales reports", "Receipts", "1 user"],
  },
  {
    name: "Business",
    price: "KSh 5,000/mo",
    popular: true,
    features: [
      "Everything in Professional", "Multi-store support", "Staff access (5 users)",
      "Advanced reports", "Audit trail",
    ],
  },
];

const faqs = [
  { q: "Can I sell different units?", a: "Yes — sell by piece, weight, volume, or any custom unit, with different prices per unit." },
  { q: "Can I track M-Pesa and cash?", a: "Yes — KxTill tracks cash, M-Pesa, card, and bank payments, including partial payments." },
  { q: "Can I manage multiple products?", a: "Yes — full product catalog with categories, SKUs, and stock tracking." },
  { q: "Can I use KxTill for a pharmacy or retail shop?", a: "Yes — KxTill works for retail shops, pharmacies, groceries, hardware shops, and more." },
  { q: "Can I upgrade my plan?", a: "Yes — upgrade anytime as your business grows." },
  { q: "How does the trial work?", a: "Start using KxTill immediately — no card required to try it out." },
];

const featureCategories = [
  {
    icon: Receipt,
    title: "POS & Sales",
    items: [
      "Fast POS / checkout", "Product search", "Barcode scanning", "Multiple selling units",
      "Fractional quantities — e.g. ½ piece", "Measured products — kg, litres, metres, etc.",
      "Packaged products — 500g, carton, box, jerrican", "Different prices per selling unit",
      "Discounts", "Tax/VAT calculation", "Hold/suspend sale", "Void/cancel sale",
      "Returns/refunds", "Receipt generation", "Reprint receipts",
    ],
  },
  {
    icon: Package,
    title: "Products & Inventory",
    items: [
      "Product catalog", "Categories", "SKU/barcodes", "Product variants where needed",
      "Base units + UOM conversions", "Branch-level stock", "Low-stock alerts",
      "Stock adjustments", "Stock movement history", "Stock valuation", "Purchase recording",
      "Supplier management", "Purchase orders", "Stock receiving", "Damaged/lost stock",
      "Inter-branch transfers", "Centralized inventory view",
    ],
  },
  {
    icon: Store,
    title: "Multi-Branch",
    items: [
      "Organization-wide branch management", "All-branches view", "Individual branch view",
      "Branch-specific inventory", "Branch-specific sales", "Branch-specific pricing",
      "Branch transfers", "Branch-level reports", "Consolidated organization reports",
      "Branch operating information", "Branch-specific receipt details",
    ],
  },
  {
    icon: Users,
    title: "Staff & Access",
    items: [
      "Cashiers", "Branch managers", "Inventory managers", "Auditors", "Custom roles",
      "Branch-specific access", "Permission-based actions", "Staff activity tracking",
      "Shift management", "Cashier accountability",
    ],
  },
  {
    icon: Wallet,
    title: "Payments",
    items: [
      "Cash", "M-Pesa", "Card", "Bank", "Other payment methods", "Partial payments",
      "Payment references", "Payment history", "Daily payment reconciliation",
      "Branch-level payment reporting",
    ],
  },
  {
    icon: UserCircle,
    title: "Customers",
    items: [
      "Customer profiles", "Purchase history", "Customer search", "Credit/customer debt",
      "Credit limits", "Customer statements", "Customer balances",
      "Cross-branch customer history", "Loyalty/rewards — later",
    ],
  },
  {
    icon: BarChart3,
    title: "Reports & Analytics",
    items: [
      "Sales dashboard", "Revenue", "Profit", "Sales by product", "Sales by category",
      "Sales by branch", "Sales by cashier", "Payment-method breakdown", "Best-selling products",
      "Slow-moving products", "Stock reports", "Low-stock reports", "Purchase reports",
      "Tax reports", "Expense reports", "Daily/weekly/monthly reports",
      "Consolidated organization reporting", "Real-time analytics",
    ],
  },
  {
    icon: Calculator,
    title: "Expenses",
    subtitle: "KXBYTE Expenses add-on",
    items: [
      "Record expenses", "Expense categories", "Branch-specific expenses",
      "Recurring expenses", "Expense approval", "Expense reports", "Profit after expenses",
    ],
  },
  {
    icon: Cpu,
    title: "Hardware",
    items: [
      "ESC/POS printers", "Barcode scanners", "Cash drawers", "Customer displays",
      "Receipt printers", "Hardware configuration",
    ],
  },
  {
    icon: RefreshCw,
    title: "Reliability",
    items: [
      "Cloud-based operation", "Automatic backups", "Offline POS", "Local transaction queue",
      "Automatic synchronization", "Conflict handling", "Connection status",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Security & Audit",
    items: [
      "KXBYTE Identity", "Organization isolation", "Branch isolation", "Role-based permissions",
      "Audit logs", "Staff activity history", "Transaction history", "Secure payment records",
    ],
  },
  {
    icon: Sparkles,
    title: "AI",
    subtitle: "Later — via Reports & Dashboard",
    items: [
      "Ask questions about sales", "Compare branches", "Explain revenue/profit changes",
      "Identify slow-moving stock", "Identify fast-moving products", "Suggest reorder priorities",
      "Summarize daily business performance", "Natural-language report queries",
      "Business insights", "Anomaly detection",
    ],
  },
];

const quickQuestions = [
  "Can I sell half a piece?",
  "How does inventory work?",
  "What does KxTill cost?",
  "Can I track M-Pesa and cash?",
  "How does the trial work?",
];

// ===== AI ASSISTANT COMPONENT — Client-only =====
function AiAssistant() {
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    { role: "assistant", content: "Hi! Ask me anything about KxTill." },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Fix hydration: only render on client after mount
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsMounted(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const getResponse = (question: string): string => {
    const q = question.toLowerCase();
    if (q.includes("half") || q.includes("piece") || q.includes("unit")) {
      return "Yes! KxTill lets you sell fractional quantities like ½ piece, 500g, 1kg, cartons, and more. Each unit can have its own price.";
    }
    if (q.includes("inventory") || q.includes("stock")) {
      return "KxTill tracks inventory in real-time. You get low-stock alerts, can adjust stock, view movement history, and manage products across multiple branches.";
    }
    if (q.includes("cost") || q.includes("price") || q.includes("pricing")) {
      return "KxTill plans start at KSh 2,500/month for Professional and KSh 5,000/month for Business. Both come with a free trial.";
    }
    if (q.includes("mpesa") || q.includes("cash") || q.includes("payment")) {
      return "KxTill tracks all payment methods — cash, M-Pesa, card, and bank. You can also take partial payments and add payment references.";
    }
    if (q.includes("trial")) {
      return "You can start using KxTill immediately. No credit card required to try it out.";
    }
    if (q.includes("pharmacy") || q.includes("retail") || q.includes("shop")) {
      return "Yes! KxTill works for retail shops, pharmacies, groceries, hardware shops, mini-supermarkets, and wholesalers.";
    }
    if (q.includes("upgrade")) {
      return "Yes — you can upgrade from Professional to Business anytime as your business grows.";
    }
    if (q.includes("staff") || q.includes("attendant")) {
      return "KxTill supports multiple staff with role-based access. You can have cashiers, managers, inventory managers, and more.";
    }
    return "That's a great question about KxTill. I'd recommend checking our features section above, or you can start a free trial to explore everything!";
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { role: "user" as const, content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const response = getResponse(input);
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
      setIsTyping(false);
    }, 600);
  };

  // Don't render anything on the server
  if (!isMounted) return null;

  return (
    <>
      <button
        className={styles.fab}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Ask KxTill AI Assistant"
      >
        {isOpen ? <X size={24} /> : <Sparkle size={24} />}
        {!isOpen && <span className={styles.fabLabel}>Ask KxTill</span>}
      </button>

      {isOpen && (
        <div className={styles.chatPanel}>
          <div className={styles.chatHeader}>
            <span className={styles.chatIcon}>✦</span>
            <span className={styles.chatTitle}>Ask KxTill</span>
            <button className={styles.chatClose} onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <div className={styles.chatMessages}>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={msg.role === "assistant" ? styles.chatAssistant : styles.chatUser}
              >
                {msg.content}
              </div>
            ))}
            {isTyping && (
              <div className={styles.chatTyping}>
                <span>.</span><span>.</span><span>.</span>
              </div>
            )}
          </div>

          <div className={styles.chatQuick}>
            {quickQuestions.map((q) => (
              <button
                key={q}
                className={styles.chatQuickBtn}
                onClick={() => {
                  setInput(q);
                  setTimeout(handleSend, 100);
                }}
              >
                {q}
              </button>
            ))}
          </div>

          <div className={styles.chatInput}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask about KxTill..."
              className={styles.chatInputField}
            />
            <button
              onClick={handleSend}
              className={styles.chatSend}
              disabled={!input.trim()}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}


function TrendChart({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const w = 320;
  const h = 100;
  const step = w / (data.length - 1);
  const points = data.map((v, i) => `${i * step},${h - (v / max) * h}`).join(" ");
  const areaPoints = `0,${h} ${points} ${w},${h}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={styles.trendSvg} preserveAspectRatio="none">
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(217,91,45,0.35)" />
          <stop offset="100%" stopColor="rgba(217,91,45,0)" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#trendFill)" />
      <polyline
        points={points}
        fill="none"
        stroke="#d95b2d"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PaymentDonut() {
  const segments = [
    { pct: 45, color: "#d95b2d" },
    { pct: 30, color: "rgba(249,249,249,0.5)" },
    { pct: 15, color: "rgba(249,249,249,0.28)" },
    { pct: 10, color: "rgba(249,249,249,0.14)" },
  ];
  const r = 40;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg viewBox="0 0 100 100" className={styles.donutSvg}>
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(249,249,249,0.06)" strokeWidth="14" />
      {segments.map((s, i) => {
        const dash = (s.pct / 100) * c;
        const el = (
          <circle
            key={i}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth="14"
            strokeDasharray={`${dash} ${c - dash}`}
            strokeDashoffset={-offset}
            transform="rotate(-90 50 50)"
          />
        );
        offset += dash;
        return el;
      })}
    </svg>
  );
}

export default function KxTillPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className={styles.page}>
      {/* ===== HERO ===== */}
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

{/* ===== NAV ===== */}
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
    <Link href="/" className={styles.navLink}>Home</Link>
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

{/* Mobile menu - only Home, Login, Get Started */}
{menuOpen && (
  <div className={styles.mobileMenu}>
    <Link href="/" className={styles.mobileLink}>Home</Link>
    <Link href="/login" className={styles.mobileLink}>Login</Link>
    <Link href="/signup" className={styles.mobileCta}>Get Started</Link>
  </div>
)}



        <div className={styles.heroContent}>
          <div className={styles.heroIdentity}>
            <Image src="/assets/logo.png" alt="KxTill" width={40} height={40} className={styles.heroLogo} />
          </div>
          <h1>KxTill</h1>
          <p className={styles.heroTagline}>Point of Sale &amp; Inventory Management</p>
          <p className={styles.heroDesc}>
            Sell faster, know your stock, and track your business — all in one place.
          </p>
          <div className={styles.heroButtons}>
            <Link href="/contact" className={styles.primaryBtn}>Start using KxTill</Link>
            <Link href="/products/kxtill#pricing" className={styles.secondaryBtn}>View pricing</Link>
          </div>
        </div>

        <div className={styles.assetWrap}>
          <Image
            src="/assets/dashboard3.jpg"
            alt="KxTill dashboard"
            width={1400}
            height={560}
            priority
            className={styles.assetImage}
          />
          <div className={styles.assetFade} />
        </div>

        <div className={styles.highlightGrid}>
          {highlights.map((h) => (
            <div key={h.title} className={styles.highlightCard}>
              <div className={styles.cardRow}>
                <h.icon size={20} className={styles.cardIcon} />
                <h3>{h.title}</h3>
              </div>
              <p>{h.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FEATURE GRID ===== */}
      <section className={styles.section}>
        <div className={styles.heading}>
          <h2>Everything you need to run your business</h2>
        </div>
        <div className={styles.sectionBlock}>
          <div className={styles.featureGrid}>
            {features.map((f) => (
              <div key={f.title} className={styles.featureCard}>
                <div className={styles.cardRow}>
                  <f.icon size={20} className={styles.cardIcon} />
                  <h3>{f.title}</h3>
                </div>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW SELLING WORKS ===== */}
      <section className={styles.sectionAlt}>
        <div className={styles.heading}>
          <h2>How selling works</h2>
          <p>Fast, intuitive, and built for business.</p>
        </div>
        <div className={styles.sectionBlock}>
          <div className={styles.stepsGrid}>
            {steps.map((s, i) => (
              <div key={s.n} className={styles.stepCard}>
                <span className={styles.stepNumber}>
                  <s.icon size={18} />
                </span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
                {i < steps.length - 1 && <span className={styles.stepConnector} aria-hidden="true" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FLEXIBLE UNITS ===== */}
      <section className={styles.section}>
        <div className={styles.sectionBlock}>
          <div className={styles.splitBlock}>
            <div>
              <h2>Flexible products. Powerful inventory.</h2>
              <p className={styles.splitDesc}>
                KxTill lets you sell products in any way your customers need.
              </p>
              <ul className={styles.bulletList}>
                <li>Different prices per selling unit</li>
                <li>Automatic base-unit stock conversion</li>
              </ul>
            </div>
            <div className={styles.pillCluster}>
              {units.map((u) => (
                <span key={u} className={styles.unitPill}>{u}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== PAYMENTS ===== */}
      <section className={styles.sectionAlt}>
        <div className={styles.sectionBlock}>
          <div className={styles.splitBlock}>
            <div className={styles.donutBlock}>
              <PaymentDonut />
              <div className={styles.pillCluster}>
                {paymentMethods.map((m) => (
                  <span key={m} className={styles.unitPill}>{m}</span>
                ))}
              </div>
            </div>
            <div>
              <h2>Payments, simplified</h2>
              <ul className={styles.bulletList}>
                <li>Partial payments</li>
                <li>Payment references</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ANALYTICS ===== */}
      <section className={styles.section}>
        <div className={styles.sectionBlock}>
          <div className={styles.splitBlock}>
            <div>
              <h2>Know your business</h2>
              <p className={styles.splitDesc}>Real-time insights to help you make better decisions.</p>
              <ul className={styles.bulletList}>
                <li>Sales overview</li>
                <li>Revenue tracking</li>
                <li>Best-selling products</li>
                <li>Stock status</li>
                <li>Payment breakdown</li>
                <li>Sales trends</li>
              </ul>
            </div>
            <div className={styles.analyticsCard}>
              <TrendChart data={trendData} />
              <div className={styles.statsGrid}>
                {stats.map((s) => (
                  <div key={s.label} className={styles.statCard}>
                    <span className={styles.statLabel}>{s.label}</span>
                    <span className={styles.statValue}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== INDUSTRIES ===== */}
      <section className={styles.industriesSection}>
        <p className={styles.industriesHeading}>Built for growing businesses</p>
        <div className={styles.industriesStrip}>
          {industries.map((i) => (
            <span key={i} className={styles.industryPill}>{i}</span>
          ))}
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section className={styles.section} id="pricing">
        <div className={styles.heading}>
          <h2>Simple, transparent pricing</h2>
        </div>
        <div className={styles.sectionBlock}>
          <div className={styles.pricingGrid}>
            {pricingTiers.map((tier) => (
              <div key={tier.name} className={tier.popular ? styles.priceCardPopular : styles.priceCard}>
                {tier.popular && <span className={styles.popularBadge}>Popular</span>}
                <h3>{tier.name}</h3>
                <p className={styles.priceValue}>{tier.price}</p>
                <ul className={styles.priceFeatureList}>
                  {tier.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <Link href="/contact" className={styles.ctaButton}>Start trial</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className={styles.sectionAlt}>
        <div className={styles.heading}>
          <h2>Frequently asked questions</h2>
        </div>
        <div className={styles.sectionBlock}>
          <div className={styles.faqList}>
            {faqs.map((item, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={item.q} className={styles.faqItem}>
                  <button
                    className={styles.faqQuestion}
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    aria-expanded={isOpen}
                  >
                    {item.q}
                    <span className={isOpen ? styles.faqIconOpen : styles.faqIcon}>+</span>
                  </button>
                  {isOpen && <p className={styles.faqAnswer}>{item.a}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== FULL FEATURE SET ===== */}
      <section className={styles.section}>
        <div className={styles.heading}>
          <h2>Everything KxTill can do</h2>
          <p>The complete feature set behind the product.</p>
        </div>
        <div className={styles.sectionBlock}>
          <div className={styles.categoryGrid}>
            {featureCategories.map((cat) => (
              <div key={cat.title} className={styles.categoryCard}>
                <div className={styles.categoryHeader}>
                  <span className={styles.categoryIconWrap}>
                    <cat.icon size={18} />
                  </span>
                  <div>
                    <h3>{cat.title}</h3>
                    {cat.subtitle && <span className={styles.categorySubtitle}>{cat.subtitle}</span>}
                  </div>
                </div>
                <ul className={styles.categoryList}>
                  {cat.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className={styles.finalCta}>
        <div className={styles.finalCtaGlow} aria-hidden="true" />
        <h2>Ready to take control of your business?</h2>
        <p>Join thousands of businesses using KxTill to sell faster and grow smarter.</p>
        <div className={styles.heroButtons}>
          <Link href="/contact" className={styles.primaryBtn}>Start using KxTill</Link>
          <Link href="/products/kxtill#pricing" className={styles.secondaryBtn}>Explore pricing</Link>
        </div>
      </section>

      {/* ===== AI ASSISTANT FAB ===== */}
      <AiAssistant />
    </main>
  );
}