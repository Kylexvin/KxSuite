// src/app/(public)/page.tsx

import HowItWorks from "@/components/public/HowItWorks";
import Hero from "@/components/public/Hero";
import Products from "@/components/public/Products";
import OneAccount from "@/components/public/OneAccount";
import Testimonials from "@/components/public/Testimonials";
import CTASection from "@/components/public/CTASection";
import Footer from "@/components/public/Footer";

export default function HomePage() {
  return (
    <main>
      <Hero />

      {/* ===== PRODUCT SUITE ===== */}

      <Products />

      {/* ===== ONE KXBYTE ACCOUNT ===== */}
  
       <OneAccount/>
       
      {/* ===== HOW IT WORKS ===== */}

      <HowItWorks/>

      {/* ===== TESTIMONIALS ===== */}

      <Testimonials />

      {/* ===== CTA SECTION ===== */}

      <CTASection />

      {/* ===== FOOTER ===== */}

      <Footer />

    </main>
  );
}