// app/auth/callback/page.tsx

"use client";

import { useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTokens } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // ✅ Prevent multiple executions
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const error = searchParams.get("error");

    console.log("🔍 Callback received:", {
      accessToken: !!accessToken,
      refreshToken: !!refreshToken,
      error,
    });

    if (error) {
      router.push("/login?error=social_auth_failed");
      return;
    }

    if (!accessToken || !refreshToken) {
      console.log("❌ Missing tokens");
      router.push("/login?error=missing_tokens");
      return;
    }

    // ✅ Set tokens once
    setTokens(accessToken, refreshToken)
      .then(() => {
        console.log("✅ Tokens set, redirecting to org selection");
        router.push("/onboarding/select-organization");
      })
      .catch((err) => {
        console.error("❌ Failed to set tokens:", err);
        router.push("/login?error=token_setup_failed");
      });
  }, [searchParams, router, setTokens]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#0e0f13",
        color: "#eceef2",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 40,
            height: 40,
            border: "3px solid rgba(255,255,255,0.1)",
            borderTopColor: "#ff6a2b",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 16px",
          }}
        />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <p>Signing you in...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CallbackContent />
    </Suspense>
  );
}