// components/public/HowItWorks.tsx

"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  Store,
  Eye,
  Users,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import styles from "./HowItWorks.module.css";

const painPoints = [
  {
    id: "01",
    icon: Building2,
    pain: "Managing multiple branches?",
    solution: "See your branches, sales and performance from one place.",
    image: "/assets/dashboard.jpg",
    imageAlt: "KXBYTE Suite dashboard showing multiple branches",
  },
  {
    id: "02",
    icon: Store,
    pain: "Running multiple selling counters?",
    solution: "Manage two or more counters in the same business without losing track.",
    image: "/assets/dashboard.jpg",
    imageAlt: "KXBYTE Suite counter management view",
  },
  {
    id: "03",
    icon: Eye,
    pain: "Need real-time visibility?",
    solution: "See what's happening across your business without waiting for end-of-day reports.",
    image: "/assets/dashboard.jpg",
    imageAlt: "KXBYTE Suite real-time analytics dashboard",
  },
  {
    id: "04",
    icon: Users,
    pain: "Growing your team?",
    solution: "Give employees the access they need while keeping control over your business.",
    image: "/assets/dashboard.jpg",
    imageAlt: "KXBYTE Suite team management interface",
  },
];

export default function HowItWorks() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {/* Heading */}
        <div className={styles.heading}>
          <div className={styles.badge}>
            <Sparkles size={12} />
            How Suite Helps
          </div>
          <h2>Run your business with <span className={styles.accent}>better visibility and control.</span></h2>
          <p className={styles.subtitle}>
            Every KXBYTE product is designed to solve a real business challenge — 
            so you can stop juggling tools and start growing.
          </p>
        </div>

        {/* Pain → Solution Timeline */}
        <div className={styles.timeline}>
          {painPoints.map((item, index) => {
            const Icon = item.icon;
            const isLast = index === painPoints.length - 1;

            return (
              <div key={item.id} className={styles.row}>
                {/* Left: Number + Line */}
                <div className={styles.markerCol}>
                  <div className={styles.markerCircle}>
                    <span className={styles.number}>{item.id}</span>
                  </div>
                  {!isLast && <span className={styles.line} />}
                </div>

                {/* Right: Content */}
                <div className={styles.content}>
                  {/* Pain */}
                  <div className={styles.painBadge}>
                    <Icon size={16} className={styles.painIcon} />
                    <span className={styles.painText}>{item.pain}</span>
                  </div>

                  {/* Solution */}
                  <h3 className={styles.solutionText}>{item.solution}</h3>

                  {/* Mockup Image */}
                  <div className={styles.mockupWrapper}>
                    <div className={styles.mockupFrame}>
                      <Image
                        src={item.image}
                        alt={item.imageAlt}
                        width={600}
                        height={340}
                        className={styles.mockupImage}
                      />
                      <div className={styles.mockupOverlay} />
                    </div>
                  </div>

                  {/* CTA Link */}
                  <Link href="/products" className={styles.learnMore}>
                    See how it works
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className={styles.footer}>
          <p className={styles.footerText}>
            Ready to solve these challenges? <Link href="/signup" className={styles.footerLink}>Start your free trial</Link>
          </p>
        </div>
      </div>
    </section>
  );
}