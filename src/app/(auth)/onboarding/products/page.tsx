// app/(auth)/onboarding/products/page.tsx

"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function ProductsPage() {
  const router = useRouter();

  return (
    <div style={{ 
      maxWidth: "1200px", 
      margin: "0 auto", 
      padding: "2rem 1rem" 
    }}>
      <button 
        onClick={() => router.back()}
        style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "0.5rem",
          background: "none",
          border: "none",
          color: "#666",
          cursor: "pointer",
          marginBottom: "2rem"
        }}
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" }}>
        Products
      </h1>
      <p style={{ color: "#666" }}>This page is under construction.</p>
    </div>
  );
}