"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/axios";
import { CheckCircle2, AlertCircle, Mail } from "lucide-react";
import styles from "./page.module.css";

type Status = "working" | "ok" | "error" | "signin";

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
        setMessage("You&apos;ve joined. Taking you to your workspace…");
        toast.success("Invitation accepted");

        setTimeout(() => {
          router.replace("/onboarding/select-organization");
        }, 800);
      } catch (err: unknown) {
        let text =
          "We couldn&apos;t accept this invitation. It may have expired or already been used.";

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

      <div className={styles.card}>
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
  );
}