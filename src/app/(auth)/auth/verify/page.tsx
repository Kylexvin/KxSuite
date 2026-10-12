"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import { Mail, CheckCircle2, AlertCircle } from "lucide-react";
import styles from "./page.module.css";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://auth.kxbyte.co.ke";
//   process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type Screen =
  | { kind: "checkInbox"; email: string }
  | { kind: "verifying" }
  | { kind: "verified"; email?: string }
  | { kind: "verifyFailed"; message: string };

function VerifyInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const emailParam = searchParams.get("email") || "";
  const tokenParam = searchParams.get("token") || "";

  const [screen, setScreen] = useState<Screen>(() =>
    tokenParam
      ? { kind: "verifying" }
      : { kind: "checkInbox", email: emailParam }
  );

  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const hasAutoVerified = useRef(false);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // -------- auto-verify when token is present --------
  useEffect(() => {
    if (!tokenParam || hasAutoVerified.current) return;
    hasAutoVerified.current = true;

    const run = async () => {
      try {
        await axios.get(
          `${API_BASE_URL}/api/v1/auth/verify-email/json?token=${encodeURIComponent(
            tokenParam
          )}`
        );
        setScreen({ kind: "verified" });
      } catch (err: unknown) {
        let message =
          "This verification link is invalid or has expired. Request a new one below.";
        if (axios.isAxiosError(err)) {
          const apiError = err.response?.data?.error;
          if (typeof apiError === "object" && apiError?.message) {
            message = apiError.message;
          } else if (typeof apiError === "string") {
            message = apiError;
          }
        }
        setScreen({ kind: "verifyFailed", message });
      }
    };

    run();
  }, [tokenParam]);

  // -------- redirect after success --------
  useEffect(() => {
    if (screen.kind !== "verified") return;
    redirectTimer.current = setTimeout(() => {
      router.push("/auth?mode=signIn&verified=1");
    }, 1500);
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, [screen.kind, router]);

  // -------- cooldown tick --------
  useEffect(() => {
    if (cooldown <= 0) return;
    cooldownTimer.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          if (cooldownTimer.current) clearInterval(cooldownTimer.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => {
      if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    };
  }, [cooldown]);

  const handleResend = async () => {
    const targetEmail =
      screen.kind === "checkInbox"
        ? screen.email
        : emailParam;

    if (!targetEmail) return;

    setResending(true);
    setResendMessage("");

    try {
      await axios.post(`${API_BASE_URL}/api/v1/auth/resend-verification`, {
        email: targetEmail,
      });
      setResendMessage("Verification link sent. Check your inbox.");
      setCooldown(60);
    } catch (err: unknown) {
      let message = "Couldn't resend right now. Try again in a minute.";
      if (axios.isAxiosError(err)) {
        const apiError = err.response?.data?.error;
        if (typeof apiError === "object" && apiError?.message) {
          message = apiError.message;
        }
        if (err.response?.status === 429) {
          message = "Too many attempts. Please wait a few minutes.";
        }
      }
      setResendMessage(message);
    } finally {
      setResending(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className={styles.page}>
      <div className={styles.glowAmber} />
      <div className={styles.glowMoss} />

      <div className={styles.card}>
        <div className={styles.brand}>
          <Image
            src="/assets/logo.png"
            alt=""
            width={28}
            height={28}
            className={styles.logoMark}
            priority
          />
          
        </div>
        

        {screen.kind === "checkInbox" && (
          <>
            <div className={styles.iconWrap}>
              <Mail size={26} />
            </div>
            <h1 className={styles.title}>Check your inbox</h1>
            <p className={styles.subtitle}>
              We sent a verification link to{" "}
              <span className={styles.emailHighlight}>
                {screen.email || "your email"}
              </span>
              . Click the link in the email to activate your account.
            </p>

            {resendMessage && (
              <div
                className={
                  resendMessage.toLowerCase().includes("sent")
                    ? styles.success
                    : styles.error
                }
              >
                {resendMessage}
              </div>
            )}

            <button
              type="button"
              className={styles.primaryBtn}
              onClick={handleResend}
              disabled={resending || cooldown > 0}
            >
              {resending ? (
                <>
                  <span className={styles.spinner} />
                  Sending…
                </>
              ) : cooldown > 0 ? (
                <>Resend in {cooldown}s</>
              ) : (
                <>Resend verification email</>
              )}
            </button>

            <p className={styles.cooldown}>
              Didn&apos;t get it? Check your spam folder.
            </p>

            <p className={styles.footerLink}>
              Wrong email?{" "}
              <a href="/auth?mode=signUp">Start over</a>
            </p>
          </>
        )}

        {screen.kind === "verifying" && (
          <>
            <div className={styles.iconWrap}>
              <span className={styles.spinnerLarge} />
            </div>
            <h1 className={styles.title}>Verifying your email</h1>
            <p className={styles.subtitle}>This will only take a moment.</p>
          </>
        )}

        {screen.kind === "verified" && (
          <>
            <div className={`${styles.iconWrap} ${styles.success}`}>
              <CheckCircle2 size={26} />
            </div>
            <h1 className={styles.title}>Email verified</h1>
            <p className={styles.subtitle}>
              Your email is confirmed. Redirecting you to sign in…
            </p>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => router.push("/auth?mode=signIn&verified=1")}
            >
              Continue to sign in
            </button>
          </>
        )}

        {screen.kind === "verifyFailed" && (
          <>
            <div className={`${styles.iconWrap} ${styles.danger}`}>
              <AlertCircle size={26} />
            </div>
            <h1 className={styles.title}>Verification failed</h1>
            <p className={styles.subtitle}>{screen.message}</p>

            {resendMessage && (
              <div
                className={
                  resendMessage.toLowerCase().includes("sent")
                    ? styles.success
                    : styles.error
                }
              >
                {resendMessage}
              </div>
            )}

            <button
              type="button"
              className={styles.primaryBtn}
              onClick={handleResend}
              disabled={resending || cooldown > 0 || !emailParam}
            >
              {resending ? (
                <>
                  <span className={styles.spinner} />
                  Sending…
                </>
              ) : cooldown > 0 ? (
                <>Resend in {cooldown}s</>
              ) : (
                <>Send a new link</>
              )}
            </button>

            <button
              type="button"
              className={styles.ghostBtn}
              onClick={() => router.push("/auth?mode=signIn")}
            >
              Back to sign in
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyInner />
    </Suspense>
  );
}