// src/app/(auth)/sso/page.tsx

"use client";

import { useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";

const AUTH_BASE_URL =
  process.env.NEXT_PUBLIC_AUTH_BASE_URL || "https://kxbyte.onrender.com";

function SigningInScreen() {
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
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p>Signing you in…</p>
      </div>
    </div>
  );
}

function SSOContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTokens } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const code = searchParams.get("code");
    const next = searchParams.get("next");

    if (!code) {
      router.replace("/login?error=missing_code");
      return;
    }

    axios
      .post(`${AUTH_BASE_URL}/api/v1/auth/sso/exchange`, { code })
      .then(async ({ data }) => {
        await setTokens(data.accessToken, data.refreshToken);

        if (next && next.startsWith("/")) {
          router.replace(next);
          return;
        }

        const hasOrgs = (data.organizations || []).length > 0;
        router.replace(
          hasOrgs ? "/onboarding/select-organization" : "/dashboard"
        );
      })
      .catch((err) => {
        console.error("SSO exchange failed:", err);
        router.replace("/login?error=sso_failed");
      });
  }, [searchParams, router, setTokens]);

  return <SigningInScreen />;
}

export default function SSOPage() {
  return (
    <Suspense fallback={<SigningInScreen />}>
      <SSOContent />
    </Suspense>
  );
}