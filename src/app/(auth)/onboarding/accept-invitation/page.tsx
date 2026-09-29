"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/axios";
import styles from "../select-organization/page.module.css";

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
        setMessage("Please sign in to accept this invitation.");
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
        }, 700);
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

  const handleSignIn = () => router.push("/login");
  const handleBack = () => router.push("/onboarding/select-organization");

  return (
    <div className={styles.page}>
      <div className={styles.glowAmber} />
      <div className={styles.glowMoss} />

      <div className={styles.loadingCard}>
        {status === "working" && (
          <>
            <div className={styles.spinner} />
            <p>Accepting your invitation…</p>
          </>
        )}

        {status === "signin" && (
          <>
            <p>{message}</p>
            <button className={styles.submitBtn} onClick={handleSignIn}>
              Sign in
            </button>
          </>
        )}

        {status === "ok" && <p>{message}</p>}

        {status === "error" && (
          <>
            <div className={styles.error}>{message}</div>
            <button className={styles.backBtn} onClick={handleBack}>
              ← Back to workspace
            </button>
          </>
        )}
      </div>
    </div>
  );
}