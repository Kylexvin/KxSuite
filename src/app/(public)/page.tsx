// src/app/(public)/page.tsx

import Hero from "@/components/public/Hero";
import Products from "@/components/public/Products";
import HowItWorks from "@/components/public/HowItWorks";
import OneAccount from "@/components/public/OneAccount";     // ✅ Merged with WhySuite
import ModularApproach from "@/components/public/ModularApproach";
import Testimonials from "@/components/public/Testimonials";
import CTASection from "@/components/public/CTASection";
import Footer from "@/components/public/Footer";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Products />
      <HowItWorks />
      <ModularApproach />
      <OneAccount />        {/* ✅ Now covers both Ecosystem + Why Suite */}
      <Testimonials />
      <CTASection />
      <Footer />
    </main>
  );
}