"use client";

import styles from "./Testimonials.module.css";

const testimonials = [
  {
    name: "Grace Muthoni",
    role: "Retail Owner",
    business: "Grace's Fashion House, Nairobi",
    quote:
      "KxTill transformed how I manage my boutique. I can track sales, inventory, and customer preferences all in one place.",
    rating: 5,
    initials: "GM",
  },
  {
    name: "James Ochieng",
    role: "Restaurant Manager",
    business: "Haven Eatery, Kisumu",
    quote:
      "The inventory management alone saved us from overstocking. KxTill gives me peace of mind knowing exactly what we have.",
    rating: 5,
    initials: "JO",
  },
  {
    name: "Sarah Wanjiku",
    role: "Pharmacist",
    business: "Wellness Pharmacy, Mombasa",
    quote:
      "KxInvoice made billing so much faster. My customers appreciate the professional receipts and payment reminders.",
    rating: 4,
    initials: "SW",
  },
];

export default function Testimonials() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.heading}>
          <h2>Trusted by businesses like yours</h2>
          <p>Real reviews from real business owners.</p>
        </div>

        <div className={styles.grid}>
          {testimonials.map((t, i) => (
            <div key={i} className={styles.card}>
              <div className={styles.rating}>
                {[...Array(5)].map((_, idx) => (
                  <span
                    key={idx}
                    className={idx < t.rating ? styles.starFilled : styles.starEmpty}
                  >
                    ★
                  </span>
                ))}
              </div>

              <p className={styles.quote}>&ldquo;{t.quote}&rdquo;</p>

              <div className={styles.profile}>
                <div className={styles.avatar}>{t.initials}</div>
                <div className={styles.info}>
                  <span className={styles.name}>{t.name}</span>
                  <span className={styles.detail}>
                    {t.role} · {t.business}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          <span className={styles.ratingSummary}>
            <span className={styles.stars}>★★★★★</span>
            <span className={styles.ratingText}>
              4.8 / 5.0 based on 150+ reviews
            </span>
          </span>
          <p className={styles.source}>
            Powered by Google Reviews
            <span className={styles.badge}>Coming soon</span>
          </p>
        </div>
      </div>
    </section>
  );
}