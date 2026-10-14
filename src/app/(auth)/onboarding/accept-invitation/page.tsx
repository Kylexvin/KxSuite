"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/axios";
import { CheckCircle2, AlertCircle, Mail } from "lucide-react";
import styles from "./page.module.css";

type Status = "working" | "ok" | "error" | "signin";

// Kx products shown on the hero app grid (duplicated for now — swap in real ones later)
const PRODUCTS = [
  { name: "KxTill", logo: "/assets/products/kxtillRetail.png" },
  { name: "KxWork", logo: "/assets/products/kxwork.jpg" },
  { name: "KxCRM", logo: "/assets/products/kxcrm.jpg" },
];

const APP_TILES = Array.from(
  { length: 16 },
  (_, i) => PRODUCTS[i % PRODUCTS.length]
);

export default function AcceptInvitationPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, setAuth } = useAuth();

  const [status, setStatus] = useState<Status>("working");
  const [message, setMessage] = useState("Accepting your invitation…");
  const hasRun = useRef(false);

  useEffect(() => {
    if (isLoading) return;
    if (hasRun.current) return;
    hasRun.current = true;

    const run = async () => {
      const params =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search)
          : new URLSearchParams();
      const token = params.get("token") || "";

      if (!token) {
        setStatus("error");
        setMessage("This invitation link is missing its token. Ask the inviter to resend it.");
        return;
      }

      if (!isAuthenticated) {
        setStatus("signin");
        setMessage("Sign in to accept this invitation.");
        return;
      }

      try {
        await api.post("/api/v1/invitations/accept", { token });

        const orgsRes = await api.get("/api/v1/organizations");
        const freshOrgs = orgsRes.data.organizations || [];
        const accessToken = localStorage.getItem("accessToken") || "";
        const refreshToken = localStorage.getItem("refreshToken") || "";
        if (user) setAuth(user, accessToken, refreshToken, freshOrgs);

        setStatus("ok");
        setMessage("You've joined. Taking you to your workspace…");
        toast.success("Invitation accepted");

        setTimeout(() => {
          router.replace("/onboarding/select-organization");
        }, 800);
      } catch (err: unknown) {
        let text =
          "We couldn't accept this invitation. It may have expired or already been used.";

        if (axios.isAxiosError(err)) {
          const data = err.response?.data as
            | { message?: string; error?: string }
            | undefined;
          if (data?.message) text = data.message;
          else if (data?.error) text = data.error;
        } else if (err instanceof Error && err.message) {
          text = err.message;
        }

        setStatus("error");
        setMessage(text);
      }
    };

    void run();
  }, [isAuthenticated, isLoading, user, router, setAuth]);

  return (
    <div className={styles.page}>
      <div className={styles.glowAmber} />
      <div className={styles.glowMoss} />

      {/* Big background photo with diagonal edge (desktop only) */}
      <div className={styles.bgPhoto} />

      <div className={styles.card}>
        {/* ============ HERO (left, desktop only) — Kx products ============ */}
        <aside className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.appGrid}>
              {APP_TILES.map((p, i) => (
                <div key={i} className={styles.appTile}>
                  <div className={styles.appIcon}>
                    <Image
                      src={p.logo}
                      alt={p.name}
                      width={46}
                      height={46}
                      className={styles.appLogo}
                    />
                  </div>
                  <span className={styles.appName}>{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ============ PANEL (right) ============ */}
        <div className={styles.panel}>
          <div className={styles.brand}>
            <Image
              src="/assets/logo.png"
              alt="KXBYTE"
              width={28}
              height={28}
              className={styles.logoMark}
              priority
            />
            <span className={styles.brandName}>
              KXBYTE <span className={styles.brandAccent}>SUITE</span>
            </span>
          </div>

          <div className={styles.stateWrap}>
            {status === "working" && (
              <>
                <div className={styles.spinner} />
                <p className={styles.subtitle}>Accepting your invitation&hellip;</p>
              </>
            )}

            {status === "signin" && (
              <>
                <div className={styles.iconWrap}>
                  <Mail />
                </div>
                <h1 className={styles.title}>Sign in to accept</h1>
                <p className={styles.subtitle}>{message}</p>
                <button
                  className={styles.primaryBtn}
                  onClick={() => router.push("/login")}
                >
                  Sign in
                </button>
              </>
            )}

            {status === "ok" && (
              <>
                <div className={`${styles.iconWrap} ${styles.iconSuccess}`}>
                  <CheckCircle2 />
                </div>
                <h1 className={styles.title}>Invitation accepted</h1>
                <p className={styles.subtitle}>{message}</p>
              </>
            )}

            {status === "error" && (
              <>
                <div className={`${styles.iconWrap} ${styles.iconError}`}>
                  <AlertCircle />
                </div>
                <h1 className={styles.title}>Couldn&apos;t accept</h1>
                <p className={styles.subtitle}>{message}</p>
                <button
                  className={styles.ghostBtn}
                  onClick={() => router.push("/onboarding/select-organization")}
                >
                  &larr; Back to workspace
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}