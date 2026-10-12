"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./page.module.css";

const API_BASE_URL =

//   process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  process.env.NEXT_PUBLIC_API_URL || "https://auth.kxbyte.co.ke";

type Mode = "signIn" | "signUp";

type FieldErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  agreeToTerms?: string;
};

const PASSWORD_MIN = 8;

function AuthInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, setAuth } = useAuth();

  const modeParam = searchParams.get("mode");
  const mode: Mode = modeParam === "signUp" ? "signUp" : "signIn";
  const verifiedParam = searchParams.get("verified");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(
    verifiedParam === "1" ? "Email verified. Sign in to continue." : ""
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const passwordChecks = {
    length: password.length >= PASSWORD_MIN,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };
  const passwordScore = Object.values(passwordChecks).filter(Boolean).length;
  const passwordStrength: "weak" | "fair" | "good" | "strong" =
    passwordScore <= 1
      ? "weak"
      : passwordScore === 2
      ? "fair"
      : passwordScore === 3
      ? "good"
      : "strong";

  const clearFieldError = (field: keyof FieldErrors) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const switchMode = (next: Mode) => {
    if (loading || redirecting) return;
    setError("");
    setSuccess("");
    setFieldErrors({});
    setPassword("");
    setShowPassword(false);
    setAgreeToTerms(false);
    router.replace(`/auth?mode=${next}`);
  };

  const validate = (): boolean => {
    const errs: FieldErrors = {};

    if (mode === "signUp") {
      if (!firstName.trim()) errs.firstName = "First name is required";
      if (!lastName.trim()) errs.lastName = "Last name is required";
    }

    if (!email.trim()) {
      errs.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "Enter a valid email address";
    }

    if (!password) {
      errs.password = "Password is required";
    } else if (mode === "signUp" && password.length < PASSWORD_MIN) {
      errs.password = `Password must be at least ${PASSWORD_MIN} characters`;
    }

    if (mode === "signUp" && !agreeToTerms) {
      errs.agreeToTerms = "You must agree to the Terms and Privacy Policy";
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validate()) return;

    setLoading(true);

    try {
      if (mode === "signIn") {
        const { hasOrganizations } = await login(email.trim(), password);
        setRedirecting(true);
        router.push(
          hasOrganizations ? "/onboarding/select-organization" : "/dashboard"
        );
        return;
      }

      const res = await axios.post(`${API_BASE_URL}/api/v1/auth/register`, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
      });

      const { user, accessToken, refreshToken, organizations } = res.data;
      setAuth(user, accessToken, refreshToken, organizations || []);

      setRedirecting(true);
      router.push(`/auth/verify?email=${encodeURIComponent(user.email)}`);
    } catch (err: unknown) {
      handleApiError(err);
      setLoading(false);
    }
  };

  const handleApiError = (err: unknown) => {
    const normalized = err as Error & {
      code?: string;
      details?: Record<string, unknown>;
      status?: number;
    };

    if (normalized.code || (normalized.message && !axios.isAxiosError(err))) {
      if (normalized.code === "EMAIL_NOT_VERIFIED") {
        const detailsEmail = normalized.details?.email as string | undefined;
        const target = detailsEmail || email.trim();
        setRedirecting(true);
        router.push(`/auth/verify?email=${encodeURIComponent(target)}`);
        return;
      }
      if (normalized.code === "INVALID_CREDENTIALS" || normalized.status === 401) {
        setError("Email or password is incorrect");
        return;
      }
      if (normalized.code === "RATE_LIMITED" || normalized.status === 429) {
        setError("Too many attempts. Please try again in a few minutes.");
        return;
      }
      setError(normalized.message || "Something went wrong. Please try again.");
      return;
    }

    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const apiError = err.response?.data?.error;
      const code = typeof apiError === "object" ? apiError?.code : undefined;
      const message =
        (typeof apiError === "object" && apiError?.message) ||
        (typeof apiError === "string" && apiError) ||
        "Something went wrong. Please try again.";

      if (code === "VALIDATION_ERROR" && typeof apiError === "object") {
        const fields = apiError?.details?.fields as
          | Record<string, string>
          | undefined;
        if (fields) {
          setFieldErrors(fields as FieldErrors);
          return;
        }
      }
      if (code === "EMAIL_EXISTS") {
        setFieldErrors({ email: "This email is already registered" });
        return;
      }
      if (code === "INVALID_CREDENTIALS" || status === 401) {
        setError("Email or password is incorrect");
        return;
      }
      if (code === "RATE_LIMITED" || status === 429) {
        setError("Too many attempts. Please try again in a few minutes.");
        return;
      }
      setError(message);
      return;
    }

    setError("Something went wrong. Please try again.");
  };

  const handleGoogle = () => {
    if (loading || redirecting) return;
    const url = `${API_BASE_URL}/api/v1/auth/google/direct`;
    if (url.startsWith("http://") || url.startsWith("https://")) {
      window.location.href = url;
    }
  };

  const disabled = loading || redirecting;

  return (
    <div className={styles.page}>
      <div className={styles.glowAmber} />
      <div className={styles.glowMoss} />

      <div className={styles.card}>
        <div className={styles.formSide}>
          <div className={styles.header}>
            <div className={styles.brand}>
              <Image
                src="/assets/logo.png"
                alt=""
                width={28}
                height={28}
                className={styles.logoMark}
                priority
              />
              <span className={styles.brandName}>KXBYTE</span>
            </div>

            <div key={mode} className={styles.fieldsWrap}>
              <h1 className={styles.title}>
                {mode === "signIn" ? "Sign in" : "Create your account"}
              </h1>
              {mode === "signIn" && (
                <p className={styles.subtitle}>
                  One account for every Kx product.
                </p>
              )}
            </div>
          </div>

          {success && <div className={styles.success}>{success}</div>}
          {error && <div className={styles.error}>{error}</div>}

          <button
            type="button"
            className={styles.googleBtn}
            onClick={handleGoogle}
            disabled={disabled}
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path
                fill="#FFC107"
                d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
              />
              <path
                fill="#FF3D00"
                d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
              />
              <path
                fill="#4CAF50"
                d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
              />
              <path
                fill="#1976D2"
                d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
              />
            </svg>
            Continue with Google
          </button>

          {mode === "signIn" && <div className={styles.divider}>or</div>}

          <form
            key={mode}
            className={`${styles.form} ${styles.fieldsWrap}`}
            onSubmit={handleSubmit}
            noValidate
          >
            {mode === "signUp" && (
              <div className={styles.formRow}>
                <div className={styles.formGroupCompact}>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    className={styles.input}
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => {
                      setError("");
                      setSuccess("");
                      setFirstName(e.target.value);
                      clearFieldError("firstName");
                    }}
                    disabled={disabled}
                  />
                  {fieldErrors.firstName && (
                    <span className={styles.fieldError}>
                      {fieldErrors.firstName}
                    </span>
                  )}
                </div>

                <div className={styles.formGroupCompact}>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    className={styles.input}
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => {
                      setError("");
                      setSuccess("");
                      setLastName(e.target.value);
                      clearFieldError("lastName");
                    }}
                    disabled={disabled}
                  />
                  {fieldErrors.lastName && (
                    <span className={styles.fieldError}>
                      {fieldErrors.lastName}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className={styles.input}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setError("");
                  setSuccess("");
                  setEmail(e.target.value);
                  clearFieldError("email");
                }}
                disabled={disabled}
              />
              {fieldErrors.email && (
                <span className={styles.fieldError}>{fieldErrors.email}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="password">
                Password
              </label>
              <div className={styles.inputWrap}>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    mode === "signIn" ? "current-password" : "new-password"
                  }
                  className={`${styles.input} ${styles.inputWithToggle}`}
                  placeholder={
                    mode === "signUp"
                      ? `At least ${PASSWORD_MIN} characters`
                      : ""
                  }
                  value={password}
                  onChange={(e) => {
                    setError("");
                    setSuccess("");
                    setPassword(e.target.value);
                    clearFieldError("password");
                  }}
                  disabled={disabled}
                />
                <button
                  type="button"
                  className={styles.toggle}
                  onClick={() => setShowPassword((s) => !s)}
                  disabled={disabled}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.password && (
                <span className={styles.fieldError}>
                  {fieldErrors.password}
                </span>
              )}

              {mode === "signUp" && password.length > 0 && (
                <div className={styles.strength}>
                  <div className={styles.strengthBar}>
                    <span
                      className={`${styles.strengthFill} ${
                        styles[`strength_${passwordStrength}`]
                      }`}
                      style={{ width: `${(passwordScore / 4) * 100}%` }}
                    />
                  </div>
                  <div className={styles.strengthChecks}>
                    <span
                      className={
                        passwordChecks.length ? styles.checkOn : styles.checkOff
                      }
                    >
                      {passwordChecks.length ? "✓" : "○"} 8+
                    </span>
                    <span
                      className={
                        passwordChecks.upper ? styles.checkOn : styles.checkOff
                      }
                    >
                      {passwordChecks.upper ? "✓" : "○"} A-Z
                    </span>
                    <span
                      className={
                        passwordChecks.number ? styles.checkOn : styles.checkOff
                      }
                    >
                      {passwordChecks.number ? "✓" : "○"} 0-9
                    </span>
                    <span
                      className={
                        passwordChecks.symbol ? styles.checkOn : styles.checkOff
                      }
                    >
                      {passwordChecks.symbol ? "✓" : "○"} !@#
                    </span>
                  </div>
                </div>
              )}
            </div>

            {mode === "signIn" && (
              <div className={styles.formOptions}>
                <label className={styles.rememberMe}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={disabled}
                  />
                  Remember me
                </label>
                <a href="/forgot" className={styles.forgotLink}>
                  Forgot password?
                </a>
              </div>
            )}

            {mode === "signUp" && (
              <>
                <label className={styles.terms}>
                  <input
                    type="checkbox"
                    checked={agreeToTerms}
                    onChange={(e) => {
                      setError("");
                      setSuccess("");
                      setAgreeToTerms(e.target.checked);
                      clearFieldError("agreeToTerms");
                    }}
                    disabled={disabled}
                  />
                  <span>
                    I agree to the{" "}
                    <a
                      href="https://kxbyte.co.ke/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.termsLink}
                    >
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a
                      href="https://kxbyte.co.ke/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.termsLink}
                    >
                      Privacy Policy
                    </a>
                  </span>
                </label>
                {fieldErrors.agreeToTerms && (
                  <span className={styles.fieldError}>
                    {fieldErrors.agreeToTerms}
                  </span>
                )}
              </>
            )}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={disabled}
            >
              {loading ? (
                <>
                  <span className={styles.spinner} />
                  {mode === "signIn" ? "Signing in…" : "Creating account…"}
                </>
              ) : (
                <>{mode === "signIn" ? "Sign in" : "Create account"}</>
              )}
            </button>
          </form>

          <p className={styles.switch}>
            {mode === "signIn" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  className={styles.switchBtn}
                  onClick={() => switchMode("signUp")}
                  disabled={disabled}
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className={styles.switchBtn}
                  onClick={() => switchMode("signIn")}
                  disabled={disabled}
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>

        <aside className={styles.brandSide}>
          <div className={styles.shape1} />
          <div className={styles.shape2} />
          <div className={styles.shape3} />

          <div className={styles.brandSideInner}>
            <p className={styles.brandSideMark}>
              KXBYTE <span className={styles.brandSideMarkAccent}>Suite</span>
            </p>
            <p className={styles.brandSideTag}>
              One account. Every Kx product. Manage your business from a single
              workspace.
            </p>

            <div className={styles.productScatter}>
              <div className={`${styles.productBubble} ${styles.bubble1}`}>
                <Image
                  src="/assets/products/logo.png"
                  alt="KxSuite"
                  width={44}
                  height={44}
                  className={styles.bubbleLogo}
                />
                <span className={styles.bubbleLabel}>KxSuite</span>
              </div>

              <div className={`${styles.productBubble} ${styles.bubble2}`}>
                <Image
                  src="/assets/products/kxtill.png"
                  alt="KxTill Retail"
                  width={44}
                  height={44}
                  className={styles.bubbleLogo}
                />
                <span className={styles.bubbleLabel}>KxTill Retail</span>
              </div>

              <div className={`${styles.productBubble} ${styles.bubble3}`}>
                <Image
                  src="/assets/products/kxtill.png"
                  alt="KxTill Pharmacy"
                  width={44}
                  height={44}
                  className={styles.bubbleLogo}
                />
                <span className={styles.bubbleLabel}>KxTill Pharmacy</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthInner />
    </Suspense>
  );
}